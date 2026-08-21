import { Plus, Calendar, Users, Zap, CheckCircle2, Circle, Clock, Activity, Trash2, X, FileText, Search, UserPlus, Download, User, Database, Bell, Check, Eye, Loader2, Copy, GitBranch, ExternalLink, Code2, MessageSquare } from "lucide-react"; // Import UI icons
import { useState, useEffect } from "react"; // Import React hooks

import { 
  getProjects, 
  createProject, 
  getProjectTasks, 
  addTaskToProject, 
  updateTaskStatus, 
  deleteTaskFromProject,
  updateProjectData,
  getProjectFiles, 
  getRecentActivities,
  getMembers, 
  getSystemUsers,
  getAllSystemFiles, 
  sendInvitation,
  linkSystemFileToProject,
  getPendingInvitations, 
  respondToInvitation,
  getFileContent,
  downloadFile,
  exportToPersonalFiles,
  getProjectRepositories,
  getRepositories, 
  linkSystemRepoToProject,
  exportRepoToPersonal,
  getCurrentUser,
  getSentInvitations,
  revokeInvitation

} from '../services/apiService'; // Import API services

import { Documantasyon_page } from "./Documantasyon_page.jsx"; // Import documentation component
import { ChatWindow } from "./ChatWindow.jsx"; // Import chat component

export function Projects({ onNavigate, setTargetRepo }) { // Main projects component
  const [projects, setProjects] = useState([]); // Projects list state
  const [selectedProject, setSelectedProject] = useState(null); // Active project state
  const [isNewProjectDialogOpen, setIsNewProjectDialogOpen] = useState(false); // New project modal
  const [newTaskTitle, setNewTaskTitle] = useState(""); // New task input
  const [activeTab, setActiveTab] = useState("tasks"); // Active tab state
  
  const [allMembers, setAllMembers] = useState([]); // All members state
  const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false); // Add member modal

  const [systemFiles, setSystemFiles] = useState([]); // System files state
  const [isSystemFileModalOpen, setIsSystemFileModalOpen] = useState(false); // System file modal

  const [systemRepos, setSystemRepos] = useState([]); // System repos state
  const [isSystemRepoModalOpen, setIsSystemRepoModalOpen] = useState(false); // System repo modal

  const [invitations, setInvitations] = useState([]); // Pending invites state
  
  const [sentInvites, setSentInvites] = useState([]); // Sent invites state

  const [previewFile, setPreviewFile] = useState(null); // Preview file target
  const [previewContent, setPreviewContent] = useState(""); // Preview content data
  const [isPreviewLoading, setIsPreviewLoading] = useState(false); // Preview loading state

  const [isMessageModalOpen, setIsMessageModalOpen] = useState(false); // Message modal state
  const [messageReceiver, setMessageReceiver] = useState(""); // Message target state
  const [messageText, setMessageText] = useState(""); // Message content state
  const [currentUser, setCurrentUser] = useState(null); // Active user state
  const [activeChatMember, setActiveChatMember] = useState(null); // Active chat target

  const [systemUsers, setSystemUsers] = useState([]); // System users state
  const [newProjectForm, setNewProjectForm] = useState({ // Project form state
    name: "",
    description: "",
    dueDate: "",
    status: "Planlama"
  }); 

  const projectColors = [ // Defined project colors
    "bg-blue-500", "bg-purple-500", "bg-green-500", "bg-orange-500", 
    "bg-pink-500", "bg-teal-500", "bg-indigo-500", "bg-red-500", 
    "bg-cyan-500", "bg-amber-500"
  ];

  useEffect(() => { // Mount effect hook
    loadProjects(); // Fetch initial projects
    loadInvitations(); // Fetch pending invitations
    loadInitialData(); // Fetch initial data
  }, []); // Dependency array trigger

  const loadInitialData = async () => { // Fetch core data
    try { // Start try block
      const user = await getCurrentUser(); // Get active user
      setCurrentUser(user); // Set active user

      const users = await getSystemUsers(); // Get system users
      setSystemUsers(Array.isArray(users) ? users : []); // Set users array

      const myMembers = await getMembers(); // Get team members
      setAllMembers(Array.isArray(myMembers) ? myMembers : []); // Set members array
    } catch (err) { // Catch fetch error
      console.error("Veriler yüklenemedi:", err); // Log fetch error
    }
  };

  const loadProjects = async () => { // Fetch all projects
    try { // Start try block
      const data = await getProjects(); // Call projects API
      const validData = Array.isArray(data) ? data : []; // Validate projects array
      
      const enrichedData = validData.map((p, i) => ({ // Map project data
        ...p, // Spread existing data
        color: projectColors[i % projectColors.length], // Assign project color
        teamMembers: p.teamMembers || [], // Ensure team members
        activities: p.activities || [] // Ensure activities array
      }));
      setProjects(enrichedData); // Update projects state
    } catch (err) { // Catch fetch error
      console.error("Projeler yüklenemedi:", err); // Log fetch error
      setProjects([]); // Reset projects state
    }
  };

  const loadInvitations = async () => { // Fetch pending invites
    try { // Start try block
      const data = await getPendingInvitations(); // Call invites API
      setInvitations(Array.isArray(data) ? data : []); // Set invites array
    } catch (err) { // Catch fetch error
      console.error("Davetiyeler yüklenemedi:", err); // Log fetch error
    }
  };

  const handleRespondInvitation = async (invId, status) => { // Handle invite response
    try { // Start try block
      await respondToInvitation(invId, status); // Post invite response
      await loadInvitations(); // Refresh invitations list
      if (status === 'accepted') { // Check acceptance status
        await loadProjects(); // Refresh projects list
      }
    } catch (err) { // Catch response error
      alert("Davetiye yanıtlanırken hata oluştu."); // Notify user error
    }
  };

  const calculateProgress = (tasks) => { // Calculate project progress
    if (!tasks || tasks.length === 0) return { progress: 0, status: "Planlama" }; // Handle empty tasks
    
    const completed = tasks.filter(t => t.is_completed).length; // Count completed tasks
    const progress = Math.round((completed / tasks.length) * 100); // Calculate percentage
    
    let status = "Planlama"; // Default project status
    if (progress === 100) { // Check full completion
      status = "Tamamlandı"; // Set completed status
    } else if (progress > 0) { // Check partial completion
      status = "Devam Ediyor"; // Set active status
    }
    return { progress, status }; // Return calculated metrics
  };

  const handleCreateProject = async () => { // Handle project creation
    if (newProjectForm.name.trim() !== "") { // Validate project name
      try { // Start try block
        const projectData = { // Build project payload
          name: newProjectForm.name, // Set project name
          description: newProjectForm.description || "Açıklama yok", // Set project description
          status: newProjectForm.status, // Set project status
          progress: 0, // Init zero progress
          due_date: newProjectForm.dueDate || null // Set due date
        };

        await createProject(projectData); // Post project payload
        await loadProjects(); // Refresh projects list

        setNewProjectForm({ name: "", description: "", dueDate: "", status: "Planlama" }); // Reset form inputs
        setIsNewProjectDialogOpen(false); // Close creation modal
      } catch(err) { // Catch creation error
        alert("Proje oluşturulamadı."); // Notify creation error
      }
    } else { // Handle validation failure
      alert("Proje adı zorunludur!"); // Notify validation error
    }
  };

  const handleOpenProject = async (project) => { // Open project details
    setSelectedProject(project); // Set active project
    setActiveTab("tasks"); // Reset active tab
    try { // Start try block
      const tasks = await getProjectTasks(project.id); // Fetch project tasks
      const files = await getProjectFiles(project.id); // Fetch project files
      
      let repos = []; // Init repos array
      try { // Inner try block
        repos = await getProjectRepositories(project.id); // Fetch project repos
      } catch (e) { // Catch inner block
        console.warn("Proje repoları henüz Backend'de hazır değil."); // Log missing endpoint
      }

      const allActivities = await getRecentActivities(); // Fetch all activities
      const projectActivities = allActivities.filter(a => a.project_id === project.id); // Filter project activities

      const updatedProject = { // Build updated project
        ...project, // Spread existing data
        tasks, // Assign fetched tasks
        files: Array.isArray(files) ? files : [], // Assign valid files
        repositories: Array.isArray(repos) ? repos : [], // Assign valid repos
        activities: projectActivities, // Assign filtered activities
        progress: calculateProgress(tasks).progress // Calculate new progress
      };
      setSelectedProject(updatedProject); // Update active project
      setProjects(prev => prev.map(p => p.id === project.id ? updatedProject : p)); // Update local list
    } catch (err) { // Catch fetch error
      console.error("Proje detayları çekilemedi:", err); // Log fetch error
    }
  };

  const refreshActivities = async (projectId) => { // Refresh project activities
    try { // Start try block
      const allActivities = await getRecentActivities(); // Fetch all activities
      const projectActivities = allActivities.filter(a => a.project_id === projectId); // Filter project activities
      
      setSelectedProject(prev => prev ? { ...prev, activities: projectActivities } : prev); // Update active project
      setProjects(prev => prev.map(p => p.id === projectId ? { ...p, activities: projectActivities } : p)); // Update local list
    } catch (err) { // Catch fetch error
      console.error("Aktiviteler anlık güncellenemedi:", err); // Log fetch error
    }
  };

  const toggleTaskCompletion = async (projectId, taskId, currentIsCompleted) => { // Toggle task completion
    try { // Start try block
      await updateTaskStatus(taskId, !currentIsCompleted); // Post status update
      const updatedTasks = await getProjectTasks(projectId); // Fetch updated tasks
      
      const { progress: newProgress, status: newStatus } = calculateProgress(updatedTasks); // Recalculate metrics
      
      const projToUpdate = projects.find(p => p.id === projectId); // Find target project
      await updateProjectData(projectId, { // Post metrics update
        name: projToUpdate.name, // Send existing name
        progress: newProgress, // Send new progress
        status: newStatus // Send new status
      });

      setProjects(prev => prev.map(p => { // Update local list
        if (Number(p.id) === Number(projectId)) { // Match target project
          const updated = { ...p, tasks: updatedTasks, progress: newProgress, status: newStatus }; // Build updated object
          if (selectedProject?.id === p.id) setSelectedProject(updated); // Sync active project
          return updated; // Return updated object
        }
        return p; // Return unchanged object
      }));

      await refreshActivities(projectId); // Trigger activity refresh
    } catch (err) { // Catch update error
      console.error("Görev güncellenemedi:", err); // Log update error
    }
  };

  const addTask = async (projectId) => { // Handle task creation
    if (!newTaskTitle.trim()) return; // Validate task title
    try { // Start try block
      await addTaskToProject(projectId, { title: newTaskTitle, is_completed: false }); // Post task data
      const updatedTasks = await getProjectTasks(projectId); // Fetch updated tasks
      
      const { progress: newProgress, status: newStatus } = calculateProgress(updatedTasks); // Recalculate metrics
      
      const projToUpdate = projects.find(p => p.id === projectId); // Find target project
      await updateProjectData(projectId, { // Post metrics update
        name: projToUpdate.name, // Send existing name
        progress: newProgress, // Send new progress
        status: newStatus // Send new status
      });

      setProjects(prev => prev.map(p => { // Update local list
        if (Number(p.id) === Number(projectId)) { // Match target project
          const updated = { ...p, tasks: updatedTasks, progress: newProgress, status: newStatus }; // Build updated object
          if (selectedProject?.id === p.id) setSelectedProject(updated); // Sync active project
          return updated; // Return updated object
        }
        return p; // Return unchanged object
      }));
      setNewTaskTitle(""); // Reset task input

      await refreshActivities(projectId); // Trigger activity refresh
    } catch (err) { // Catch creation error
      console.error("Görev eklenemedi:", err); // Log creation error
    }
  };

  const deleteTask = async (projectId, taskId) => { // Handle task deletion
    try { // Start try block
      await deleteTaskFromProject(taskId); // Post delete request
      const updatedTasks = await getProjectTasks(projectId); // Fetch updated tasks
      const { progress: newProgress, status: newStatus } = calculateProgress(updatedTasks); // Recalculate metrics
      
      const projToUpdate = projects.find(p => p.id === projectId); // Find target project
      await updateProjectData(projectId, { // Post metrics update
        name: projToUpdate.name, // Send existing name
        progress: newProgress, // Send new progress
        status: newStatus // Send new status
      });

      setProjects(prev => prev.map(p => { // Update local list
        if (Number(p.id) === Number(projectId)) { // Match target project
          const updated = { ...p, tasks: updatedTasks, progress: newProgress, status: newStatus }; // Build updated object
          if (selectedProject?.id === p.id) setSelectedProject(updated); // Sync active project
          return updated; // Return updated object
        }
        return p; // Return unchanged object
      }));

      await refreshActivities(projectId); // Trigger activity refresh
    } catch (err) { // Catch deletion error
      console.error("Görev silinemedi:", err); // Log deletion error
    }
  };

  const handleOpenSystemFiles = async () => { // Open system files
    try { // Start try block
      const files = await getAllSystemFiles(); // Fetch system files
      setSystemFiles(Array.isArray(files) ? files : []); // Update files array
      setIsSystemFileModalOpen(true); // Show files modal
    } catch (err) { // Catch fetch error
      console.error("Sistem dosyaları çekilemedi", err); // Log fetch error
      alert("Şahsi dosyalarınız yüklenirken hata oluştu."); // Notify fetch error
    }
  };

  const handleLinkSystemFileToProject = async (file) => { // Link file to project
    try { // Start try block
      await linkSystemFileToProject(selectedProject.id, file.id); // Post link request
      const updatedFiles = await getProjectFiles(selectedProject.id); // Fetch updated files
      
      const updatedProject = { ...selectedProject, files: updatedFiles }; // Build updated project
      setSelectedProject(updatedProject); // Update active project
      setProjects(prev => prev.map(p => p.id === selectedProject.id ? updatedProject : p)); // Update local list
      
      setIsSystemFileModalOpen(false); // Close files modal
      alert("Dosya başarıyla projeye eklendi!"); // Notify success

      await refreshActivities(selectedProject.id); // Trigger activity refresh
    } catch (err) { // Catch link error
      console.error("Dosya projeye aktarılamadı:", err); // Log link error
      alert("Dosya aktarılırken bir hata oluştu. Projeye yetkiniz olmayabilir."); // Notify link error
    }
  };

  const handleOpenAddMemberModal = async () => { // Open member modal
    await loadInitialData(); // Refresh core data
    setIsAddMemberModalOpen(true); // Show member modal
  };

  const handleAssignMemberToProject = async (member) => { // Send project invitation
    try { // Start try block
      await sendInvitation({ // Post invite request
        receiver_email: member.email, // Set receiver email
        invitation_type: "project", // Set invite type
        project_id: selectedProject.id // Set project ID
      });
      setSentInvites(prev => [...prev, member.id]); // Update local tracking
      alert(`${member.name} kullanıcısına proje davetiyesi gönderildi!`); // Notify success
    } catch (err) { // Catch invite error
      alert("Davetiye gönderilirken hata oluştu."); // Notify invite error
    }
  };

  const handleRevokeInvitation = async (member) => { // Revoke sent invitation
    try { // Start try block
      const sentInvitationsData = await getSentInvitations(); // Fetch sent invites
      
      const targetInvite = sentInvitationsData.find( // Match target invite
        inv => inv.receiver_email === member.email && 
               inv.project_name === selectedProject.name && 
               inv.type === "project"
      );

      if (!targetInvite) { // Validate target invite
        alert("Geri çekilecek bekleyen bir davetiye bulunamadı."); // Notify missing invite
        setSentInvites(prev => prev.filter(id => id !== member.id)); // Clear local tracking
        return; // Exit execution
      }

      await revokeInvitation(targetInvite.id); // Post revocation request

      setSentInvites(prev => prev.filter(id => id !== member.id)); // Clear local tracking
      alert(`${member.name} kullanıcısına gönderilen davetiye başarıyla geri çekildi.`); // Notify success
      
    } catch (err) { // Catch revocation error
      console.error("Geri çekme hatası:", err); // Log revocation error
      alert("Davetiye geri çekilirken hata oluştu."); // Notify generic error
    }
  };
  const handleOpenMessageModal = (userName) => { // Open message modal
    setMessageReceiver(userName); // Set message target
    setMessageText(""); // Reset message input
    setIsMessageModalOpen(true); // Show message modal
  };

  const handleSendMessage = () => { // Send chat message
    if (!messageText.trim()) return; // Validate message text
    alert(`${messageReceiver} kullanıcısına mesajınız gönderildi:\n${messageText}`); // Mock sending response
    setIsMessageModalOpen(false); // Close message modal
    setMessageText(""); // Reset message input
  };

  const handlePreviewFile = async (file) => { // Handle file preview
    setPreviewFile(file); // Set preview target
    setIsPreviewLoading(true); // Start loading indicator
    setPreviewContent(""); // Reset preview content
    try { // Start try block
      const data = await getFileContent(file.id); // Fetch file content
      setPreviewContent(data.content); // Update content state
    } catch (err) { // Catch fetch error
      setPreviewContent("⚠️ İçerik yüklenemedi.\nBu dosya metin tabanlı olmayabilir veya sunucuda bulunamadı."); // Set fallback message
    }
    setIsPreviewLoading(false); // Stop loading indicator
  };

  const handleDownloadFile = async (file) => { // Handle file download
    try { // Start try block
      const blob = await downloadFile(file.id); // Fetch download blob
      const url = window.URL.createObjectURL(new Blob([blob])); // Create object URL
      const link = document.createElement('a'); // Create anchor element
      link.href = url; // Assign URL to link
      link.setAttribute('download', file.name); // Set download attribute
      document.body.appendChild(link); // Append link to DOM
      link.click(); // Trigger file download
      link.parentNode.removeChild(link); // Remove link from DOM
    } catch (err) { // Catch download error
      alert("Dosya indirilirken hata oluştu."); // Notify download error
    }
  };

  const handleExportToPersonal = async (file) => { // Export to personal
    try { // Start try block
      await exportToPersonalFiles(file.id, selectedProject.name); // Post export request
      alert("Dosya başarıyla şahsi uygulamaya (My Files) aktarıldı!"); // Notify success
    } catch (err) { // Catch export error
      alert("Dosya aktarılırken hata oluştu."); // Notify export error
    }
  };

  const handleOpenSystemRepos = async () => { // Open repositories modal
    try { // Start try block
      const repos = await getRepositories(); // Fetch personal repositories
      setSystemRepos(Array.isArray(repos) ? repos : []); // Update repos array
      setIsSystemRepoModalOpen(true); // Show repositories modal
    } catch (err) { // Catch fetch error
      console.error("Sistem depoları çekilemedi", err); // Log fetch error
      alert("Şahsi depolarınız yüklenirken hata oluştu."); // Notify fetch error
    }
  };

  const handleLinkSystemRepoToProject = async (repo) => { // Link repo to project
    try { // Start try block
      await linkSystemRepoToProject(selectedProject.id, repo.id); // Post link request
      const updatedRepos = await getProjectRepositories(selectedProject.id); // Fetch updated repos
      
      const updatedProject = { ...selectedProject, repositories: updatedRepos }; // Build updated project
      setSelectedProject(updatedProject); // Sync active project
      setProjects(prev => prev.map(p => p.id === selectedProject.id ? updatedProject : p)); // Sync local list
      
      setIsSystemRepoModalOpen(false); // Close repositories modal
      alert("Kod deposu başarıyla projeye eklendi!"); // Notify success

      await refreshActivities(selectedProject.id); // Trigger activity refresh
    } catch (err) { // Catch link error
      console.error("Repo projeye aktarılamadı:", err); // Log link error
      alert("Depo aktarılırken bir hata oluştu."); // Notify link error
    }
  };

  const handleExportRepoToPersonal = async (repo) => { // Export repo to personal
    try { // Start try block
      await exportRepoToPersonal(repo.id, selectedProject.name); // Post export request
      alert("Kod deposu başarıyla şahsi alanınıza kopyalandı!"); // Notify success
    } catch (err) { // Catch export error
      alert("Depo kopyalanırken hata oluştu."); // Notify export error
    }
  };
  const formatTime = (timestamp) => { // Format timestamp function
    if (!timestamp) return "Az önce"; // Handle empty timestamp
    
    const utcTimeString = timestamp.endsWith('Z') || timestamp.includes('+') 
      ? timestamp 
      : `${timestamp}Z`; // Force UTC suffix
      
    const date = new Date(utcTimeString); // Instantiate Date object
    
    return date.toLocaleTimeString('tr-TR', { // Convert to local time
      hour: '2-digit', 
      minute: '2-digit',
      timeZone: 'Europe/Istanbul' 
    });
  };

  return ( // Render component JSX
    <div className="space-y-6"> {/* Main layout container */}
      
      <div className="flex items-center justify-between"> {/* Header container */}
        <div> {/* Title container */}
          <h2 className="text-2xl font-semibold text-zinc-900">Projeler</h2> {/* Main title */}
          <p className="text-zinc-600 mt-1">Otomasyon projelerinizi yönetin ve takip edin</p> {/* Main subtitle */}
        </div>
        
        <button  // New project button
          onClick={() => setIsNewProjectDialogOpen(true)} // Open creation dialog
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm" // Button styles
        >
          <Plus className="w-4 h-4" /> {/* Plus icon */}
          Yeni Proje {/* Button label */}
        </button>
      </div>

      {invitations.length > 0 && ( // Conditional invites notification
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 shadow-sm animate-in fade-in slide-in-from-top-4 duration-300"> {/* Notification wrapper */}
          <div className="flex items-center gap-2 mb-4"> {/* Notification header */}
            <Bell className="w-5 h-5 text-amber-500" /> {/* Bell icon */}
            <h3 className="font-bold text-amber-900">Bekleyen Davetiyeleriniz Var ({invitations.length})</h3> {/* Notification title */}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"> {/* Grid container */}
            {invitations.map(inv => ( // Iterate over invitations
              <div key={inv.id} className="bg-white border border-amber-100 rounded-lg p-4 flex flex-col justify-between shadow-sm"> {/* Invitation card */}
                <p className="text-sm text-zinc-700 mb-4"> {/* Invitation text */}
                  <span className="font-bold text-zinc-900">{inv.sender_name}</span> sizi 
                  <span className="font-bold text-blue-600"> {inv.project_name} </span> 
                  projesine davet ediyor. {/* Invite content */}
                </p>
                <div className="flex items-center gap-2 mt-auto"> {/* Action buttons container */}
                  <button  // Accept invite button
                    onClick={() => handleRespondInvitation(inv.id, 'accepted')} // Accept handler
                    className="flex-1 flex items-center justify-center gap-1 py-2 bg-green-500 text-white text-xs font-bold rounded-lg hover:bg-green-600 transition-colors" // Button styles
                  >
                    <Check className="w-4 h-4" /> Kabul Et {/* Button label */}
                  </button>
                  <button  // Reject invite button
                    onClick={() => handleRespondInvitation(inv.id, 'rejected')} // Reject handler
                    className="flex-1 flex items-center justify-center gap-1 py-2 bg-zinc-200 text-zinc-700 text-xs font-bold rounded-lg hover:bg-zinc-300 transition-colors" // Button styles
                  >
                    <X className="w-4 h-4" /> Reddet {/* Button label */}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"> {/* Projects grid container */}
        {projects.map((project) => { // Iterate over projects
          const isOpen = project.status !== "Tamamlandı"; // Determine open status
          return ( // Render project card
          <div 
            key={project.id} 
            className="bg-white rounded-xl border border-zinc-200 p-6 hover:shadow-lg transition-shadow cursor-pointer flex flex-col h-full relative overflow-hidden" // Card styles
            onClick={() => handleOpenProject(project)} // Open project handler
          >
            <div className={`absolute top-0 right-0 px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-bl-lg ${isOpen ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}> {/* Status badge */}
              {isOpen ? "Katılıma Açık" : "Katılıma Kapalı"} {/* Badge label */}
            </div>

            <div className="flex items-start justify-between mb-4 mt-2"> {/* Card header */}
              <div className={`w-12 h-12 ${project.color} rounded-lg flex items-center justify-center shadow-inner`}> {/* Project icon container */}
                <Zap className="w-6 h-6 text-white" /> {/* Zap icon */}
              </div>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${ // Project status label
                project.status === "Tamamlandı" ? "bg-green-50 text-green-700 border-green-200" : 
                project.status === "Devam Ediyor" ? "bg-blue-50 text-blue-700 border-blue-200" : "bg-yellow-50 text-yellow-700 border-yellow-200" // Dynamic status styles
              }`}>
                {project.status || "Planlama"} 
              </span>
            </div>
            
            <h3 className="font-semibold text-lg text-zinc-900 mb-2">{project.name}</h3> {/* Project title */}
            <p className="text-sm text-zinc-600 mb-6 flex-1 line-clamp-2">{project.description}</p> {/* Project description */}
            
            <div className="mb-5"> {/* Progress bar container */}
              <div className="flex items-center justify-between text-sm mb-2"> {/* Progress labels */}
                <span className="text-zinc-600 font-medium">İlerleme</span> {/* Progress text */}
                <span className="font-bold text-zinc-900">{project.progress || 0}%</span> {/* Progress value */}
              </div>
              <div className="w-full bg-zinc-100 rounded-full h-2.5 overflow-hidden"> {/* Progress track */}
                <div 
                  className={`${project.color} h-2.5 rounded-full transition-all duration-500 ease-out`} // Progress fill
                  style={{ width: `${project.progress || 0}%` }} // Fill width
                ></div>
              </div>
            </div>
            
            <div className="flex items-center justify-between text-sm text-zinc-500 pt-4 border-t border-zinc-100"> {/* Card footer */}
              <div className="flex items-center gap-1.5"> {/* Members count */}
                <Users className="w-4 h-4" /> {/* Users icon */}
                <span>{project.teamMembers?.length || 0} Üye</span> {/* Count label */}
              </div>
              <div className="flex items-center gap-1.5"> {/* Due date */}
                <Calendar className="w-4 h-4" /> {/* Calendar icon */}
                <span>{project.due_date ? new Date(project.due_date).toLocaleDateString('tr-TR') : "Tarih Yok"}</span> {/* Date label */}
              </div>
            </div>
          </div>
        )})}
      </div>

      {isNewProjectDialogOpen && ( // Conditional project modal
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 text-left"> {/* Modal overlay */}
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col"> {/* Modal container */}
            <div className="px-6 py-5 border-b border-zinc-100 flex justify-between items-center bg-zinc-50/50"> {/* Modal header */}
              <h3 className="text-lg font-bold text-zinc-900">Yeni Proje Oluştur</h3> {/* Modal title */}
              <button onClick={() => setIsNewProjectDialogOpen(false)} className="p-2 hover:bg-zinc-200 rounded-full text-zinc-400 transition-colors"> {/* Close button */}
                <X className="w-5 h-5" /> {/* Close icon */}
              </button>
            </div>

            <div className="p-6 space-y-5"> {/* Modal body */}
              <div className="space-y-2"> {/* Name input */}
                <label className="text-sm font-bold text-zinc-700">Proje Adı <span className="text-red-500">*</span></label> {/* Input label */}
                <input
                  placeholder="Örn: Yeni Otomasyon" // Placeholder text
                  value={newProjectForm.name} // Bind value
                  onChange={(e) => setNewProjectForm({ ...newProjectForm, name: e.target.value })} // Handle change
                  className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-blue-600 transition-all" // Input styles
                />
              </div>

              <div className="space-y-2"> {/* Description input */}
                <label className="text-sm font-bold text-zinc-700">Açıklama</label> {/* Input label */}
                <textarea
                  placeholder="Projenin detayları..." // Placeholder text
                  value={newProjectForm.description} // Bind value
                  onChange={(e) => setNewProjectForm({ ...newProjectForm, description: e.target.value })} // Handle change
                  rows={3} // Textarea rows
                  className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-blue-600 transition-all resize-none" // Input styles
                />
              </div>

              <div className="space-y-2"> {/* Due date input */}
                <label className="text-sm font-bold text-zinc-700">Teslim Tarihi</label> {/* Input label */}
                <input
                  type="date" // Date type
                  value={newProjectForm.dueDate} // Bind value
                  onChange={(e) => setNewProjectForm({ ...newProjectForm, dueDate: e.target.value })} // Handle change
                  className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-blue-600 transition-all" // Input styles
                />
              </div>
            </div>

            <div className="px-6 py-4 bg-zinc-50 border-t border-zinc-100 flex justify-end gap-3 mt-auto"> {/* Modal footer */}
              <button onClick={() => setIsNewProjectDialogOpen(false)} className="px-5 py-2.5 border border-zinc-200 bg-white font-medium text-zinc-700 rounded-xl hover:bg-zinc-100">İptal</button> {/* Cancel button */}
              <button onClick={handleCreateProject} disabled={!newProjectForm.name.trim()} className="px-5 py-2.5 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 disabled:opacity-50 shadow-sm">Projeyi Oluştur</button> {/* Submit button */}
            </div>
          </div>
        </div>
      )}

      {selectedProject && ( // Conditional project details modal
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 text-left"> {/* Modal overlay */}
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[85vh] flex flex-col overflow-hidden"> {/* Modal container */}
            
            <div className="px-8 py-6 border-b border-zinc-100 flex justify-between items-start bg-zinc-50/30"> {/* Modal header */}
              <div className="flex items-center gap-5"> {/* Header content */}
                <div className={`w-14 h-14 ${selectedProject.color} rounded-xl flex items-center justify-center shadow-lg`}> {/* Project icon */}
                  <Zap className="w-7 h-7 text-white" /> {/* Zap icon */}
                </div>
                <div> {/* Project title container */}
                  <div className="flex items-center gap-3"> {/* Title row */}
                    <h3 className="text-2xl font-bold tracking-tight">{selectedProject.name}</h3> {/* Project name */}
                    <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${selectedProject.status !== "Tamamlandı" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}> {/* Status badge */}
                      {selectedProject.status !== "Tamamlandı" ? "Katılıma Açık" : "Kapalı"} {/* Badge label */}
                    </span>
                  </div>
                  <p className="text-sm text-zinc-500 mt-1.5">{selectedProject.description}</p> {/* Project description */}
                </div>
              </div>
              <button onClick={() => setSelectedProject(null)} className="p-2 hover:bg-zinc-200 rounded-full text-zinc-400 transition-colors"> {/* Close button */}
                <X className="w-6 h-6" /> {/* Close icon */}
              </button>
            </div>

            <div className="p-8 overflow-y-auto space-y-6 flex-1 bg-zinc-50/30"> {/* Modal body content */}
              
              <div className="bg-white rounded-xl p-5 border border-zinc-200 shadow-sm"> {/* Progress card */}
                <div className="flex items-center justify-between mb-3"> {/* Progress header */}
                  <span className="text-sm font-bold text-zinc-700 uppercase tracking-wide">Genel İlerleme</span> {/* Progress label */}
                  <span className="text-sm font-black text-blue-600">{selectedProject.progress || 0}%</span> {/* Progress value */}
                </div>
                <div className="w-full bg-zinc-100 rounded-full h-3 overflow-hidden"> {/* Progress track */}
                  <div className={`${selectedProject.color} h-3 rounded-full transition-all duration-500 ease-out`} style={{ width: `${selectedProject.progress || 0}%` }}></div> {/* Progress fill */}
                </div>
              </div>

              <div className="w-full"> {/* Tabbed interface container */}
                <div className="grid grid-cols-5 p-1.5 bg-zinc-100/80 rounded-xl mb-6"> {/* Tabs navigation */}
                  {['tasks', 'team', 'activity', 'files', 'repositories'].map(tab => { // Iterate tabs
                    const labels = { tasks: "Görevler", team: "Takım", activity: "Aktivite", files: "Dosyalar", repositories: "Kod Depoları" }; // Tab labels dictionary
                    return ( // Render tab button
                      <button 
                        key={tab} // React key
                        onClick={() => setActiveTab(tab)} // Select tab handler
                        className={`py-2.5 text-sm font-bold rounded-lg transition-all ${activeTab === tab ? "bg-white text-blue-600 shadow-sm" : "text-zinc-500 hover:text-zinc-700 hover:bg-zinc-200/50"}`} // Active state styling
                      >
                        {labels[tab]} {/* Tab label text */}
                      </button>
                    )
                  })}
                </div>
                
                {activeTab === "tasks" && ( // Conditional tasks tab
                  <div className="space-y-4 animate-in fade-in duration-200"> {/* Tasks container */}
                    <div className="flex items-center justify-between mb-4"> {/* Tasks header */}
                      <h4 className="font-bold text-zinc-900">Proje Görevleri</h4> {/* Tasks title */}
                      <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-bold"> {/* Completion badge */}
                        {selectedProject.tasks?.filter(t => t.is_completed).length || 0} / {selectedProject.tasks?.length || 0} Tamamlandı {/* Completion ratio */}
                      </span>
                    </div>
                    
                    <div className="flex gap-3 mb-6"> {/* Task input container */}
                      <input // Task input field
                        placeholder="Yeni bir görev yazın..." // Placeholder text
                        value={newTaskTitle} // Bind value
                        onChange={(e) => setNewTaskTitle(e.target.value)} // Handle change
                        onKeyDown={(e) => { if (e.key === 'Enter') addTask(selectedProject.id); }} // Handle enter key
                        className="flex-1 px-4 py-3 bg-white border border-zinc-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-600 shadow-sm" // Input styles
                      />
                      <button onClick={() => addTask(selectedProject.id)} className="px-6 py-3 bg-zinc-900 text-white font-medium rounded-xl hover:bg-zinc-800 shadow-sm transition-colors"> {/* Add task button */}
                        Ekle {/* Button text */}
                      </button>
                    </div>

                    {selectedProject.tasks?.length === 0 && <p className="text-center py-8 text-zinc-400 italic">Henüz görev eklenmemiş.</p>} {/* Empty tasks state */}
                    {selectedProject.tasks?.map((task) => ( // Iterate tasks
                      <div key={task.id} className={`flex items-center gap-4 p-4 bg-white border rounded-xl transition-all group ${task.is_completed ? "border-green-200 bg-green-50/30" : "border-zinc-200 hover:border-blue-300"}`}> {/* Task item */}
                        <button onClick={() => toggleTaskCompletion(selectedProject.id, task.id, task.is_completed)} className="flex items-center gap-4 flex-1 text-left focus:outline-none"> {/* Task toggle button */}
                          {task.is_completed ? <CheckCircle2 className="w-6 h-6 text-green-500 shrink-0" /> : <Circle className="w-6 h-6 text-zinc-300 shrink-0 group-hover:text-blue-400 transition-colors" />} {/* Completion icon */}
                          <span className={`font-medium text-sm transition-all ${task.is_completed ? 'text-zinc-400 line-through' : 'text-zinc-700'}`}>{task.title}</span> {/* Task title */}
                        </button>
                        <button onClick={() => deleteTask(selectedProject.id, task.id)} className="opacity-0 group-hover:opacity-100 p-2 text-zinc-400 hover:bg-red-50 hover:text-red-600 rounded-lg transition-all" title="Sil"> {/* Task delete button */}
                          <Trash2 className="w-4 h-4" /> {/* Trash icon */}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                
                {activeTab === "team" && ( // Conditional team tab
                  <div className="space-y-4 animate-in fade-in duration-200"> {/* Team container */}
                    <div className="flex items-center justify-between mb-4"> {/* Team header */}
                      <h4 className="font-bold text-zinc-900">Takım Üyeleri</h4> {/* Team title */}
                      <div className="flex gap-2"> {/* Team actions */}
                        <button 
                          onClick={handleOpenAddMemberModal} // Open invite modal
                          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm" // Button styles
                        >
                          <UserPlus className="w-4 h-4" /> Takım Üyelerinden Davet Et {/* Button text */}
                        </button>
                      </div>
                    </div>
                    
                    {(() => { // Render team members
                      let allProjectUsers = [...(selectedProject.teamMembers || [])]; // Clone members array
                      
                      if (selectedProject.owner_name && !allProjectUsers.includes(selectedProject.owner_name)) { // Check owner name
                        allProjectUsers.unshift(selectedProject.owner_name); // Add owner name
                      } else if (selectedProject.owner && typeof selectedProject.owner === 'string' && !allProjectUsers.includes(selectedProject.owner)) { // Check owner string
                        allProjectUsers.unshift(selectedProject.owner); // Add owner string
                      }

                      return allProjectUsers.length > 0 ? ( // Check members existence
                        allProjectUsers.map((member, idx) => { // Iterate members
                          const cleanMemberName = member.replace(" (Kurucu)", "").trim(); // Remove founder tag

                          const userObj = systemUsers.find(u =>  // Find system user
                            `${u.name} ${u.surname || ""}`.trim().toLowerCase() === cleanMemberName.toLowerCase() || // Match full name
                            u.name.trim().toLowerCase() === cleanMemberName.toLowerCase() // Match first name
                          );

                          return ( // Render member item
                            <div key={idx} className="flex items-center justify-between p-4 bg-white border border-zinc-200 rounded-xl shadow-sm group hover:border-blue-300 transition-colors text-zinc-900"> {/* Member container */}
                              <div className="flex items-center gap-4"> {/* Member info */}
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold"> {/* Avatar circle */}
                                  {cleanMemberName.substring(0,2).toUpperCase()} {/* Avatar initials */}
                                </div>
                                <span className="font-bold">{member}</span> {/* Member name */}
                              </div>
                              
                              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all"> {/* Member actions */}
                                {userObj && ( // Check user existence
                                  <button 
                                    onClick={() => setActiveChatMember({ ...userObj, connected_user_id: userObj.id })} // Open chat window
                                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-bold bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg transition-all" // Button styles
                                    title="Mesaj Yaz" // Hover title
                                  >
                                    <MessageSquare className="w-4 h-4" /> {/* Message icon */}
                                    Konuş {/* Button text */}
                                  </button>
                                )}
                              </div>
                            </div>
                          )
                        })
                      ) : ( // Render empty team state
                        <div className="text-center py-12 bg-white border border-dashed border-zinc-300 rounded-xl text-zinc-900"> {/* Empty container */}
                          <Users className="w-8 h-8 text-zinc-300 mx-auto mb-3" /> {/* Empty icon */}
                          <p className="font-medium text-zinc-500">Bu projeye henüz üye atanmamış.</p> {/* Empty text */}
                        </div>
                      )
                    })()}
                  </div>
                )}
                
                {activeTab === "activity" && ( // Conditional activity tab
                  <div className="space-y-4 animate-in fade-in duration-200"> {/* Activity container */}
                    <h4 className="font-bold text-zinc-900 mb-3">Proje Geçmişi</h4> {/* Activity title */}
                    <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-sm"> {/* Activity list wrapper */}
                      {selectedProject.activities?.length === 0 && <p className="text-zinc-500 text-sm text-center py-4">Henüz aktivite bulunmuyor.</p>} {/* Empty activity state */}
                      <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-zinc-200 before:to-transparent"> {/* Timeline container */}
                        {selectedProject.activities?.map((activity, idx) => ( // Iterate activities
                           <div key={idx} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active"> {/* Timeline item */}
                             <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-blue-100 text-blue-600 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10"> {/* Timeline node */}
                               <Activity className="w-4 h-4" /> {/* Activity icon */}
                             </div>
                             <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-zinc-50 p-4 rounded-xl border border-zinc-100 shadow-sm"> {/* Activity content card */}
                               <div className="flex items-center justify-between mb-1"> {/* Activity card header */}
                                 <div className="font-bold text-zinc-900 text-sm capitalize">{activity.action_type.replace(/_/g, ' ')}</div> {/* Activity type */}
                                 <div className="text-xs text-zinc-400 flex items-center gap-1 font-medium"> {/* Activity timestamp */}
                                   <Clock className="w-3 h-3" /> {/* Clock icon */}
                                   {formatTime(activity.created_at)} {/* Formatted time */}
                                 </div>
                               </div>
                               <div className="text-zinc-600 text-sm">{activity.details || "Detay yok."}</div> {/* Activity details */}
                             </div>
                           </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "files" && ( // Conditional files tab
                  <div className="space-y-4 animate-in fade-in duration-200"> {/* Files container */}
                    <div className="flex items-center justify-between mb-4"> {/* Files header */}
                      <h4 className="font-bold text-zinc-900">Proje Dosyaları</h4> {/* Files title */}
                      
                      <div className="flex gap-2"> {/* Files actions */}
                        <button 
                          onClick={handleOpenSystemFiles} // Open system files
                          className="flex items-center gap-2 px-4 py-2 bg-white border border-zinc-200 text-zinc-700 text-sm font-medium rounded-lg hover:bg-zinc-50 transition-colors shadow-sm" // Button styles
                        >
                          <Database className="w-4 h-4 text-blue-500" /> Sistemden Seç {/* Button text */}
                        </button>
                      </div>

                    </div>
                    <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden shadow-sm"> {/* Files table container */}
                      {selectedProject.files?.length > 0 ? ( // Check files existence
                        <table className="w-full text-left"> {/* Files table */}
                          <thead className="bg-zinc-50 border-b border-zinc-200 text-xs uppercase text-zinc-500 font-bold"> {/* Table header */}
                            <tr> {/* Header row */}
                              <th className="px-6 py-4">Dosya Adı</th> {/* Name header */}
                              <th className="px-6 py-4">Tür</th> {/* Type header */}
                              <th className="px-6 py-4">Boyut</th> {/* Size header */}
                              <th className="px-6 py-4 text-right">İşlem</th> {/* Actions header */}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-zinc-100"> {/* Table body */}
                            {selectedProject.files.map((file, i) => ( // Iterate files
                              <tr key={i} className="hover:bg-zinc-50 transition-colors"> {/* File row */}
                                <td 
                                  className="px-6 py-4 flex items-center gap-3 cursor-pointer group" // Name cell styles
                                  onClick={() => handlePreviewFile(file)} // Preview file handler
                                >
                                  <FileText className="w-5 h-5 text-blue-500 group-hover:text-blue-700" /> {/* File icon */}
                                  <span className="font-medium text-sm text-zinc-900 group-hover:text-blue-600 transition-colors">{file.name}</span> {/* File name */}
                                </td>
                                <td className="px-6 py-4 text-sm text-zinc-500">{file.file_type}</td> {/* File type */}
                                <td className="px-6 py-4 text-sm text-zinc-500">{file.size || "-"}</td> {/* File size */}
                                <td className="px-6 py-4 text-right"> {/* Actions cell */}
                                  <div className="flex items-center justify-end gap-4"> {/* Actions container */}
                                    <button 
                                      onClick={() => handleExportToPersonal(file)} // Export file handler
                                      className="text-zinc-500 hover:text-blue-600 text-sm font-bold flex items-center gap-1 transition-colors" // Export button styles
                                      title="Şahsi Uygulama Dosyalarına Aktar" // Hover title
                                    >
                                      <Copy className="w-4 h-4"/> Aktar {/* Export button text */}
                                    </button>
                                    <button 
                                      onClick={() => handleDownloadFile(file)} // Download file handler
                                      className="text-blue-600 hover:text-blue-800 text-sm font-bold flex items-center gap-1 transition-colors" // Download button styles
                                      title="Bilgisayara İndir" // Hover title
                                    >
                                      <Download className="w-4 h-4"/> İndir {/* Download button text */}
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      ) : ( // Render empty files state
                        <div className="text-center py-12"> {/* Empty state container */}
                          <FileText className="w-10 h-10 text-zinc-300 mx-auto mb-3" /> {/* Empty icon */}
                          <p className="text-zinc-500 font-medium">Bu projeye henüz dosya yüklenmemiş.</p> {/* Empty text */}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {activeTab === "repositories" && ( // Conditional repos tab
                  <div className="space-y-4 animate-in fade-in duration-200"> {/* Repos container */}
                    <div className="flex items-center justify-between mb-4"> {/* Repos header */}
                      <h4 className="font-bold text-zinc-900">Proje Kod Depoları</h4> {/* Repos title */}
                      
                      <div className="flex gap-2"> {/* Repos actions */}
                        <button 
                          onClick={handleOpenSystemRepos} // Open system repos
                          className="flex items-center gap-2 px-4 py-2 bg-white border border-zinc-200 text-zinc-700 text-sm font-medium rounded-lg hover:bg-zinc-50 transition-colors shadow-sm" // Button styles
                        >
                          <Database className="w-4 h-4 text-purple-500" /> Şahsi Repolarımdan Seç {/* Button text */}
                        </button>
                      </div>

                    </div>
                    <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden shadow-sm"> {/* Repos table container */}
                      {selectedProject.repositories?.length > 0 ? ( // Check repos existence
                        <table className="w-full text-left"> {/* Repos table */}
                          <thead className="bg-zinc-50 border-b border-zinc-200 text-xs uppercase text-zinc-500 font-bold"> {/* Table header */}
                            <tr> {/* Header row */}
                              <th className="px-6 py-4">Depo Adı</th> {/* Name header */}
                              <th className="px-6 py-4">Dil</th> {/* Language header */}
                              <th className="px-6 py-4">Açıklama</th> {/* Description header */}
                              <th className="px-6 py-4 text-right">İşlem</th> {/* Actions header */}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-zinc-100"> {/* Table body */}
                            {selectedProject.repositories.map((repo, i) => ( // Iterate repos
                              <tr key={i} className="hover:bg-zinc-50 transition-colors"> {/* Repo row */}
                                <td className="px-6 py-4 flex items-center gap-3"> {/* Name cell */}
                                  <GitBranch className="w-5 h-5 text-purple-500" /> {/* Git icon */}
                                  <span className="font-medium text-sm text-zinc-900">{repo.repo_name}</span> {/* Repo name */}
                                </td>
                                <td className="px-6 py-4 text-sm text-zinc-500">{repo.language || "-"}</td> {/* Repo language */}
                                <td className="px-6 py-4 text-sm text-zinc-500 truncate max-w-[150px]">{repo.description || "-"}</td> {/* Repo description */}
                                <td className="px-6 py-4 text-right"> {/* Actions cell */}
                                  <div className="flex items-center justify-end gap-4"> {/* Actions container */}
                                    
                                    <button 
                                      onClick={() => handleExportRepoToPersonal(repo)} // Export repo handler
                                      className="text-zinc-500 hover:text-purple-600 text-sm font-bold flex items-center gap-1 transition-colors" // Export button styles
                                      title="Şahsi Uygulama Depolarına Kopya Al (Fork)" // Hover title
                                    >
                                      <Copy className="w-4 h-4"/> Kopyala {/* Export button text */}
                                    </button>

                                    <button 
                                      onClick={() => { // Open code editor
                                        if(onNavigate && setTargetRepo) { // Verify navigation props
                                          setTargetRepo(repo); // Set target repo
                                          onNavigate('codes'); // Navigate to codes
                                        }
                                      }}
                                      className="flex items-center gap-1.5 px-4 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-sm font-bold transition-colors shadow-sm" // Navigation button styles
                                      title="Repoya Git ve Takımla Çalış" // Hover title
                                    >
                                      <Code2 className="w-4 h-4"/> Birlikte Kodla {/* Navigation button text */}
                                    </button>

                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      ) : ( // Render empty repos state
                        <div className="text-center py-12"> {/* Empty state container */}
                          <GitBranch className="w-10 h-10 text-zinc-300 mx-auto mb-3" /> {/* Empty icon */}
                          <p className="text-zinc-500 font-medium">Bu projeye henüz kod deposu eklenmemiş.</p> {/* Empty text */}
                        </div>
                      )}
                    </div>
                  </div>
                )}

              </div>
            </div>
          </div>
        </div>
      )}

      {isAddMemberModalOpen && ( // Conditional add member modal
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 text-left"> {/* Modal overlay */}
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col"> {/* Modal container */}
            <div className="px-6 py-5 border-b border-zinc-100 flex justify-between items-center bg-zinc-50/50"> {/* Modal header */}
              <h3 className="text-lg font-bold text-zinc-900">Takım Üyeleriniz</h3> {/* Modal title */}
              <button onClick={() => setIsAddMemberModalOpen(false)} className="p-2 hover:bg-zinc-200 rounded-full text-zinc-400 transition-colors"> {/* Close button */}
                <X className="w-5 h-5" /> {/* Close icon */}
              </button>
            </div>
            
            <div className="p-6 max-h-[60vh] overflow-y-auto space-y-3"> {/* Modal body */}
              {allMembers.length === 0 ? ( // Conditional empty members
                <p className="text-center text-zinc-500 italic py-4">Takımınızda (Members) projeye eklenecek kimse bulunamadı. Önce Members sayfasından takım oluşturun.</p> // Empty members text
              ) : ( // Render members list
                allMembers.map(member => { // Iterate members
                  const fullName = member.name; // Get member name
                  
                  const isAlreadyAdded = selectedProject.teamMembers?.some(tm => { // Check already added
                    const cleanTmName = tm.replace(" (Kurucu)", "").trim().toLowerCase(); // Remove founder tag
                    return cleanTmName === fullName.toLowerCase(); // Compare names
                  });
                  
                  const isInviteSent = sentInvites.includes(member.id); // Check sent invite
                  
                  return ( // Render member item
                    <div key={member.id} className="flex items-center justify-between p-4 border border-zinc-200 rounded-xl hover:border-blue-300 transition-colors"> {/* Member card */}
                      <div className="flex items-center gap-3"> {/* Member info */}
                        <div className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-500"> {/* Member avatar */}
                          <User className="w-5 h-5" /> {/* User icon */}
                        </div>
                        <div> {/* Member text */}
                          <p className="font-bold text-zinc-900 text-sm">{fullName}</p> {/* Member name */}
                          <p className="text-xs text-zinc-500">{member.email}</p> {/* Member email */}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2"> {/* Member actions */}
                        {isAlreadyAdded ? ( // Render added state
                          <button disabled className="px-4 py-1.5 text-sm font-bold rounded-lg transition-colors min-w-[95px] text-center bg-zinc-100 text-zinc-400 cursor-not-allowed opacity-70"> {/* Added button */}
                            Eklendi {/* Button text */}
                          </button>
                        ) : isInviteSent ? ( // Render invite sent state
                          <button onClick={() => handleRevokeInvitation(member)} className="px-4 py-1.5 text-sm font-bold rounded-lg transition-colors min-w-[95px] text-center bg-red-50 text-red-600 hover:bg-red-100"> {/* Revoke button */}
                            Geri Çek {/* Button text */}
                          </button>
                        ) : ( // Render invite action
                          <button onClick={() => handleAssignMemberToProject(member)} className="px-4 py-1.5 text-sm font-bold rounded-lg transition-colors min-w-[95px] text-center bg-blue-50 text-blue-600 hover:bg-blue-100"> {/* Invite button */}
                            Davet Et {/* Button text */}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {isSystemFileModalOpen && ( // Conditional system files modal
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 text-left"> {/* Modal overlay */}
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col"> {/* Modal container */}
            <div className="px-6 py-5 border-b border-zinc-100 flex justify-between items-center bg-zinc-50/50 text-zinc-900"> {/* Modal header */}
              <h3 className="text-lg font-bold text-zinc-900">Şahsi Dosyalarınızdan Seçin</h3> {/* Modal title */}
              <button onClick={() => setIsSystemFileModalOpen(false)} className="p-2 hover:bg-zinc-200 rounded-full text-zinc-400 transition-colors"> {/* Close button */}
                <X className="w-5 h-5" /> {/* Close icon */}
              </button>
            </div>
            
            <div className="p-6 max-h-[60vh] overflow-y-auto space-y-3"> {/* Modal body */}
              {systemFiles.length === 0 ? ( // Conditional empty files
                <div className="text-center py-6"> {/* Empty files container */}
                  <Database className="w-10 h-10 text-zinc-300 mx-auto mb-3" /> {/* Empty database icon */}
                  <p className="text-zinc-500 italic text-sm text-zinc-900 font-bold">Hiç dosyanız yok.</p> {/* Empty files text */}
                </div>
              ) : ( // Render files list
                systemFiles.map(file => ( // Iterate system files
                  <div key={file.id} className="flex items-center justify-between p-4 border border-zinc-200 rounded-xl hover:border-blue-300 transition-colors"> {/* File card */}
                    <div className="flex items-center gap-3 overflow-hidden text-zinc-900"> {/* File info container */}
                      <FileText className="w-6 h-6 text-blue-500 flex-shrink-0" /> {/* File icon */}
                      <div className="truncate"> {/* File text wrapper */}
                        <p className="font-bold text-sm truncate">{file.name}</p> {/* File name */}
                        <p className="text-xs text-zinc-500">{new Date(file.modified_at).toLocaleDateString('tr-TR')}</p> {/* File date */}
                      </div>
                    </div>
                    <button 
                      onClick={() => handleLinkSystemFileToProject(file)} // Link file handler
                      className="px-4 py-1.5 text-sm font-bold bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors shrink-0 ml-2" // Button styles
                    >
                      Projeye Ekle {/* Button text */}
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {previewFile && ( // Conditional file preview modal
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-zinc-900/70 backdrop-blur-md p-4 md:p-8"> {/* Modal overlay */}
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200"> {/* Modal container */}
            <div className="px-6 py-4 border-b border-zinc-100 flex justify-between items-center bg-zinc-50 flex-shrink-0 text-zinc-900"> {/* Modal header */}
              <div className="flex items-center gap-3"> {/* File info wrapper */}
                <div className="p-2 bg-blue-100 text-blue-600 rounded-lg"><FileText className="w-5 h-5" /></div> {/* File icon wrapper */}
                <div><h3 className="font-bold text-lg">{previewFile.name}</h3><p className="text-xs text-zinc-500">Ön İzleme</p></div> {/* File metadata */}
              </div>
              <button onClick={() => setPreviewFile(null)} className="p-2 hover:bg-zinc-100 rounded-full"><X className="w-5 h-5" /></button> {/* Close button */}
            </div>
            <div className="flex-1 overflow-auto bg-zinc-50/50 p-6 md:p-8"> {/* Modal body */}
              {isPreviewLoading ? ( <div className="flex flex-col items-center justify-center h-full text-zinc-400 gap-3"><Loader2 className="w-8 h-8 animate-spin" /><p>Yükleniyor...</p></div> ) : ( // Conditional loading state
                <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-sm min-h-full"><pre className="font-mono text-sm text-zinc-800 whitespace-pre-wrap">{previewContent}</pre></div> // Render file content
              )}
            </div>
          </div>
        </div>
      )}

      {isSystemRepoModalOpen && ( // Conditional system repos modal
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 text-left"> {/* Modal overlay */}
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col"> {/* Modal container */}
            <div className="px-6 py-5 border-b border-zinc-100 flex justify-between items-center bg-zinc-50/50 text-zinc-900"> {/* Modal header */}
              <h3 className="text-lg font-bold">Şahsi Depolarınızdan Seçin</h3> {/* Modal title */}
              <button onClick={() => setIsSystemRepoModalOpen(false)} className="p-2 hover:bg-zinc-200 rounded-full text-zinc-400 transition-colors"><X className="w-5 h-5" /></button> {/* Close button */}
            </div>
            <div className="p-6 max-h-[60vh] overflow-y-auto space-y-3"> {/* Modal body */}
              {systemRepos.length === 0 ? ( // Conditional empty repos
                <div className="text-center py-6 text-zinc-900 font-bold"><p>Depo bulunamadı.</p></div> // Empty repos text
              ) : ( // Render repos list
                systemRepos.map(repo => ( // Iterate system repos
                  <div key={repo.id} className="flex items-center justify-between p-4 border border-zinc-200 rounded-xl hover:border-purple-300 transition-colors"> {/* Repo card */}
                    <div className="flex items-center gap-3 overflow-hidden text-zinc-900"> {/* Repo info container */}
                      <GitBranch className="w-6 h-6 text-purple-500 flex-shrink-0" /><div className="truncate"><p className="font-bold text-sm truncate">{repo.repo_name}</p><p className="text-xs text-zinc-500">{repo.language || "Bilinmiyor"}</p></div> {/* Repo metadata */}
                    </div>
                    <button onClick={() => handleLinkSystemRepoToProject(repo)} className="px-4 py-1.5 text-sm font-bold bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 transition-colors shrink-0 ml-2">Projeye Ekle</button> {/* Link repo button */}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {activeChatMember && currentUser && ( // Conditional chat window
        <ChatWindow 
          currentUser={currentUser} 
          chatMember={activeChatMember} 
          onClose={() => setActiveChatMember(null)} 
        />
      )}

      {isMessageModalOpen && ( // Conditional message modal
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 text-left"> {/* Modal overlay */}
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200"> {/* Modal container */}
            <div className="px-6 py-5 border-b border-zinc-100 flex justify-between items-center bg-zinc-50/50"> {/* Modal header */}
              <h3 className="text-lg font-bold text-zinc-900">{messageReceiver} - Mesaj Yaz</h3> {/* Modal title */}
              <button onClick={() => setIsMessageModalOpen(false)} className="p-2 hover:bg-zinc-200 rounded-full text-zinc-400 transition-colors"> {/* Close button */}
                <X className="w-5 h-5" /> {/* Close icon */}
              </button>
            </div>
            <div className="p-6"> {/* Modal body */}
              <textarea // Message input textarea
                value={messageText} // Bind value
                onChange={(e) => setMessageText(e.target.value)} // Handle change
                placeholder="Mesajınızı buraya yazın..." // Placeholder text
                rows={4} // Textarea rows
                className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-blue-600 transition-all resize-none text-zinc-900" // Textarea styles
              />
            </div>
            <div className="px-6 py-4 bg-zinc-50 border-t border-zinc-100 flex justify-end gap-3"> {/* Modal footer */}
              <button onClick={() => setIsMessageModalOpen(false)} className="px-5 py-2.5 border border-zinc-200 bg-white font-medium text-zinc-700 rounded-xl hover:bg-zinc-100">İptal</button> {/* Cancel button */}
              <button onClick={handleSendMessage} disabled={!messageText.trim()} className="px-5 py-2.5 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 disabled:opacity-50 shadow-sm transition-all">Gönder</button> {/* Send button */}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}