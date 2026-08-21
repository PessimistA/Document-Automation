from pydantic import BaseModel, ConfigDict, EmailStr # Veri doğrulama araçları
from typing import List, Optional # Tip belirleme araçları
from datetime import datetime # Zaman araçları

class UserBase(BaseModel): # Kullanıcı bilgileri
    name: str # Ad alanı
    surname: str # Soyad alanı
    email: str # E-posta alanı

class UserLogin(BaseModel): # Giriş verileri
    email: str # Giriş e-postası
    password: str # Giriş şifresi

class UserCreate(UserBase): # Kayıt verileri
    password: str # Yeni şifre alanı

class UserUpdate(BaseModel): # Güncelleme verileri
    name: str # Yeni ad
    surname: str # Yeni soyad
    role: Optional[str] = None # Yeni rol
    department: Optional[str] = None # Yeni bölüm
    location: Optional[str] = None # Yeni konum

class User(UserBase): # Çıktı kullanıcı verisi
    id: int # Kullanıcı numarası
    is_active: bool = True # Aktiflik durumu
    last_login: Optional[datetime] = None # Son giriş zamanı
    role: Optional[str] = "Member" # Kullanıcı rolü
    department: Optional[str] = None # Bölüm bilgisi
    location: Optional[str] = None # Konum bilgisi

    model_config = ConfigDict(from_attributes=True) # Veritabanı uyumu

class TaskBase(BaseModel): # Görev bilgileri
    title: str # Görev başlığı
    is_completed: Optional[bool] = False # Tamamlanma durumu

class TaskCreate(TaskBase): # Görev oluşturma
    pass # Ek alan yok

class Task(TaskBase): # Çıktı görev verisi
    id: int # Görev numarası
    project_id: int # Bağlı proje numarası

    model_config = ConfigDict(from_attributes=True) # Veritabanı uyumu

class Activity(BaseModel): # Aktivite verisi
    id: int # Kayıt numarası
    user_id: int # Kayıt Yapan kişi numarası
    project_id: Optional[int] = None # İlgili proje numarası
    action_type: str # İşlem türü
    details: Optional[str] = None # İşlem detayı
    created_at: datetime # Kayıt zamanı

    model_config = ConfigDict(from_attributes=True) # Veritabanı uyumu

class ProjectBase(BaseModel): # Proje bilgileri
    name: str # Proje adı
    description: Optional[str] = None # Proje açıklaması
    status: Optional[str] = "Planning" # Proje durumu
    due_date: Optional[str] = None # Bitiş tarihi
    progress: int = 0 # İlerleme durumu

class ProjectCreate(ProjectBase): # Proje oluşturma
    pass # Ek alan yok

class ProjectUpdate(BaseModel): # Proje güncelleme
    name: Optional[str] = None # Yeni ad
    description: Optional[str] = None # Yeni açıklama
    status: Optional[str] = None # Yeni durum
    due_date: Optional[str] = None # Yeni tarih
    progress: Optional[int] = None # Yeni ilerleme

class Project(ProjectBase): # Çıktı proje verisi
    id: int # Proje numarası
    created_at: datetime # Oluşturulma zamanı
    tasks: List[Task] = [] # Projeye görevleri

    model_config = ConfigDict(from_attributes=True) # Veritabanı uyumu

class MemberBase(BaseModel): # Üye bilgileri
    name: str # Kişi adı
    role: str # Kişi rolü
    email: str # Kişi e-postası
    status: Optional[str] = "Active" # Aktiflik durumu

class MemberCreate(MemberBase): # Üye oluşturma
    pass # Ek alan yok

class MemberUpdate(BaseModel): # Üye güncelleme
    name: Optional[str] = None # Yeni ad
    role: Optional[str] = None # Yeni rol
    email: Optional[str] = None # Yeni e-posta
    status: Optional[str] = None # Yeni durum

class Member(MemberBase): # Çıktı üye
    id: int # Üye numarası
    connected_user_id: Optional[int] = None # Bağlı hesap numarası
    model_config = ConfigDict(from_attributes=True) # Veritabanı uyumu

class ProjectFileCreate(BaseModel): # Dosya oluşturma
    name: str # Dosya adı
    file_type: str # Dosya türü
    size: Optional[str] = None # Dosya boyutu
    project_id: Optional[int] = None # Proje bağlantısı

class ProjectFile(BaseModel): # Çıktı dosya
    id: int # Dosya numarası
    name: str # Dosya adı
    file_type: str # Dosya türü
    size: Optional[str] = None # Dosya boyutu
    project_id: Optional[int] = None # Proje numarası
    modified_at: datetime # Güncellenme zamanı
    file_path: Optional[str] = None # Fiziksel dosya yolu

    model_config = ConfigDict(from_attributes=True) # Veritabanı uyumu

class RepositoryCreate(BaseModel): # Depo oluşturma
    repo_name: str # Depo adı
    description: Optional[str] = None # Depo açıklaması
    language: Optional[str] = None # Yazılım dili
    project_id: Optional[int] = None # Proje bağlantısı

class RepositoryOut(BaseModel): # Çıktı depo
    id: int # Depo numarası
    repo_name: str # Depo adı
    repo_path: str # Kayıt yolu
    description: Optional[str] = None # Depo açıklaması
    language: Optional[str] = None # Kullanılan dil
    project_id: Optional[int] = None # Proje numarası

    model_config = ConfigDict(from_attributes=True) # Veritabanı uyumu

class MessageCreate(BaseModel): # Mesaj oluşturma
    receiver_id: int # Alıcı numarası
    content: str # Mesaj içeriği

class MessageOut(BaseModel): # Çıktı mesaj
    id: int # Mesaj numarası
    sender_id: int # Gönderen numarası
    receiver_id: int # Alıcı numarası
    content: str # Mesaj metni
    is_read: bool # Okundu bilgisi
    created_at: datetime # Gönderim zamanı

    model_config = ConfigDict(from_attributes=True) # Veritabanı uyumu