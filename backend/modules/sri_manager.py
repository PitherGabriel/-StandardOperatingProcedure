"""
Gestor principal de facturación electrónica SRI
Coordina la generación, firma, envío y autorización
"""
from .sri_xml_generator import XMLGenerator
from .sri_firma_electronica import FirmaElectronica
from .sri_facturacion import SRIClient
from config import SRIConfig
import json
from datetime import datetime


class SRIManager:

    def __init__(self):
        """Inicializa el gestor de facturación"""
        SRIConfig.crear_directorios()

        self.xml_generator = XMLGenerator()
        self.firmador = FirmaElectronica()
        self.sri_client = SRIClient()

        self.secuencial_actual = self._cargar_secuencial()

        print("SRI Manager iniciado correctamente")

    def _cargar_secuencial(self):
        """Carga el último secuencial usado"""
        try:
            with open('secuencial.json', 'r') as f:
                data = json.load(f)
                return data.get('ultimo_secuencial', 0)
        except FileNotFoundError:
            return 0

    def _guardar_secuencial(self):
        """Guarda el secuencial actual"""
        try:
            with open('secuencial.json', 'w') as f:
                json.dump({'ultimo_secuencial': self.secuencial_actual}, f)
        except Exception as e:
            print(f"❌ Error guardando secuencial: {str(e)}")

    def _incrementar_secuencial(self):
        """Incrementa el secuencial"""
        self.secuencial_actual += 1
        self._guardar_secuencial()
        return self.secuencial_actual

    def preparar_datos_venta(self, venta_pos):
        """
        Convierte los datos de venta del POS al formato requerido por el generador XML
        """
        subtotal = 0
        iva_total = 0
        items_formateados = []

        for item in venta_pos['cart']:
            cantidad = item['cantidad_vendida']
            precio_unitario = item['precio']
            precio_total_sin_impuesto = cantidad * precio_unitario

            tarifa_iva = 15
            codigo_porcentaje = "4"  # 4 = 15% según tabla SRI
            valor_iva = precio_total_sin_impuesto * (tarifa_iva / 100)

            subtotal += precio_total_sin_impuesto
            iva_total += valor_iva

            items_formateados.append({
                'codigo': item['codigo'],
                'descripcion': item['nombre'],
                'cantidad': cantidad,
                'precio_unitario': precio_unitario,
                'descuento': 0.00,
                'precio_total_sin_impuesto': precio_total_sin_impuesto,
                'codigo_porcentaje_iva': codigo_porcentaje,
                'tarifa_iva': str(tarifa_iva),
                'valor_iva': valor_iva
            })

        total = subtotal + iva_total

        return {
            'subtotal_sin_impuestos': subtotal,
            'descuento_total': 0.00,
            'iva_total': iva_total,
            'total': total,
            'codigo_porcentaje_iva': codigo_porcentaje,
            'forma_pago': '01',  # 01 = Sin sistema financiero
            'items': items_formateados,
            'info_adicional': [
                {'nombre': 'Vendedor', 'valor': venta_pos.get('vendedor', 'Sistema')},
                {'nombre': 'Email', 'valor': venta_pos.get('cliente', {}).get('email', '')}
            ]
        }

    def preparar_datos_cliente(self, cliente):
        """
        Prepara los datos del cliente para el XML
        """
        identificacion = cliente['identificacion']

        if len(identificacion) == 13:
            tipo_identificacion = '04'  # RUC
        elif len(identificacion) == 10:
            tipo_identificacion = '05'  # Cédula
        else:
            tipo_identificacion = '06'  # Pasaporte

        return {
            'tipo_identificacion': tipo_identificacion,
            'identificacion': identificacion,
            'razon_social': cliente['razon_social'],
            'direccion': cliente.get('direccion', 'N/A'),
            'email': cliente.get('email', ''),
            'telefono': cliente.get('telefono', '')
        }

    def emitir_factura(self, venta_pos, cliente):
        """
        Proceso completo de emisión de factura electrónica
        """
        try:
            print("\n" + "="*60)
            print("🧾 INICIANDO EMISIÓN DE FACTURA ELECTRÓNICA")
            print("="*60)

            secuencial = self._incrementar_secuencial()
            print(f"📄 Secuencial: {str(secuencial).zfill(9)}")

            datos_venta = self.preparar_datos_venta(venta_pos)
            datos_cliente = self.preparar_datos_cliente(cliente)

            print(f"💰 Total: ${datos_venta['total']:.2f}")
            print(f"👤 Cliente: {datos_cliente['razon_social']}")

            print("\n📝 Generando XML...")
            xml_sin_firmar, clave_acceso = self.xml_generator.generar_factura_xml(
                datos_venta, datos_cliente, secuencial
            )

            self.sri_client.guardar_xml(xml_sin_firmar, clave_acceso, SRIConfig.DIR_XML_GENERADOS)
            print(f"🔑 Clave de acceso: {clave_acceso}")

            print("\n✍️  Firmando XML electrónicamente...")
            xml_firmado = self.firmador.firmar_xml(xml_sin_firmar)
            self.sri_client.guardar_xml(xml_firmado, clave_acceso, SRIConfig.DIR_XML_FIRMADOS)

            print("\n📤 Enviando comprobante al SRI...")
            resultado_envio = self.sri_client.enviar_comprobante(xml_firmado)

            if not resultado_envio['success']:
                self.sri_client.guardar_xml(xml_firmado, clave_acceso, SRIConfig.DIR_XML_RECHAZADOS)
                return {
                    'success': False,
                    'error': resultado_envio['mensaje'],
                    'errores': resultado_envio.get('errores', []),
                    'clave_acceso': clave_acceso
                }

            print("\n⏳ Esperando autorización del SRI...")
            resultado_autorizacion = self.sri_client.consultar_autorizacion(clave_acceso)

            if not resultado_autorizacion['success']:
                self.sri_client.guardar_xml(xml_firmado, clave_acceso, SRIConfig.DIR_XML_RECHAZADOS)
                return {
                    'success': False,
                    'error': resultado_autorizacion.get('mensaje', 'Error en autorización'),
                    'errores': resultado_autorizacion.get('errores', []),
                    'clave_acceso': clave_acceso,
                    'estado': resultado_autorizacion['estado']
                }

            autorizacion_xml = self._build_autorizacion_xml(resultado_autorizacion)
            self.sri_client.guardar_xml(
                autorizacion_xml,
                clave_acceso,
                SRIConfig.DIR_XML_AUTORIZADOS
            )

            print("\n" + "="*60)
            print("✅ FACTURA ELECTRÓNICA EMITIDA EXITOSAMENTE")
            print("="*60 + "\n")

            return {
                'success': True,
                'clave_acceso': clave_acceso,
                'numero_autorizacion': resultado_autorizacion['numero_autorizacion'],
                'fecha_autorizacion': resultado_autorizacion['fecha_autorizacion'],
                'ambiente': resultado_autorizacion['ambiente'],
                'secuencial': str(secuencial).zfill(9),
                'numero_factura': f"{SRIConfig.CODIGO_ESTABLECIMIENTO}-{SRIConfig.CODIGO_PUNTO_EMISION}-{str(secuencial).zfill(9)}",
                'total': datos_venta['total'],
                'advertencias': resultado_autorizacion.get('advertencias', [])
            }

        except Exception as e:
            print(f"\n❌ ERROR CRÍTICO: {str(e)}")
            import traceback
            traceback.print_exc()
            return {'success': False, 'error': f'Error crítico en emisión: {str(e)}'}

    def _build_autorizacion_xml(self, resultado_autorizacion):
        """
        Builds the <autorizacion> envelope that the SRI delivers to end-clients.
        The inner comprobante is wrapped in CDATA so special characters are preserved.
        """
        comprobante = resultado_autorizacion['comprobante_xml'] or ''
        mensajes = resultado_autorizacion.get('advertencias', [])

        mensajes_xml = ''
        for m in mensajes:
            mensajes_xml += (
                f'<mensaje>'
                f'<identificador>{m.get("identificador","")}</identificador>'
                f'<mensaje>{m.get("mensaje","")}</mensaje>'
                f'<tipo>{m.get("tipo","")}</tipo>'
                f'</mensaje>'
            )

        return (
            '<?xml version="1.0" encoding="UTF-8"?>\n'
            '<autorizacion>\n'
            f'    <estado>AUTORIZADO</estado>\n'
            f'    <numeroAutorizacion>{resultado_autorizacion["numero_autorizacion"]}</numeroAutorizacion>\n'
            f'    <fechaAutorizacion>{resultado_autorizacion["fecha_autorizacion"]}</fechaAutorizacion>\n'
            f'    <comprobante><![CDATA[{comprobante}]]></comprobante>\n'
            f'    <mensajes>{mensajes_xml}</mensajes>\n'
            '</autorizacion>'
        )
