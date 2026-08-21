import os # İşletim sistemi araçları
import sys # Sistem araçları

if getattr(sys, 'frozen', False): # Program exe mi bak
    BASE_DIR = os.path.dirname(sys.executable) # Exe yolunu al
else: # Kod olarak çalışıyorsa
    BASE_DIR = os.path.dirname(os.path.abspath(__file__)) # Dosya yolunu al

STORAGE_BASE = os.path.join(BASE_DIR, "local_storage") # Depolama ana yolu
REPOS_DIR = os.path.join(STORAGE_BASE, "repositories") # Depo klasör yolu

if not os.path.exists(REPOS_DIR): # Klasör yoksa
    os.makedirs(REPOS_DIR) # Yeni klasör oluştur

def get_file_tree_service(dir_path, base_dir=None): # Dosya listesi oluştur
    tree = [] # Sonuç listesi
    if not os.path.exists(dir_path): # Yol yoksa
        return [] # Boş liste dön

    if base_dir is None: # Ana dizin boşsa
        base_dir = dir_path # Mevcut yolu ata

    for item in os.listdir(dir_path): # Klasörü tara
        if item.startswith('.'): # Gizli dosyaysa
            continue # Atla

        item_path = os.path.join(dir_path, item) # Tam yolu bul
        relative_path = os.path.relpath(item_path, base_dir).replace("\\", "/") # Kısa yolu bul

        if os.path.isdir(item_path): # Klasörse
            tree.append({ # Bilgileri ekle
                "name": item, # İsim yaz
                "type": "folder", # Tipini belirt
                "path": relative_path, # Yolu ekle
                "children": get_file_tree_service(item_path, base_dir) # İçini tara
            })
        else: # Dosyaysa
            ext = item.split('.')[-1] if '.' in item else '' # Uzantıyı al
            lang_map = { # Dil haritası
                'py': 'python', 'ts': 'typescript', 'js': 'javascript',
                'md': 'markdown', 'json': 'json', 'html': 'html', 'css': 'css',
                'c': 'c', 'cpp': 'cpp', 'cs': 'csharp', 'java': 'java'
            }

            file_content = "" # İçerik değişkeni
            try:
                with open(item_path, "r", encoding="utf-8") as f: # Dosyayı aç
                    file_content = f.read() # Metni oku
            except Exception as e: # Hata olursa
                file_content = f"Dosya okuma hatası: {str(e)}" # Hatayı yaz

            tree.append({ # Dosya verisi ekle
                "name": item, # İsim yaz
                "type": "file", # Tip belirt
                "path": relative_path, # Yol ekle
                "language": lang_map.get(ext, "plaintext"), # Dili bul
                "content": file_content # Metni ekle
            })
    return tree # Ağacı geri dön


def save_file_service(repo_name, filename, content): # Dosya kaydet
    repo_path = os.path.join(REPOS_DIR, repo_name) # Depo yolunu kur

    save_path = os.path.join(repo_path, filename) # Kayıt yolunu kur

    if not os.path.abspath(save_path).startswith(os.path.abspath(repo_path)): # Güvenlik kontrolü
        raise ValueError("Geçersiz dosya yolu!") # Çökmemek için Hata fırlat

    parent_dir = os.path.dirname(save_path) # Üst klasörü bul
    if not os.path.exists(parent_dir): # Klasör yoksa
        os.makedirs(parent_dir, exist_ok=True) # Klasörleri oluştur

    with open(save_path, 'w', encoding='utf-8') as f: # Dosyayı aç
        f.write(content) # İçeriği yaz

    return save_path # Yolu geri dön