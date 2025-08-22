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

  useEffect(() => {
    fetchDashboardData();
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

        <div className="flex flex-1 overflow-hidden">
          {/* Sessions List */}
          <div className="w-1/3 bg-white border-r border-gray-200 flex flex-col">
            {/* Stats Cards */}
            <div className="p-4 border-b border-gray-200">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 p-3 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{stats.todayChats || 0}</div>
                  <div className="text-sm text-blue-600">Today's Chats</div>
                </div>
                <div className="bg-green-50 p-3 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{stats.activeSessionsToday || 0}</div>
                  <div className="text-sm text-green-600">Active Sessions</div>
                </div>
              </div>
            </div>

            {/* Search */}
            <div className="p-4 border-b border-gray-200">
              <div className="relative">
                <MagnifyingGlass className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="text"
                  placeholder="Search sessions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Sessions List */}
            <div className="flex-1 overflow-y-auto">
              {filteredSessions.length === 0 ? (
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
              )}
            </div>
          </div>

          {/* Chat Details */}
          <div className="flex-1 flex flex-col">
            {selectedSession ? (
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
            ) : (
              <div className="flex-1 flex items-center justify-center bg-gray-50">
                <div className="text-center">
                  <ChatCircle size={64} className="mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Chat Session</h3>
                  <p className="text-gray-500">Choose a session from the list to view chat history and user details</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
