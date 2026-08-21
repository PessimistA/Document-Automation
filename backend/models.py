from sqlalchemy import Column, Integer, String, ForeignKey, Boolean, DateTime, Text # Veri tipleri
from sqlalchemy.orm import relationship # Tablo ilişkileri aracı
from datetime import datetime, timezone # Zaman araçları
from database import Base # Temel veritabanı sınıfı


class User(Base): # Kullanıcı tablosu
    __tablename__ = "users"
    #Sütunler
    id = Column(Integer, primary_key=True, index=True) # Benzersiz idsi
    name = Column(String, nullable=False) # Kullanıcı adı
    surname = Column(String, nullable=False) # Kullanıcı soyadı
    email = Column(String, unique=True, index=True, nullable=False) # E-posta adresi
    hashed_password = Column(String, nullable=False) # Parola
    is_active = Column(Boolean, default=True) # Hesap aktif mi
    last_login = Column(DateTime, nullable=True) # Son giriş tarihi
    role = Column(String, default="User") # Kullanıcı yetkisi
    location = Column(String, nullable=True) # Yaşadığı yer
    department = Column(String, nullable=True) # Çalıştığı bölüm
    #ilişkiler
    project_memberships = relationship("ProjectMember", back_populates="user") # Proje üyelikleri ilişkiler
    activities = relationship("Activity", back_populates="user") # Yapılan işlemler ilişkiler
    projects = relationship("Project", back_populates="owner") # Sahibi olduğu projeler
    repositories = relationship("Repository", back_populates="owner") # Kod depoları ilişkiler
    members = relationship("Member", foreign_keys='Member.user_id', back_populates="owner") # Rehberindeki kişiler

    sent_invitations = relationship("Invitation", foreign_keys='Invitation.sender_id', back_populates="sender") # Gönderilen davetler
    received_invitations = relationship("Invitation", foreign_keys='Invitation.receiver_id', back_populates="receiver") # Gelen davetler


class Project(Base): # Proje tablosu
    __tablename__ = "projects"
    # Sütunler
    id = Column(Integer, primary_key=True, index=True) # Proje idsi
    name = Column(String) # Proje adı
    description = Column(String, nullable=True) # Proje açıklaması
    status = Column(String, default="Planning") # Proje durumu
    due_date = Column(String, nullable=True) # Bitiş tarihi
    progress = Column(Integer, default=0) # İlerleme yüzdesi
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc)) # Kurulma zamanı
    # Foreign key
    user_id = Column(Integer, ForeignKey("users.id"))  # Proje sahibi idsi
    # ilişkiler
    owner = relationship("User", back_populates="projects") # Kurucu ilişkiler
    members = relationship("ProjectMember", back_populates="project")  # Üyeler ilişkiler
    tasks = relationship("Task", back_populates="project") # Görevler ilişkiler
    activities = relationship("Activity", back_populates="project") # Aktivite geçmişi
    files = relationship("File", back_populates="project") # Dosyalar ilişkiler
    repositories = relationship("Repository", back_populates="project") # Depolar ilişkiler
    project_files = relationship("ProjectFile", back_populates="project") # Proje dokümanları
    invitations = relationship("Invitation", back_populates="project") # Gelen ilişkiler


class ProjectMember(Base): # Proje üyeleri tablosu
    __tablename__ = "project_members"
    # Sütunlar
    id = Column(Integer, primary_key=True, index=True) # Kayıt idsi
    user_id = Column(Integer, ForeignKey("users.id")) # Üye olan kullanıcı
    project_id = Column(Integer, ForeignKey("projects.id")) # Üye olunan proje
    role = Column(String, default="member") # Projedeki görevi
    #İlişkiler
    user = relationship("User", back_populates="project_memberships") # Kullanıcıya bağlan
    project = relationship("Project", back_populates="members") # Projeye bağlan


class Task(Base): # Görevler tablosu
    __tablename__ = "tasks"
    # Sütunlar
    id = Column(Integer, primary_key=True, index=True) # Görev idsi
    project_id = Column(Integer, ForeignKey("projects.id")) # Bağlı olduğu proje
    title = Column(String, nullable=False) # Görev başlığı
    is_completed = Column(Boolean, default=False) # Tamamlandı mı
    # İlişkiler
    project = relationship("Project", back_populates="tasks") # Proje ilişkisi


class Activity(Base): # Aktivite kayıt tablosu
    __tablename__ = "activities"
    # Sütunlar
    id = Column(Integer, primary_key=True, index=True) # Kayıt idsi
    user_id = Column(Integer, ForeignKey("users.id")) # İşlemi yapan kişi
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=True) # İlgili proje
    action_type = Column(String, nullable=False) # İşlem türü
    details = Column(Text, nullable=True) # İşlem detayları
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc)) # İşlem zamanı
    # İlişkiler
    user = relationship("User", back_populates="activities") # Kullanıcı ilişkisi
    project = relationship("Project", back_populates="activities") # Proje ilişkisi


class File(Base): # Dosyalar tablosu
    __tablename__ = "files"
    # Sütunlar
    id = Column(Integer, primary_key=True, index=True) # Dosya idsi
    project_id = Column(Integer, ForeignKey("projects.id")) # Bağlı olduğu proje
    uploader_id = Column(Integer, ForeignKey("users.id")) # Yükleyen kişi
    file_name = Column(String, nullable=False) # Dosya adı
    file_path = Column(String, nullable=False) # Kayıt yolu
    uploaded_at = Column(DateTime, default=lambda: datetime.now(timezone.utc)) # Yüklenme zamanı
    # İlişkiler
    project = relationship("Project", back_populates="files") # Proje ilişkisi


class Repository(Base): # Kod depoları tablosu
    __tablename__ = "repositories"
    # Sütunlar
    id = Column(Integer, primary_key=True, index=True) # Depo idsi
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=True) # Bağlı proje
    user_id = Column(Integer, ForeignKey("users.id")) # Sahibi olan kişi
    repo_name = Column(String, nullable=False) # Depo adı
    repo_path = Column(String, nullable=False) # Bilgisayardaki yolu
    description = Column(String, nullable=True) # Depo açıklaması
    language = Column(String, nullable=True) # Kullanılan yazılım dili
    # İlişkiler
    owner = relationship("User", back_populates="repositories") # Sahip olan
    project = relationship("Project", back_populates="repositories") # Proje ilişkisi


class Member(Base): # Bağlantılar tablosu
    __tablename__ = "members"
    #Sütunlar
    id = Column(Integer, primary_key=True, index=True) # Kayıt idsi
    user_id = Column(Integer, ForeignKey("users.id")) # Ekleyen kullanıcı
    connected_user_id = Column(Integer, ForeignKey("users.id"), nullable=True) # Eklenen hesap
    name = Column(String) # Görünen ad
    role = Column(String) # Atanan rol
    email = Column(String, index=True) # İletişim e-postası
    status = Column(String, default="Active") # Durum bilgisi
    #İlişkiler
    owner = relationship("User", foreign_keys=[user_id], back_populates="members") # Sahip İlişkisi
    connected_user = relationship("User", foreign_keys=[connected_user_id]) # Hesap İlişkisi


class ProjectFile(Base): # Proje dokümanları tablosu
    __tablename__ = "project_files"
    #Sütunlar
    id = Column(Integer, primary_key=True, index=True) # Kayıt idsi
    name = Column(String) # Dosya adı
    file_type = Column(String) # Dosya tipi
    size = Column(String, nullable=True) # Dosya boyutu
    items_count = Column(Integer, default=0) # İçerik sayısı
    modified_at = Column(DateTime, default=lambda: datetime.now(timezone.utc),
                         onupdate=lambda: datetime.now(timezone.utc)) # Güncellenme zamanı
    project_id = Column(Integer, ForeignKey("projects.id")) # Proje numarası
    user_id = Column(Integer, ForeignKey("users.id")) # Kullanıcı numarası
    file_path = Column(String, nullable=True) # Fiziksel yol
    #İlişkiler
    project = relationship("Project", back_populates="project_files") # Proje İlişkisi


class Invitation(Base): # Davetiyeler tablosu
    __tablename__ = "invitations"
    #Sütunlar
    id = Column(Integer, primary_key=True, index=True) # İstek idsi
    sender_id = Column(Integer, ForeignKey("users.id")) # Gönderen kişi
    receiver_id = Column(Integer, ForeignKey("users.id")) # Alan kişi
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=True) # İlgili proje
    invitation_type = Column(String, nullable=False) # İstek türü
    status = Column(String, default="pending") # İstek durumu
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc)) # Oluşturulma zamanı
    #İlişkiler
    sender = relationship("User", foreign_keys=[sender_id], back_populates="sent_invitations") # Gönderen ilişkisi
    receiver = relationship("User", foreign_keys=[receiver_id], back_populates="received_invitations") # Alan ilişkisi
    project = relationship("Project", back_populates="invitations") # Proje ilişkisi


class Message(Base): # Mesajlar tablosu
    __tablename__ = "messages"
    #Sütunlar
    id = Column(Integer, primary_key=True, index=True) # Mesaj numarası
    sender_id = Column(Integer, ForeignKey("users.id")) # Gönderen kişi
    receiver_id = Column(Integer, ForeignKey("users.id")) # Alan kişi
    content = Column(String) # Mesaj içeriği
    is_read = Column(Boolean, default=False) # Okundu mu
    created_at = Column(DateTime, default=datetime.utcnow) # Gönderilme zamanı