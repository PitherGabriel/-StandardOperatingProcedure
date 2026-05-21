import re
import unicodedata


class InferenceModel:
    """
    OCR-based product recognition from images of handwritten/printed sales lists.
    Uses PaddleOCR for text extraction and deterministic fuzzy matching against
    the inventory database — no external API calls, zero ongoing cost.
    """

    def __init__(self, _api_key=None):
        # api_key param kept for backward-compat but unused
        self._ocr = None  # Lazy init: PaddleOCR loads slowly on first use

    def _get_ocr(self):
        if self._ocr is None:
            from paddleocr import PaddleOCR
            self._ocr = PaddleOCR(use_angle_cls=True, lang='es', show_log=False)
        return self._ocr

    @staticmethod
    def _normalize(text):
        """Lowercase, strip accents, remove non-alphanumeric."""
        text = unicodedata.normalize('NFKD', str(text)).encode('ascii', 'ignore').decode('ascii')
        text = re.sub(r'[^a-z0-9\s]', ' ', text.lower())
        return re.sub(r'\s+', ' ', text).strip()

    @staticmethod
    def _levenshtein(s1, s2):
        """Normalized Levenshtein similarity [0.0 – 1.0]."""
        if not s1 or not s2:
            return 0.0
        n, m = len(s1), len(s2)
        prev = list(range(m + 1))
        for i in range(1, n + 1):
            curr = [i] + [0] * m
            for j in range(1, m + 1):
                curr[j] = prev[j - 1] if s1[i - 1] == s2[j - 1] else 1 + min(prev[j], curr[j - 1], prev[j - 1])
            prev = curr
        return 1.0 - prev[m] / max(n, m)

    def _match_product(self, token, inventory_items, threshold=0.65):
        """Return (item, score, method) for the best inventory match."""
        token_norm = self._normalize(token)
        if not token_norm:
            return None, 0.0, 'empty'

        best_item, best_score, best_method = None, 0.0, 'no_match'

        for item in inventory_items:
            codigo = str(item.get('Codigo', '')).strip()
            nombre = str(item.get('Nombre', ''))
            nombre_norm = self._normalize(nombre)

            # Exact code match — highest priority
            if token.strip().upper() == codigo.upper():
                return item, 1.0, 'exact_code'

            # Exact normalized name
            if token_norm == nombre_norm:
                return item, 0.97, 'exact_name'

            # Substring containment (partial word matching)
            if token_norm and nombre_norm:
                if token_norm in nombre_norm:
                    score = len(token_norm) / len(nombre_norm)
                    score = min(0.90, max(0.70, score))
                elif nombre_norm in token_norm:
                    score = len(nombre_norm) / len(token_norm)
                    score = min(0.88, max(0.65, score))
                else:
                    score = self._levenshtein(token_norm, nombre_norm)

                if score > best_score and score >= threshold:
                    best_score, best_item, best_method = score, item, 'fuzzy'

        return best_item, best_score, best_method

    def infer_cart_from_image(self, image_file, inventory_items=None):
        """
        Extracts a cart from an image of a sales list.
        Steps:
          1. PaddleOCR extracts text lines
          2. Regex heuristics parse quantity + product token per line
          3. Fuzzy match each token against inventory
        Returns list of cart dicts compatible with process_sale().
        """
        try:
            image_bytes = image_file.read() if hasattr(image_file, 'read') else image_file
        except Exception:
            image_bytes = image_file

        ocr = self._get_ocr()
        result = ocr.ocr(image_bytes, cls=True)

        if not result or not result[0]:
            print("OCR returned no results")
            return []

        lines = [(line[1][0].strip(), float(line[1][1])) for line in result[0] if line[1][0].strip()]
        print(f"OCR extracted {len(lines)} lines: {[l[0] for l in lines]}")

        qty_first_re  = re.compile(r'^(\d+(?:[.,]\d+)?)\s*[xX\*\-]?\s+(.+)', re.UNICODE)
        qty_last_re   = re.compile(r'^(.+?)\s+[xX\*]\s*(\d+(?:[.,]\d+)?)$', re.UNICODE)
        qty_suffix_re = re.compile(r'^(.+?)\s+(\d+(?:[.,]\d+)?)$', re.UNICODE)

        cart = []
        seen_codes = {}  # code -> cart index for duplicate accumulation

        for raw_text, ocr_conf in lines:
            quantity = 1.0
            product_token = raw_text

            for pat, qty_group, tok_group in [
                (qty_first_re,  1, 2),
                (qty_last_re,   2, 1),
                (qty_suffix_re, 2, 1),
            ]:
                m = pat.match(raw_text)
                if m:
                    try:
                        q = float(m.group(qty_group).replace(',', '.'))
                        if 0 < q <= 9999:
                            quantity = q
                            product_token = m.group(tok_group).strip()
                            break
                    except ValueError:
                        pass

            if not inventory_items or not product_token:
                continue

            matched, score, method = self._match_product(product_token, inventory_items)

            if matched and score >= 0.65:
                codigo = str(matched.get('Codigo', '')).strip()

                if codigo in seen_codes:
                    cart[seen_codes[codigo]]['cantidadVendida'] += quantity
                    continue

                seen_codes[codigo] = len(cart)
                cart.append({
                    'codigo': codigo,
                    'nombre': str(matched.get('Nombre', '')),
                    'cantidadVendida': quantity,
                    'precio': float(str(matched.get('Precio_1', 0)) or 0),
                    'tipoPrecio': 'precio',
                    'confidence': round(score, 2),
                    'original_text': raw_text,
                    'match_method': method,
                })
            else:
                cart.append({
                    'codigo': '',
                    'nombre': product_token,
                    'cantidadVendida': quantity,
                    'precio': 0,
                    'tipoPrecio': 'precio',
                    'confidence': 0.0,
                    'original_text': raw_text,
                    'match_method': 'no_match',
                })

        print(f"Cart built: {len(cart)} items, {len([c for c in cart if c['confidence'] >= 0.65])} matched")
        return cart
