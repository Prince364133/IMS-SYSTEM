from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from ..middleware.auth import get_current_user
from ..models.user import User
from ..services.file_service import FileService

router = APIRouter(prefix="/api/upload", tags=["upload"])

@router.post("")
async def upload_file(
    file: UploadFile = File(...),
    subfolder: str = "general",
    current_user: User = Depends(get_current_user)
):
    # Basic validation for subfolder to prevent directory traversal or clutter
    allowed_subfolders = ["resumes", "projects", "chat", "general"]
    if subfolder not in allowed_subfolders:
        subfolder = "general"
        
    # Check if a file was actually uploaded
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file selected")
        
    file_path = await FileService.save_upload(file, subfolder)
    
    return {
        "url": f"/uploads/{file_path}",
        "filename": file.filename,
        "type": file.content_type
    }
