class ModelConfig:  # Model ayarı
    def __init__(self, model_name, size_category):  # Başlangıç ayarları
        self.model_name = model_name  # Model adını
        self.size_category = size_category  # Boyut sınıfını

    @property  # Özellik
    def temperature(self):  # Yaratıcılık seviyesi ayarı
        if self.size_category == "small":  # Küçük boyut
            return 0.1  # Düşük yaratıcılık
        if self.size_category == "medium":  # Orta boyut
            return 0.2  # Orta yaratıcılık
        return 0.3  # Yüksek yaratıcılık

    @property  # Özellik
    def max_context(self):  # Maksimum kelime sınırı
        if self.size_category == "small":  # Küçük boyut
            return 2048  # Düşük sınır
        if self.size_category == "medium":  # Orta boyut
            return 4096  # Dengeli sınır
        return 8192  # En yüksek sınır