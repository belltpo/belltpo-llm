import React, { useState, useEffect } from "react";
import { 
  Users, 
  Envelope as Mail, 
  Phone, 
  Globe, 
  Calendar, 
  Download, 
  Eye, 
  Trash, 
  FunnelSimple as Filter,
  MagnifyingGlass as Search,
  ArrowClockwise as RefreshCw,
  ChartBar as BarChart3,
  TrendingUp
} from "@phosphor-icons/react";
import Sidebar from "@/components/Sidebar";
import { useUser } from "@/hooks/useUser";
import Admin from "@/models/admin";
import showToast from "@/utils/toast";

export default function PrechatDashboard() {
  const { user } = useUser();
  const [loading, setLoading] = useState(true);
  const [submissions, setSubmissions] = useState([]);
  const [stats, setStats] = useState({});
  const [filters, setFilters] = useState({
    status: "",
    search: "",
    startDate: "",
    endDate: ""
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({});

  useEffect(() => {
    fetchSubmissions();
    fetchStats();
  }, [currentPage, filters]);

  const fetchSubmissions = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        page: currentPage,
        limit: 20,
        ...Object.fromEntries(Object.entries(filters).filter(([_, v]) => v))
      });

      const response = await Admin.prechat.getSubmissions(queryParams.toString());
      if (response.success) {
        setSubmissions(response.submissions);
        setPagination(response.pagination);
      } else {
        showToast("Failed to fetch submissions", "error");
      }
    } catch (error) {
      console.error("Error fetching submissions:", error);
      showToast("Error loading submissions", "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await Admin.prechat.getStats();
      if (response.success) {
        setStats(response.stats);
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const handleStatusUpdate = async (uuid, newStatus) => {
    try {
      const response = await Admin.prechat.updateStatus(uuid, newStatus);
      if (response.success) {
        showToast("Status updated successfully", "success");
        fetchSubmissions();
      } else {
        showToast("Failed to update status", "error");
      }
    } catch (error) {
      console.error("Error updating status:", error);
      showToast("Error updating status", "error");
    }
  };

  const handleDelete = async (uuid) => {
    if (!confirm("Are you sure you want to delete this submission?")) return;
    
    try {
      const response = await Admin.prechat.deleteSubmission(uuid);
      if (response.success) {
        showToast("Submission deleted successfully", "success");
        fetchSubmissions();
        fetchStats();
      } else {
        showToast("Failed to delete submission", "error");
      }
    } catch (error) {
      console.error("Error deleting submission:", error);
      showToast("Error deleting submission", "error");
    }
  };

  const handleExport = async () => {
    try {
      const queryParams = new URLSearchParams(
        Object.fromEntries(Object.entries(filters).filter(([_, v]) => v))
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

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'submitted': return 'bg-blue-100 text-blue-800';
      case 'contacted': return 'bg-yellow-100 text-yellow-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      case 'archived': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="w-screen h-screen overflow-hidden bg-sidebar flex">
      <Sidebar />
      <div className="flex flex-col w-full h-full overflow-y-scroll">
        <div className="flex-1 p-6">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Prechat Dashboard</h1>
            <p className="text-white/60">Manage and analyze prechat form submissions</p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/60 text-sm">Total Submissions</p>
                  <p className="text-2xl font-bold text-white">{stats.total || 0}</p>
                </div>
                <Users className="h-8 w-8 text-blue-400" />
              </div>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/60 text-sm">Today</p>
                  <p className="text-2xl font-bold text-white">{stats.today || 0}</p>
                </div>
                <Calendar className="h-8 w-8 text-green-400" />
              </div>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/60 text-sm">This Week</p>
                  <p className="text-2xl font-bold text-white">{stats.week || 0}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-purple-400" />
              </div>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/60 text-sm">This Month</p>
                  <p className="text-2xl font-bold text-white">{stats.month || 0}</p>
                </div>
                <BarChart3 className="h-8 w-8 text-orange-400" />
              </div>
            </div>
          </div>

          {/* Filters and Actions */}
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 mb-6">
            <div className="flex flex-wrap gap-4 items-center justify-between">
              <div className="flex flex-wrap gap-4 items-center">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/60" />
                  <input
                    type="text"
                    placeholder="Search by name or email..."
                    value={filters.search}
                    onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                    className="pl-10 pr-4 py-2 bg-white/20 border border-white/30 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <select
                  value={filters.status}
                  onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                  className="px-4 py-2 bg-white/20 border border-white/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Status</option>
                  <option value="submitted">Submitted</option>
                  <option value="contacted">Contacted</option>
                  <option value="resolved">Resolved</option>
                  <option value="archived">Archived</option>
                </select>
                
                <input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
                  className="px-4 py-2 bg-white/20 border border-white/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                
                <input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
                  className="px-4 py-2 bg-white/20 border border-white/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={fetchSubmissions}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  <RefreshCw size={16} />
                  Refresh
                </button>
                
                <button
                  onClick={handleExport}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                >
                  <Download size={16} />
                  Export CSV
                </button>
              </div>
            </div>
          </div>

          {/* Submissions Table */}
          <div className="bg-white/10 backdrop-blur-sm rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-white/20">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white/80 uppercase tracking-wider">
                      Contact Info
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white/80 uppercase tracking-wider">
                      Location
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white/80 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white/80 uppercase tracking-wider">
                      Submitted
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white/80 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {loading ? (
                    <tr>
                      <td colSpan="5" className="px-6 py-8 text-center text-white/60">
                        <div className="flex items-center justify-center">
                          <RefreshCw className="animate-spin h-6 w-6 mr-2" />
                          Loading submissions...
                        </div>
                      </td>
                    </tr>
                  ) : submissions.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="px-6 py-8 text-center text-white/60">
                        No submissions found
                      </td>
                    </tr>
                  ) : (
                    submissions.map((submission) => (
                      <tr key={submission.uuid} className="hover:bg-white/5">
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center">
                                <Users className="h-5 w-5 text-white" />
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-white">{submission.name}</div>
                              <div className="text-sm text-white/60 flex items-center">
                                <Mail className="h-3 w-3 mr-1" />
                                {submission.email}
                              </div>
                              <div className="text-sm text-white/60 flex items-center">
                                <Phone className="h-3 w-3 mr-1" />
                                {submission.mobile}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center text-sm text-white/80">
                            <Globe className="h-4 w-4 mr-2" />
                            {submission.region}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <select
                            value={submission.status}
                            onChange={(e) => handleStatusUpdate(submission.uuid, e.target.value)}
                            className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(submission.status)} border-0 focus:outline-none focus:ring-2 focus:ring-blue-500`}
                          >
                            <option value="submitted">Submitted</option>
                            <option value="contacted">Contacted</option>
                            <option value="resolved">Resolved</option>
                            <option value="archived">Archived</option>
                          </select>
                        </td>
                        <td className="px-6 py-4 text-sm text-white/80">
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-2" />
                            {formatDate(submission.created_at)}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm font-medium">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleDelete(submission.uuid)}
                              className="text-red-400 hover:text-red-300 transition-colors"
                              title="Delete submission"
                            >
                              <Trash size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            
            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="bg-white/20 px-6 py-3 flex items-center justify-between">
                <div className="text-sm text-white/60">
                  Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} results
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={!pagination.hasPrev}
                    className="px-3 py-1 bg-white/20 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/30 transition-colors"
                  >
                    Previous
                  </button>
                  <span className="px-3 py-1 text-white/80">
                    Page {pagination.page} of {pagination.totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, pagination.totalPages))}
                    disabled={!pagination.hasNext}
                    className="px-3 py-1 bg-white/20 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/30 transition-colors"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
