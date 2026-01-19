import gspread
from oauth2client.service_account import ServiceAccountCredentials
from datetime import datetime
import uuid

class InventoryManager:
    def __init__(self, credentials_file, spreadsheet_name):
        scope = ['https://spreadsheets.google.com/feeds',
                 'https://www.googleapis.com/auth/drive']
        
        creds = ServiceAccountCredentials.from_json_keyfile_name(
            credentials_file, scope
        )
        self.client = gspread.authorize(creds)
        self.spreadsheet = self.client.open(spreadsheet_name)
        self.sheet_inventory = self.spreadsheet.worksheet('Inventario')
        self.sheet_sales = self.spreadsheet.worksheet('Ventas')
        
    def get_inventory(self):
        """Obtiene todo el inventario"""
        records = self.sheet_inventory.get_all_records()
        return records
    
    def get_product_by_code(self, code):
        """Busca un producto por código"""
        try:
            cell = self.sheet_inventory.find(code)
            row = self.sheet_inventory.row_values(cell.row)
            return {
                'id': row[0],
                'codigo': row[1],
                'nombre': row[2],
                'cantidad': int(row[3]),
                'precio': float(row[4]),
                'minStock': int(row[5])
            }
        except:
            return None
    
    def update_stock(self, product_code, quantity_sold):
        """Actualiza el stock después de una venta"""
        try:
            # Buscar el producto
            cell = self.sheet_inventory.find(product_code)
            row = cell.row
            
            # Obtener datos del producto
            product_id = self.sheet_inventory.cell(row, 1).value
            product_name = self.sheet_inventory.cell(row, 3).value
            current_qty = int(self.sheet_inventory.cell(row, 4).value)
            price = float(self.sheet_inventory.cell(row, 5).value)
            min_stock = int(self.sheet_inventory.cell(row, 6).value)
            
            # Verificar si hay suficiente stock
            if current_qty < quantity_sold:
                return {
                    'success': False,
                    'error': 'Stock insuficiente'
                }
            
            # Calcular nueva cantidad
            new_qty = current_qty - quantity_sold
            
            # Actualizar en la hoja
            self.sheet_inventory.update_cell(row, 4, new_qty)
            
            # Actualizar timestamp
            timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
            self.sheet_inventory.update_cell(row, 7, timestamp)
            
            # Verificar si requiere alerta
            alert = new_qty <= min_stock
            
            return {
                'success': True,
                'product_id': product_id,
                'product_code': product_code,
                'product_name': product_name,
                'price': price,
                'quantity_sold':quantity_sold,
                'new_quantity': new_qty,
                'alert': alert
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
        
    def save_sale(self, sale_id, cart_items, total, vendedor='Sistema'):
        """Guarda el detalle de la venta en la hoja de Ventas"""
        try:
            now = datetime.now()
            fecha = now.strftime('%Y-%m-%d')
            hora = now.strftime('%H:%M:%S')
            
            # Preparar filas para insertar
            rows = []
            for item in cart_items:
                row = [
                    sale_id,
                    fecha,
                    hora,
                    item['product_id'],
                    item['product_code'],
                    item['product_name'],
                    item['quantity_sold'],
                    item['price'],
                    item['price'] * item['quantity_sold'],  # Subtotal
                    total,
                    vendedor
                ]
                rows.append(row)
            print(f'Filas para insertar: {rows}')
            # Insertar todas las filas de la venta
            self.sheet_sales.append_rows(rows)
            
            return {
                'success': True,
                'sale_id': sale_id,
                'items_saved': len(rows)
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }

        
    def process_sale(self, cart_items, vendedor='Sistema'):
        """Procesa una venta completa"""

        sale_id = f"VTA-{datetime.now().strftime('%Y%m%d')}-{str(uuid.uuid4())[:8]}"

        results = []
        alerts = []
        total_sale = 0
        sale_details = []
        
        # Procesar cada producto        
        for item in cart_items:
            print(f"Processing {item['codigo']}")
            result = self.update_stock(
                item['codigo'],
                item['cantidad_vendida']
            )
            
            if not result['success']:
                return{
                    'success': False,
                    'error': f"Error en {item['codigo']}: {result['error']}"
                }
            
            results.append(result)

            # Calcular total
            subtotal = result['price']*result['quantity_sold']
            total_sale += subtotal
            
            # Guardar detalles para el historial
            sale_details.append({
                'product_id': result['product_id'],
                'product_code': result['product_code'],
                'product_name': result['product_name'],
                'price': result['price'],
                'quantity_sold': result['quantity_sold']
            })
            
            # Verificar alertas
            if result.get('alert'):
                alerts.append({
                    'producto': result['product_name'],
                    'cantidad_restante': result['new_quantity']
                })

        print(f"Sales details: {sale_details}")
            
        save_result = self.save_sale(sale_id, sale_details, total_sale, vendedor)

        if not save_result['success']:
            return {
                'success': False,
                'error': f"Venta procesada pero no se guardó en historial: {save_result['error']}"
            }
            
        return {
            'success': True,
            'sale_id': sale_id,
            'total': total_sale,
            'items': len(results),
            'results': results,
            'alerts': alerts
        }
    
    def get_sales_history(self, limit=None, date_from=None, date_to=None):
        """Obtiene el historial de ventas con filtros opcionales"""
        try:
            records = self.sheet_sales.get_all_records()
            
            # Filtrar por fecha si se especifica
            if date_from:
                records = [r for r in records if r['Fecha'] >= date_from]
            if date_to:
                records = [r for r in records if r['Fecha'] <= date_to]
            
            # Limitar cantidad de resultados
            if limit:
                records = records[-limit:]
            
            return records
        except Exception as e:
            print(f"Error obteniendo historial: {e}")
            return []
    
    def get_sales_summary(self, date=None):
        """Obtiene un resumen de ventas del día"""
        try:
            if date is None:
                date = datetime.now().strftime('%Y-%m-%d')
            
            records = self.sheet_sales.get_all_records()
            daily_sales = [r for r in records if r['Fecha'] == date]
            
            if not daily_sales:
                return {
                    'date': date,
                    'total_sales': 0,
                    'total_amount': 0,
                    'items_sold': 0,
                    'unique_sales': 0
                }
            
            # Calcular estadísticas
            unique_sales = len(set(r['VentaID'] for r in daily_sales))
            total_items = sum(r['Cantidad'] for r in daily_sales)
            total_amount = sum(r['Subtotal'] for r in daily_sales)
            
            return {
                'date': date,
                'total_sales': unique_sales,
                'total_amount': total_amount,
                'items_sold': total_items,
                'sales': daily_sales
            }
            
        except Exception as e:
            return {
                'error': str(e)
            }
            
    def get_low_stock_alerts(self):
        """Obtiene todos los productos con stock bajo"""
        records = self.get_inventory()
        alerts = []
        
        for record in records:
            if record['Cantidad'] <= record['MinStock']:
                alerts.append({
                    'codigo': record['Codigo'],
                    'nombre': record['Nombre'],
                    'cantidad': record['Cantidad'],
                    'minimo': record['MinStock']
                })
        
        return alerts


# Ejemplo de uso
if __name__ == "__main__":
    # Inicializar
    inventory = InventoryManager(
        'credenciales.json',
        'Inventario_MiTienda'
    )
    
    # Ejemplo de venta
    venta = [
        {'codigo': 'CAM001', 'cantidad_vendida': 2},
        {'codigo': 'PAN001', 'cantidad_vendida': 1}
    ]
    
    resultado = inventory.process_sale(venta)
    
    if resultado['success']:
        print("✅ Venta procesada exitosamente")
        
        if resultado['alerts']:
            print("\n⚠️ ALERTAS DE STOCK BAJO:")
            for alert in resultado['alerts']:
                print(f"  - {alert['producto']}: {alert['cantidad_restante']} unidades")
    else:
        print("❌ Error procesando la venta")