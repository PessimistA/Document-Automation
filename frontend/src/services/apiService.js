import api from '../api/apiConfig'; // API yapılandırmasını içe aktar

export const registerUser = async (userData) => { // Yeni kullanıcı kaydı
  const response = await api.post('/register/', userData); // Kayıt verilerini gönder
  return response.data; // Yanıt verisini dön
};

export const loginUser = async (email, password) => { // Kullanıcı giriş fonksiyonu
  const response = await api.post('/login/', { email, password }); // Giriş verilerini gönder
  if (response.data.access_token) { // Token varlığını kontrol et
    localStorage.setItem('access_token', response.data.access_token); // Kimlik doğrulama tokenini sakla
  }
  return response.data; // Yanıt verisini dön
};

export const getCurrentUser = async () => { // Aktif kullanıcıyı getir
  const response = await api.get('/users/me'); // Kullanıcı profilini çek
  return response.data; // Yanıt verisini dön
};

export const updateCurrentUser = async (updateData) => { // Kullanıcı profilini güncelle
  const response = await api.patch('/users/me', updateData, { // Kullanıcı verilerini yama (patch)
    headers: { // Üstbilgileri (headers) ayarla
      'Content-Type': 'application/json' // İçerik türünü belirle
    }
  });
  return response.data; // Yanıt verisini dön
};

export const getSystemUsers = async () => { // Tüm kullanıcıları getir
  const response = await api.get('/system/users/'); // Sistem kullanıcılarını çek
  return response.data; // Yanıt verisini dön
};

export const sendInvitation = async (invitationData) => { // Yeni davet gönder
  const response = await api.post('/invitations/', invitationData); // Davet verilerini gönder
  return response.data; // Yanıt verisini dön
};

export const getPendingInvitations = async () => { // Alınan davetleri getir
  const response = await api.get('/invitations/'); // Bekleyen davetleri çek
  return response.data; // Yanıt verisini dön
};

export const getSentInvitations = async () => { // Gönderilen davetleri getir
  const response = await api.get('/invitations/sent/'); // Giden davetleri çek
  return response.data; // Yanıt verisini dön
};

export const respondToInvitation = async (invId, status) => { // Davete yanıt ver
  const response = await api.post(`/invitations/${invId}/respond`, { status }); // Yanıt durumunu gönder
  return response.data; // Yanıt verisini dön
};

export const revokeInvitation = async (invId) => { // Gönderilen daveti iptal et
  const response = await api.delete(`/invitations/${invId}/revoke`); // Hedef daveti sil
  return response.data; // Yanıt verisini dön
};

export const getRecentActivities = async () => { // Panel aktivitelerini getir
  const response = await api.get('/dashboard/activities/'); // Son aktiviteleri çek
  return response.data; // Yanıt verisini dön
};

export const getProjects = async () => { // Tüm projeleri getir
  const response = await api.get('/projects/'); // Proje listesini çek
  return response.data; // Yanıt verisini dön
};

export const getProjectDetails = async (projectId) => { // Proje detaylarını getir
  const response = await api.get(`/projects/${projectId}`); // Belirli projeyi çek
  return response.data; // Yanıt verisini dön
};

export const createProject = async (projectData) => { // Yeni proje oluştur
  const response = await api.post('/projects/', projectData); // Proje verilerini gönder
  return response.data; // Yanıt verisini dön
};

export const updateProjectData = async (projectId, updateData) => { // Proje verilerini güncelle
  const response = await api.patch(`/projects/${projectId}`, updateData); // Proje verilerini yama (patch)
  return response.data; // Yanıt verisini dön
};

export const getProjectTasks = async (projectId) => { // Proje görevlerini getir
  const response = await api.get(`/projects/${projectId}/tasks/`); // Görev listesini çek
  return response.data; // Yanıt verisini dön
};

export const addTaskToProject = async (projectId, taskData) => { // Yeni görev oluştur
  const response = await api.post(`/projects/${projectId}/tasks/`, taskData); // Görev verilerini gönder
  return response.data; // Yanıt verisini dön
};

export const updateTaskStatus = async (taskId, is_completed) => { // Görev durumunu güncelle
  const response = await api.patch(`/tasks/${taskId}`, { is_completed }); // Tamamlanma durumunu yama (patch)
  return response.data; // Yanıt verisini dön
};

export const deleteTaskFromProject = async (taskId) => { // Proje görevini sil
  const response = await api.delete(`/tasks/${taskId}`); // Hedef görevi sil
  return response.data; // Yanıt verisini dön
};

export const getMembers = async () => { // Takım üyelerini getir
  const response = await api.get('/members/'); // Üye listesini çek
  return response.data; // Yanıt verisini dön
};

export const addMember = async (memberData) => { // Takım üyesi ekle
  const response = await api.post('/members/', memberData); // Üye verilerini gönder
  return response.data; // Yanıt verisini dön
};

export const updateMemberInDb = async (memberId, updateData) => { // Takım üyesini güncelle
  const response = await api.patch(`/members/${memberId}`, updateData); // Üye verilerini yama (patch)
  return response.data; // Yanıt verisini dön
};

export const deleteMemberFromDb = async (memberId) => { // Takım üyesini sil
  const response = await api.delete(`/members/${memberId}`); // Hedef üyeyi sil
  return response.data; // Yanıt verisini dön
};

export const getProjectFiles = async (projectId) => { // Proje dosyalarını getir
  if (!projectId || typeof projectId === 'object') { // Global kapsamı (scope) kontrol et
    const response = await api.get('/system/files/'); // Sistem dosyalarını çek
    return response.data; // Yanıt verisini dön
  }
  const response = await api.get(`/projects/${projectId}/files/`); // Kapsamlı dosyaları çek
  return response.data; // Yanıt verisini dön
};

export const uploadProjectFile = async (projectId, file) => { // Yeni dosya yükle
  const formData = new FormData(); // Form verisi oluştur
  formData.append('file', file); // Dosya nesnesini ekle
  const token = localStorage.getItem('access_token'); // Kimlik doğrulama tokenini al
  
  const BASE_URL = "http://127.0.0.1:8000"; // Arka uç (backend) URL'sini tanımla
  
  if (!projectId || typeof projectId === 'object') { // Global kapsamı kontrol et
    const response = await fetch(`${BASE_URL}/files/upload/`, { // Global yüklemeyi çağır
      method: 'POST', // POST metodunu ayarla
      headers: { 'Authorization': `Bearer ${token}` }, // Yetkilendirme başlığını ayarla
      body: formData // Yükü (payload) iliştir
    });
    if (!response.ok) { // Hata durumunu kontrol et
      const errData = await response.json().catch(() => ({})); // Hatayı güvenli ayrıştır
      throw new Error(errData.detail || "Şahsi dosya yüklenemedi."); // Yükleme hatası fırlat
    }
    return await response.json(); // Ayrıştırılmış yanıtı dön
  }

  const response = await fetch(`${BASE_URL}/projects/${projectId}/upload_file/`, { // Kapsamlı yüklemeyi çağır
    method: 'POST', // POST metodunu ayarla
    headers: { 'Authorization': `Bearer ${token}` }, // Yetkilendirme başlığını ayarla
    body: formData // Yükü (payload) iliştir
  });

  if (!response.ok) { // Hata durumunu kontrol et
    const errData = await response.json().catch(() => ({})); // Hatayı güvenli ayrıştır
    throw new Error(errData.detail || "Proje dosyası yüklenemedi."); // Yükleme hatası fırlat
  }

  return await response.json(); // Ayrıştırılmış yanıtı dön
};

export const linkSystemFileToProject = async (projectId, fileId) => { // Mevcut dosyayı bağla
  const response = await api.post(`/projects/${projectId}/link_file/${fileId}`); // Bağlantı isteğini gönder
  return response.data; // Yanıt verisini dön
};

export const getFileContent = async (fileId) => { // Dosya içeriğini getir
  const response = await api.get(`/files/${fileId}/content`); // Ham içeriği çek
  return response.data; // Yanıt verisini dön
};

export const downloadFile = async (fileId) => { // Dosya blogunu indir
  const response = await api.get(`/files/${fileId}/download`, { // Blob akışını çek
    responseType: 'blob' // Blob yanıtını belirt
  });
  return response.data; // Yanıt verisini dön
};

export const exportToPersonalFiles = async (fileId, projectName) => { // Kişisel dosyalara aktar
  const response = await api.post(`/files/${fileId}/export`, { project_name: projectName }); // Aktarım isteğini gönder
  return response.data; // Yanıt verisini dön
};

export const deleteProjectFile = async (fileId) => { // Dosya referansını sil
  const response = await api.delete(`/files/${fileId}`); // Hedef dosyayı sil
  return response.data; // Yanıt verisini dön
};

export const updateFileMetadata = async (fileId, updateData) => { // Dosya üstverisini güncelle
  const response = await api.patch(`/files/${fileId}`, updateData); // Dosya bilgisini yama (patch)
  return response.data; // Yanıt verisini dön
};

export const getAllSystemFiles = async () => { // Sistem dosyalarını getir
  const response = await api.get('/system/files/'); // Global dosyaları çek
  return response.data; // Yanıt verisini dön
};

export const getRepositories = async () => { // Tüm depoları getir
  const response = await api.get('/repositories/'); // Global depoları çek
  return response.data; // Yanıt verisini dön
};

export const getProjectRepositories = async (projectId) => { // Kapsamlı depoları getir
  const response = await api.get(`/projects/${projectId}/repositories/`); // Proje depolarını çek
  return response.data; // Yanıt verisini dön
};

export const linkSystemRepoToProject = async (projectId, repoId) => { // Mevcut depoyu bağla
  const response = await api.post(`/projects/${projectId}/link_repo/${repoId}`); // Bağlantı isteğini gönder
  return response.data; // Yanıt verisini dön
};

export const exportRepoToPersonal = async (repoId, projectName) => { // Depoyu aktar
  const response = await api.post(`/repositories/${repoId}/export`, { project_name: projectName }); // Aktarım isteğini gönder
  return response.data; // Yanıt verisini dön
};

export const createRepository = async (repoData) => { // Yeni depo oluştur
  const response = await api.post('/repositories/', repoData); // Depo verilerini gönder
  return response.data; // Yanıt verisini dön
};

export const getWorkspaceTree = async (repoId) => { // Depo ağacını getir
  const response = await api.get(`/api/get-tree?repo_id=${repoId}`); // Dizin yapısını çek
  return response.data; // Yanıt verisini dön
};

export const saveCodeToApp = async (repoId, fileName, content) => { // Kod dosyasını kaydet
  const response = await api.post('/save-app', { // Kod güncellemesini gönder
    repo_id: repoId, // Depo kimliğini ata
    file: fileName, // Dosya adını ata
    content: content // Dosya içeriğini ata
  });
  return response.data; // Yanıt verisini dön
};

export const processCodeWithAI = async (codeContent) => { // Yapay zeka ile kod analizi
  const response = await api.post('/process-code', { code: codeContent }); // Yapay zeka isteğini gönder
  return response.data; // Yanıt verisini dön
};

export const generateDocument = async (docData) => { // Yapay zeka dökümanı üret
  const response = await api.post('/api/generate', docData); // Üretici isteğini gönder
  return response.data; // Yanıt verisini dön
};

export const editInlineDocument = async (editData) => { // Yapay zeka ile doküman düzenle
  const response = await api.post('/api/edit-inline', editData); // Düzenleyici isteğini gönder
  return response.data; // Yanıt verisini dön
};

export const saveDocumentToServer = async (file, content) => { // Üretilen dokümanı kaydet
  const response = await api.post('/api/save-doc', { file, content }); // Doküman verilerini gönder
  return response.data; // Yanıt verisini dön
};

export const checkAiHealth = async () => { // Yapay zeka bağlantısını kontrol et
  const response = await api.get('/api/health'); // Sağlık durumunu çek
  return response.data; // Yanıt verisini dön
};

export const getMessages = async (otherUserId) => { // Sohbet geçmişini getir
  const response = await api.get(`/messages/${otherUserId}`); // Mesaj kaydını çek
  return response.data; // Yanıt verisini dön
};

export const sendMessage = async (receiverId, content) => { // Sohbet mesajı gönder
  const response = await api.post('/messages/', { receiver_id: receiverId, content }); // API örneğini (instance) kullan
  return response.data; // Yanıt verisini dön
};

export const createFolderInRepo = async (repoId, folderPath) => { // Depo klasörü oluştur
  const response = await api.post('/create-folder', { repo_id: repoId, folder_path: folderPath }); // Klasör isteği gönder
  return response.data; // Yanıt verisini dön
};

export const renameRepoItem = async (repoId, oldPath, newPath) => { // Depo öğesini yeniden adlandır
  const response = await api.post('/rename-item', { repo_id: repoId, old_path: oldPath, new_path: newPath }); // Yeniden adlandırma isteğini gönder
  return response.data; // Yanıt verisini dön
};

export const uploadFilesToRepo = async (repoId, rootPath, filesWithPaths) => { // Depoya dosyaları yükle
  const formData = new FormData(); // Form verisi oluştur
  
  if (Array.isArray(filesWithPaths) && filesWithPaths[0]?.path !== undefined) { // Yapılandırılmış girdiyi kontrol et
    filesWithPaths.forEach((fw) => { // Dosya sarmalayıcılarını (wrappers) yinele
      formData.append('files', fw.file); // Dosya blogunu ekle
      formData.append('paths', fw.path); // Göreceli yolu ekle
    });
  } else { // Ham FileList'i işle
    Array.from(filesWithPaths).forEach(file => { // Ham dosyaları yinele
      formData.append('files', file); // Dosya blogunu ekle
      formData.append('paths', file.name); // Dosya adını ekle
    });
  }
  
  const token = localStorage.getItem('access_token'); // Kimlik doğrulama tokenini al
  const BASE_URL = "http://127.0.0.1:8000"; // Arka uç (backend) URL'si alternatifi
  const response = await fetch(`${BASE_URL}/repositories/${repoId}/upload`, { // Yükleme uç noktasını (endpoint) çağır
    method: 'POST', // POST metodunu ayarla
    headers: { 'Authorization': `Bearer ${token}` }, // Yetkilendirme başlığını ayarla
    body: formData // Yükü (payload) iliştir
  });
  
  if (!response.ok) { // Hata durumunu kontrol et
    throw new Error("Yükleme başarısız oldu"); // Yükleme hatası fırlat
  }
  
  return await response.json(); // Ayrıştırılmış yanıtı dön
};

export const getAllSystemUsers = async () => { // Tüm kullanıcıları getir
  const response = await api.get('/system/users/'); // Kullanıcı dizisini çek
  return response.data; // Yanıt verisini dön
};