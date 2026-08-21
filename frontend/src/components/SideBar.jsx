import { useState, useEffect } from "react"; // Import React hooks
import { Users, FolderKanban, Code, FileText, Settings, LayoutDashboard, User, Mail, Calendar, MapPin, LogOut, X } from "lucide-react"; // Import UI icons
import { getUserProfile } from "../services/authService"; // Import API service

export function SideBar({ activeMenu, onMenuChange }) { // Sidebar main component
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false); // Modal visibility state
  
  const [userProfile, setUserProfile] = useState({ // User profile state
    name: "Yükleniyor...",
    email: "...",
    role: "Üye", 
    joinDate: "...",
    location: "Belirtilmedi", 
    department: "Belirtilmedi", 
    avatar: "U"
  });

  useEffect(() => { // Mount effect hook
    const fetchUserProfile = async () => { // Fetch profile function
      try { // Start try block
        const data = await getUserProfile(); // Get API response
        
        const cleanText = (text) => { // Sanitize text utility
          if (!text) return ""; // Return empty string
          return String(text).replace(/undefined|null/gi, "").trim(); // Remove invalid words
        };

        const safeName = cleanText(data.name) || "Kullanıcı"; // Sanitize user name
        const safeSurname = cleanText(data.surname); // Sanitize user surname
        
        const fullName = `${safeName} ${safeSurname}`.trim(); // Combine full name
        
        let avatarText = safeName.charAt(0).toUpperCase(); // Extract first initial
        if (safeSurname) { // Check surname existence
          avatarText += safeSurname.charAt(0).toUpperCase(); // Append surname initial
        } else if (safeName.length > 1) { // Check name length
          avatarText = safeName.substring(0, 2).toUpperCase(); // Extract double initial
        }

        setUserProfile({ // Update local state
          name: fullName, // Set full name
          email: cleanText(data.email) || "E-posta yok", // Set email
          role: cleanText(data.role) || "Üye", // Set role
          joinDate: data.created_at ? new Date(data.created_at).toLocaleDateString('tr-TR') : "Bilinmiyor", // Set join date
          location: cleanText(data.location) || "Belirtilmedi", // Set location
          department: cleanText(data.department) || "Belirtilmedi", // Set department
          avatar: avatarText // Set avatar initials
        });
      } catch (error) { // Catch fetch error
        console.error("Kullanıcı profili çekilemedi:", error); // Log fetch error
        setUserProfile(prev => ({ ...prev, name: "Kullanıcı Bulunamadı", avatar: "U" })); // Set fallback state
      }
    };

    fetchUserProfile(); // Trigger initial fetch

    window.addEventListener("profile_updated", fetchUserProfile); // Attach event listener

    return () => { // Cleanup function
      window.removeEventListener("profile_updated", fetchUserProfile); // Detach event listener
    };
  }, []); // Dependency array trigger

  const handleLogout = (e) => { // Handle user logout
    e.stopPropagation(); // Prevent event bubbling
    localStorage.removeItem('access_token'); // Clear auth token
    onMenuChange("login"); // Navigate to login
  };

  const menuItems = [ // Define sidebar items
    { id: "dashboard", label: "Panel", icon: LayoutDashboard }, // Dashboard item
    { id: "members", label: "Takım Üyeleri", icon: Users }, // Members item
    { id: "projects", label: "Projeler", icon: FolderKanban }, // Projects item
    { id: "codes", label: "Kod Depoları", icon: Code }, // Codes item
    { id: "files", label: "Dosyalar", icon: FileText }, // Files item
    { id: "settings", label: "Ayarlar", icon: Settings }, // Settings item
  ];

  return ( // Return JSX elements
    <aside className="w-64 bg-zinc-900 text-white h-screen flex flex-col shrink-0">
      <div className="p-6 border-b border-zinc-800">
        <h1 className="text-xl font-bold tracking-tight text-white">Otomasyon Hub</h1>
        <p className="text-xs text-zinc-500 uppercase tracking-widest mt-1 font-semibold">Proje Yönetimi</p>
      </div>

      <nav className="flex-1 p-4 overflow-y-auto">
        <ul className="space-y-1">
          {menuItems.map((item) => { // Iterate menu items
            const Icon = item.icon; // Extract icon component
            const isActive = activeMenu === item.id; // Check active status

            return ( // Render menu item
              <li key={item.id}>
                <button
                  onClick={() => onMenuChange(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 focus:outline-none ${
                    isActive
                      ? "bg-blue-600 text-white shadow-lg shadow-blue-900/20"
                      : "text-zinc-400 hover:bg-zinc-800 hover:text-white"
                  }`}
                >
                  <Icon className={`w-5 h-5 ${isActive ? "text-white" : "text-zinc-500"}`} />
                  <span className="font-medium">{item.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="p-4 border-t border-zinc-800 bg-zinc-900/50">
        <div className="space-y-2">
          <button
            onClick={() => setIsProfileDialogOpen(true)}
            className="w-full flex items-center gap-3 hover:bg-zinc-800 p-2 rounded-lg transition-colors group text-left overflow-hidden"
          >
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shrink-0 shadow-inner">
              <span className="text-xs font-bold text-white">{userProfile.avatar}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-zinc-200 group-hover:text-white truncate">{userProfile.name}</p>
              <p className="text-xs text-zinc-500 truncate">{userProfile.email}</p>
            </div>
          </button>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 text-zinc-400 hover:bg-red-900/20 hover:text-red-400 rounded-lg transition-all group"
          >
            <LogOut className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            <span className="text-sm font-medium">Çıkış Yap</span>
          </button>
        </div>
      </div>

      {isProfileDialogOpen && ( // Conditional modal render
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white text-zinc-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-5 border-b border-zinc-100 flex justify-between items-center bg-zinc-50/50">
              <div>
                <h3 className="text-lg font-bold text-zinc-900">Kullanıcı Profili</h3>
                <p className="text-xs text-zinc-500">Hesap yönetimi ve detayları</p>
              </div>
              <button
                onClick={() => setIsProfileDialogOpen(false)}
                className="p-2 hover:bg-zinc-200 rounded-full text-zinc-400 hover:text-zinc-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              <div className="flex items-center gap-5 mb-8 overflow-hidden">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-xl rotate-3 shrink-0">
                  <span className="text-2xl font-black text-white -rotate-3">{userProfile.avatar}</span>
                </div>
                <div className="min-w-0">
                  <h3 className="text-2xl font-bold text-zinc-900 tracking-tight truncate">{userProfile.name}</h3>
                  <span className="inline-block px-2 py-1 rounded bg-blue-50 text-blue-700 text-[10px] font-bold uppercase tracking-wider mt-1 truncate max-w-full">
                    {userProfile.role}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3">
                <ProfileItem icon={Mail} label="E-Posta" value={userProfile.email} />
                <ProfileItem icon={User} label="Departman" value={userProfile.department} />
                <ProfileItem icon={MapPin} label="Konum" value={userProfile.location} />
              </div>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}

function ProfileItem({ icon: Icon, label, value }) { // Render detail row
  return ( // Return row JSX
    <div className="flex items-center gap-4 p-3 bg-zinc-50 rounded-xl border border-zinc-100 transition-colors hover:bg-zinc-100/50 overflow-hidden">
      <div className="p-2 bg-white rounded-lg shadow-sm border border-zinc-100 shrink-0">
        <Icon className="w-4 h-4 text-blue-600" />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-tighter truncate">{label}</p>
        <p className="text-sm font-semibold text-zinc-800 truncate">{value}</p>
      </div>
    </div>
  );
}