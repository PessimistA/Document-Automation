import os
import sys
from typing import Optional
from pydantic import BaseModel
from sqlalchemy.orm import Session
from fastapi import HTTPException

import models

# Klasör Ayarları
if getattr(sys, 'frozen', False):  # Derlenmiş .exe kontrolü
    BASE_DIR = os.path.dirname(sys.executable)  # Exe çalışma dizini
else:  # Normal çalışma durumu
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))  # Mevcut dosya dizini

STORAGE_BASE = os.path.join(BASE_DIR, "local_storage")  # Ana depolama yolu

FILES_DIR = os.path.join(STORAGE_BASE, "files")  # Genel dosya dizini
REPOS_DIR = os.path.join(STORAGE_BASE, "repositories")  # Kaynak kod dizini
DOCS_DIR = os.path.join(STORAGE_BASE, "saved_docs")  # belge dizini

os.makedirs(FILES_DIR, exist_ok=True)  # Dosya dizinini oluştur
os.makedirs(REPOS_DIR, exist_ok=True)  # Repo dizinini oluştur
os.makedirs(DOCS_DIR, exist_ok=True)  # Belge dizinini oluştur

def log_activity(db: Session, user_id: int, action_type: str, project_id: int = None, details: str = None):  # Sistem aktivite kaydedici
    new_activity = models.Activity(  # Yeni kayıt
        user_id=user_id,
        project_id=project_id,
        action_type=action_type,
        details=details
    )
    db.add(new_activity)  # Veritabanına ekle
    db.commit()  # İşlemi onayla

def check_project_access(db: Session, project_id: int, user_id: int):  # Proje erişim kontrolü
    safe_user_id = str(user_id)  # Güvenli tip dönüşümü

    project = db.query(models.Project).filter(models.Project.id == project_id).first()  # Projeyi sorgula
    if not project:  # Proje yoksa
        return False  # Erişimi reddet

    if str(project.user_id) == safe_user_id:  # Proje sahibi kontrolü
        return True  # Erişime izin ver

    is_member = db.query(models.ProjectMember).filter(  # Takım üyesi sorgusu
        models.ProjectMember.project_id == project_id,
        models.ProjectMember.user_id == user_id
    ).first()
    return bool(is_member)  # Üyelik durumunu dön

def get_repo_base_path(repo_id: int, db: Session, current_user_id: int):  # Fiziksel repo yolu
    db_repo = db.query(models.Repository).filter(models.Repository.id == repo_id).first()  # Repoyu sorgula
    if not db_repo:  # Repo yoksa
        raise HTTPException(status_code=404, detail="Repo bulunamadı.")

    has_access = False  # default olarak verilen erişim kapalı
    if db_repo.user_id == current_user_id:  # Repo sahibi kontrolü
        has_access = True  # Erişime izin ver
    elif db_repo.project_id is not None:  # Projeye bağlı repo kontrolü
        has_access = check_project_access(db, db_repo.project_id, current_user_id)  # Proje yetkisini denetle

    if not has_access:  # Yetki yoksa
        raise HTTPException(status_code=403, detail="Bu repoya erişim yetkiniz yok.")  # hatası fırlat
    return db_repo.repo_path  # path dön

# request modelleri
class SaveAppRequest(BaseModel):  # Uygulama kayıt modeli
    repo_id: int
    file: str
    content: str

class CodeRequest(BaseModel):  # Kod işleme modeli
    code: str

class SaveRequest(BaseModel):  # Dosya kayıt modeli
    file: str
    content: str

class DocRequest(BaseModel):  # Doküman üretim modeli
    main_topic: str
    section_name: str
    text: str
    detail_level: str = "normal"
    language: str = "Türkçe"

class InlineEditRequest(BaseModel):  # Satır içi düzenleme modeli
    full_document: str
    target_text: str
    instruction: str
    language: str = "Türkçe"

class InvitationCreate(BaseModel):  # Davetiye oluşturma modeli
    receiver_email: str
    invitation_type: str
    project_id: int = None

class InvitationRespond(BaseModel):  # Davetiye yanıt modeli
    status: str

class ExportFileRequest(BaseModel):  # Dosya dışa aktarma modeli
    project_name: str

class ExportRepoRequest(BaseModel):  # Repo dışa aktarma modeli
    project_name: str

class CreateFolderRequest(BaseModel):  # Klasör oluşturma modeli
    repo_id: int
    folder_path: str

class RenameItemRequest(BaseModel):  # Öğe yeniden adlandırma modeli
    repo_id: int
    old_path: str
    new_path: str

class RenameFileRequest(BaseModel):  # Dosya yeniden adlandırma modeli
    new_name: str

class ProfileUpdateRequest(BaseModel):  # Profil güncelleme modeli
    name: Optional[str] = None
    surname: Optional[str] = None
    role: Optional[str] = None
    department: Optional[str] = None
    location: Optional[str] = None