"""
Test script: emits a test SRI invoice and sends it by email.

Run from anywhere:
    python3 backend/scripts/test_sri_factura.py [recipient@email.com]

Requirements:
    - .env configured with SRI_CERT_PATH, SRI_CERT_PASSWORD, SMTP_* vars
    - Certificate .p12 must exist at the path in SRI_CERT_PATH
    - SRI must be in PRUEBAS mode (config.py AMBIENTE_ACTUAL = 1)
"""
import os
import sys

# backend/scripts/ → go one level up to reach backend/
script_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.abspath(os.path.join(script_dir, '..'))
sys.path.insert(0, backend_dir)
os.chdir(backend_dir)  # needed for relative paths like secuencial.json

from dotenv import load_dotenv
load_dotenv(os.path.join(backend_dir, '.env'))

# Test data 

CLIENTE = {
    'identificacion': '9999999999',   # cédula de prueba (10 dígitos)
    'razon_social':   'Cliente Prueba SRI',
    'email':          sys.argv[1] if len(sys.argv) > 1 else os.environ.get('SMTP_USER', ''),
    'direccion':      'Loja, Ecuador',
    'telefono':       '0999999999',
}

CART = [
    {
        'codigo':          'PROD001',
        'nombre':          'Producto de Prueba A',
        'cantidad_vendida': 2,
        'precio':          5.00,   # precio sin IVA
        'tipoPrecio':      'precio',
    },
    {
        'codigo':          'PROD002',
        'nombre':          'Producto de Prueba B',
        'cantidad_vendida': 1,
        'precio':          10.00,
        'tipoPrecio':      'precio',
    },
]

VENTA_POS = {
    'cart':     CART,
    'vendedor': 'Script de Prueba',
    'sale_id':  'TEST-001',
    'cliente':  CLIENTE,
}

# Run 

def main():
    if not CLIENTE['email']:
        print(" Especifica el email destinatario como argumento o configura SMTP_USER en .env")
        print(" Uso: python3 scripts/test_sri_factura.py tu@email.com")
        sys.exit(1)

    print("=" * 60)
    print("TEST FACTURA ELECTRÓNICA SRI")
    print("=" * 60)
    print(f"Cliente:      {CLIENTE['razon_social']} ({CLIENTE['identificacion']})")
    print(f"Email:        {CLIENTE['email']}")
    subtotal = sum(i['precio'] * i['cantidad_vendida'] for i in CART)
    print(f"Subtotal:     ${subtotal:.2f}  (+IVA 15%  → ${subtotal * 1.15:.2f} total)")
    print()

    # 1. Inicializar SRIManager
    print("1/3  Inicializando SRI Manager...")
    try:
        from modules.sri_manager import SRIManager
        sri = SRIManager()
    except Exception as e:
        print(f"Error iniciando SRI Manager: {e}")
        sys.exit(1)

    # 2. Emitir factura
    print("\n2/3  Emitiendo factura electrónica...")
    result = sri.emitir_factura(VENTA_POS, CLIENTE)

    if not result['success']:
        print(f"\nFactura FALLIDA")
        print(f"    Error:   {result.get('error', 'desconocido')}")
        errores = result.get('errores', [])
        for e in errores:
            print(f"    [{e.get('identificador','')}] {e.get('mensaje','')} — {e.get('informacion_adicional','')}")
        sys.exit(1)

    print(f"\nFactura AUTORIZADA")
    print(f"    Número:        {result['numero_factura']}")
    print(f"    Clave acceso:  {result['clave_acceso']}")
    print(f"    Autorización:  {result['numero_autorizacion']}")
    print(f"    Fecha:         {result['fecha_autorizacion']}")
    print(f"    Ambiente:      {result['ambiente']}")
    print(f"    Total:         ${result['total']:.2f}")
    if result.get('advertencias'):
        for w in result['advertencias']:
            print(f"    ⚠  {w.get('mensaje', '')}")

    # 3. Enviar email
    print(f"\n3/3  Enviando factura por email a {CLIENTE['email']}...")
    from config import SRIConfig
    xml_path = os.path.join(SRIConfig.DIR_XML_AUTORIZADOS, f"{result['clave_acceso']}.xml")

    smtp_host = os.environ.get('SMTP_HOST', '')
    smtp_port = int(os.environ.get('SMTP_PORT', 587))
    smtp_user = os.environ.get('SMTP_USER', '')
    smtp_pass = os.environ.get('SMTP_PASS', '')

    if not all([smtp_host, smtp_user, smtp_pass]):
        print("⚠  Variables SMTP no configuradas — email omitido")
    else:
        import smtplib
        from email.mime.multipart import MIMEMultipart
        from email.mime.text import MIMEText
        from email.mime.base import MIMEBase
        from email import encoders

        msg = MIMEMultipart()
        msg['From'] = smtp_user
        msg['To'] = CLIENTE['email']
        msg['Subject'] = f"Factura Electrónica SRI — {result['numero_factura']}"

        body = (
            f"Estimado/a {CLIENTE['razon_social']},\n\n"
            f"Adjuntamos su factura electrónica autorizada por el SRI.\n\n"
            f"Número:        {result['numero_factura']}\n"
            f"Clave acceso:  {result['clave_acceso']}\n"
            f"Autorización:  {result['numero_autorizacion']}\n"
            f"Fecha:         {result['fecha_autorizacion']}\n"
            f"Total:         ${result['total']:.2f}\n\n"
            "Saludos,\nCentro Comercial TB"
        )
        msg.attach(MIMEText(body, 'plain', 'utf-8'))

        if os.path.isfile(xml_path):
            with open(xml_path, 'rb') as f:
                part = MIMEBase('application', 'octet-stream')
                part.set_payload(f.read())
                encoders.encode_base64(part)
                part.add_header('Content-Disposition', f'attachment; filename="{result["clave_acceso"]}.xml"')
                msg.attach(part)
            print(f"    XML adjunto: {xml_path}")
        else:
            print(f"    ⚠  XML no encontrado en {xml_path} — email sin adjunto")

        try:
            with smtplib.SMTP(smtp_host, smtp_port) as server:
                server.starttls()
                server.login(smtp_user, smtp_pass)
                server.sendmail(smtp_user, CLIENTE['email'], msg.as_string())
            print(f"Email enviado exitosamente")
        except Exception as e:
            print(f"    ❌  Error enviando email: {e}")

    print("\n" + "=" * 60)
    print("TEST COMPLETADO")
    print("=" * 60)


if __name__ == '__main__':
    main()
