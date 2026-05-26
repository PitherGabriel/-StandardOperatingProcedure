"""
Quick test: sends a plain email using the SMTP credentials in .env
Run from the backend/ directory: python3 test_smtp.py [recipient@email.com]
"""
import os
import sys
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dotenv import load_dotenv

load_dotenv()

host = os.environ.get('SMTP_HOST', '')
port = int(os.environ.get('SMTP_PORT', 587))
user = os.environ.get('SMTP_USER', '')
password = os.environ.get('SMTP_PASS', '')

if not all([host, user, password]):
    print("Faltan variables de entorno: SMTP_HOST, SMTP_USER, SMTP_PASS")
    sys.exit(1)

recipient = sys.argv[1] if len(sys.argv) > 1 else user  # default: send to yourself

print(f"Conectando a {host}:{port}...")
print(f"Usuario: {user}")
print(f"Destinatario: {recipient}")

msg = MIMEMultipart()
msg['From'] = user
msg['To'] = recipient
msg['Subject'] = "Test SMTP — POS Centro Comercial TB"
msg.attach(MIMEText(
    "Este es un correo de prueba del sistema de facturación electrónica SRI.\n\n"
    "Si recibes este mensaje, la configuración SMTP está funcionando correctamente.",
    'plain', 'utf-8'
))

try:
    with smtplib.SMTP(host, port) as server:
        server.starttls()
        server.login(user, password)
        server.sendmail(user, recipient, msg.as_string())
    print(f"Correo enviado exitosamente a {recipient}")
except Exception as e:
    print(f"Error: {e}")
    sys.exit(1)
