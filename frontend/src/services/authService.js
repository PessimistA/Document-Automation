import api from '../api/apiConfig'; // API yapılandırmasını içe aktar

export const registerUser = async (name, surname, email, password) => { // Kullanıcı kaydı oluştur
  const response = await api.post('/register/', { name, surname, email, password }); // Kayıt verilerini gönder
  return response.data; // Yanıt verisini dön
};

export const loginUser = async (email, password) => { // Kullanıcı girişi yap
  const response = await api.post('/login/', { email, password }); // Giriş verilerini gönder
  
  if (response.data.access_token) { // Token kontrolü yap
    localStorage.setItem('access_token', response.data.access_token); // Tokeni yerel hafızaya kaydet
  }
  return response.data; // Yanıt verisini dön
};

export const getUserProfile = async () => { // Kullanıcı profilini getir
  const response = await api.get('/users/me'); // Profil verisini çek
  return response.data; // Yanıt verisini dön
};

export const updateUserProfile = async (profileData) => { // Kullanıcı profilini güncelle
  const token = localStorage.getItem('access_token'); // Yetki tokenini al
  
  const response = await api.patch('/users/me', profileData, { // Profil verilerini yama (patch)
    headers: { // Üstbilgileri ayarla
      'Content-Type': 'application/json', // İçerik türünü belirle
      'Authorization': `Bearer ${token}` // Yetkilendirme başlığını ekle
    }
  });
  return response.data; // Yanıt verisini dön
};