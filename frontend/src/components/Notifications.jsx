import { Bell, Check, X, UserPlus, FolderKanban, Loader2, Clock } from "lucide-react"; // Import UI icons
import { useState, useEffect } from "react"; // Import React hooks
import { getPendingInvitations, respondToInvitation } from "../services/apiService"; // Import API services

export function Notifications() { // Main notification component
  const [invitations, setInvitations] = useState([]); // Invites array state
  const [isLoading, setIsLoading] = useState(true); // Loading status state

  useEffect(() => { // Mount effect hook
    fetchInvitations(); // Fetch initial invites
  }, []); // Dependency array trigger

  const fetchInvitations = async () => { // Fetch invites function
    setIsLoading(true); // Start loading indicator
    try { // Start try block
      const data = await getPendingInvitations(); // Call fetch API
      setInvitations(Array.isArray(data) ? data : []); // Set valid array
    } catch (error) { // Catch error block
      console.error("Bildirimler çekilemedi:", error); // Log fetch error
    } finally { // Execute finally block
      setIsLoading(false); // Stop loading indicator
    }
  };

  const handleRespond = async (id, status) => { // Handle invite response
    try { // Start try block
      await respondToInvitation(id, status); // Post response API
      setInvitations(prev => prev.filter(inv => inv.id !== id)); // Remove processed invite
      alert(status === "accepted" ? "Daveti kabul ettiniz!" : "Daveti reddettiniz."); // Notify response result
    } catch (error) { // Catch error block
      alert("İşlem sırasında bir hata oluştu."); // Notify execution error
    }
  };

  return ( // Return JSX tree
    <div className="space-y-6 text-left max-w-5xl mx-auto"> {/* Main wrapper container */}
      <div className="flex items-center justify-between"> {/* Header flex container */}
        <div> {/* Title wrapper */}
          <h2 className="text-2xl font-semibold text-zinc-900">Bildirimler</h2> {/* Main page title */}
          <p className="text-zinc-600 mt-1">Size gelen takım ve proje davetlerini yönetin</p> {/* Subtitle text */}
        </div>
        <div className="p-3 bg-blue-50 text-blue-600 rounded-xl"> {/* Icon wrapper block */}
          <Bell className="w-6 h-6" /> {/* Bell icon graphic */}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-zinc-200 shadow-sm p-6"> {/* Content wrapper block */}
        {isLoading ? ( // Conditional loading render
          <div className="flex flex-col items-center justify-center py-12 text-zinc-500"> {/* Loading container */}
            <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-3" /> {/* Loading spinner icon */}
            <p>Bildirimleriniz yükleniyor...</p> {/* Loading text label */}
          </div>
        ) : invitations.length === 0 ? ( // Conditional empty render
          <div className="flex flex-col items-center justify-center py-12 text-zinc-500"> {/* Empty state container */}
            <div className="w-16 h-16 bg-zinc-50 border-2 border-dashed border-zinc-200 rounded-full flex items-center justify-center mb-4"> {/* Empty icon wrapper */}
              <Bell className="w-6 h-6 text-zinc-300" /> {/* Empty bell icon */}
            </div>
            <p className="font-medium text-zinc-900">Bekleyen bildiriminiz yok</p> {/* Empty state title */}
            <p className="text-sm">Şu an için size gönderilmiş yeni bir davetiye bulunmuyor.</p> {/* Empty state subtitle */}
          </div>
        ) : ( // Conditional list render
          <div className="space-y-4"> {/* List items wrapper */}
            {invitations.map((inv) => ( // Iterate over invites
              <div key={inv.id} className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-xl border border-zinc-200 hover:border-blue-300 transition-colors bg-zinc-50/50"> {/* Invite item row */}
                
                <div className="flex items-start gap-4"> {/* Invite info wrapper */}
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 shadow-sm text-white ${inv.type === 'team' ? 'bg-gradient-to-br from-purple-500 to-indigo-600' : 'bg-gradient-to-br from-blue-500 to-cyan-600'}`}> {/* Dynamic avatar wrapper */}
                    {inv.type === 'team' ? <UserPlus className="w-5 h-5" /> : <FolderKanban className="w-5 h-5" />} {/* Dynamic avatar icon */}
                  </div>
                  <div> {/* Invite text wrapper */}
                    <h4 className="font-bold text-zinc-900 text-base"> {/* Invite type title */}
                      {inv.type === 'team' ? 'Takım Davetiyesi' : 'Proje Davetiyesi'} {/* Render type label */}
                    </h4>
                    <p className="text-sm text-zinc-600 mt-1"> {/* Invite description text */}
                      <span className="font-semibold text-zinc-900">{inv.sender_name}</span> ({inv.sender_email}) sizi  {/* Render sender info */}
                      {inv.type === 'team' ? " çalışma takımına " : <span className="font-bold text-blue-600"> {inv.project_name} </span>} {/* Render target info */}
                      davet ediyor. {/* Render suffix text */}
                    </p>
                    <div className="flex items-center gap-1 text-xs font-medium text-zinc-400 mt-2"> {/* Timestamp wrapper */}
                      <Clock className="w-3 h-3" /> {/* Clock icon graphic */}
                      {new Date(inv.created_at).toLocaleDateString('tr-TR')} {/* Render date string */}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0"> {/* Actions button wrapper */}
                  <button  // Reject button element
                    onClick={() => handleRespond(inv.id, "rejected")} // Bind reject handler
                    className="flex items-center gap-1.5 px-4 py-2 bg-white border border-zinc-200 text-zinc-600 font-medium rounded-lg hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors" // Apply reject styles
                  >
                    <X className="w-4 h-4" /> Reddet {/* Render reject label */}
                  </button>
                  <button  // Accept button element
                    onClick={() => handleRespond(inv.id, "accepted")} // Bind accept handler
                    className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 shadow-sm transition-colors" // Apply accept styles
                  >
                    <Check className="w-4 h-4" /> Kabul Et {/* Render accept label */}
                  </button>
                </div>

              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}