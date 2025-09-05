import React, { useState, useEffect } from "react";
import { formatDistanceToNow } from "date-fns";
import { MagnifyingGlass, User, ChatCircle, Clock, X } from "@phosphor-icons/react";
import Sidebar from "@/components/Sidebar";
import { FullScreenLoader } from "@/components/Preloader";
import System from "@/models/system";

export default function ChatDashboard() {
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [chatHistory, setChatHistory] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [stats, setStats] = useState({});
  const [embeds, setEmbeds] = useState([]);
  const [selectedEmbed, setSelectedEmbed] = useState("");
  const [activeTab, setActiveTab] = useState("sessions");
  const [prechatSubmissions, setPrechatSubmissions] = useState([]);
  const [prechatStats, setPrechatStats] = useState({});
  const [selectedSubmission, setSelectedSubmission] = useState(null);

  useEffect(() => {
    fetchDashboardData();
    
    // Setup WebSocket for real-time updates
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//localhost:3001/ws/dashboard`;
    
    let ws;
    try {
      ws = new WebSocket(wsUrl);
      
      ws.onopen = () => {
        console.log('Dashboard WebSocket connected');
        // Request initial data
        ws.send(JSON.stringify({ type: 'GET_SESSIONS', embedId: selectedEmbed }));
        ws.send(JSON.stringify({ type: 'GET_STATS', embedId: selectedEmbed }));
        ws.send(JSON.stringify({ type: 'GET_PRECHAT_SUBMISSIONS' }));
        ws.send(JSON.stringify({ type: 'GET_PRECHAT_STATS' }));
      };
      
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('WebSocket message received:', data);
          
          switch (data.type) {
            case 'DASHBOARD_INIT':
              setSessions(data.data.sessions || []);
              setStats(data.data.stats || {});
              setPrechatSubmissions(data.data.prechatSubmissions || []);
              setPrechatStats(data.data.prechatStats || {});
              break;
            case 'SESSIONS_UPDATE':
              setSessions(data.data.sessions || []);
              break;
            case 'STATS_UPDATE':
              setStats(data.data.stats || {});
              break;
            case 'PRECHAT_SUBMISSIONS_UPDATE':
              setPrechatSubmissions(data.data.submissions || []);
              break;
            case 'PRECHAT_STATS_UPDATE':
              setPrechatStats(data.data || {});
              break;
            case 'NEW_CHAT_MESSAGE':
              // Refresh sessions when new message arrives
              ws.send(JSON.stringify({ type: 'GET_SESSIONS', embedId: selectedEmbed }));
              ws.send(JSON.stringify({ type: 'GET_STATS', embedId: selectedEmbed }));
              break;
            case 'NEW_PRECHAT_SUBMISSION':
              // Refresh prechat data when new submission arrives
              ws.send(JSON.stringify({ type: 'GET_PRECHAT_SUBMISSIONS' }));
              ws.send(JSON.stringify({ type: 'GET_PRECHAT_STATS' }));
              break;
            default:
              console.log('Unknown WebSocket message type:', data.type);
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };
      
      ws.onclose = () => {
        console.log('Dashboard WebSocket disconnected');
      };
      
      ws.onerror = (error) => {
        console.error('Dashboard WebSocket error:', error);
      };
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
    }
    
    return () => {
      if (ws) {
        ws.close();
      }
    };
  }, [selectedEmbed]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [sessionsRes, statsRes, embedsRes, prechatRes, prechatStatsRes] = await Promise.all([
        System.chatDashboard.getSessions(selectedEmbed),
        System.chatDashboard.getStats(selectedEmbed),
        System.chatDashboard.getEmbeds(),
        System.chatDashboard.getPrechatSubmissions(),
        System.chatDashboard.getPrechatStats(),
      ]);

      setSessions(sessionsRes.sessions || []);
      setStats(statsRes || {});
      setEmbeds(embedsRes.embeds || []);
      setPrechatSubmissions(prechatRes.submissions || []);
      setPrechatStats(prechatStatsRes || {});
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSessionDetails = async (sessionId) => {
    try {
      const response = await System.chatDashboard.getSessionDetails(sessionId, selectedEmbed);
      setSelectedSession(response.sessionInfo);
      setChatHistory(response.chatHistory || []);
    } catch (error) {
      console.error("Failed to fetch session details:", error);
    }
  };

  const filteredSessions = sessions.filter((session) =>
    session.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    session.userEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    session.sessionId?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredSubmissions = prechatSubmissions.filter((submission) =>
    submission.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    submission.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    submission.mobile?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    submission.region?.toLowerCase().includes(searchTerm.toLowerCase())
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
    <div className="w-screen h-screen overflow-hidden bg-sidebar flex">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Chat Dashboard</h1>
              <p className="text-gray-600">Monitor and manage embed chat sessions</p>
            </div>
            <div className="flex items-center space-x-4">
              <select
                value={selectedEmbed}
                onChange={(e) => setSelectedEmbed(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
        </div>

        {/* Tabs */}
        <div className="bg-white border-b border-gray-200">
          <div className="px-6">
            <nav className="flex space-x-8">
              <button
                onClick={() => setActiveTab("sessions")}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "sessions"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Chat Sessions
              </button>
              {prechatSubmissions.length > 0 && (
                <button
                  onClick={() => setActiveTab("prechat")}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === "prechat"
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  Prechat Submissions
                </button>
              )}
            </nav>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Sessions/Submissions List */}
          <div className="w-1/3 bg-white border-r border-gray-200 flex flex-col">
            {/* Stats Cards */}
            <div className="p-4 border-b border-gray-200">
              <div className="grid grid-cols-3 gap-4">
                {activeTab === "sessions" ? (
                  <>
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">{stats.todayChats || 0}</div>
                      <div className="text-sm text-blue-600">Today's Chats</div>
                    </div>
                    <div className="bg-green-50 p-3 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">{stats.activeSessionsToday || 0}</div>
                      <div className="text-sm text-green-600">Active Sessions</div>
                    </div>
                    <div className="bg-purple-50 p-3 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">{stats.totalMessages || 0}</div>
                      <div className="text-sm text-purple-600">Total Messages</div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">{prechatStats.total || 0}</div>
                      <div className="text-sm text-blue-600">Total Submissions</div>
                    </div>
                    <div className="bg-green-50 p-3 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">{prechatStats.today || 0}</div>
                      <div className="text-sm text-green-600">Today</div>
                    </div>
                    <div className="bg-orange-50 p-3 rounded-lg">
                      <div className="text-2xl font-bold text-orange-600">{prechatStats.thisMonth || 0}</div>
                      <div className="text-sm text-orange-600">This Month</div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Search */}
            <div className="p-4 border-b border-gray-200">
              <div className="relative">
                <MagnifyingGlass className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="text"
                  placeholder={activeTab === "sessions" ? "Search sessions..." : "Search submissions..."}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Sessions/Submissions List */}
            <div className="flex-1 overflow-y-auto">
              {activeTab === "sessions" ? (
                filteredSessions.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">
                    <ChatCircle size={48} className="mx-auto mb-2 text-gray-300" />
                    <p>No chat sessions found</p>
                  </div>
                ) : (
                  filteredSessions.map((session) => (
                    <div
                      key={session.sessionId}
                      onClick={() => fetchSessionDetails(session.sessionId)}
                      className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${
                        selectedSession?.sessionId === session.sessionId ? "bg-blue-50 border-blue-200" : ""
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="relative">
                            <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                              <User size={20} className="text-gray-600" />
                            </div>
                            <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${getStatusColor(session.status)}`}></div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-gray-900 truncate">
                              {session.userName || "Anonymous User"}
                            </div>
                            <div className="text-sm text-gray-500 truncate">
                              {session.userEmail || session.sessionId.slice(0, 8)}
                            </div>
                            {session.userMobile && (
                              <div className="text-xs text-gray-400 truncate">
                                📱 {session.userMobile}
                              </div>
                            )}
                            <div className="text-xs text-gray-400 flex items-center mt-1">
                              <Clock size={12} className="mr-1" />
                              {formatDistanceToNow(new Date(session.lastActivity), { addSuffix: true })}
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col items-end">
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            session.status === "online" ? "bg-green-100 text-green-800" :
                            session.status === "away" ? "bg-yellow-100 text-yellow-800" :
                            "bg-gray-100 text-gray-800"
                          }`}>
                            {getStatusText(session.status)}
                          </span>
                          <div className="text-xs text-gray-500 mt-1">
                            {session.messageCount} messages
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )
              ) : (
                filteredSubmissions.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">
                    <User size={48} className="mx-auto mb-2 text-gray-300" />
                    <p>No prechat submissions found</p>
                  </div>
                ) : (
                  filteredSubmissions.map((submission) => (
                    <div
                      key={submission.uuid}
                      onClick={() => setSelectedSubmission(submission)}
                      className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${
                        selectedSubmission?.uuid === submission.uuid ? "bg-blue-50 border-blue-200" : ""
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <User size={20} className="text-blue-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-gray-900 truncate">
                              {submission.name}
                            </div>
                            <div className="text-sm text-gray-500 truncate">
                              {submission.email}
                            </div>
                            <div className="text-xs text-gray-400 truncate">
                              📱 {submission.country_code} {submission.mobile}
                            </div>
                            <div className="text-xs text-gray-400 flex items-center mt-1">
                              <Clock size={12} className="mr-1" />
                              {formatDistanceToNow(new Date(submission.createdAt), { addSuffix: true })}
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col items-end">
                          <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-800">
                            {submission.region}
                          </span>
                          {submission.status && (
                            <div className="text-xs text-gray-500 mt-1">
                              Status: {submission.status}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )
              )}
            </div>
          </div>

          {/* Details Panel */}
          <div className="flex-1 flex flex-col">
            {activeTab === "sessions" && selectedSession ? (
              <>
                {/* Chat Header */}
                <div className="bg-white border-b border-gray-200 p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="relative">
                        <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center">
                          <User size={24} className="text-gray-600" />
                        </div>
                        <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${getStatusColor(selectedSession.status)}`}></div>
                      </div>
                      <div>
                        <h2 className="text-lg font-semibold text-gray-900">
                          {selectedSession.userName || "Anonymous User"}
                        </h2>
                        <div className="text-sm text-gray-500 space-y-1">
                          {selectedSession.userEmail && <div>📧 {selectedSession.userEmail}</div>}
                          {selectedSession.userMobile && <div>📱 {selectedSession.userMobile}</div>}
                          {selectedSession.userRegion && <div>🌍 {selectedSession.userRegion}</div>}
                          <div>💬 {selectedSession.messageCount} messages</div>
                          <div>🕒 First seen: {formatDistanceToNow(new Date(selectedSession.firstSeen), { addSuffix: true })}</div>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedSession(null)}
                      className="p-2 hover:bg-gray-100 rounded-full"
                    >
                      <X size={20} className="text-gray-500" />
                    </button>
                  </div>
                </div>

                {/* Chat History */}
                <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
                  <div className="space-y-4">
                    {chatHistory.map((message, index) => (
                      <div key={message.id || index} className="flex flex-col">
                        <div className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                          <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                            message.role === "user"
                              ? "bg-blue-500 text-white"
                              : "bg-white text-gray-800 border border-gray-200"
                          }`}>
                            <div className="text-sm">{message.prompt || message.response}</div>
                          </div>
                        </div>
                        <div className={`text-xs text-gray-500 mt-1 ${
                          message.role === "user" ? "text-right" : "text-left"
                        }`}>
                          {formatDistanceToNow(new Date(message.timestamp), { addSuffix: true })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : activeTab === "prechat" && selectedSubmission ? (
              <>
                {/* Submission Header */}
                <div className="bg-white border-b border-gray-200 p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <User size={24} className="text-blue-600" />
                      </div>
                      <div>
                        <h2 className="text-lg font-semibold text-gray-900">
                          {selectedSubmission.name}
                        </h2>
                        <div className="text-sm text-gray-500 space-y-1">
                          <div>📧 {selectedSubmission.email}</div>
                          <div>📱 {selectedSubmission.country_code} {selectedSubmission.mobile}</div>
                          <div>🌍 {selectedSubmission.region}</div>
                          <div>🕒 Submitted: {formatDistanceToNow(new Date(selectedSubmission.created_at), { addSuffix: true })}</div>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedSubmission(null)}
                      className="p-2 hover:bg-gray-100 rounded-full"
                    >
                      <X size={20} className="text-gray-500" />
                    </button>
                  </div>
                </div>

                {/* Submission Details */}
                <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
                  <div className="bg-white rounded-lg shadow-sm p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Submission Details</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Name</label>
                        <div className="mt-1 text-sm text-gray-900">{selectedSubmission.name}</div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Email</label>
                        <div className="mt-1 text-sm text-gray-900">{selectedSubmission.email}</div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Mobile</label>
                        <div className="mt-1 text-sm text-gray-900">{selectedSubmission.country_code} {selectedSubmission.mobile}</div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Region</label>
                        <div className="mt-1 text-sm text-gray-900">{selectedSubmission.region}</div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Session ID</label>
                        <div className="mt-1 text-sm text-gray-900 font-mono">{selectedSubmission.session_id || 'N/A'}</div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Workspace ID</label>
                        <div className="mt-1 text-sm text-gray-900 font-mono">{selectedSubmission.workspace_id || 'N/A'}</div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">IP Address</label>
                        <div className="mt-1 text-sm text-gray-900">{selectedSubmission.ip_address || 'N/A'}</div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">User Agent</label>
                        <div className="mt-1 text-sm text-gray-900 truncate" title={selectedSubmission.user_agent}>
                          {selectedSubmission.user_agent || 'N/A'}
                        </div>
                      </div>
                    </div>
                    
                    {selectedSubmission.message && (
                      <div className="mt-4">
                        <label className="block text-sm font-medium text-gray-700">Message</label>
                        <div className="mt-1 p-3 bg-gray-50 rounded-md text-sm text-gray-900">
                          {selectedSubmission.message}
                        </div>
                      </div>
                    )}

                    <div className="mt-6 flex space-x-3">
                      <button
                        onClick={() => System.chatDashboard.updatePrechatStatus(selectedSubmission.uuid, 'contacted')}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                      >
                        Mark as Contacted
                      </button>
                      <button
                        onClick={() => System.chatDashboard.deletePrechatSubmission(selectedSubmission.uuid)}
                        className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm"
                      >
                        Delete Submission
                      </button>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center bg-gray-50">
                <div className="text-center">
                  <ChatCircle size={64} className="mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {activeTab === "sessions" ? "Select a Chat Session" : "Select a Prechat Submission"}
                  </h3>
                  <p className="text-gray-500">
                    {activeTab === "sessions" 
                      ? "Choose a session from the list to view chat history and user details"
                      : "Choose a submission from the list to view user details and manage the submission"
                    }
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
