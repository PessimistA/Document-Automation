import { useState } from 'react' // React hook'unu aktar
import { Login } from './components/Login' // Login bileşenini aktar
import { SignUp} from './components/SignUp' // Kayıt bileşenini aktar
import { SideBar } from './components/SideBar' // Kenar çubuğunu aktar
import { Settings } from './components/Settings' // Ayarlar bileşenini aktar
import { Projects } from './components/Projects' // Projeler bileşenini aktar
import { Members } from './components/Members' // Üyeler bileşenini aktar
import { Files } from './components/Files' // Dosyalar bileşenini aktar
import { Dashboard } from './components/Dashboard' // Panel bileşenini aktar
import { Codes } from './components/Codes' // Kodlar bileşenini aktar

import { DocumentProvider } from './components/DocumentContext' // Belge bağlamını aktar
import { CodeProvider } from './components/CodeContext' // Kod bağlamını aktar

function App() { // Ana uygulama bileşeni
  const [activeTab, setActiveTab] = useState('login') // Aktif sekme durumu
  const [targetRepo,setTargetRepo] = useState(null) // Hedef depo durumu

  const handleSideBar = activeTab === 'login' || activeTab === 'signup'; // Kenar çubuğu görünürlüğü

  const renderContent = () => { // İçerik oluşturucu fonksiyon
    switch (activeTab) { // Aktif sekmeyi kontrol et
      case 'login': // Giriş sekmesi durumu
        return <Login onNavigate={setActiveTab} /> // Giriş ekranını renderla
      case 'signup': // Kayıt sekmesi durumu
        return <SignUp onNavigate={setActiveTab}/> // Kayıt ekranını renderla
      case 'dashboard': // Panel sekmesi durumu
        return <Dashboard /> // Paneli renderla
      case 'projects': // Projeler sekmesi durumu
        return <Projects onNavigate={setActiveTab} setTargetRepo={setTargetRepo} /> // Projeleri renderla
      case 'members': // Üyeler sekmesi durumu
        return <Members /> // Üyeleri renderla
      case 'files': // Dosyalar sekmesi durumu
        return <Files /> // Dosyaları renderla
      case 'codes': // Kodlar sekmesi durumu
        return <Codes targetRepo={targetRepo} setTargetRepo={setTargetRepo}/> // Kodları renderla
      case 'settings': // Ayarlar sekmesi durumu
        return <Settings /> // Ayarları renderla
      default: // Varsayılan durum
        return <Login /> // Giriş ekranını renderla
    }
  }

  return ( // JSX ağacını döndür
    <DocumentProvider> {/* Belge sağlayıcısını sar */}
      <CodeProvider> {/* Kod sağlayıcısını sar */}
        {handleSideBar ? ( // Düzen koşulunu kontrol et
          <div className="min-h-screen bg-zinc-50"> {/* Tam ekran sarıcı */}
            {renderContent()} {/* Ana içeriği renderla */}
          </div>
        ) : ( // Yan panelli düzen
          <div className="flex h-screen overflow-hidden bg-zinc-50"> {/* Esnek kapsayıcı (container) */}
            <SideBar activeMenu={activeTab} onMenuChange={setActiveTab} /> {/* Kenar çubuğunu renderla */}
            
            <main className="flex-1 overflow-y-auto"> {/* Ana içerik alanı */}
              <div className="w-full p-8"> {/* İçerik boşluğu (padding) */}
                {renderContent()} {/* Ana içeriği renderla */}
              </div>
            </main>
          </div>
        )}
      </CodeProvider>
    </DocumentProvider>
  )
}

export default App // Uygulamayı dışa aktar