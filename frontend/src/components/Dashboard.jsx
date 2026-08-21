import { Activity, Clock, CheckCircle2, Bell, Check, X } from "lucide-react"; // Import UI icons
import { useState, useEffect } from "react"; // Import React hooks
import { getProjects, getRecentActivities, getPendingInvitations, respondToInvitation } from "../services/apiService"; // Import API services

export function Dashboard() { // Dashboard main component
  const [projects, setProjects] = useState([]); // Projects list state
  const [activities, setActivities] = useState([]); // Activities list state
  const [invitations, setInvitations] = useState([]); // Pending invites state
  const [loading, setLoading] = useState(true); // Loading status state

  const loadDashboardData = async () => { // Fetch dashboard data
    try { // Start try block
      const [projectsData, activitiesData, invitesData] = await Promise.all([ // Fetch concurrently
        getProjects(), // Get projects API
        getRecentActivities(), // Get activities API
        getPendingInvitations() // Get invites API
      ]);
      
      setProjects(Array.isArray(projectsData) ? projectsData : []); // Safely set projects
      setActivities(Array.isArray(activitiesData) ? activitiesData : []); // Safely set activities
      setInvitations(Array.isArray(invitesData) ? invitesData : []); // Safely set invites
    } catch (err) { // Catch error block
      console.error("Dashboard verileri çekilemedi:", err); // Log fetch error
      setProjects([]); // Reset projects state
      setActivities([]); // Reset activities state
      setInvitations([]); // Reset invites state
    } finally { // Execute finally block
      setLoading(false); // Stop loading indicator
    }
  };

  useEffect(() => { // Mount effect hook
    loadDashboardData(); // Initial data load
  }, []); // Dependency array trigger

  const handleRespondToInvite = async (invId, status) => { // Handle invite response
    try { // Start try block
      await respondToInvitation(invId, status); // Send response API
      await loadDashboardData(); // Refresh dashboard data
    } catch (error) { // Catch error block
      console.error("Davet yanıtlanırken hata:", error); // Log response error
      alert("İşlem sırasında bir hata oluştu."); // Notify user error
    }
  };

  const stats = [ // Dashboard statistics array
    { 
      label: "Toplam Projeler", 
      value: projects.length.toString(), 
      icon: Activity, 
      color: "text-blue-500" 
    },
    { 
      label: "Devam Edenler", 
      value: projects.filter(p => p.status === "Devam Ediyor").length.toString(), 
      icon: Clock, 
      color: "text-yellow-500" 
    },
    { 
      label: "Tamamlananlar", 
      value: projects.filter(p => p.status === "Tamamlandı").length.toString(), 
      icon: CheckCircle2, 
      color: "text-green-500" 
    }
  ];

  const formatTime = (timestamp) => { // Format timestamp function
    if (!timestamp) return "Az önce"; // Handle empty timestamp
    
    const utcTimeString = timestamp.endsWith('Z') || timestamp.includes('+') 
      ? timestamp 
      : `${timestamp}Z`; // Ensure UTC format
      
    const date = new Date(utcTimeString); // Create Date object
    
    return date.toLocaleTimeString('tr-TR', { // Format to Turkish
      hour: '2-digit', 
      minute: '2-digit',
      timeZone: 'Europe/Istanbul' 
    });
  };

  return ( // Return JSX elements
    <div className="space-y-6 text-left animate-in fade-in duration-200 pb-10">
      <div>
        <h2 className="text-2xl font-semibold text-zinc-900">Panel</h2>
        <p className="text-zinc-600 mt-1">Otomasyon projelerinize genel bakış</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat) => { // Iterate over stats
          const Icon = stat.icon; // Extract icon component
          return ( // Render stat card
            <div key={stat.label} className="bg-white rounded-lg border border-zinc-200 p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-zinc-600">{stat.label}</p>
                  <p className="text-3xl font-bold text-zinc-900 mt-2">
                    {loading ? "..." : stat.value}
                  </p>
                </div>
                <Icon className={`w-8 h-8 ${stat.color}`} />
              </div>
            </div>
          );
        })}
      </div>

      {invitations.length > 0 && ( // Conditional invites render
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 shadow-sm">
          <h3 className="text-sm font-bold text-blue-800 flex items-center gap-2 mb-3">
            <Bell className="w-4 h-4" /> Bekleyen Davetleriniz Var ({invitations.length})
          </h3>
          <div className="space-y-3">
            {invitations.map(inv => ( // Iterate over invites
              <div key={inv.id} className="flex flex-col sm:flex-row sm:items-center justify-between bg-white p-3.5 rounded-lg border border-blue-100 shadow-sm">
                <div className="text-sm text-zinc-700">
                  <span className="font-bold text-zinc-900">{inv.sender_name}</span> ({inv.sender_email}) sizi 
                  <span className="font-bold text-blue-700">
                    {inv.type === 'team' || inv.invitation_type === 'team' ? ' çalışma takımına' : ` "${inv.project_name}" projesine`}
                  </span> davet ediyor.
                </div>
                <div className="flex items-center gap-2 mt-3 sm:mt-0">
                  <button 
                    onClick={() => handleRespondToInvite(inv.id, "rejected")} 
                    className="px-4 py-2 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-md transition-colors"
                  >
                    Reddet
                  </button>
                  <button 
                    onClick={() => handleRespondToInvite(inv.id, "accepted")} 
                    className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors shadow-sm"
                  >
                    <Check className="w-3.5 h-3.5" /> Kabul Et
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg border border-zinc-200 p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-zinc-900 mb-5">Son Aktiviteler</h3>
        <div className="space-y-4">
          {activities.length > 0 ? ( // Conditional activities render
            activities.map((activity, index) => ( // Iterate over activities
              <div key={index} className="flex items-start gap-4 pb-4 border-b border-zinc-100 last:border-0 last:pb-0">
                <div className="w-2 h-2 rounded-full bg-blue-500 mt-2 shrink-0"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-zinc-900 capitalize">
                    {activity.action_type ? activity.action_type.replace(/_/g, ' ') : "Aktivite"}
                  </p>
                  <p className="text-sm text-zinc-600">{activity.details}</p>
                </div>
                <span className="text-xs font-medium text-zinc-500 bg-zinc-50 px-2 py-1 rounded-md shrink-0">
                  {formatTime(activity.created_at)}
                </span>
              </div>
            ))
          ) : ( // Empty activities state
            <p className="text-sm text-zinc-500 py-6 italic text-center bg-zinc-50 rounded-lg border border-dashed border-zinc-200">
              {loading ? "Aktiviteler yükleniyor..." : "Sistemde henüz bir aktivite bulunmuyor."}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}