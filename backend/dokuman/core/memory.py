class MemoryManager: # Hafıza yönetimi
    def __init__(self, window_size, max_chars=6000): # Başlangıç ayarları
        self.window_size = window_size # Pencere boyutunu
        self.max_chars = max_chars # Karakter sınırını
        self.history = [] # Geçmiş listesini

    def add_to_history(self, text): # Geçmişe veri ekleme
        # Belleğe sadece max_chars kadarını ekle
        shortened = text[:self.max_chars] # Metni sınırda kes
        self.history.append(shortened) # Yeni veriyi ekle
        if len(self.history) > self.window_size: # Pencere aşımı kontrolü
            self.history.pop(0) # En eski veriyi at

    def get_previous_context(self): # Önceki bağlamı getir
        # Önceki içerik yoksa boş string döndür
        return "\n".join(self.history) if self.history else "" # Metinleri birleştirip dön