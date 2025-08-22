import { useEffect, useState } from "react";
import Sidebar from "@/components/SettingsSidebar";
import { isMobile } from "react-device-detect";
import * as Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import System from "@/models/system";
import { User, ChatCircle, Clock, Envelope, Phone, MapPin, ArrowLeft } from "@phosphor-icons/react";
import { useTranslation } from "react-i18next";
import { CanViewChatHistory } from "@/components/CanViewChatHistory";

export default function UserDashboard() {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userChats, setUserChats] = useState([]);
  const [loadingChats, setLoadingChats] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    async function fetchUsers() {
      const { users: _users = [] } = await System.prechatUsers();
      setUsers(_users);
      setLoading(false);
    }
    fetchUsers();
  }, []);

  const handleUserSelect = async (user) => {
    setSelectedUser(user);
    setLoadingChats(true);
    
    if (user.session_token) {
      const { chats = [] } = await System.chatsByUser(user.session_token);
      setUserChats(chats);
    } else {
      setUserChats([]);
    }
    setLoadingChats(false);
  };

  const handleBackToUsers = () => {
    setSelectedUser(null);
    setUserChats([]);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  if (loading) {
    return (
      <CanViewChatHistory>
        <div className="w-screen h-screen overflow-hidden bg-theme-bg-container flex">
          <Sidebar />
          <div
            style={{ height: isMobile ? "100%" : "calc(100% - 32px)" }}
            className="relative md:ml-[2px] md:mr-[16px] md:my-[16px] md:rounded-[16px] bg-theme-bg-secondary w-full h-full overflow-y-scroll p-4 md:p-0"
          >
            <div className="flex flex-col w-full px-1 md:pl-6 md:pr-[50px] md:py-6 py-16">
              <Skeleton.default
                height="80vh"
                width="100%"
                highlightColor="var(--theme-bg-primary)"
                baseColor="var(--theme-bg-secondary)"
                count={1}
                className="w-full p-4 rounded-b-2xl rounded-tr-2xl rounded-tl-sm"
                containerClassName="flex w-full"
              />
            </div>
          </div>
        </div>
      </CanViewChatHistory>
    );
  }

  return (
    <CanViewChatHistory>
      <div className="w-screen h-screen overflow-hidden bg-theme-bg-container flex">
        <Sidebar />
        <div
          style={{ height: isMobile ? "100%" : "calc(100% - 32px)" }}
          className="relative md:ml-[2px] md:mr-[16px] md:my-[16px] md:rounded-[16px] bg-theme-bg-secondary w-full h-full overflow-y-scroll p-4 md:p-0"
        >
          <div className="flex flex-col w-full px-1 md:pl-6 md:pr-[50px] md:py-6 py-16">
            <div className="w-full flex flex-col gap-y-1 pb-6 border-white/10 border-b-2">
              <div className="flex items-center gap-4">
                {selectedUser && (
                  <button
                    onClick={handleBackToUsers}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-theme-bg-primary hover:bg-theme-bg-primary/80 text-theme-text-primary transition-all"
                  >
                    <ArrowLeft size={16} />
                    Back to Users
                  </button>
                )}
                <h1 className="text-lg leading-6 font-bold text-theme-text-primary">
                  {selectedUser ? `${selectedUser.name}'s Conversations` : 'User Chat Dashboard'}
                </h1>
              </div>
              <p className="text-xs leading-[18px] font-base text-theme-text-secondary mt-2">
                {selectedUser 
                  ? `View all conversations for ${selectedUser.name} (${selectedUser.email})`
                  : 'Select a user to view their chat conversations and details'
                }
              </p>
            </div>

            <div className="w-full h-full flex gap-4 mt-6">
              {!selectedUser ? (
                // Users List View
                <div className="w-full">
                  {users.length === 0 ? (
                    <div className="text-center py-16">
                      <User size={64} className="mx-auto mb-4 text-theme-text-secondary opacity-50" />
                      <h3 className="text-lg font-medium text-theme-text-primary mb-2">
                        No Users Found
                      </h3>
                      <p className="text-theme-text-secondary">
                        No prechat form submissions found. Users will appear here after they submit the prechat form.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {users.map((user) => (
                        <UserCard 
                          key={user.id} 
                          user={user} 
                          onSelect={handleUserSelect}
                          formatDate={formatDate}
                        />
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                // Selected User Chat View
                <div className="w-full flex flex-col">
                  <UserDetailsHeader user={selectedUser} formatDate={formatDate} />
                  <ChatHistory 
                    chats={userChats} 
                    loading={loadingChats} 
                    userName={selectedUser.name}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </CanViewChatHistory>
  );
}

function UserCard({ user, onSelect, formatDate }) {
  return (
    <div
      onClick={() => onSelect(user)}
      className="bg-theme-bg-primary rounded-lg p-4 border border-white/10 cursor-pointer transition-all duration-200 hover:bg-white/5 hover:border-primary-button/50 hover:shadow-lg"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="w-12 h-12 bg-primary-button rounded-full flex items-center justify-center">
          <User size={24} className="text-white" />
        </div>
        <ChatCircle size={20} className="text-theme-text-secondary" />
      </div>
      
      <div className="space-y-2">
        <h3 className="font-semibold text-theme-text-primary text-lg">
          {user.name}
        </h3>
        
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm text-theme-text-secondary">
            <Envelope size={14} />
            <span className="truncate">{user.email}</span>
          </div>
          
          {user.mobile && (
            <div className="flex items-center gap-2 text-sm text-theme-text-secondary">
              <Phone size={14} />
              <span>{user.mobile}</span>
            </div>
          )}
          
          {user.region && (
            <div className="flex items-center gap-2 text-sm text-theme-text-secondary">
              <MapPin size={14} />
              <span>{user.region}</span>
            </div>
          )}
          
          <div className="flex items-center gap-2 text-xs text-theme-text-secondary mt-3">
            <Clock size={12} />
            <span>Joined {formatDate(user.created_at)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function UserDetailsHeader({ user, formatDate }) {
  return (
    <div className="bg-theme-bg-primary/30 rounded-lg p-6 border border-white/10 mb-6">
      <div className="flex items-center gap-4 mb-4">
        <div className="w-16 h-16 bg-primary-button rounded-full flex items-center justify-center">
          <User size={32} className="text-white" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-theme-text-primary">
            {user.name}
          </h2>
          <p className="text-theme-text-secondary">{user.email}</p>
        </div>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
        <div>
          <span className="text-theme-text-secondary block">Mobile:</span>
          <span className="text-theme-text-primary font-medium">
            {user.mobile || 'N/A'}
          </span>
        </div>
        <div>
          <span className="text-theme-text-secondary block">Region:</span>
          <span className="text-theme-text-primary font-medium">
            {user.region || 'N/A'}
          </span>
        </div>
        <div>
          <span className="text-theme-text-secondary block">Joined:</span>
          <span className="text-theme-text-primary font-medium">
            {formatDate(user.created_at)}
          </span>
        </div>
        <div>
          <span className="text-theme-text-secondary block">Session:</span>
          <span className="text-theme-text-primary font-medium font-mono text-xs">
            {user.session_token ? user.session_token.substring(0, 12) + '...' : 'N/A'}
          </span>
        </div>
      </div>
    </div>
  );
}

function ChatHistory({ chats, loading, userName }) {
  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Skeleton.default
            key={i}
            height={120}
            highlightColor="var(--theme-bg-primary)"
            baseColor="var(--theme-bg-secondary)"
            className="rounded-lg"
          />
        ))}
      </div>
    );
  }

  if (chats.length === 0) {
    return (
      <div className="text-center py-16 bg-theme-bg-primary/20 rounded-lg border border-white/10">
        <ChatCircle size={64} className="mx-auto mb-4 text-theme-text-secondary opacity-50" />
        <h3 className="text-lg font-medium text-theme-text-primary mb-2">
          No Conversations Found
        </h3>
        <p className="text-theme-text-secondary">
          {userName} hasn't started any conversations yet.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-theme-text-primary mb-4">
        Conversations ({chats.length})
      </h3>
      {chats.map((chat) => (
        <ChatMessage key={chat.id} chat={chat} />
      ))}
    </div>
  );
}

function ChatMessage({ chat }) {
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const parseResponse = (jsonResponse) => {
    try {
      const json = JSON.parse(jsonResponse);
      return json.text || jsonResponse;
    } catch (e) {
      return jsonResponse;
    }
  };

  return (
    <div className="bg-theme-bg-primary/30 rounded-lg p-6 border border-white/10">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
            <User size={16} className="text-white" />
          </div>
          <span className="text-sm font-medium text-theme-text-primary">
            Chat Session
          </span>
          {chat.workspace?.name && (
            <span className="text-xs px-2 py-1 bg-theme-bg-secondary rounded text-theme-text-secondary">
              {chat.workspace.name}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 text-xs text-theme-text-secondary">
          <Clock size={12} />
          {formatDate(chat.createdAt)}
        </div>
      </div>
      
      <div className="space-y-4">
        {/* User Message */}
        <div className="bg-primary-button/10 rounded-lg p-4 border-l-4 border-primary-button">
          <div className="flex items-center gap-2 mb-2">
            <User size={14} className="text-primary-button" />
            <span className="text-xs font-medium text-theme-text-secondary">User:</span>
          </div>
          <div className="text-sm text-theme-text-primary whitespace-pre-wrap">
            {chat.prompt}
          </div>
        </div>
        
        {/* AI Response */}
        <div className="bg-green-500/10 rounded-lg p-4 border-l-4 border-green-500">
          <div className="flex items-center gap-2 mb-2">
            <ChatCircle size={14} className="text-green-500" />
            <span className="text-xs font-medium text-theme-text-secondary">Assistant:</span>
          </div>
          <div className="text-sm text-theme-text-primary whitespace-pre-wrap">
            {parseResponse(chat.response)}
          </div>
        </div>
      </div>
    </div>
  );
}
