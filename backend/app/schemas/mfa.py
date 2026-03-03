from pydantic import BaseModel
from typing import Optional

class MFASetupResponse(BaseModel):
    secret: str
    qr_code: str # Base64 encoded PNG
    provisioning_uri: str

class MFAEnableRequest(BaseModel):
    token: str
    secret: str # The secret generated in setup

class MFAVerifyRequest(BaseModel):
    token: str
    user_id: str
