from escpos.printer import Network


class ReceiptPrinter:
    def __init__(self):
        try:
            self.printer = Network("192.168.1.100")
        except Exception as e:
            print(f"Printer initialization error: {e}")
            self.printer = None

    def print_receipt(self, receipt_data):
        """Print receipt to thermal printer"""
        if not self.printer:
            return {'success': False, 'error': 'Printer not initialized'}

        try:
            business = receipt_data['business']
            sale = receipt_data['sale']
            items = receipt_data['items']
            totals = receipt_data['totals']

            self.printer.charcode('USA')

            self.printer.set(align='center', text_type='B', width=2, height=2)
            self.printer.text(f"{business['name']}\n")

            self.printer.set(align='center', text_type='normal', width=1, height=1)
            self.printer.text(f"{business['address']}\n")
            self.printer.text(f"{business['RUC']}\n")

            self.printer.text("================================\n")

            self.printer.set(align='left')
            self.printer.text(f"Fecha: {sale['fecha']} {sale['hora']}\n")
            self.printer.text("--------------------------------\n")

            self.printer.set(text_type='B')
            self.printer.text(f"{'Producto':<20} {'Cant':>4} {'Total':>8}\n")
            self.printer.set(text_type='normal')
            self.printer.text("--------------------------------\n")

            for item in items:
                name = item['product_name'][:20]
                self.printer.text(f"{name:<20}\n")
                qty = item['quantity_sold']
                price = item['price']
                total = price * qty
                self.printer.text(f"  ${price:.2f} x {qty:>2}        ${total:>7.2f}\n")

            self.printer.text("================================\n")

            self.printer.set(text_type='B', width=2, height=2)
            self.printer.text(f"TOTAL:          ${totals['total']:>8.2f}\n")

            self.printer.text("--------------------------------\n")

            self.printer.set(align='center')
            self.printer.text("\n")
            self.printer.set(text_type='B')
            self.printer.text("¡Gracias por su compra!\n")
            self.printer.text("\n")

            self.printer.cut()

            return {'success': True, 'message': 'Receipt printed successfully'}

        except Exception as e:
            return {'success': False, 'error': str(e)}
