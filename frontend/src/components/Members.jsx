import { Mail, MoreVertical, UserPlus, Pencil, Trash2, X, Loader2, Database, Send, Bell, Check, MessageSquare, Clock, XCircle } from "lucide-react"; // Import UI icons
import { useState, useEffect } from "react"; // Import React hooks
import { getMembers, deleteMemberFromDb, updateMemberInDb, getSystemUsers, sendInvitation, getPendingInvitations, getSentInvitations, revokeInvitation, respondToInvitation, getCurrentUser } from "../services/apiService"; // Import API services

import { ChatWindow } from "./ChatWindow"; // Import chat component

export function Members() { // Main Members component
  const [members, setMembers] = useState([]); // Members list state
  const [pendingInvites, setPendingInvites] = useState([]); // Received invites state
  const [sentInvites, setSentInvites] = useState([]); // Sent invites state
  const [systemUsers, setSystemUsers] = useState([]); // All users state
  const [currentUser, setCurrentUser] = useState(null); // Current user state
  const [isLoading, setIsLoading] = useState(true); // Loading status state
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false); // Add modal state
  const [isSendingInvite, setIsSendingInvite] = useState(false); // Sending status state
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false); // Edit modal state
  const [editingMember, setEditingMember] = useState(null); // Target member state
  
  const [activeChatMember, setActiveChatMember] = useState(null); // Active chat state

  const [formData, setFormData] = useState({ name: "", role: "", email: "" }); // Form inputs state
  const [activeDropdownId, setActiveDropdownId] = useState(null); // Dropdown toggle state

  const roles = [ // Predefined roles list
    "Proje Yöneticisi", "Kıdemli Geliştirici", "Önyüz Geliştirici", 
    "Arkayüz Geliştirici", "DevOps Mühendisi", "Kalite Güvence (QA) Uzmanı", 
    "Tasarımcı", "Ürün Yöneticisi"
  ];

  useEffect(() => { // Initial data fetch
    loadPageData(); // Call fetcher function
  }, []); // Dependency array trigger

  const loadPageData = async () => { // Fetch page data
    setIsLoading(true); // Enable loading indicator
    try { // Start try block
      const user = await getCurrentUser(); // Get active user
      setCurrentUser(user); // Set active user

      const membersData = await getMembers(); // Get team members
      const validData = Array.isArray(membersData) ? membersData : []; // Validate members array
      const enriched = validData.map(m => { // Enhance member objects
        let avatarText = "U"; // Default avatar fallback
        if (m.name && typeof m.name === 'string') { // Validate name string
          const parts = m.name.trim().split(/\s+/); // Split by whitespace
          avatarText = parts.length > 1  // Generate initials
            ? (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase() // Double initials 
            : parts[0].charAt(0).toUpperCase(); // Single initial
        }
        return { ...m, avatar: avatarText }; // Return enriched member
      });
      setMembers(enriched); // Update members state

      const invitesData = await getPendingInvitations(); // Get received invites
      const teamInvites = Array.isArray(invitesData) ? invitesData.filter(inv => inv.type === "team" || inv.invitation_type === "team") : []; // Filter team invites
      setPendingInvites(teamInvites); // Update pending invites

      try { // Inner try block
        const sentData = await getSentInvitations(); // Get sent invites
        const mySentTeamInvites = Array.isArray(sentData) ? sentData.filter(inv => inv.type === "team" || inv.invitation_type === "team") : []; // Filter sent invites
        setSentInvites(mySentTeamInvites); // Update sent invites
      } catch (e) { // Catch inner block
        console.warn("Giden davetler API'si henüz hazır değil.", e); // Log missing endpoint
      }

    } catch (err) { // Catch main block
      console.error("Veriler yüklenemedi:", err); // Log data fetch error
    } finally { // Execute finally block
      setIsLoading(false); // Disable loading indicator
    }
  };

  const handleRespondToInvite = async (invId, status) => { // Handle invite response
    try { // Start try block
      await respondToInvitation(invId, status); // Post invite response
      await loadPageData(); // Refresh page data
      alert(status === "accepted" ? "Daveti kabul ettiniz! Takım arkadaşınız eklendi." : "Daveti reddettiniz."); // Notify response result
    } catch (error) { // Catch error block
      alert("İşlem sırasında bir hata oluştu."); // Notify generic error
    }
  };

  const handleRevokeInvite = async (invId) => { // Handle invite revocation
    try { // Start try block
      await revokeInvitation(invId); // Post revocation request
      setSentInvites(prev => prev.filter(inv => inv.id !== invId)); // Update local state
    } catch (error) { // Catch error block
      alert("Davetiye geri çekilirken bir hata oluştu."); // Notify revocation error
    }
  };

  const openAddDialog = async () => { // Open invite dialog
    setIsAddDialogOpen(true); // Toggle dialog visibility
    try { // Start try block
      const users = await getSystemUsers(); // Fetch system users
      setSystemUsers(Array.isArray(users) ? users : []); // Update users state
    } catch (error) { // Catch error block
      console.error("Sistem kullanıcıları çekilemedi:", error); // Log fetch error
    }
  };

  const closeAddDialog = () => { // Close invite dialog
    setIsAddDialogOpen(false); // Toggle dialog visibility
    setFormData({ name: "", role: "", email: "" });  // Reset form inputs
  };

  const closeEditDialog = () => { // Close edit dialog
    setIsEditDialogOpen(false); // Toggle dialog visibility
    setEditingMember(null); // Clear target member
    setFormData({ name: "", role: "", email: "" });  // Reset form inputs
  };

  const handleSendInvite = async () => { // Execute invite sending
    if (formData.email) { // Validate email input
      const isAlreadyMember = members.some(m => m.email === formData.email); // Check existing member
      const isAlreadyInvited = sentInvites.some(inv => inv.receiver_email === formData.email); // Check existing invite

      if (isAlreadyMember) { // Handle existing member
        alert("Bu kullanıcı zaten takımınızda ekli!"); // Notify duplicate error
        return; // Exit execution
      }
      if (isAlreadyInvited) { // Handle existing invite
        alert("Bu kullanıcıya zaten bekleyen bir davetiye gönderilmiş!"); // Notify duplicate invite
        return; // Exit execution
      }

      setIsSendingInvite(true); // Enable loading state
      try { // Start try block
        await sendInvitation({ // Post invite request
          receiver_email: formData.email, // Set target email
          invitation_type: "team" // Set invite type
        });
        alert("Davetiye başarıyla gönderildi! Kullanıcı kabul ettiğinde takımınızda görünecektir."); // Notify success
        closeAddDialog();  // Close modal dialog
        await loadPageData(); // Refresh page data
      } catch (err) { // Catch error block
        const detail = err.response?.data?.detail; // Extract error detail
        const errorMsg = typeof detail === 'string' ? detail : "Davetiye gönderilirken format hatası oluştu."; // Determine error message
        alert(errorMsg); // Show error alert
      } finally { // Execute finally block
        setIsSendingInvite(false); // Disable loading state
      }
    }
  };

  const handleEditMember = async () => { // Execute role update
    if (editingMember && formData.role) { // Validate required data
      try { // Start try block
        await updateMemberInDb(editingMember.id, { // Post update request
          name: formData.name, // Set updated name
          role: formData.role, // Set updated role
          email: formData.email // Set updated email
        });
        await loadPageData(); // Refresh page data
        closeEditDialog();  // Close modal dialog
      } catch (err) { // Catch error block
        alert("Güncelleme başarısız oldu."); // Notify update error
      }
    }
  };

  const handleDeleteMember = async (id) => { // Execute member deletion
    try { // Start try block
      await deleteMemberFromDb(id); // Post delete request
      setMembers(members.filter(m => m.id !== id)); // Update local state
      setActiveDropdownId(null); // Close active dropdown
    } catch (err) { // Catch error block
      console.error("Silme hatası:", err); // Log delete error
    }
  };

  const openEditDialog = (member) => { // Open edit dialog
    setEditingMember(member); // Set target member
    setFormData({ name: member.name, role: member.role, email: member.email }); // Populate form inputs
    setIsEditDialogOpen(true); // Toggle dialog visibility
    setActiveDropdownId(null); // Close active dropdown
  };

  return ( // Return JSX tree
    <div className="space-y-6 text-left pb-20"> {/* Main wrapper container */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4"> {/* Header flex container */}
        <div> {/* Title block wrapper */}
          <h2 className="text-2xl font-semibold text-zinc-900">Takım Üyeleri</h2> {/* Main page title */}
          <p className="text-zinc-600 mt-1">Sistemdeki kayıtlı kullanıcıları takımınıza davet edin ve iletişime geçin.</p> {/* Subtitle description */}
        </div>
        
        <div className="flex items-center gap-3"> {/* Action buttons container */}
          <button  // Invite button trigger
            onClick={openAddDialog} // Bind click handler
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm" // Apply styling classes
          >
            <Database className="w-4 h-4" /> {/* Render icon */}
            <span className="text-sm font-medium">Veritabanından Davet Et</span> {/* Render button text */}
          </button>
        </div>
      </div>

      {pendingInvites.length > 0 && ( // Conditionally render received
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 shadow-sm animate-in fade-in duration-300"> {/* Notice container */}
          <h3 className="text-sm font-bold text-blue-800 flex items-center gap-2 mb-4"> {/* Notice header */}
            <Bell className="w-4 h-4" /> Bekleyen Takım Davetleriniz Var ({pendingInvites.length}) {/* Render header text */}
          </h3>
          <div className="space-y-3"> {/* Invites list wrapper */}
            {pendingInvites.map(inv => ( // Map received invites
              <div key={inv.id} className="flex flex-col md:flex-row md:items-center justify-between bg-white p-4 rounded-lg border border-blue-100 shadow-sm"> {/* Invite item row */}
                <div className="text-sm text-zinc-700"> {/* Sender info wrapper */}
                  <span className="font-bold text-zinc-900">{inv.sender_name}</span> ({inv.sender_email}) sizi çalışma takımına davet ediyor. {/* Render sender text */}
                </div>
                <div className="flex items-center gap-2 mt-3 md:mt-0"> {/* Actions button wrapper */}
                  <button  // Reject button
                    onClick={() => handleRespondToInvite(inv.id, "rejected")}  // Bind reject handler
                    className="px-4 py-2 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-md transition-colors" // Apply styling classes
                  >
                    Reddet {/* Render reject text */}
                  </button>
                  <button  // Accept button
                    onClick={() => handleRespondToInvite(inv.id, "accepted")}  // Bind accept handler
                    className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors shadow-sm" // Apply styling classes
                  >
                    <Check className="w-4 h-4" /> Kabul Et {/* Render accept text */}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {sentInvites.length > 0 && ( // Conditionally render sent
        <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-5 shadow-sm animate-in fade-in duration-300"> {/* Notice container */}
          <h3 className="text-sm font-bold text-zinc-700 flex items-center gap-2 mb-4"> {/* Notice header */}
            <Clock className="w-4 h-4" /> Gönderilmiş Bekleyen Davetleriniz ({sentInvites.length}) {/* Render header text */}
          </h3>
          <div className="space-y-3"> {/* Invites list wrapper */}
            {sentInvites.map(inv => ( // Map sent invites
              <div key={inv.id} className="flex flex-col md:flex-row md:items-center justify-between bg-white p-4 rounded-lg border border-zinc-200 shadow-sm"> {/* Invite item row */}
                <div className="text-sm text-zinc-600"> {/* Receiver info wrapper */}
                  <span className="font-bold text-zinc-900">{inv.receiver_name}</span> ({inv.receiver_email}) kullanıcısına davet gönderdiniz. Yanıt bekleniyor... {/* Render receiver text */}
                </div>
                <div className="flex items-center gap-2 mt-3 md:mt-0"> {/* Actions button wrapper */}
                  <button  // Revoke button
                    onClick={() => handleRevokeInvite(inv.id)}  // Bind revoke handler
                    className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-orange-600 bg-orange-50 hover:bg-orange-100 rounded-md transition-colors" // Apply styling classes
                  >
                    <XCircle className="w-4 h-4" /> Daveti İptal Et / Geri Çek {/* Render revoke text */}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-zinc-200 overflow-visible min-h-[300px] shadow-sm"> {/* Table parent wrapper */}
        <div className="w-full overflow-visible"> {/* Responsive scroll wrapper */}
          <table className="min-w-full text-left border-collapse"> {/* Members data table */}
            <thead className="bg-zinc-50/80 border-b border-zinc-200"> {/* Table header row */}
              <tr> {/* Header cells row */}
                <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider w-1/3">Üye</th> {/* Name column header */}
                <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider w-1/4">Rol</th> {/* Role column header */}
                <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider w-1/4">E-Posta</th> {/* Email column header */}
                <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider text-right w-auto">İşlemler</th> {/* Actions column header */}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100"> {/* Table body rows */}
              {isLoading ? ( // Render loading state
                <tr> {/* Loading row wrapper */}
                  <td colSpan="4" className="px-6 py-12 text-center text-zinc-500"> {/* Centered content cell */}
                    <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-500 mb-3" /> {/* Loading spinner icon */}
                    <p className="font-medium">Üyeler yükleniyor...</p> {/* Loading text label */}
                  </td>
                </tr>
              ) : members.length === 0 ? ( // Render empty state
                <tr> {/* Empty row wrapper */}
                  <td colSpan="4" className="px-6 py-12 text-center text-zinc-500"> {/* Centered content cell */}
                    <div className="w-16 h-16 bg-zinc-50 border-2 border-dashed border-zinc-200 rounded-2xl flex items-center justify-center mx-auto mb-4"> {/* Icon container block */}
                      <UserPlus className="w-8 h-8 text-zinc-300" /> {/* Empty state icon */}
                    </div>
                    <p className="font-medium text-zinc-900 mb-1">Hiç takım üyesi bulunamadı</p> {/* Empty state title */}
                    <p className="text-sm">Başlamak için sağ üstten takım arkadaşlarınızı davet edin.</p> {/* Empty state subtitle */}
                  </td>
                </tr>
              ) : ( // Render members loop
                members.map((member) => ( // Map members array
                  <tr key={member.id} className="hover:bg-zinc-50 transition-colors"> {/* Data row wrapper */}
                    <td className="px-6 py-4"> {/* Member name cell */}
                      <div className="flex items-center gap-3"> {/* Flex layout wrapper */}
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-sm shrink-0"> {/* Avatar circle block */}
                          <span className="text-sm font-bold text-white">{member.avatar}</span> {/* Render avatar initial */}
                        </div>
                        <span className="font-semibold text-zinc-900">{member.name}</span> {/* Render full name */}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-zinc-600 font-medium">{member.role}</td> {/* Render member role */}
                    <td className="px-6 py-4"> {/* Member email cell */}
                      <div className="flex items-center gap-2 text-sm text-zinc-500"> {/* Flex layout wrapper */}
                        <Mail className="w-4 h-4 text-zinc-400 shrink-0" /> {/* Email icon graphic */}
                        {member.email} {/* Render email address */}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right"> {/* Actions trigger cell */}
                      <div className="flex items-center justify-end gap-2"> {/* Right aligned wrapper */}
                        {member.connected_user_id && ( // Check chat availability
                          <button  // Chat launch button
                            onClick={() => setActiveChatMember(member)} // Bind chat handler
                            className="p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors flex items-center gap-1.5 focus:outline-none" // Apply styling classes
                            title="Mesaj Gönder" // Hover tooltip text
                          >
                            <MessageSquare className="w-4 h-4" /> {/* Chat icon graphic */}
                            <span className="text-xs font-bold">Mesaj</span> {/* Chat button label */}
                          </button>
                        )}

                        <div className="relative"> {/* Dropdown root container */}
                          <button  // Dropdown toggle button
                            onClick={() => setActiveDropdownId(activeDropdownId === member.id ? null : member.id)} // Bind toggle handler
                            className="p-2 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-lg transition-colors focus:outline-none" // Apply styling classes
                          >
                            <MoreVertical className="w-5 h-5" /> {/* Vertical dots icon */}
                          </button>
                          
                          {activeDropdownId === member.id && ( // Conditionally render dropdown
                            <div className="absolute right-0 top-12 w-48 bg-white border border-zinc-200 rounded-xl shadow-2xl py-1.5 z-[100] animate-in fade-in zoom-in-95 duration-100 text-left"> {/* Dropdown menu wrapper */}
                              <button  // Edit role button
                                onClick={() => openEditDialog(member)} // Bind edit handler
                                className="w-full flex items-center px-4 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors" // Apply styling classes
                              >
                                <Pencil className="w-4 h-4 mr-2.5 text-zinc-400" /> {/* Pencil icon graphic */}
                                Rolü Düzenle {/* Render edit label */}
                              </button>
                              <div className="h-px bg-zinc-100 my-1"></div> {/* Horizontal divider line */}
                              <button  // Remove member button
                                onClick={() => handleDeleteMember(member.id)} // Bind delete handler
                                className="w-full flex items-center px-4 py-2.5 text-sm font-bold text-red-600 hover:bg-red-50 transition-colors" // Apply styling classes
                              >
                                <Trash2 className="w-4 h-4 mr-2.5" /> {/* Trash icon graphic */}
                                Üyeyi Çıkar {/* Render remove label */}
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {activeChatMember && currentUser && ( // Conditionally render chat
        <ChatWindow  // Inject chat component
          currentUser={currentUser}  // Pass active user
          chatMember={activeChatMember}  // Pass target member
          onClose={() => setActiveChatMember(null)}  // Pass close handler
        />
      )}

      {isAddDialogOpen && (  // Conditionally render add modal
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 text-left text-zinc-900"> {/* Overlay wrapper block */}
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col animate-in zoom-in-95 duration-200"> {/* Modal content container */}
            <div className="px-6 py-5 border-b border-zinc-100 flex justify-between items-center bg-zinc-50/50"> {/* Modal header bar */}
              <div> {/* Modal titles wrapper */}
                <h3 className="text-lg font-bold">Kullanıcıyı Davet Et</h3> {/* Modal primary title */}
                <p className="text-sm text-zinc-500 mt-1">Uygulamaya kayıtlı kullanıcılara takım daveti gönderin.</p> {/* Modal subtitle text */}
              </div>
              <button onClick={closeAddDialog} className="p-2 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-200 rounded-full transition-colors"> {/* Close button trigger */}
                <X className="w-5 h-5" /> {/* X icon graphic */}
              </button>
            </div>

            <div className="p-6 space-y-4"> {/* Modal body container */}
              <div className="space-y-2"> {/* Input field wrapper */}
                <label className="text-sm font-bold text-zinc-700">Kullanıcı Seçin <span className="text-red-500">*</span></label> {/* Dropdown field label */}
                
                <select // User select dropdown
                  value={formData.email} // Bind form email
                  onChange={(e) => { // Handle change event
                    const selectedUser = systemUsers.find(u => u.email === e.target.value); // Find selected user
                    if (selectedUser) { // If user found
                      setFormData({  // Update form state
                        ...formData,  // Preserve state
                        name: `${selectedUser.name} ${selectedUser.surname || ""}`.trim(),  // Build full name
                        email: selectedUser.email  // Assign email value
                      });
                    }
                  }}
                  className="w-full px-4 py-2.5 border border-zinc-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-600 bg-zinc-50 focus:bg-white transition-all" // Apply styling classes
                >
                  <option value="" disabled>Arama yapmak için tıklayın...</option> {/* Placeholder default option */}
                  {systemUsers.map((user) => { // Iterate system users
                    const isAlreadyMember = members.some(m => m.email === user.email); // Check existing member
                    const isAlreadyInvited = sentInvites.some(inv => inv.receiver_email === user.email); // Check existing invite
                    const isMe = currentUser && currentUser.email === user.email; // Check self user
                    
                    const isDisabled = isAlreadyMember || isAlreadyInvited || isMe; // Determine disabled state
                    const statusText = isMe ? " (Sen)" : isAlreadyMember ? " (Zaten Ekli)" : isAlreadyInvited ? " (Davet Bekliyor)" : ""; // Build status text

                    return ( // Return option element
                      <option key={user.id} value={user.email} disabled={isDisabled}> {/* Render dropdown option */}
                        {user.name} {user.surname || ""} ({user.email}){statusText} {/* Render option content */}
                      </option>
                    )
                  })}
                </select>
                {systemUsers.length === 0 && ( // Conditionally render fallback
                  <p className="text-xs text-orange-500 mt-1">Sistemde sizden başka kayıtlı kullanıcı bulunmuyor.</p> // Render fallback message
                )}
              </div>
            </div>

            <div className="px-6 py-4 bg-zinc-50 border-t border-zinc-100 flex justify-end gap-3"> {/* Modal footer bar */}
              <button onClick={closeAddDialog} className="px-5 py-2.5 font-medium border border-zinc-200 rounded-xl bg-white hover:bg-zinc-100 transition-colors">İptal</button> {/* Cancel button trigger */}
              <button  // Submit button trigger
                onClick={handleSendInvite}  // Bind submit handler
                disabled={!formData.email || isSendingInvite} // Manage disabled state
                className="flex items-center gap-2 px-5 py-2.5 font-bold bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 shadow-sm transition-colors" // Apply styling classes
              >
                {isSendingInvite ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} {/* Toggle button icon */}
                Davetiye Gönder {/* Render button text */}
              </button>
            </div>
          </div>
        </div>
      )}

      {isEditDialogOpen && ( // Conditionally render edit modal
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 text-left text-zinc-900"> {/* Overlay wrapper block */}
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col animate-in zoom-in-95 duration-200"> {/* Modal content container */}
            <div className="px-6 py-5 border-b border-zinc-100 flex justify-between items-center bg-zinc-50/50"> {/* Modal header bar */}
              <h3 className="text-lg font-bold">Rolü Düzenle</h3> {/* Modal primary title */}
              <button onClick={closeEditDialog} className="p-2 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-200 rounded-full transition-colors"> {/* Close button trigger */}
                <X className="w-5 h-5" /> {/* X icon graphic */}
              </button>
            </div>
            
            <div className="p-6 space-y-4"> {/* Modal body container */}
              <div className="space-y-2"> {/* Input field wrapper */}
                <label className="text-sm font-bold text-zinc-500 uppercase">Kullanıcı</label> {/* Input field label */}
                <input  // Readonly input field
                  className="w-full px-4 py-2.5 border border-zinc-200 rounded-xl bg-zinc-100 text-zinc-500 cursor-not-allowed outline-none" // Apply styling classes
                  value={`${formData.name} (${formData.email})`} // Display user identity
                  disabled // Disable input interaction
                />
                <p className="text-xs text-zinc-400">Kullanıcının adı ve e-postası değiştirilemez.</p> {/* Input hint description */}
              </div>

              <div className="space-y-2"> {/* Dropdown field wrapper */}
                <label className="text-sm font-bold text-zinc-700">Yeni Rol</label> {/* Dropdown field label */}
                <select  // Role select dropdown
                  className="w-full px-4 py-2.5 border border-zinc-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-600 bg-white transition-all" // Apply styling classes
                  value={formData.role} // Bind form role
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })} // Handle change event
                >
                  {roles.map(role => <option key={role} value={role}>{role}</option>)} {/* Render role options */}
                </select>
              </div>
            </div>

            <div className="px-6 py-4 bg-zinc-50 border-t flex justify-end gap-3"> {/* Modal footer bar */}
              <button onClick={closeEditDialog} className="px-5 py-2.5 font-medium border border-zinc-200 rounded-xl bg-white hover:bg-zinc-100 transition-colors">İptal</button> {/* Cancel button trigger */}
              <button  // Save button trigger
                onClick={handleEditMember}  // Bind save handler
                disabled={!formData.role} // Manage disabled state
                className="px-5 py-2.5 font-bold bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 shadow-sm transition-colors" // Apply styling classes
              >
                Rolü Kaydet {/* Render button text */}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}