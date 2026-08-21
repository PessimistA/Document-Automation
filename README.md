# Dokuman Otomasyon — Yapay Zekâ Destekli Proje Yönetimi ve Dokümantasyon Platformu

Ekip halinde proje yürütmeyi, kod deposu tutmayı ve **tamamen yerel çalışan** bir dil modeliyle
teknik doküman üretmeyi tek bir masaüstü uygulamasında birleştiren tam yığın (full-stack) projedir.

Uygulama internete çıkmaz: yapay zekâ istekleri, kendi bilgisayarınızda çalışan
**LM Studio** sunucusuna gider. Hiçbir kod parçası veya doküman
dışarıya gönderilmez.

---

## İçindekiler

- [Ne işe yarar?](#ne-işe-yarar)
- [Öne çıkan özellikler](#öne-çıkan-özellikler)
- [Mimari](#mimari)
- [Teknoloji yığını](#teknoloji-yığını)
- [Yapay zekâ üretim hattı](#yapay-zekâ-üretim-hattı)
- [Donanıma göre uyarlama](#donanıma-göre-uyarlama)
- [Veri modeli](#veri-modeli)
- [API uçları](#api-uçları)
- [Kurulum](#kurulum)
- [Paketleme ve build alma](#paketleme-ve-build-alma)
- [Docker ile çalıştırma](#docker-ile-çalıştırma)
- [Klasör yapısı](#klasör-yapısı)
- [Yapılandırma](#yapılandırma)
- [Sorun giderme](#sorun-giderme)
- [Lisans](#lisans)

---

## Ne işe yarar?

Bir yazılım ekibinin gün içinde ihtiyaç duyduğu üç işi tek yerde toplar:

1. **Proje yönetimi** — proje açma, görev listesi, üye daveti, ilerleme takibi, aktivite geçmişi, ekip içi mesajlaşma.
2. **Dosya ve kod deposu** — projeye veya kişisel alana dosya yükleme, klasör ağacı, tarayıcı içi kod düzenleyici, dosyaları kişisel alan ile proje arasında taşıma.
3. **Yapay zekâ üretimi** — kaynak koda satır satır Türkçe yorum ekleme ve ham notlardan akademik biçimde teknik doküman üretme.

Üretilen dokümanlar uygulama içinde önizlenebilir, satır bazında yapay zekâya
düzelttirilebilir ve PDF olarak dışa aktarılabilir.

---

## Öne çıkan özellikler

| Alan | Özellik |
|---|---|
| **Kimlik** | JWT tabanlı kayıt/giriş, rol alanı, profil düzenleme, oturum doğrulaması her uçta zorunlu |
| **Projeler** | Proje oluşturma, durum/ilerleme takibi, üyelik rolleri, erişim kontrolü |
| **Görevler** | Görev ekleme, tamamlama, silme; ilerleme yüzdesine yansıma |
| **Davetler** | Proje daveti gönderme, gelen/giden davetler, kabul-ret, daveti geri çekme |
| **Dosyalar** | Yükleme, indirme, yeniden adlandırma, silme, içerik okuma, kişisel ↔ proje aktarımı |
| **Depolar** | Yerel kod deposu tanımlama, klasör ağacı listeleme, klasör oluşturma, çoklu yükleme, düzenlenen kodu kaydetme |
| **Yapay zekâ** | Kod yorumlama, doküman üretme, satır içi  düzenleme, üretilen belgeyi kaydetme |
| **Sistem** | Canlı GPU kullanım/sıcaklık göstergesi, LLM sağlık kontrolü, aktivite kaydı |

---

## Mimari

```
┌────────────────────────────────────────────────────────────┐
│  Electron kabuğu (masaüstü uygulaması)                     │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  React 19 + Vite + Tailwind arayüzü                  │  │
│  │  Dashboard · Projeler · Kodlar · Dosyalar ·          │  │
│  │  Dokümantasyon · Üyeler · Sohbet · Ayarlar           │  │
│  └──────────────────────────────────────────────────────┘  │
└───────────────────────────┬────────────────────────────────┘
                            │ HTTP  (axios)
┌───────────────────────────▼────────────────────────────────┐
│  FastAPI backend                                           │
│  bağlantılar/  → 11 router (auth, projects, files, …)      │
│  codecomment/  → koda yorum ekleme hattı                   │
│  dokuman/      → doküman üretim hattı (Plan→Expand→Polish) │
│  SQLAlchemy + SQLite (app.db)                              │
└───────────────────────────┬────────────────────────────────┘
                            │ OpenAI uyumlu /chat/completions
┌───────────────────────────▼────────────────────────────────┐
│  LM Studio — yerel dil modeli sunucusu                     │
└────────────────────────────────────────────────────────────┘
```

Backend tek başına bir REST API'dir; Electron kabuğu olmadan da tarayıcıdan kullanılabilir.
Paketlenmiş sürümde backend, PyInstaller ile derlenip Electron'un içine gömülür.

---

## Teknoloji yığını

**Backend:** Python · FastAPI · Uvicorn · SQLAlchemy · SQLite · Pydantic · python-jose (JWT) · psutil · nvidia-ml-py · openai · aiofiles

**Frontend:** React  · Vite  · Tailwind CSS  · React Router  · Monaco Editor · react-markdown · html2pdf.js · lucide-react · axios

**Masaüstü / dağıtım:** Electron · electron-builder · PyInstaller · Docker Compose

---

## Yapay zekâ üretim hattı

### 1. Koda yorum ekleme (`codecomment/`)

Uzun kaynak dosyalar doğrudan modele verilmez; üç adımlı bir zincir çalışır:

1. `chunker.py` kodu donanıma göre belirlenen satır sayısında parçalara böler.
2. Her parça, bir önceki parçanın **özeti** bağlam olarak verilerek modele gönderilir; model her satırın sonuna Türkçe açıklama ekler.
3. Aynı parça bir kez daha özetlenerek sıradaki parçanın bağlamı hazırlanır.

Böylece model uzun dosyalarda bağlamı kaybetmez ve orijinal kodu bozmadan yalnızca yorum ekler.

### 2. Doküman üretme (`dokuman/`)

`DocumentProcessor` üç aşamalı bir hat işletir:

| Aşama | Görevi |
|---|---|
| **PLAN** (`plan_engine.py`) | Ham metinden `###` / `####` hiyerarşisinde, 3–5 ana başlıklı markdown taslak çıkarır |
| **EXPAND** (`processor.py`) | Metni parçalara böler, `MemoryManager` ile önceki parçaları bağlamda tutarak her parçayı akademik dile genişletir |
| **POLISH** (`polish_engine.py`) | Birleşen metni tutarlılık, üslup ve biçim açısından son kez düzenler |

`estimator.py` kaynak metnin uzunluğuna ve seçilen detay seviyesine bakarak hedef
token sayısını hesaplar; çıktı ne gereksiz kısa ne de donanımı zorlayacak kadar uzun olur.
Hedef dil parametreyle verilir, kaynak metin başka dilde olsa da başlıklar istenen dilde üretilir.

### 3. Satır içi düzenleme (`inline_editor.py`)

Üretilmiş bir dokümanda seçilen bölüm, tüm belgeyi yeniden üretmeden modele düzelttirilir.

---

## Donanıma göre uyarlama

Uygulama, açılışta bilgisayarın gücünü ölçüp model ayarlarını kendisi belirler.

`hardware_optimizer.py` boş RAM, fiziksel çekirdek sayısı ve boş VRAM'i okuyup bir
donanım puanı hesaplar:

```
puan = (boş VRAM GB × 5) + (boş RAM GB × 2) + (çekirdek × 1.5)
```

Puana göre parça boyutu, `max_tokens` ve bağlam penceresi ölçeklenir. `ModelConfig`
sınıfı da model boyutuna göre sıcaklığı (0.1 – 0.3) ve bağlam sınırını (2048 – 8192) ayarlar.
NVIDIA kartı yoksa VRAM sıfır sayılır ve sistem CPU profiline düşer — çalışmayı durdurmaz.

`gpu_controller.py` ayrıca anlık GPU kullanımı ve sıcaklığını okuyup arayüzdeki
göstergeye besler.

---

## Veri modeli

SQLAlchemy ile 11 tablo tanımlıdır:

| Tablo | Ne tutar |
|---|---|
| `users` | Hesap bilgileri, hashlenmiş parola, rol, departman, son giriş |
| `projects` | Proje adı, açıklama, durum, ilerleme, bitiş tarihi, sahibi |
| `project_members` | Kullanıcı ↔ proje üyelikleri ve roller |
| `tasks` | Projeye bağlı görevler ve tamamlanma durumu |
| `activities` | Kim, ne zaman, hangi işlemi yaptı (denetim kaydı) |
| `files` | Projeye yüklenen dosyaların adı ve fiziksel yolu |
| `project_files` | Üretilen/işlenen proje dokümanları |
| `repositories` | Yerel kod depoları, dili ve disk yolu |
| `members` | Kullanıcının kişisel bağlantı rehberi |
| `invitations` | Proje/bağlantı davetleri ve durumları |
| `messages` | Kullanıcılar arası birebir mesajlar |

---

## API uçları

Sunucu ayaktayken tam ve etkileşimli döküman FastAPI'nin `/docs` adresinde üretilir.
Özet:

| Router | Örnek uçlar |
|---|---|
| **Auth** | `POST /register/` · `POST /login/` · `GET /users/me` · `PATCH /users/me` |
| **Projects** | `GET /projects/` · `POST /projects/` · `GET /projects/{id}` · `PATCH /projects/{id}` |
| **Tasks** | `GET|POST /projects/{id}/tasks/` · `PATCH|DELETE /tasks/{id}` |
| **Files** | `POST /projects/{id}/upload_file/` · `GET /files/{id}/content` · `GET /files/{id}/download` · `POST /files/{id}/export` |
| **Repositories** | `POST /repositories/` · `GET /api/get-tree` · `POST /create-folder` · `POST /save-app` |
| **AI Operations** | `POST /process-code` · `POST /api/generate` · `POST /api/edit-inline` · `POST /api/save-doc` · `GET /api/health` |
| **Invitations** | `POST /invitations/` · `POST /invitations/{id}/respond` · `DELETE /invitations/{id}/revoke` |
| **Members / Messages** | `GET|POST /members/` · `POST /messages/` · `GET /messages/{user_id}` |
| **Dashboard / System** | `GET /dashboard/activities/` · `GET /api/gpu-status` |

`/register/`, `/login/` ve `/api/health` dışındaki tüm uçlar geçerli JWT ister.

---

## Kurulum

### Gereksinimler

- Python 3.10+
- Node.js 18+ ve npm
- **LM Studio** (yapay zekâ özellikleri için) — *Local Server* sekmesinden sunucu başlatılmış olmalı
- İsteğe bağlı: Docker + Docker Compose, NVIDIA sürücüleri (GPU göstergesi için)

### 1. Backend

```bash
cd backend
pip install -r requirements.txt
python main.py
```

Alternatif: `uvicorn main:app --reload`

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

`npm run dev` hem Vite geliştirme sunucusunu hem de Electron penceresini
birlikte başlatır.

### 3. LM Studio

LM Studio'yu açın, bir model yükleyin ve **Local Server → Start Server** ile
yerel sunucuyu başlatın. Docker kullanacaksanız dinleme adresini tüm arayüzlere
açıp CORS izinlerini etkinleştirin.

---

## Paketleme ve build alma

### Backend'i çalıştırılabilir hale getirme

```bash
pyinstaller --name backend --onedir \
  --hidden-import=uvicorn.logging \
  --hidden-import=uvicorn.loops \
  --hidden-import=uvicorn.loops.auto \
  --hidden-import=uvicorn.protocols.http.auto \
  --hidden-import=uvicorn.protocols.websockets.auto \
  --hidden-import=pydantic \
  --hidden-import=sqlalchemy \
  --hidden-import=pynvml \
  --hidden-import=psutil \
  --hidden-import=openai \
  --hidden-import=jose \
  --hidden-import=multipart \
  --hidden-import=aiofiles \
  --hidden-import=fastapi \
  main.py
```

`requirements.txt` içindeki paketlerin tamamı kurulu olmalıdır; eksik bir bağımlılık
build sırasında değil, uygulama açılırken hata verir. İşlem sonunda `dist/backend/`
klasörü oluşur.

### Masaüstü paketi

`dist/backend/` içeriğini `frontend/backend-dist/` klasörüne kopyalayın, sonra:

```bash
cd frontend
npm run dist
```

Çıktı `release/` altına düşer; çalıştırılabilir dosya `release/win-unpacked/` içindedir.

---

## Docker ile çalıştırma

```bash
sudo docker compose up --build
```

`docker-compose.yml` backend'i ayağa kaldırır, `host.docker.internal`
köprüsüyle ana makinedeki LM Studio'ya erişir ve veritabanı ile yüklenen dosyaları
`backend_data/` altında kalıcı tutar. Kod değiştikten sonra `--build` ile yeniden
oluşturun.

---

## Klasör yapısı

```
Dokuman_Otomasyon/
├── docker-compose.yml
├── backend/
│   ├── main.py                 # FastAPI giriş noktası, router bağlama, CORS
│   ├── database.py             # SQLAlchemy motoru ve oturum
│   ├── models.py               # 11 tablo tanımı
│   ├── schemas.py              # Pydantic şemaları
│   ├── auth.py                 # JWT üretme/doğrulama
│   ├── gpu_controller.py       # NVML ile GPU kullanım/sıcaklık okuma
│   ├── bağlantılar/            # API router'ları (11 modül)
│   ├── codecomment/            # Kod yorumlama hattı
│   │   ├── chunker.py          #   kodu parçalara böler
│   │   ├── hardware_optimizer.py  # donanım puanı ve limitler
│   │   ├── llm_handler.py      #   LM Studio istemcisi
│   │   └── prompts.py          #   sistem komutları
│   ├── dokuman/                # Doküman üretim hattı
│   │   ├── core/               #   processor, plan_engine, polish_engine,
│   │   │                       #   inline_editor, memory, llm_client, model_config
│   │   ├── prompts/templates.py
│   │   └── utils/              #   estimator, hardware, logger
│   └── services/repo_service.py
├── backend_data/               # Kalıcı veri (app.db + yüklenen dosyalar)
└── frontend/
    ├── main.cjs / preload.cjs  # Electron ana süreç ve köprü
    ├── electron/
    ├── vite.config.js
    └── src/
        ├── App.jsx, main.jsx
        ├── api/apiConfig.js
        ├── services/           # apiService, authService
        ├── components/         # Dashboard, Projects, Codes, Files,
        │                       # Documantasyon_page, Members, ChatWindow,
        │                       # Notifications, Settings, SideBar, Login, SignUp
        └── styles/
```

---

## Yapılandırma

Backend ve frontend adresleri koda gömülü değildir; her ikisi de kendi ortam
dosyalarından okunur. Depoda örnek bir yapılandırma dosyası bulunmaz — kurulum
sırasında kendi ortamınıza göre oluşturmanız beklenir.

---

## Sorun giderme

| Belirti | Çözüm |
|---|---|
| `Yapay zeka sunucusuna ulaşılamadı` | LM Studio açık ve *Local Server* başlatılmış mı? `GET /api/health` ile kontrol edin. |
| Docker içinden LLM'e erişilemiyor | LM Studio'da dinlemeyi tüm ağ arayüzlerine açın ve CORS izinlerini etkinleştirin. |
| GPU göstergesi `error` | NVIDIA sürücüsü/`nvidia-smi` yok demektir; sistem CPU profiline düşer, çalışma etkilenmez. Ayrıntı `gpu_hata_log.txt` içinde. |
| Python bağımlılık hatası | `pip install --upgrade pip && pip install -r requirements.txt` |
| Docker'da eski kod çalışıyor | `sudo docker compose down && sudo docker compose up --build` |

---

## Lisans

Bu proje akademik ve eğitim amaçlı geliştirilmiştir.
