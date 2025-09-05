const { PrechatSubmissions } = require("../../../models/prechatSubmissions");
const { reqBody } = require("../../../utils/http");
const { validApiKey } = require("../../../utils/middleware/validApiKey");
const { broadcastNewPrechatSubmission } = require("../../websocketDashboard");

function prechatEndpoints(app) {
  if (!app) return;

  // Submit prechat form
  app.post("/api/prechat/submit", async (request, response) => {
    try {
      console.log("📝 Prechat form submission received:", request.body);
      const { name, email, mobile, countryCode, region, message, workspaceId, sessionId } = reqBody(request);
      
      console.log("📋 Extracted fields:", { name, email, mobile, countryCode, region, message });
      
      // Validate required fields
      if (!name || !email || !mobile || !region) {
        console.log("❌ Validation failed - missing fields");
        return response.status(400).json({
          success: false,
          error: "Missing required fields: name, email, mobile, region"
        });
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return response.status(400).json({
          success: false,
          error: "Invalid email format"
        });
      }

      // Get client info
      const ipAddress = request.ip || request.connection.remoteAddress;
      const userAgent = request.get('User-Agent');

      // Create submission
      const { submission, error } = await PrechatSubmissions.create({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        mobile: mobile.trim(),
        countryCode: countryCode || null,
        region: region.trim(),
        message: message ? message.trim() : null,
        workspaceId: workspaceId || null,
        sessionId: sessionId || null,
        ipAddress,
        userAgent
      });

      if (error) {
        console.error("Error creating prechat submission:", error);
        return response.status(500).json({
          success: false,
          error: "Failed to save submission"
        });
      }

      // Broadcast new submission to dashboard via WebSocket
      try {
        broadcastNewPrechatSubmission(submission);
        console.log("✅ Broadcasted new prechat submission to dashboard");
      } catch (wsError) {
        console.error("⚠️ Failed to broadcast to dashboard:", wsError.message);
      }

      response.status(200).json({
        success: true,
        message: "Prechat form submitted successfully",
        submissionId: submission.uuid,
        userData: {
          name: submission.name,
          email: submission.email,
          mobile: submission.mobile,
          region: submission.region
        }
      });

    } catch (error) {
      console.error("Prechat submission error:", error);
      response.status(500).json({
        success: false,
        error: "Internal server error"
      });
    }
  });

  // Get all submissions (admin only)
  app.get("/api/prechat/submissions", [validApiKey], async (request, response) => {
    try {
      const { page = 1, limit = 50, status, workspaceId, startDate, endDate } = request.query;
      
      let submissions = [];
      
      if (status) {
        submissions = await PrechatSubmissions.getByStatus(status, parseInt(limit));
      } else if (workspaceId) {
        submissions = await PrechatSubmissions.getByWorkspace(parseInt(workspaceId), parseInt(limit));
      } else if (startDate && endDate) {
        submissions = await PrechatSubmissions.getByDateRange(startDate, endDate);
      } else {
        submissions = await PrechatSubmissions.getRecent(parseInt(limit));
      }

      // Calculate pagination
      const total = await PrechatSubmissions.count();
      const totalPages = Math.ceil(total / parseInt(limit));

      response.status(200).json({
        success: true,
        submissions,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages,
          hasNext: parseInt(page) < totalPages,
          hasPrev: parseInt(page) > 1
        }
      });

    } catch (error) {
      console.error("Error fetching prechat submissions:", error);
      response.status(500).json({
        success: false,
        error: "Failed to fetch submissions"
      });
    }
  });

  // Get submission statistics
  app.get("/api/prechat/stats", [validApiKey], async (request, response) => {
    try {
      const stats = await PrechatSubmissions.getStats();
      
      response.status(200).json({
        success: true,
        stats
      });

    } catch (error) {
      console.error("Error fetching prechat stats:", error);
      response.status(500).json({
        success: false,
        error: "Failed to fetch statistics"
      });
    }
  });

  // Get single submission by ID
  app.get("/api/prechat/submission/:uuid", [validApiKey], async (request, response) => {
    try {
      const { uuid } = request.params;
      
      const submission = await PrechatSubmissions.get(`WHERE uuid = '${uuid}'`);
      
      if (!submission) {
        return response.status(404).json({
          success: false,
          error: "Submission not found"
        });
      }

      response.status(200).json({
        success: true,
        submission
      });

    } catch (error) {
      console.error("Error fetching prechat submission:", error);
      response.status(500).json({
        success: false,
        error: "Failed to fetch submission"
      });
    }
  });

  // Update submission status
  app.put("/api/prechat/submission/:uuid/status", [validApiKey], async (request, response) => {
    try {
      const { uuid } = request.params;
      const { status } = reqBody(request);
      
      if (!status || !['submitted', 'contacted', 'resolved', 'archived'].includes(status)) {
        return response.status(400).json({
          success: false,
          error: "Invalid status. Must be one of: submitted, contacted, resolved, archived"
        });
      }

      const submission = await PrechatSubmissions.get(`WHERE uuid = '${uuid}'`);
      
      if (!submission) {
        return response.status(404).json({
          success: false,
          error: "Submission not found"
        });
      }

      const { success, error } = await PrechatSubmissions.update(submission.id, { status });
      
      if (!success) {
        return response.status(500).json({
          success: false,
          error: error || "Failed to update submission"
        });
      }

      response.status(200).json({
        success: true,
        message: "Submission status updated successfully"
      });

    } catch (error) {
      console.error("Error updating prechat submission:", error);
      response.status(500).json({
        success: false,
        error: "Failed to update submission"
      });
    }
  });

  // Delete submission
  app.delete("/api/prechat/submission/:uuid", [validApiKey], async (request, response) => {
    try {
      const { uuid } = request.params;
      
      const submission = await PrechatSubmissions.get(`WHERE uuid = '${uuid}'`);
      
      if (!submission) {
        return response.status(404).json({
          success: false,
          error: "Submission not found"
        });
      }

      const { success, error } = await PrechatSubmissions.delete(`WHERE uuid = '${uuid}'`);
      
      if (!success) {
        return response.status(500).json({
          success: false,
          error: error || "Failed to delete submission"
        });
      }

      response.status(200).json({
        success: true,
        message: "Submission deleted successfully"
      });

    } catch (error) {
      console.error("Error deleting prechat submission:", error);
      response.status(500).json({
        success: false,
        error: "Failed to delete submission"
      });
    }
  });

  // Export submissions as CSV
  app.get("/api/prechat/export", [validApiKey], async (request, response) => {
    try {
      const { startDate, endDate, status } = request.query;
      
      let submissions = [];
      
      if (startDate && endDate) {
        submissions = await PrechatSubmissions.getByDateRange(startDate, endDate);
      } else if (status) {
        submissions = await PrechatSubmissions.getByStatus(status);
      } else {
        submissions = await PrechatSubmissions.getRecent(1000); // Max 1000 for export
      }

      // Convert to CSV
      const csvHeaders = ['UUID', 'Name', 'Email', 'Mobile', 'Region', 'Status', 'Created At', 'IP Address'];
      const csvRows = submissions.map(sub => [
        sub.uuid,
        sub.name,
        sub.email,
        sub.mobile,
        sub.region,
        sub.status,
        sub.created_at,
        sub.ip_address || 'N/A'
      ]);

      const csvContent = [csvHeaders, ...csvRows]
        .map(row => row.map(field => `"${field}"`).join(','))
        .join('\n');

      response.setHeader('Content-Type', 'text/csv');
      response.setHeader('Content-Disposition', `attachment; filename="prechat-submissions-${new Date().toISOString().split('T')[0]}.csv"`);
      response.status(200).send(csvContent);

    } catch (error) {
      console.error("Error exporting prechat submissions:", error);
      response.status(500).json({
        success: false,
        error: "Failed to export submissions"
      });
    }
  });
}

module.exports = { prechatEndpoints };
