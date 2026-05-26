"""
Firma electrónica XAdES-BES para el SRI Ecuador.

Estructura exacta según la especificación técnica del SRI (ficha técnica v1.1.0):

  ds:SignedInfo tiene TRES referencias:
    1. URI="#SignedProperties"          → C14N-SHA1 de etsi:SignedProperties
    2. URI="#Certificate"               → C14N-SHA1 de ds:KeyInfo
    3. URI="#comprobante" + enveloped   → C14N-SHA1 del XML sin el Signature

  ds:KeyInfo incluye X509Certificate + RSAKeyValue (módulo y exponente).
  etsi:SignedProperties incluye SigningTime, SigningCertificate y
    SignedDataObjectProperties/DataObjectFormat.
"""
import base64
import hashlib
import random
from datetime import datetime, timezone

from lxml import etree
from cryptography.hazmat.backends import default_backend
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.asymmetric import padding
from cryptography.hazmat.primitives.serialization import pkcs12, Encoding

from config import SRIConfig

DSIG  = "http://www.w3.org/2000/09/xmldsig#"
ETSI  = "http://uri.etsi.org/01903/v1.3.2#"
C14N_ALG = "http://www.w3.org/TR/2001/REC-xml-c14n-20010315"

_OID_NAMES = {
    "2.5.4.3":              "CN",
    "2.5.4.6":              "C",
    "2.5.4.7":              "L",
    "2.5.4.8":              "ST",
    "2.5.4.10":             "O",
    "2.5.4.11":             "OU",
    "2.5.4.5":              "serialNumber",
    "1.2.840.113549.1.9.1": "emailAddress",
    "2.5.4.9":              "street",
    "2.5.4.12":             "title",
}


def _format_dn(name) -> str:
    """OpenSSL-style DN (forward RDN order, comma-separated) as required by SRI."""
    parts = []
    for rdn in name.rdns:
        for attr in rdn:
            short = _OID_NAMES.get(attr.oid.dotted_string, attr.oid.dotted_string)
            parts.append(f"{short}={attr.value}")
    return ",".join(parts)


def _c14n(element: etree._Element) -> bytes:
    return etree.tostring(element, method="c14n", exclusive=False, with_comments=False)


def _sha1_b64(data: bytes) -> str:
    return base64.b64encode(hashlib.sha1(data).digest()).decode()


def _rand_id() -> str:
    return str(random.randint(100000, 999999))


class FirmaElectronica:

    def __init__(self):
        self.cert_path     = SRIConfig.CERTIFICADO_PATH
        self.cert_password = SRIConfig.CERTIFICADO_PASSWORD
        self._cargar_certificado()

    def _cargar_certificado(self):
        try:
            with open(self.cert_path, "rb") as f:
                p12_data = f.read()

            password = self.cert_password.encode("utf-8") if self.cert_password else None

            self.private_key, self.certificate, _ = pkcs12.load_key_and_certificates(
                p12_data, password, default_backend()
            )
            print("✅ Certificado cargado correctamente")
        except FileNotFoundError:
            raise Exception(f"❌ No se encontró el certificado en: {self.cert_path}")
        except Exception as e:
            raise Exception(f"❌ Error al cargar certificado: {str(e)}")

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def firmar_xml(self, xml_string: str) -> str:
        """Firma un XML con XAdES-BES y devuelve el XML firmado como string UTF-8."""

        root = etree.fromstring(xml_string.encode("utf-8"))

        # ── certificate material ──────────────────────────────────────────────
        cert_der    = self.certificate.public_bytes(Encoding.DER)
        cert_b64    = base64.b64encode(cert_der).decode()
        cert_digest = _sha1_b64(cert_der)          # used in etsi:CertDigest
        issuer_name = _format_dn(self.certificate.issuer)
        serial_num  = str(self.certificate.serial_number)

        # RSA public key components for ds:KeyValue
        pub     = self.certificate.public_key().public_numbers()
        n_bytes = pub.n.to_bytes((pub.n.bit_length() + 7) // 8, "big")
        e_bytes = pub.e.to_bytes((pub.e.bit_length() + 7) // 8, "big")
        modulus_b64  = base64.b64encode(n_bytes).decode()
        exponent_b64 = base64.b64encode(e_bytes).decode()

        # local signing time with UTC offset (e.g. -05:00 for Ecuador)
        now          = datetime.now(timezone.utc).astimezone()
        signing_time = now.strftime("%Y-%m-%dT%H:%M:%S") + _tz_offset(now)

        # stable IDs (matching those in the sample)
        n1 = _rand_id()   # Signature suffix
        n2 = _rand_id()   # SignedInfo suffix
        n3 = _rand_id()   # SignedProperties suffix
        n4 = _rand_id()   # SignedPropertiesID (Reference 1 Id)
        n5 = _rand_id()   # Certificate / KeyInfo Id
        n6 = _rand_id()   # Reference-ID (Reference 3)
        n7 = _rand_id()   # SignatureValue suffix
        n8 = _rand_id()   # Object suffix

        sig_id  = f"Signature{n1}"
        si_id   = f"Signature-SignedInfo{n2}"
        sp_id   = f"{sig_id}-SignedProperties{n3}"
        ref1_id = f"SignedPropertiesID{n4}"
        ki_id   = f"Certificate{n5}"
        ref3_id = f"Reference-ID-{n6}"
        sv_id   = f"SignatureValue{n7}"
        obj_id  = f"{sig_id}-Object{n8}"

        # ── STEP 1: build Signature element tree (placeholders for computed values) ──

        sig_nsmap = {"ds": DSIG, "etsi": ETSI}
        sig = etree.SubElement(root, f"{{{DSIG}}}Signature",
                               nsmap=sig_nsmap, Id=sig_id)

        # ds:SignedInfo
        si = etree.SubElement(sig, f"{{{DSIG}}}SignedInfo", Id=si_id)
        etree.SubElement(si, f"{{{DSIG}}}CanonicalizationMethod", Algorithm=C14N_ALG)
        etree.SubElement(si, f"{{{DSIG}}}SignatureMethod",
                         Algorithm=f"{DSIG}rsa-sha1")

        # Reference 1 – etsi:SignedProperties
        ref1 = etree.SubElement(si, f"{{{DSIG}}}Reference",
                                Id=ref1_id,
                                Type="http://uri.etsi.org/01903#SignedProperties",
                                URI=f"#{sp_id}")
        etree.SubElement(ref1, f"{{{DSIG}}}DigestMethod", Algorithm=f"{DSIG}sha1")
        dv1 = etree.SubElement(ref1, f"{{{DSIG}}}DigestValue")
        dv1.text = "PLACEHOLDER"

        # Reference 2 – ds:KeyInfo (Certificate)
        ref2 = etree.SubElement(si, f"{{{DSIG}}}Reference", URI=f"#{ki_id}")
        etree.SubElement(ref2, f"{{{DSIG}}}DigestMethod", Algorithm=f"{DSIG}sha1")
        dv2 = etree.SubElement(ref2, f"{{{DSIG}}}DigestValue")
        dv2.text = "PLACEHOLDER"

        # Reference 3 – the comprobante (root element, enveloped-signature)
        ref3 = etree.SubElement(si, f"{{{DSIG}}}Reference",
                                Id=ref3_id, URI="#comprobante")
        tfs  = etree.SubElement(ref3, f"{{{DSIG}}}Transforms")
        etree.SubElement(tfs, f"{{{DSIG}}}Transform",
                         Algorithm=f"{DSIG}enveloped-signature")
        etree.SubElement(ref3, f"{{{DSIG}}}DigestMethod", Algorithm=f"{DSIG}sha1")
        dv3 = etree.SubElement(ref3, f"{{{DSIG}}}DigestValue")
        dv3.text = "PLACEHOLDER"

        # ds:SignatureValue
        sv = etree.SubElement(sig, f"{{{DSIG}}}SignatureValue", Id=sv_id)
        sv.text = "PLACEHOLDER"

        # ds:KeyInfo
        ki        = etree.SubElement(sig, f"{{{DSIG}}}KeyInfo", Id=ki_id)
        x509_data = etree.SubElement(ki, f"{{{DSIG}}}X509Data")
        etree.SubElement(x509_data, f"{{{DSIG}}}X509Certificate").text = cert_b64
        kv    = etree.SubElement(ki, f"{{{DSIG}}}KeyValue")
        rsa_kv = etree.SubElement(kv, f"{{{DSIG}}}RSAKeyValue")
        etree.SubElement(rsa_kv, f"{{{DSIG}}}Modulus").text  = modulus_b64
        etree.SubElement(rsa_kv, f"{{{DSIG}}}Exponent").text = exponent_b64

        # ds:Object → etsi:QualifyingProperties → etsi:SignedProperties
        obj = etree.SubElement(sig, f"{{{DSIG}}}Object", Id=obj_id)
        qp  = etree.SubElement(obj, f"{{{ETSI}}}QualifyingProperties",
                               Target=f"#{sig_id}")
        sp  = etree.SubElement(qp,  f"{{{ETSI}}}SignedProperties", Id=sp_id)

        # etsi:SignedSignatureProperties
        ssp = etree.SubElement(sp, f"{{{ETSI}}}SignedSignatureProperties")
        etree.SubElement(ssp, f"{{{ETSI}}}SigningTime").text = signing_time

        sc        = etree.SubElement(ssp, f"{{{ETSI}}}SigningCertificate")
        cert_node = etree.SubElement(sc,  f"{{{ETSI}}}Cert")
        cd        = etree.SubElement(cert_node, f"{{{ETSI}}}CertDigest")
        etree.SubElement(cd, f"{{{DSIG}}}DigestMethod", Algorithm=f"{DSIG}sha1")
        etree.SubElement(cd, f"{{{DSIG}}}DigestValue").text = cert_digest

        is_node = etree.SubElement(cert_node, f"{{{ETSI}}}IssuerSerial")
        etree.SubElement(is_node, f"{{{DSIG}}}X509IssuerName").text  = issuer_name
        etree.SubElement(is_node, f"{{{DSIG}}}X509SerialNumber").text = serial_num

        # etsi:SignedDataObjectProperties
        sdop = etree.SubElement(sp, f"{{{ETSI}}}SignedDataObjectProperties")
        dof  = etree.SubElement(sdop, f"{{{ETSI}}}DataObjectFormat",
                                ObjectReference=f"#{ref3_id}")
        etree.SubElement(dof, f"{{{ETSI}}}Description").text = "contenido comprobante"
        etree.SubElement(dof, f"{{{ETSI}}}MimeType").text    = "text/xml"

        # ── STEP 2: digest of etsi:SignedProperties ───────────────────────────
        dv1.text = _sha1_b64(_c14n(sp))

        # ── STEP 3: digest of ds:KeyInfo ──────────────────────────────────────
        dv2.text = _sha1_b64(_c14n(ki))

        # ── STEP 4: digest of comprobante (enveloped-signature removes Signature) ──
        root.remove(sig)
        dv3.text = _sha1_b64(_c14n(root))
        root.append(sig)

        # ── STEP 5: sign ds:SignedInfo ────────────────────────────────────────
        si_bytes  = _c14n(si)
        sig_bytes = self.private_key.sign(si_bytes, padding.PKCS1v15(), hashes.SHA1())
        sv.text   = base64.b64encode(sig_bytes).decode()

        signed_xml = etree.tostring(
            root,
            pretty_print=True,
            xml_declaration=True,
            encoding="UTF-8",
        ).decode("utf-8")

        print("✅ XML firmado con XAdES-BES correctamente")
        return signed_xml

    def verificar_firma(self, xml_firmado: str) -> bool:
        try:
            from signxml import XMLVerifier
            root = etree.fromstring(xml_firmado.encode("utf-8"))
            XMLVerifier().verify(root)
            print("✅ Firma verificada correctamente")
            return True
        except Exception as e:
            print(f"❌ Error verificando firma: {e}")
            return False


def _tz_offset(dt: datetime) -> str:
    """Return UTC offset string like '-05:00' or '+00:00'."""
    offset = dt.utcoffset()
    if offset is None:
        return "Z"
    total = int(offset.total_seconds())
    sign  = "+" if total >= 0 else "-"
    total = abs(total)
    h, m  = divmod(total // 60, 60)
    return f"{sign}{h:02d}:{m:02d}"
