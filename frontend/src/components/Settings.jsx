import { User, Mail, Calendar, MapPin, Edit2, Save, X, Users, Loader2 } from "lucide-react"; // Import UI icons
import { useState, useEffect } from "react"; // Import React hooks

const BASE_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000"; // Define API URL

export function Settings() { // Settings main component
  const [isEditingProfile, setIsEditingProfile] = useState(false); // Edit mode state
  const [loading, setLoading] = useState(true); // Loading status state
  const [saving, setSaving] = useState(false); // Saving status state
  
  const [userProfile, setUserProfile] = useState({ // User profile state
    name: "",
    surname: "",
    email: "",
    role: "",
    location: "",
    department: ""
  });
  
  const [editedProfile, setEditedProfile] = useState({}); // Edited profile state

  useEffect(() => { // Mount effect hook
    fetchProfile(); // Initial profile fetch
  }, []); // Dependency array trigger

  const fetchProfile = async () => { // Fetch profile data
    try { // Start try block
      const token = localStorage.getItem('access_token'); // Get auth token
      if (!token) throw new Error("Token bulunamadı!"); // Validate token presence

      const response = await fetch(`${BASE_URL}/users/me`, { // Call fetch API
        method: "GET", // Set GET method
        headers: { // Set request headers
          "Authorization": `Bearer ${token}`, // Pass auth token
          "Content-Type": "application/json" // Set content type
        }
      });

      if (!response.ok) { // Check response status
        const errText = await response.text(); // Parse error text
        throw new Error(`Sunucu Hatası: ${response.status} - ${errText}`); // Throw server error
      }

      const data = await response.json(); // Parse response JSON
      
      setUserProfile({ // Update profile state
        name: data.name || "", // Set name
        surname: data.surname || "", // Set surname
        email: data.email || "", // Set email
        role: data.role || "Üye", // Set role
        location: data.location || "Belirtilmedi", // Set location
        department: data.department || "Belirtilmedi" // Set department
      });
    } catch (error) { // Catch fetch error
      console.error("Profil verisi çekilemedi:", error); // Log fetch error
    } finally { // Execute finally block
      setLoading(false); // Stop loading indicator
    }
  };

  const handleEditProfile = () => { // Enable edit mode
    setEditedProfile({ ...userProfile }); // Copy current profile
    setIsEditingProfile(true); // Toggle edit state
  };

  const handleSaveProfile = async () => { // Save profile changes
    setSaving(true); // Start saving indicator
    try { // Start try block
      const dataToUpdate = { // Prepare payload
        name: editedProfile.name, // Assign name
        surname: editedProfile.surname, // Assign surname
        role: editedProfile.role, // Assign role
        department: editedProfile.department, // Assign department
        location: editedProfile.location // Assign location
      };
      
      const token = localStorage.getItem('access_token'); // Get auth token

      const response = await fetch(`${BASE_URL}/users/me`, { // Call update API
        method: "PATCH", // Set PATCH method
        headers: { // Set request headers
          "Content-Type": "application/json", // Set content type
          "Authorization": `Bearer ${token}` // Pass auth token
        },
        body: JSON.stringify(dataToUpdate) // Attach JSON payload
      });

      if (!response.ok) { // Check response status
        const errorText = await response.text(); // Parse error text
        console.error("SUNUCUDAN GELEN GERÇEK HATA:", errorText); // Log server error
        throw new Error("Sunucu reddetti!"); // Throw save error
      }
      
      const updatedData = await response.json(); // Parse response JSON
      
      setUserProfile({ // Update local state
        name: updatedData.name || "", // Update name
        surname: updatedData.surname || "", // Update surname
        email: updatedData.email || "", // Update email
        role: updatedData.role || "Üye", // Update role
        location: updatedData.location || "Belirtilmedi", // Update location
        department: updatedData.department || "Belirtilmedi" // Update department
      });
      
      setIsEditingProfile(false); // Disable edit mode
      
      window.dispatchEvent(new Event("profile_updated")); // Dispatch update event

    } catch (error) { // Catch save error
      console.error("Profil güncellenemedi:", error); // Log save error
      alert("Hata! F12'ye basıp Console (Konsol) sekmesine bak, gerçek hatayı orada göreceksin."); // Notify user error
    } finally { // Execute finally block
      setSaving(false); // Stop saving indicator
    }
  };

  const handleCancelEdit = () => { // Cancel edit mode
    setEditedProfile({}); // Reset edited profile
    setIsEditingProfile(false); // Disable edit mode
  };

  const handleInputChange = (field, value) => { // Handle input change
    setEditedProfile(prev => ({ ...prev, [field]: value })); // Update field state
  };

  if (loading) { // Check loading state
    return <div className="flex justify-center items-center h-64"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>; // Render loading spinner
  }

  return ( // Return JSX elements
    <div className="space-y-6 text-left max-w-5xl mx-auto animate-in fade-in duration-200">
      <div>
        <h2 className="text-2xl font-semibold text-zinc-900">Hesap Ayarları</h2>
        <p className="text-zinc-600 mt-1">Profilinizi ve çalışma alanı tercihlerinizi yönetin</p>
      </div>

      <div className="bg-white rounded-lg border border-zinc-200 p-6 shadow-sm">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-zinc-900">Profil Bilgileri</h3>
            <p className="text-sm text-zinc-600 mt-1">Hesap detaylarınızı ve kişisel bilgilerinizi güncelleyin</p>
          </div>
          {!isEditingProfile ? ( // Conditional edit button
            <button
              onClick={handleEditProfile}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors focus:outline-none shadow-sm"
            >
              <Edit2 className="w-4 h-4" />
              <span className="text-sm font-medium">Profili Düzenle</span>
            </button>
          ) : ( // Conditional action buttons
            <div className="flex gap-2">
              <button
                onClick={handleCancelEdit} 
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-zinc-300 text-zinc-700 rounded-lg hover:bg-zinc-50 transition-colors focus:outline-none disabled:opacity-50"
              >
                <X className="w-4 h-4" />
                <span className="text-sm font-medium">İptal</span>
              </button>
              <button
                onClick={handleSaveProfile} 
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors focus:outline-none disabled:opacity-50 shadow-sm"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                <span className="text-sm font-medium">Değişiklikleri Kaydet</span>
              </button>
            </div>
          )}
        </div>

        <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0 shadow-md">
            <span className="text-3xl font-bold text-white uppercase tracking-widest">
              {userProfile.name ? userProfile.name.charAt(0) : "K"}
              {userProfile.surname ? userProfile.surname.charAt(0) : ""}
            </span>
          </div>

          <div className="flex-1 w-full space-y-6">
            {isEditingProfile ? ( // Render edit form
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1 block">Ad</label>
                  <input type="text" value={editedProfile.name} onChange={(e) => handleInputChange('name', e.target.value)} className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none transition-shadow" />
                </div>
                <div>
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1 block">Soyad</label>
                  <input type="text" value={editedProfile.surname} onChange={(e) => handleInputChange('surname', e.target.value)} className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none transition-shadow" />
                </div>
                <div>
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1 block">E-Posta (Değiştirilemez)</label>
                  <input type="text" value={editedProfile.email} disabled className="w-full px-3 py-2 border border-zinc-200 bg-zinc-50 rounded-lg outline-none text-zinc-500 cursor-not-allowed" />
                </div>
                <div>
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1 block">Unvan / Rol</label>
                  <input type="text" value={editedProfile.role} onChange={(e) => handleInputChange('role', e.target.value)} className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none transition-shadow" />
                </div>
                <div>
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1 block">Departman</label>
                  <input type="text" value={editedProfile.department} onChange={(e) => handleInputChange('department', e.target.value)} className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none transition-shadow" />
                </div>
                <div>
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1 block">Konum</label>
                  <input type="text" value={editedProfile.location} onChange={(e) => handleInputChange('location', e.target.value)} className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none transition-shadow" />
                </div>
              </div>
            ) : ( // Render view mode
              <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-4">
                <ProfileItem icon={User} label="Tam Ad" value={`${userProfile.name} ${userProfile.surname}`} />
                <ProfileItem icon={Mail} label="E-Posta" value={userProfile.email} />
                <ProfileItem icon={User} label="Unvan" value={userProfile.role} />
                <ProfileItem icon={Users} label="Departman" value={userProfile.department} />
                <ProfileItem icon={MapPin} label="Konum" value={userProfile.location} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ProfileItem({ icon: Icon, label, value }) { // Render profile row
  return ( // Return JSX elements
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