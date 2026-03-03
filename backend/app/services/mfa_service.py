import pyotp
import qrcode
import io
import base64
from typing import Optional

class MFAService:
    @staticmethod
    def generate_secret():
        return pyotp.random_base32()

    @staticmethod
    def get_provisioning_uri(email: str, secret: str, issuer_name: str = "Instaura IMS"):
        return pyotp.totp.TOTP(secret).provisioning_uri(name=email, issuer_name=issuer_name)

    @staticmethod
    def verify_token(secret: str, token: str):
        totp = pyotp.totp.TOTP(secret)
        return totp.verify(token)

    @staticmethod
    def generate_qr_base64(provisioning_uri: str):
        qr = qrcode.QRCode(version=1, box_size=10, border=5)
        qr.add_data(provisioning_uri)
        qr.make(fit=True)
        img = qr.make_image(fill_color="black", back_color="white")
        
        buffered = io.BytesIO()
        img.save(buffered, format="PNG")
        return base64.b64encode(buffered.getvalue()).decode()
