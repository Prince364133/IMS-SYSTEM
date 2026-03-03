import os
import uuid
import shutil
from fastapi import UploadFile, HTTPException
from typing import List, Optional
from datetime import datetime

# Root directory for uploads
UPLOAD_DIR = "uploads"
if not os.path.exists(UPLOAD_DIR):
    os.makedirs(UPLOAD_DIR)

class UploadService:
    @staticmethod
    def save_file(file: UploadFile, sub_dir: str = "general") -> str:
        # 1. Create sub-directory if needed
        full_sub_dir = os.path.join(UPLOAD_DIR, sub_dir)
        if not os.path.exists(full_sub_dir):
            os.makedirs(full_sub_dir)
            
        # 2. Extract extension and generate unique name
        filename = file.filename
        ext = os.path.splitext(filename)[1].lower()
        if not ext:
            ext = ".bin" # Fallback
            
        unique_name = f"{datetime.now().strftime('%Y%m%d%H%M%S')}_{uuid.uuid4().hex}{ext}"
        save_path = os.path.join(full_sub_dir, unique_name)
        
        # 3. Save to disk
        try:
            with open(save_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to save file: {str(e)}")
        finally:
            file.file.close() # Always close the file handle
            
        # 4. Return relative path for URL generation
        return f"/uploads/{sub_dir}/{unique_name}"

    @staticmethod
    def delete_file(file_url: str):
        # File URL is expected as /uploads/sub_dir/filename
        if not file_url.startswith("/uploads/"):
            return
            
        rel_path = file_url.lstrip("/")
        full_path = os.path.join(os.getcwd(), rel_path) # Absolute path from CWD
        
        if os.path.exists(full_path):
            os.remove(full_path)
