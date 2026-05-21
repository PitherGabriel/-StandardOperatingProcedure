from flask import Flask, request, jsonify, session, send_file
from flask_cors import CORS
from modules.inventory import InventoryManager
from modules.inference import InferenceModel
import time
import os

_sri_manager = None

def _get_sri_manager():
    global _sri_manager
    if _sri_manager is None:
        try:
            from modules.sri_manager import SRIManager
            _sri_manager = SRIManager()
        except Exception as e:
            raise RuntimeError(f"SRI Manager no inicializado: {e}")
    return _sri_manager

def create_app():
    app = Flask(__name__)

    app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY')

    app.config.update(
        SESSION_COOKIE_NAME='pos_session',
        SESSION_COOKIE_HTTPONLY=True,
        SESSION_COOKIE_SAMESITE='Lax',
        SESSION_COOKIE_SECURE=os.environ.get('FLASK_ENV') == 'production',
        SESSION_COOKIE_PATH='/',      # 👈 THIS LINE
        SESSION_PERMANENT=True,
        PERMANENT_SESSION_LIFETIME=60 * 60 * 24 * 7,  # 7 days
        SESSION_REFRESH_EACH_REQUEST=True
    )

    CORS(app, supports_credentials=True)  # Importante: soportar credenciales

    CREDS_PATH = os.environ.get("GOOGLE_APPLICATION_CREDENTIALS")
    
    if not CREDS_PATH:
        raise RuntimeError("GOOGLE_APPLICATION_CREDENTIALS is not set")

    if not os.path.isfile(CREDS_PATH):
        raise RuntimeError(f"Credentials file not found: {CREDS_PATH}")
    
    inventory = InventoryManager(CREDS_PATH, 'CentroComercialTB')
    inference_engine = InferenceModel()

    @app.route('/api/auth/login', methods=['POST'])
    def login():
        try:
            data = request.json
            username = data.get('username')
            password = data.get('password')
            
            if not username or not password:
                return jsonify({
                    'success': False,
                    'message': 'Usuario y contraseña son requeridos'
                }), 400
            
            result = inventory.authenticate_user(username, password)
            
            if result['success']:
                # Guardar usuario en sesión
                session['user'] = result['user']
                session.permanent = True
                
                return jsonify(result)
            else:
                return jsonify(result), 401
                
        except Exception as e:
            return jsonify({
                'success': False,
                'message': str(e)
            }), 500

    @app.route('/api/auth/logout', methods=['POST'])
    def logout():
        session.pop('user', None)
        return jsonify({'success': True, 'message': 'Sesión cerrada'})

    @app.route('/api/auth/check', methods=['GET'])
    def check_auth():
        """Verifica si hay sesión activa"""
        if 'user' in session:
            return jsonify({
                'success': True,
                'authenticated': True,
                'user': session['user']
            })
        else:
            return jsonify({
                'success': True,
                'authenticated': False
            })

    @app.route('/api/users/create', methods=['POST'])
    def create_user():
        """Solo administradores pueden crear usuarios"""
        try:
            # Verificar que hay sesión activa y es admin
            if 'user' not in session or session['user']['role'] != 'admin':
                return jsonify({
                    'success': False,
                    'message': 'No autorizado'
                }), 403
            
            data = request.json
            result = inventory.create_user(
                username=data['username'],
                password=data['password'],
                role=data.get('role', 'vendedor'),
                nombre=data.get('nombre', '')
            )
            
            return jsonify(result)
            
        except Exception as e:
            return jsonify({
                'success': False,
                'message': str(e)
            }), 500

    @app.route('/api/users', methods=['GET'])
    def get_users():
        """Solo administradores pueden ver usuarios"""
        try:
            if 'user' not in session or session['user']['role'] != 'admin':
                return jsonify({
                    'success': False,
                    'message': 'No autorizado'
                }), 403
            
            result = inventory.get_all_users()
            return jsonify(result)
            
        except Exception as e:
            return jsonify({
                'success': False,
                'message': str(e)
            }), 500

    # Middleware para proteger rutas
    def require_auth(f):
        from functools import wraps
        @wraps(f)
        def decorated_function(*args, **kwargs):
            if 'user' not in session:
                return jsonify({
                    'success': False,
                    'message': 'No autorizado. Inicie sesión.'
                }), 401
            return f(*args, **kwargs)
        return decorated_function

    @app.route('/api/inventory', methods=['GET'])
    def get_inventory():
        """Obtener todo el inventario"""
        try:
            print("Pulling all inventory from Google Sheets")
            data = inventory.get_inventory()
            #print(data)
            return jsonify({'success': True, 'data': data})
        except Exception as e:
            return jsonify({'success': False, 'error': str(e)}), 500

    @app.route('/api/inventory/add', methods=['POST'])
    def add_product():
        try:
            data = request.json
            
            # Validar datos requeridos
            required_fields = ['codigo', 'nombre', 'costo', 'precio_1', 'unidad']
            for field in required_fields:
                if field not in data:
                    return jsonify({
                        'success': False,
                        'message': f'Campo requerido faltante: {field}'
                    }), 400

            # Preparar datos del producto con valores por defecto
            product_data = {
                'codigo': data['codigo'],
                'nombre': data['nombre'],
                'cantidad': data.get('cantidad', 0),
                'costo': float(data['costo']),
                'precio_1': float(data['precio_1']),
                'precio_2': float(data['precio_2']),
                'precio_3': float(data['precio_3']),
                'minStock': data.get('minStock', 5),
                'unidad': data['unidad'],
                'categoria': data.get('categoria', ''),
                'subcategoria': data.get('subcategoria', ''),
                'descuento': float(data.get('descuento', 0) or 0),
            }
            
            # Guardar producto usando la clase de Google Sheets
            result = inventory.add_product(product_data)
           
            return jsonify(result)
            
        except Exception as e:
            return jsonify({
                'success': False,
                'message': str(e)
            }), 500

    @app.route('/api/product/<code>', methods=['GET'])
    def get_product(code):
        """Obtener un producto específico"""
        product = inventory.get_product_by_code(code)
        if product:
            return jsonify({'success': True, 'data': product})
        return jsonify({'success': False, 'error': 'Producto no encontrado'}), 404

    @app.route('/api/inventory/<code>', methods=['PUT'])
    def update_product(code):
        """Actualizar datos de un producto existente"""
        try:
            data = request.json
            result = inventory.update_product(code, data)
            return jsonify(result)
        except Exception as e:
            return jsonify({'success': False, 'error': str(e)}), 500

    @app.route('/api/inventory/<code>/adjust', methods=['POST'])
    def adjust_stock(code):
        """Ajustar el stock de un producto"""
        try:
            data = request.json
            cantidad_ajuste = data.get('cantidad_ajuste')
            motivo = data.get('motivo', '')
            if cantidad_ajuste is None:
                return jsonify({'success': False, 'error': 'cantidad_ajuste es requerido'}), 400
            result = inventory.adjust_stock(code, float(cantidad_ajuste), motivo)
            return jsonify(result)
        except Exception as e:
            return jsonify({'success': False, 'error': str(e)}), 500

    @app.route('/api/sale', methods=['POST'])
    def process_sale():
        """Procesar una venta"""
        try:
            cart = []
            vendedor = "Sistema"

            # Check what type of data is coming
            if request.is_json:
                cart = request.json.get('cart', [])
                vendedor = request.json.get('vendedor', 'Sistema')
                metodo_pago = request.json.get('metodoPago', 'efectivo')
                referencia = request.json.get('referencia', '')

            else:
                image = request.files.get('image')
                if not image:
                    return jsonify({
                        'success': False,
                        'error': 'No image provided'
                    }), 400
                # Convert image to cart
                cart = inference_engine.infer_cart_from_image(image)
                vendedor = request.form.get('vendedor', 'Sistema')
                metodo_pago = request.form.get('metodoPago', 'efectivo')
                referencia = request.form.get('referencia', '')

            print(f"Carrito de compra : {cart}")
            result = inventory.process_sale(cart, vendedor, metodo_pago, referencia)

            return jsonify(result)
        except Exception as e:
            return jsonify({'success': False, 'error': str(e)}), 500
        
    
    @app.route('/api/analyze-picture', methods=['POST'])
    def analyze_picture():
        """Analyze a sales list image and return a proposed cart using OCR + fuzzy matching"""
        try:
            image = request.files.get('image')
            if not image:
                return jsonify({'success': False, 'error': 'No image provided'}), 400

            # Load current inventory for matching
            inventory_items = inventory.get_inventory()

            cart = inference_engine.infer_cart_from_image(image, inventory_items)
            print(f"OCR cart result: {cart}")

            return jsonify({'success': True, 'cart': cart})

        except Exception as e:
            import traceback
            traceback.print_exc()
            return jsonify({'success': False, 'error': str(e)}), 500

    @app.route('/api/sale/<sale_id>/refund', methods=['POST'])
    def refund_sale(sale_id):
        """Procesar una devolución parcial o total de una venta"""
        try:
            items = request.json.get('items', [])
            if not items:
                return jsonify({'success': False, 'error': 'items es requerido'}), 400
            result = inventory.refund_sale(sale_id, items)
            return jsonify(result)
        except Exception as e:
            return jsonify({'success': False, 'error': str(e)}), 500

    @app.route('/api/sales/history', methods=['GET'])
    def get_sales_history():
        """Obtener historial de ventas"""
        try:
            limit = request.args.get('limit', type=int)
            date_from = request.args.get('date_from')
            date_to = request.args.get('date_to')

            history = inventory.get_sales_history(limit, date_from, date_to)
            return jsonify({'success': True, 'data': history})
        except Exception as e:
            return jsonify({'success': False, 'error': str(e)}), 500

    @app.route('/api/sales/chart', methods=['GET'])
    def get_sales_chart():
        try:
            period = request.args.get('period', 'today')
            result = inventory.get_sales_chart(period)
            return jsonify(result)
        except Exception as e:
            return jsonify({'success': False, 'error': str(e)}), 500

    @app.route('/api/sales/summary', methods=['GET'])
    def get_sales_summary():
        """Obtener resumen de ventas del día"""
        try:
            date = request.args.get('date')  # Formato: YYYY-MM-DD
            summary = inventory.get_sales_summary(date)
            return jsonify({'success': True, 'data': summary})
        except Exception as e:
            return jsonify({'success': False, 'error': str(e)}), 500
        
    @app.route('/api/alerts', methods=['GET'])
    def get_alerts():
        """Obtener alertas de stock bajo"""
        try:
            print("get api alerts")
            alerts = inventory.get_low_stock_alerts()
            return jsonify({'success': True, 'alerts': alerts})
        except Exception as e:
            return jsonify({'success': False, 'error': str(e)}), 500

    @app.route('/api/categories', methods=['GET'])
    def get_categories():
        try:
            result = inventory.get_categories()
            return jsonify(result)
        except Exception as e:
            return jsonify({'success': False, 'error': str(e)}), 500

    @app.route('/api/categories', methods=['POST'])
    def add_category():
        try:
            data = request.json
            categoria = data.get('categoria', '').strip()
            subcategoria = data.get('subcategoria', '').strip()
            if not categoria:
                return jsonify({'success': False, 'error': 'Nombre de categoría requerido'}), 400
            result = inventory.add_category(categoria, subcategoria)
            return jsonify(result)
        except Exception as e:
            return jsonify({'success': False, 'error': str(e)}), 500

    @app.route('/api/sales/export', methods=['GET'])
    def export_cierre_caja():
        try:
            from datetime import datetime
            period = request.args.get('period', 'today')
            custom_start = request.args.get('start_date')
            custom_end = request.args.get('end_date')

            result = inventory.export_cierre_caja(period, custom_start, custom_end)
            if not result['success']:
                return jsonify(result), 400

            periodo_safe = result['periodo'].replace('/', '-').replace(' ', '_')
            filename = f"cierre_caja_{periodo_safe}.xlsx"

            return send_file(
                result['workbook'],
                mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                as_attachment=True,
                download_name=filename,
            )
        except Exception as e:
            return jsonify({'success': False, 'error': str(e)}), 500

    @app.route('/api/sales/profit-analysis', methods=['GET'])
    def get_profit_analysis():
        try:
            period = request.args.get('period', 'today')  # today, week, month, custom
            custom_start = request.args.get('start_date')
            custom_end = request.args.get('end_date')
            
            result = inventory.get_profit_analysis(period, custom_start, custom_end)
            return jsonify(result)
            
        except Exception as e:
            return jsonify({
                'success': False,
                'message': str(e)
            }), 500
    
    @app.route('/api/sale-with-invoice-sri', methods=['POST'])
    def process_sale_with_invoice_sri():
        """Procesar venta con factura electrónica SRI"""
        try:
            data = request.json or {}
            cart = data.get('cart', [])
            vendedor = data.get('vendedor', 'Sistema')
            metodo_pago = data.get('metodoPago', 'efectivo')
            referencia = data.get('referencia', '')
            cliente = data.get('cliente', None)

            if not cliente:
                return jsonify({'success': False, 'error': 'Datos del cliente requeridos para facturar'}), 400

            for campo in ['identificacion', 'razon_social', 'email']:
                if not cliente.get(campo):
                    return jsonify({'success': False, 'error': f'Campo {campo} del cliente es obligatorio'}), 400

            # 1. Procesar venta normal
            sale_result = inventory.process_sale(cart, vendedor, metodo_pago, referencia)
            if not sale_result['success']:
                return jsonify(sale_result), 400

            # 2. Emitir factura electrónica SRI
            try:
                sri_manager = _get_sri_manager()
            except RuntimeError as e:
                return jsonify({'success': False, 'error': str(e)}), 503

            venta_pos = {
                'cart': cart,
                'vendedor': vendedor,
                'sale_id': sale_result['sale_id'],
                'cliente': cliente,
            }
            invoice_result = sri_manager.emitir_factura(venta_pos, cliente)

            if not invoice_result['success']:
                return jsonify({
                    'success': False,
                    'error': f"Venta procesada pero factura falló: {invoice_result.get('error', 'Error desconocido')}",
                    'sale_id': sale_result['sale_id'],
                    'detalles_error': invoice_result,
                }), 500

            # 3. Guardar datos de factura en Google Sheets hoja "Facturas"
            inventory.save_invoice_to_sheet(sale_result['sale_id'], invoice_result, cliente, cart, sale_result['total'])

            # 4. Enviar email al cliente con el XML autorizado
            import os as _os
            from config import SRIConfig
            xml_path = _os.path.join(
                SRIConfig.DIR_XML_AUTORIZADOS,
                f"{invoice_result.get('clave_acceso', '')}.xml"
            )
            email_result = inventory.send_invoice_email(
                cliente['email'],
                cliente['razon_social'],
                invoice_result,
                xml_path if _os.path.isfile(xml_path) else None,
            )
            if not email_result['success']:
                print(f"Advertencia: email no enviado — {email_result['error']}")

            return jsonify({
                'success': True,
                'sale': sale_result,
                'invoice': invoice_result,
                'email_enviado': email_result['success'],
            })

        except Exception as e:
            import traceback
            traceback.print_exc()
            return jsonify({'success': False, 'error': str(e)}), 500

    return app
app = create_app()
#if __name__ == '__main__':
#    app.run(host="0.0.0.0", debug=True, port=5000)