import React, { useState, useEffect } from "react";
import moment from "moment";
import { 
  MagnifyingGlass, 
  User, 
  ChatCircle, 
  Clock, 
  X,
  Envelope,
  Phone,
  MapPin,
  ChartBar,
  Calendar,
  Users,
  Download,
  Trash,
  ArrowClockwise
} from "@phosphor-icons/react";
import Sidebar from "@/components/Sidebar";
import { FullScreenLoader } from "@/components/Preloader";
import System from "@/models/system";
import Admin from "@/models/admin";
import showToast from "@/utils/toast";

export default function ChatDashboard() {
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [chatHistory, setChatHistory] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [stats, setStats] = useState({});
  const [embeds, setEmbeds] = useState([]);
  const [selectedEmbed, setSelectedEmbed] = useState("");
  const [activeTab, setActiveTab] = useState("chat-sessions");
  const [prechatSubmissions, setPrechatSubmissions] = useState([]);
  const [prechatStats, setPrechatStats] = useState({});
  const [prechatFilters, setPrechatFilters] = useState({
    status: "",
    search: "",
    startDate: "",
    endDate: ""
  });

  useEffect(() => {
    fetchDashboardData();
    
    // Set up WebSocket for real-time updates
    const ws = new WebSocket('ws://localhost:3001/ws');
    
    ws.onopen = () => {
      console.log('Dashboard WebSocket connected');
    };
    
    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        if (message.type === 'new_chat_session') {
          console.log('New chat session detected, refreshing dashboard');
          fetchDashboardData();
        }
      } catch (error) {
        console.log('WebSocket message error:', error);
      }
    };
    
    ws.onclose = () => {
      console.log('Dashboard WebSocket disconnected');
    };
    
    ws.onerror = (error) => {
      console.log('Dashboard WebSocket error:', error);
    };
    
    // Cleanup WebSocket on unmount
    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, [selectedEmbed]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [sessionsRes, statsRes, embedsRes] = await Promise.all([
        System.chatDashboard.getSessions(selectedEmbed),
        System.chatDashboard.getStats(selectedEmbed),
        System.chatDashboard.getEmbeds(),
      ]);

      setSessions(sessionsRes.sessions || []);
      setStats(statsRes || {});
      setEmbeds(embedsRes.embeds || []);

      // Fetch prechat data if on prechat tab
      if (activeTab === "prechat-submissions") {
        await fetchPrechatData();
      }
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
      showToast("Failed to load dashboard data", "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchPrechatData = async () => {
    try {
      const queryParams = new URLSearchParams({
        page: 1,
        limit: 50,
        ...Object.fromEntries(Object.entries(prechatFilters).filter(([_, v]) => v))
      });

      const [submissionsRes, statsRes] = await Promise.all([
        Admin.prechat.getSubmissions(queryParams.toString()),
        Admin.prechat.getStats()
      ]);

      if (submissionsRes.success) {
        setPrechatSubmissions(submissionsRes.submissions);
      }
      if (statsRes.success) {
        setPrechatStats(statsRes.stats);
      }
    } catch (error) {
      console.error("Failed to fetch prechat data:", error);
      showToast("Failed to load prechat data", "error");
    }
  };

  const handlePrechatStatusUpdate = async (uuid, newStatus) => {
    try {
      const response = await Admin.prechat.updateStatus(uuid, newStatus);
      if (response.success) {
        showToast("Status updated successfully", "success");
        fetchPrechatData();
      } else {
        showToast("Failed to update status", "error");
      }
    } catch (error) {
      console.error("Error updating status:", error);
      showToast("Error updating status", "error");
    }
  };

  const handlePrechatDelete = async (uuid) => {
    if (!confirm("Are you sure you want to delete this submission?")) return;
    
    try {
      const response = await Admin.prechat.deleteSubmission(uuid);
      if (response.success) {
        showToast("Submission deleted successfully", "success");
        fetchPrechatData();
      } else {
        showToast("Failed to delete submission", "error");
      }
    } catch (error) {
      console.error("Error deleting submission:", error);
      showToast("Error deleting submission", "error");
    }
  };

  const handlePrechatExport = async () => {
    try {
      const queryParams = new URLSearchParams(
        Object.fromEntries(Object.entries(prechatFilters).filter(([_, v]) => v))
      );
      
      const response = await fetch(`/api/prechat/export?${queryParams}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("anythingllm_authToken")}` }
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `prechat-submissions-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        showToast("Export completed successfully", "success");
      } else {
        showToast("Export failed", "error");
      }
    } catch (error) {
      console.error("Error exporting:", error);
      showToast("Error during export", "error");
    }
  };

  const fetchSessionDetails = async (sessionId) => {
    try {
      const response = await fetch(`/api/chat-dashboard/sessions/${sessionId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log("Session details response:", data);
        
        // Transform the chat history to match expected format
        const transformedHistory = (data.chatHistory || []).map(chat => ({
          id: chat.id,
          userMessage: chat.userMessage || chat.prompt,
          assistantMessage: chat.assistantMessage || chat.response,
          timestamp: chat.timestamp || chat.createdAt
        }));
        
        setChatHistory(transformedHistory);
        setSelectedSession(data.sessionInfo || data.session || null);
      } else {
        console.error("Failed to fetch session details");
        setChatHistory([]);
        setSelectedSession(null);
      }
    } catch (error) {
      console.error("Error fetching session details:", error);
      setChatHistory([]);
      setSelectedSession(null);
    }
  };

  const filteredSessions = sessions.filter((session) =>
    session.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    session.userEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    session.sessionId?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status) => {
    switch (status) {
      case "online": return "bg-green-500";
      case "away": return "bg-yellow-500";
      default: return "bg-gray-400";
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case "online": return "Online";
      case "away": return "Away";
      default: return "Offline";
    }
  };

  if (loading) return <FullScreenLoader />;

  return (
    <div className="w-screen h-screen overflow-hidden bg-theme-bg-primary flex">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Header */}
        <div className="bg-theme-bg-secondary border-b border-theme-modal-border px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-theme-text-primary">Chat Dashboard</h1>
              <p className="text-theme-text-secondary">Monitor and manage chat sessions and prechat submissions</p>
            </div>
            <div className="flex items-center space-x-4">
              <select
                value={selectedEmbed}
                onChange={(e) => setSelectedEmbed(e.target.value)}
                className="px-3 py-2 bg-theme-bg-primary border border-theme-modal-border rounded-md text-theme-text-primary focus:outline-none focus:ring-2 focus:ring-theme-sidebar-footer-icon"
              >
                <option value="">All Embeds</option>
                {embeds.map((embed) => (
                  <option key={embed.id} value={embed.id}>
                    {embed.workspaceName} ({embed.uuid.slice(0, 8)})
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          {/* Tab Navigation */}
          <div className="flex space-x-1 mt-4">
            <button
              onClick={() => setActiveTab("chat-sessions")}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === "chat-sessions"
                  ? "bg-theme-sidebar-footer-icon text-white"
                  : "text-theme-text-secondary hover:text-theme-text-primary hover:bg-theme-bg-primary"
              }`}
            >
              <ChatCircle size={16} className="inline mr-2" />
              Chat Sessions
            </button>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Sessions List */}
          <div className="w-1/3 bg-theme-bg-secondary border-r border-theme-modal-border flex flex-col">
            {/* Stats Cards */}
            <div className="p-4 border-b border-theme-modal-border">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{sessions.length || 0}</div>
                  <div className="text-sm text-blue-600 dark:text-blue-400">Today's Chats</div>
                </div>
                <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">{sessions.length || 0}</div>
                  <div className="text-sm text-green-600 dark:text-green-400">Total Sessions</div>
                </div>
              </div>
            </div>

            {/* Search */}
            <div className="p-4 border-b border-theme-modal-border">
              <div className="relative">
                <MagnifyingGlass className="absolute left-3 top-1/2 transform -translate-y-1/2 text-theme-text-secondary" size={16} />
                <input
                  type="text"
                  placeholder="Search sessions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-theme-bg-primary border border-theme-modal-border rounded-md text-theme-text-primary placeholder-theme-text-secondary focus:outline-none focus:ring-2 focus:ring-theme-sidebar-footer-icon"
                />
              </div>
            </div>

            {/* Sessions List */}
            <div className="flex-1 overflow-y-auto">
              {filteredSessions.length === 0 ? (
                <div className="p-4 text-center text-theme-text-secondary">
                  <ChatCircle size={48} className="mx-auto mb-2 text-theme-text-secondary opacity-50" />
                  <p>No chat sessions found</p>
                </div>
              ) : (
                filteredSessions.map((session) => (
                  <div
                    key={session.sessionId}
                    onClick={() => fetchSessionDetails(session.sessionId)}
                    className={`p-4 border-b border-theme-modal-border cursor-pointer hover:bg-theme-bg-primary transition-colors ${
                      selectedSession?.sessionId === session.sessionId ? "bg-theme-bg-primary border-l-4 border-l-theme-sidebar-footer-icon" : ""
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="relative">
                          <div className="w-10 h-10 bg-theme-sidebar-footer-icon rounded-full flex items-center justify-center">
                            <User size={20} className="text-white" />
                          </div>
                          <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-theme-bg-secondary ${getStatusColor(session.status)}`}></div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-theme-text-primary truncate">
                            {session.userName || "Anonymous User"}
                          </div>
                          <div className="text-sm text-theme-text-secondary truncate">
                            <Envelope size={12} className="inline mr-1" />
                            {session.userEmail || session.sessionId.slice(0, 8)}
                          </div>
                          {session.userMobile && (
                            <div className="text-sm text-theme-text-secondary truncate">
                              <Phone size={12} className="inline mr-1" />
                              {session.userMobile}
                            </div>
                          )}
                          <div className="text-xs text-theme-text-secondary flex items-center mt-1">
                            <Clock size={12} className="mr-1" />
                            {moment(session.lastActivity).fromNow()}
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          session.status === "online" ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" :
                          session.status === "away" ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400" :
                          "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400"
                        }`}>
                          {getStatusText(session.status)}
                        </span>
                        <div className="text-xs text-theme-text-secondary mt-1">
                          {session.messageCount} messages
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Chat Details */}
          <div className="flex-1 flex flex-col">
            {selectedSession ? (
              <>
                {/* Chat Header */}
                <div className="bg-theme-bg-secondary border-b border-theme-modal-border p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="relative">
                        <div className="w-12 h-12 bg-theme-sidebar-footer-icon rounded-full flex items-center justify-center">
                          <User size={24} className="text-white" />
                        </div>
                        <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-theme-bg-secondary ${getStatusColor(selectedSession.status)}`}></div>
                      </div>
                      <div>
                        <h2 className="text-lg font-semibold text-theme-text-primary">
                          {selectedSession.userName || "Anonymous User"}
                        </h2>
                        <div className="text-sm text-theme-text-secondary space-y-1">
                          {selectedSession.userEmail && (
                            <div className="flex items-center">
                              <Envelope size={14} className="mr-2" />
                              {selectedSession.userEmail}
                            </div>
                          )}
                          {selectedSession.userMobile && (
                            <div className="flex items-center">
                              <Phone size={14} className="mr-2" />
                              {selectedSession.userMobile}
                            </div>
                          )}
                          {selectedSession.userRegion && (
                            <div className="flex items-center">
                              <MapPin size={14} className="mr-2" />
                              {selectedSession.userRegion}
                            </div>
                          )}
                          <div className="flex items-center">
                            <ChatCircle size={14} className="mr-2" />
                            {selectedSession.messageCount} messages
                          </div>
                          <div className="flex items-center">
                            <Clock size={14} className="mr-2" />
                            Last Seen: {moment(selectedSession.firstSeen).fromNow()}
                          </div>
                          <div className="flex items-center">
                            <Calendar size={14} className="mr-2" />
                            Session Date: {moment(selectedSession.firstSeen).format('MMM DD, YYYY [at] h:mm A')}
                          </div>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedSession(null)}
                      className="p-2 hover:bg-theme-bg-primary rounded-full transition-colors"
                    >
                      <X size={20} className="text-theme-text-secondary" />
                    </button>
                  </div>
                </div>

                {/* Chat History */}
                <div className="flex-1 overflow-y-auto p-4 bg-theme-bg-primary">
                  <div className="space-y-4">
                    {chatHistory.length === 0 ? (
                      <div className="flex items-center justify-center h-full">
                        <div className="text-center">
                          <ChatCircle size={48} className="mx-auto mb-2 text-theme-text-secondary opacity-50" />
                          <p className="text-theme-text-secondary">No chat history available</p>
                        </div>
                      </div>
                    ) : (
                      chatHistory.map((message, index) => (
                        <div key={message.id || index} className="space-y-2">
                          {/* User Message */}
                          {message.userMessage && (
                            <>
                              <div className="flex justify-end">
                                <div className="max-w-xs lg:max-w-md px-4 py-2 rounded-lg bg-theme-sidebar-footer-icon text-white">
                                  <div className="text-sm">{message.userMessage}</div>
                                </div>
                              </div>
                              <div className="text-xs text-theme-text-secondary text-right">
                              {selectedSession.userName || "Anonymous User"} • {moment(message.timestamp).fromNow()}
                              </div>
                            </>
                          )}

                          {/* Assistant Message */}
                          {message.assistantMessage && (
                            <>
                              <div className="flex justify-start">
                                <div className="max-w-xs lg:max-w-md px-4 py-2 rounded-lg bg-theme-bg-secondary text-theme-text-primary border border-theme-modal-border">
                                  <div className="text-sm whitespace-pre-wrap">{message.assistantMessage}</div>
                                </div>
                              </div>
                              <div className="text-xs text-theme-text-secondary text-left">
                                Bell Chat Assistant • {moment(message.timestamp).fromNow()}
                              </div>
                            </>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center bg-theme-bg-primary">
                <div className="text-center">
                  <ChatCircle size={64} className="mx-auto mb-4 text-theme-text-secondary opacity-50" />
                  <h3 className="text-lg font-medium text-theme-text-primary mb-2">Select a Chat Session</h3>
                  <p className="text-theme-text-secondary">Choose a session from the list to view chat history and user details</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
