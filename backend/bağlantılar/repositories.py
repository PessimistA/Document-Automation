import os
import shutil
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File as FastAPIFile, Form
from sqlalchemy.orm import Session
from typing import List

import schemas
import models
from database import get_db
from auth import verify_token
from services.repo_service import get_file_tree_service, save_file_service, REPOS_DIR
from bağlantılar.core import log_activity, check_project_access, get_repo_base_path, SaveAppRequest, ExportRepoRequest, CreateFolderRequest, RenameItemRequest

router = APIRouter()

@router.get("/repositories/", response_model=List[schemas.RepositoryOut]) # Şahsi depoları görme adresi
def get_all_repositories(db: Session = Depends(get_db), current_user_id: int = Depends(verify_token)):
    return db.query(models.Repository).filter( # current usera ait olan ve
        models.Repository.user_id == current_user_id,
        models.Repository.project_id == None # Projesi olmayanları getir
    ).all()


@router.get("/projects/{project_id}/repositories/", response_model=List[schemas.RepositoryOut]) # Proje depolarını görme adresi
def get_project_repositories(project_id: int, db: Session = Depends(get_db),
                             current_user_id: int = Depends(verify_token)):
    if not check_project_access(db, project_id, current_user_id): # İzin kontrolü yap
        raise HTTPException(status_code=403, detail="Bu projeyi görüntüleme yetkiniz yok")
    return db.query(models.Repository).filter(models.Repository.project_id == project_id).all() # Projeye ait depoları ver


@router.post("/repositories/", response_model=schemas.RepositoryOut) # Yeni depo kurma adresi
def create_new_repository(repo: schemas.RepositoryCreate, db: Session = Depends(get_db),
                          current_user_id: int = Depends(verify_token)):
    existing_repo = db.query(models.Repository).filter(models.Repository.repo_name == repo.repo_name, # Aynı isimde var mı bak
                                                       models.Repository.user_id == current_user_id).first()
    if existing_repo:
        raise HTTPException(status_code=400, detail="Bu isimde bir deponuz zaten var.")

    repo_dir = os.path.join(REPOS_DIR, f"user_{current_user_id}_{repo.repo_name}") # Fiziksel klasör yolunu belirle
    os.makedirs(repo_dir, exist_ok=True) # Klasörü bilgisayarda aç

    new_repo = models.Repository( # Veritabanına kaydını gir
        repo_name=repo.repo_name,
        description=repo.description,
        language=repo.language,
        repo_path=repo_dir,
        project_id=repo.project_id,
        user_id=current_user_id
    )
    db.add(new_repo) # Kaydet
    db.commit()
    db.refresh(new_repo)
    log_activity(db, user_id=current_user_id, action_type="repo_created",
                 details=f"Yeni depo oluşturuldu: {repo.repo_name}") # İşlemi loga yaz
    return new_repo


@router.post("/projects/{project_id}/link_repo/{repo_id}") # Şahsi depoyu projeye taşıma adresi
def link_system_repo_to_project(project_id: int, repo_id: int, db: Session = Depends(get_db),
                                current_user_id: int = Depends(verify_token)):
    if not check_project_access(db, project_id, current_user_id): # İzin kontrolü
        raise HTTPException(status_code=403, detail="Bu projeye depo ekleme yetkiniz yok")

    sys_repo = db.query(models.Repository).filter( # Depo o andaki current usera mi ait diye bak
        models.Repository.id == repo_id,
        models.Repository.user_id == current_user_id,
        models.Repository.project_id == None
    ).first()

    if not sys_repo:
        raise HTTPException(status_code=404, detail="Sistem deposu bulunamadı veya size ait değil")

    new_project_repo = models.Repository( # Depoyu projeye kopyala
        repo_name=sys_repo.repo_name,
        description=sys_repo.description,
        language=sys_repo.language,
        repo_path=sys_repo.repo_path,
        project_id=project_id,
        user_id=current_user_id
    )
    db.add(new_project_repo)
    db.commit()
    db.refresh(new_project_repo)

    log_activity(db, user_id=current_user_id, project_id=project_id, action_type="repo_linked",
                 details=f"Sistemden depo projeye aktarıldı: {sys_repo.repo_name}")
    return new_project_repo


@router.post("/repositories/{repo_id}/export") # Ortak depoyu şahsi alana çekme adresi
def export_repo_to_personal(repo_id: int, req: ExportRepoRequest, db: Session = Depends(get_db),
                            current_user_id: int = Depends(verify_token)):
    db_repo = db.query(models.Repository).filter(models.Repository.id == repo_id).first() # Depoyu bul

    if not db_repo or db_repo.project_id is None: # Proje deposu değilse hata ver
        raise HTTPException(status_code=404, detail="Aktarılacak geçerli bir proje deposu bulunamadı.")

    if not check_project_access(db, db_repo.project_id, current_user_id): # İzin kontrolü yap
        raise HTTPException(status_code=403, detail="Bu projede yetkiniz yok.")

    new_filename = f"[{req.project_name}] {db_repo.repo_name}" # Başına proje adını ekle
    new_repo_path = os.path.join(REPOS_DIR, f"user_{current_user_id}_{new_filename}") # Yeni fiziksel yolu belirle

    if os.path.exists(db_repo.repo_path): # Eski klasör varsa
        shutil.copytree(db_repo.repo_path, new_repo_path, dirs_exist_ok=True) # Tüm içindekilerle birlikte kopyala
    else:
        os.makedirs(new_repo_path, exist_ok=True) # Yoksa boş aç

    new_personal_repo = models.Repository( # Şahsi kayıt oluştur
        repo_name=new_filename,
        description=db_repo.description,
        language=db_repo.language,
        repo_path=new_repo_path,
        project_id=None,
        user_id=current_user_id
    )

    db.add(new_personal_repo)
    db.commit()
    db.refresh(new_personal_repo)

    log_activity(db, user_id=current_user_id, action_type="repo_exported",
                 details=f"Proje deposu şahsi alana aktarıldı: {new_filename}")
    return new_personal_repo


@router.get("/api/get-tree") # Klasör yapısını listeleme adresi
def fetch_tree(repo_id: int, db: Session = Depends(get_db), current_user_id: int = Depends(verify_token)):
    repo_path = get_repo_base_path(repo_id, db, current_user_id) # Deponun bilgisayardaki yerini bul

    try:
        file_tree = get_file_tree_service(repo_path) # İçindeki dosyaları ağaç gibi oku
        return file_tree # Ağacı geri ver
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/create-folder") # Depoya yeni klasör ekleme adresi
def create_folder_endpoint(req: CreateFolderRequest, db: Session = Depends(get_db),
                           current_user_id: int = Depends(verify_token)):
    repo_base_path = get_repo_base_path(req.repo_id, db, current_user_id) # Depo yolunu bul
    full_path = os.path.join(repo_base_path, req.folder_path) # Yeni klasörün yolunu hesapla

    if not os.path.abspath(full_path).startswith(os.path.abspath(repo_base_path)): # Güvenlik önlemi dışarı çıkmayı engeller
        raise HTTPException(status_code=400, detail="Geçersiz yol!")

    os.makedirs(full_path, exist_ok=True) # Klasörü bilgisayarda oluştur
    return {"message": "Klasör başarıyla oluşturuldu"}


@router.post("/rename-item") # Dosya veya klasör adı değiştirme adresi
def rename_item_endpoint(req: RenameItemRequest, db: Session = Depends(get_db),
                         current_user_id: int = Depends(verify_token)):
    repo_base_path = get_repo_base_path(req.repo_id, db, current_user_id) # Depo yolunu bul

    old_full_path = os.path.join(repo_base_path, req.old_path) # Eski adın yolu
    new_full_path = os.path.join(repo_base_path, req.new_path) # Yeni adın yolu

    if not os.path.abspath(old_full_path).startswith(os.path.abspath(repo_base_path)) or \
            not os.path.abspath(new_full_path).startswith(os.path.abspath(repo_base_path)): # Güvenlik kontrolü
        raise HTTPException(status_code=400, detail="Geçersiz yol!")

    if not os.path.exists(old_full_path): # Dosya var mı diye bak
        raise HTTPException(status_code=404, detail="Dosya veya klasör bulunamadı!")

    os.makedirs(os.path.dirname(new_full_path), exist_ok=True) # Alt klasörler yoksa oluştur
    os.rename(old_full_path, new_full_path) # Dosyanın adını bilgisayarda değiştir
    return {"message": "Başarıyla yeniden adlandırıldı"}


@router.post("/repositories/{repo_id}/upload") # Depoya çoklu dosya yükleme adresi
async def upload_to_repo_endpoint(
        repo_id: int,
        files: List[UploadFile] = FastAPIFile(...),
        paths: List[str] = Form(default=[]),
        db: Session = Depends(get_db),
        current_user_id: int = Depends(verify_token)
):
    repo_base_path = get_repo_base_path(repo_id, db, current_user_id) # Depo yolunu bul

    uploaded_names = [] # Yüklenenleri tutacak liste

    if not paths or len(paths) != len(files) or (len(paths) == 1 and paths[0] == ""): # Yol belirtilmemişse direkt ana dizine at
        paths = [file.filename for file in files]

    for file, relative_path in zip(files, paths): # Dosyaları teker teker işle
        file_path = os.path.join(repo_base_path, relative_path) # Nereye kaydedileceğini hesapla

        if not os.path.abspath(file_path).startswith(os.path.abspath(repo_base_path)): # Güvenlik kontrolü
            continue

        os.makedirs(os.path.dirname(file_path), exist_ok=True) # Klasör yoksa aç
        with open(file_path, "wb") as buffer: # Dosyayı diske yaz
            shutil.copyfileobj(file.file, buffer)
        uploaded_names.append(relative_path) # Listeye ekle

    return {"message": f"{len(uploaded_names)} dosya başarıyla yüklendi", "files": uploaded_names}


@router.post("/save-app") # Kod değişikliklerini kaydetme adresi
def save_to_app(request_data: SaveAppRequest, db: Session = Depends(get_db),
                current_user_id: int = Depends(verify_token)):
    if not request_data.file or request_data.content is None: # Veri eksikse hata ver
        raise HTTPException(status_code=400, detail="Dosya adı ve içerik zorunludur.")

    repo_base_path = get_repo_base_path(request_data.repo_id, db, current_user_id) # Depo yolunu bul
    full_path = os.path.join(repo_base_path, request_data.file) # Dosyanın tam yolunu bul

    if not os.path.abspath(full_path).startswith(os.path.abspath(repo_base_path)): # Güvenlik kontrolü
        raise HTTPException(status_code=400, detail="Geçersiz dosya yolu!")

    try:
        os.makedirs(os.path.dirname(full_path), exist_ok=True) # Klasör yoksa yarat
        with open(full_path, "w", encoding="utf-8") as f: # Dosyayı yazma modunda aç
            f.write(request_data.content) # Gelen yeni kodu dosyanın içine yaz

        log_activity(db, user_id=current_user_id, action_type="code_saved",
                     details=f"Kod kaydedildi: repo_id:{request_data.repo_id}/{request_data.file}") # Kayıt işlemini günlüğe yaz
        return {"message": "Dosya başarıyla kaydedildi", "path": full_path}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))