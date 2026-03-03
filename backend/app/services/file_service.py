import os
import uuid
from fastapi import UploadFile, HTTPException
from ..config import settings

class FileService:
    @staticmethod
    def ensure_upload_dir():
        if not os.path.exists(settings.UPLOAD_DIR):
            os.makedirs(settings.UPLOAD_DIR)

    @staticmethod
    async def save_upload(file: UploadFile, subfolder: str = "") -> str:
        FileService.ensure_upload_dir()
        
        # Check file size
        # Note: In some environments file.size might be available, 
        # but seek/tell is reliable for standard SpooledTemporaryFile
        file.file.seek(0, 2)
        size = file.file.tell()
        file.file.seek(0)
        
        if size > settings.MAX_UPLOAD_SIZE:
            raise HTTPException(status_code=400, detail="File too large (max 5MB)")
            
        # Create subfolder if needed
        target_dir = os.path.join(settings.UPLOAD_DIR, subfolder) if subfolder else settings.UPLOAD_DIR
        if not os.path.exists(target_dir):
            os.makedirs(target_dir)
            
        # Generate unique filename
        ext = os.path.splitext(file.filename or "")[1]
        unique_name = f"{uuid.uuid4()}{ext}"
        file_path = os.path.join(target_dir, unique_name)
        
        try:
            with open(file_path, "wb") as f:
                content = await file.read()
                f.write(content)
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Could not save file: {str(e)}")
            
        # Return logical path
        return os.path.join(subfolder, unique_name).replace("\\", "/")

    @staticmethod
    def delete_file(file_path: str):
        full_path = os.path.join(settings.UPLOAD_DIR, file_path)
        if os.path.exists(full_path):
            os.remove(full_path)
