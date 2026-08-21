import logging  # Sistem kayıt aracı

logger = logging.getLogger(__name__)  # Kayıtçıyı başlat

def split_code_universally(source_code: str, max_lines: int) -> list[str]:  # Kod parçalama
    try:
        lines = source_code.splitlines()  # Satırları ayır
        chunks = []  # Parça listesi
        current_chunk = []  # Aktif parça listesi
        bracket_count = 0  # Parantez sayacı

        for line in lines:  # Satırları tara
            current_chunk.append(line)  # Satırı ekle
            bracket_count += line.count('{') - line.count('}')  # Parantez kontrolü

            if len(current_chunk) >= max_lines and bracket_count == 0:  # Bölme kontrolü
                chunks.append("\n".join(current_chunk))  # Parçayı kaydet
                current_chunk = []  # Listeyi sıfırla

        if current_chunk:  # Kalan kontrolü
            chunks.append("\n".join(current_chunk))  # Son parçayı ekle

        logger.info(f"Kod toplam {len(chunks)} mantıksal parçaya bölündü.")  # İşlem sonucu kaydı
        return chunks  # Parçaları dön
    except Exception as e:
        logger.error(f"Kod parçalama hatası: {str(e)}")  # Hatayı kaydet
        raise Exception("Kod ayrıştırılırken bir sorun oluştu.")  # Hatayı fırlat