import os
import sys
from flask import Flask, request, jsonify
from flask_cors import CORS

# Set PRINTER_NAME env var if the printer appears under a different name in
# Windows "Impresoras y escáneres" (Settings → Bluetooth y dispositivos).
PRINTER_NAME = os.environ.get('PRINTER_NAME', 'POS-80C')
PORT = int(os.environ.get('BRIDGE_PORT', '6543'))

app = Flask(__name__)
CORS(app)

try:
    import win32print
except ImportError:
    print('ERROR: pywin32 not found. Run:  pip install -r requirements.txt')
    sys.exit(1)


@app.get('/health')
def health():
    return jsonify({'ok': True, 'printer': PRINTER_NAME})


@app.post('/print')
def print_receipt():
    data = request.get_data()
    if not data:
        return jsonify({'error': 'No data received'}), 400
    try:
        hp = win32print.OpenPrinter(PRINTER_NAME)
        try:
            win32print.StartDocPrinter(hp, 1, ('Receipt', None, 'RAW'))
            win32print.StartPagePrinter(hp)
            win32print.WritePrinter(hp, data)
            win32print.EndPagePrinter(hp)
            win32print.EndDocPrinter(hp)
        finally:
            win32print.ClosePrinter(hp)
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    return jsonify({'ok': True})


if __name__ == '__main__':
    print(f'Print bridge  →  http://127.0.0.1:{PORT}')
    print(f'Printer name  →  {PRINTER_NAME}')
    app.run(host='127.0.0.1', port=PORT)
