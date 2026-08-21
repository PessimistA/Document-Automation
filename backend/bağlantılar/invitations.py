from fastapi import APIRouter, Depends, HTTPException  # API araçları
from sqlalchemy.orm import Session  # Veritabanı oturumu

import models  # Veritabanı modelleri
from database import get_db  # Veritabanı bağlantısı
from auth import verify_token  # Kimlik doğrulama
from bağlantılar.core import log_activity, InvitationCreate, InvitationRespond  # Çekirdek modüller

router = APIRouter()  # Yönlendiriciyi başlat

@router.post("/invitations/")  # Davet endpoint
def send_invitation(inv: InvitationCreate, db: Session = Depends(get_db), current_user_id: int = Depends(verify_token)):  # Davet fonksiyonu
    receiver = db.query(models.User).filter(models.User.email == inv.receiver_email).first()  # Alıcıyı sorgula
    if not receiver:  # Alıcı yoksa
        raise HTTPException(status_code=404, detail="Kullanıcı sistemde bulunamadı")
    if receiver.id == current_user_id:  # Kendine davet kontrolü
        raise HTTPException(status_code=400, detail="Kendinize davet gönderemezsiniz")

    existing = db.query(models.Invitation).filter(  # Mevcut davet sorgusu
        models.Invitation.sender_id == current_user_id,  # Gönderen eşleşmesi
        models.Invitation.receiver_id == receiver.id,  # Alıcı eşleşmesi
        models.Invitation.project_id == inv.project_id,  # Proje eşleşmesi
        models.Invitation.status == "pending"  # Durum kontrolü
    ).first()  # İlk kaydı al

    if existing:  # Davet varsa
        raise HTTPException(status_code=400, detail="Bu kullanıcıya zaten bekleyen bir davetiniz var.")

    new_inv = models.Invitation(  # Yeni davet modeli
        sender_id=current_user_id,  # Göndereni ata
        receiver_id=receiver.id,  # Alıcıyı ata
        project_id=inv.project_id,  # Projeyi ata
        invitation_type=inv.invitation_type,  # Tipi belirle
        status="pending"  # Durumu beklemede yap
    )
    db.add(new_inv)  # Kaydı ekle
    db.commit()  # İşlemi onayla
    return {"message": "Davet başarıyla gönderildi"}  # Sonucu dön


@router.get("/invitations/")  # Gelen davetler endpoint
def get_invitations(db: Session = Depends(get_db), current_user_id: int = Depends(verify_token)):  # Listeleme fonksiyonu
    invs = db.query(models.Invitation).filter(  # Davetleri sorgula
        models.Invitation.receiver_id == current_user_id,  # Alıcı benim
        models.Invitation.status == "pending"  # Durum beklemede
    ).all()  # Tümünü getir

    result = []  # Sonuç listesi
    for i in invs:  # Davetleri döngüye al
        sender = db.query(models.User).filter(models.User.id == i.sender_id).first()  # Göndereni bul
        project = db.query(models.Project).filter(models.Project.id == i.project_id).first() if i.project_id else None  # Projeyi bul
        result.append({  # Listeye ekle
            "id": i.id,  # Davet ID
            "sender_name": f"{sender.name} {sender.surname}",  # Gönderen adı
            "sender_email": sender.email,  # Gönderen e-posta
            "type": i.invitation_type,  # Davet tipi
            "project_name": project.name if project else None,  # Proje adı
            "created_at": i.created_at  # Oluşturulma tarihi
        })
    return result  # Listeyi dön


@router.get("/invitations/sent/")  # Gönderilen davetler endpoint
def get_sent_invitations(db: Session = Depends(get_db), current_user_id: int = Depends(verify_token)):  # Listeleme fonksiyonu
    invs = db.query(models.Invitation).filter(  # Davetleri sorgula
        models.Invitation.sender_id == current_user_id,  # Gönderen benim
        models.Invitation.status == "pending"  # Durum beklemede
    ).all()  # Tümünü getir

    result = []  # Sonuç listesi
    for i in invs:  # Davetleri döngüye al
        receiver = db.query(models.User).filter(models.User.id == i.receiver_id).first()  # Alıcıyı bul
        project = db.query(models.Project).filter(models.Project.id == i.project_id).first() if i.project_id else None  # Projeyi bul
        result.append({  # Listeye ekle
            "id": i.id,  # Davet ID
            "receiver_name": f"{receiver.name} {getattr(receiver, 'surname', '')}".strip(),  # Alıcı adı
            "receiver_email": receiver.email,  # Alıcı e-posta
            "type": i.invitation_type,  # Davet tipi
            "project_name": project.name if project else None,  # Proje adı
            "created_at": i.created_at  # Oluşturulma tarihi
        })
    return result  # Listeyi dön


@router.post("/invitations/{inv_id}/respond")  # Davet yanıt endpoint
def respond_invitation(inv_id: int, response: InvitationRespond, db: Session = Depends(get_db),
                       current_user_id: int = Depends(verify_token)):  # Yanıt fonksiyonu
    inv = db.query(models.Invitation).filter(models.Invitation.id == inv_id,  # Daveti sorgula
                                             models.Invitation.receiver_id == current_user_id).first()  # Alıcı kontrolü
    if not inv:  # Davet yoksa
        raise HTTPException(status_code=404, detail="Davetiye bulunamadı")

    if response.status == "accepted":  # Kabul edildiyse
        inv.status = "accepted"  # Durumu güncelle
        receiver_user = db.query(models.User).filter(models.User.id == current_user_id).first()  # Alıcıyı bul
        sender_user = db.query(models.User).filter(models.User.id == inv.sender_id).first()  # Göndereni bul

        if inv.invitation_type == "team":  # Takım davetiyse
            existing_member_a = db.query(models.Member).filter(  # A listesi kontrolü
                models.Member.user_id == inv.sender_id,  # A kişisi
                models.Member.connected_user_id == current_user_id  # B kişisi
            ).first()  # İlk kaydı al

            if not existing_member_a:  # Kayıt yoksa
                new_member_a = models.Member(  # Yeni üye modeli
                    user_id=inv.sender_id,  # A'ya ekle
                    connected_user_id=current_user_id,  # B'yi bağla
                    name=f"{receiver_user.name} {getattr(receiver_user, 'surname', '')}".strip(),  # İsim formatı
                    email=receiver_user.email,  # E-posta ata
                    role="Takım Üyesi"  # Rolü belirle
                )
                db.add(new_member_a)  # Kaydı ekle

            existing_member_b = db.query(models.Member).filter(  # B listesi kontrolü
                models.Member.user_id == current_user_id,  # B kişisi
                models.Member.connected_user_id == inv.sender_id  # A kişisi
            ).first()  # İlk kaydı al

            if not existing_member_b:  # Kayıt yoksa
                new_member_b = models.Member(  # Yeni üye modeli
                    user_id=current_user_id,  # B'ye ekle
                    connected_user_id=inv.sender_id,  # A'yı bağla
                    name=f"{sender_user.name} {getattr(sender_user, 'surname', '')}".strip(),  # İsim formatı
                    email=sender_user.email,  # E-posta ata
                    role="Takım Lideri"  # Rolü belirle
                )
                db.add(new_member_b)  # Kaydı ekle

            log_activity(db, user_id=inv.sender_id, action_type="team_joined",
                         details=f"{receiver_user.name} takımınıza katıldı.")  # Aktiviteyi kaydet
            log_activity(db, user_id=current_user_id, action_type="team_joined",
                         details=f"{sender_user.name} ile takımlaştınız.")  # Aktiviteyi kaydet

        elif inv.invitation_type == "project":  # Proje davetiyse
            new_pm = models.ProjectMember(  # Proje üyesi modeli
                user_id=current_user_id,  # Kullanıcıyı ekle
                project_id=inv.project_id,  # Projeyi bağla
                role="member"  # Rolü belirle
            )
            db.add(new_pm)  # Kaydı ekle
            log_activity(db, user_id=inv.sender_id, project_id=inv.project_id, action_type="project_joined",
                         details=f"{receiver_user.name} projeye katıldı.")  # Aktiviteyi kaydet

    elif response.status == "rejected":  # Reddedildiyse
        inv.status = "rejected"  # Durumu güncelle

    db.commit()  # İşlemleri onayla
    return {"message": f"Davetiye {response.status} olarak güncellendi."}  # Sonucu dön


@router.delete("/invitations/{inv_id}/revoke")  # Davet iptal endpoint
def revoke_invitation(inv_id: int, db: Session = Depends(get_db), current_user_id: int = Depends(verify_token)):  # İptal fonksiyonu
    inv = db.query(models.Invitation).filter(  # Daveti sorgula
        models.Invitation.id == inv_id,  # ID eşleşmesi
        models.Invitation.sender_id == current_user_id,  # Gönderen kontrolü
        models.Invitation.status == "pending"  # Durum kontrolü
    ).first()  # İlk kaydı al

    if not inv:  # Davet yoksa
        raise HTTPException(status_code=404, detail="Davetiye bulunamadı veya geri çekme yetkiniz yok.")

    db.delete(inv)  # Veritabanından sil
    db.commit()  # İşlemi onayla
    return {"message": "Davetiye başarıyla geri çekildi."}  # Sonucu dön