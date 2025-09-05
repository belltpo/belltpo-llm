const { v4: uuidv4 } = require("uuid");
const prisma = require("../utils/prisma");

const PrechatSubmissions = {
  create: async function ({
    name,
    email,
    mobile,
    countryCode = null,
    region,
    message = null,
    workspaceId = null,
    sessionId = null,
    ipAddress = null,
    userAgent = null,
  }) {
    try {
      const uuid = uuidv4();
      
      const submission = await prisma.prechat_submissions.create({
        data: {
          uuid,
          name,
          email,
          mobile,
          country_code: countryCode,
          region,
          message,
          workspace_id: workspaceId,
          session_id: sessionId,
          ip_address: ipAddress,
          user_agent: userAgent,
        },
      });

      return { submission, error: null };
    } catch (error) {
      console.error("FAILED TO CREATE PRECHAT SUBMISSION:", error.message);
      return { submission: null, error: error.message };
    }
  },

  get: async function (whereClause = {}) {
    try {
      const result = await prisma.prechat_submissions.findFirst({
        where: whereClause,
      });
      return result;
    } catch (error) {
      console.error("FAILED TO GET PRECHAT SUBMISSION:", error.message);
      return null;
    }
  },

  where: async function (whereClause = {}, limit = null, orderBy = null) {
    try {
      const options = {
        where: whereClause,
      };
      
      if (orderBy) {
        options.orderBy = orderBy;
      }
      
      if (limit) {
        options.take = limit;
      }

      const results = await prisma.prechat_submissions.findMany(options);
      return results;
    } catch (error) {
      console.error("FAILED TO GET PRECHAT SUBMISSIONS:", error.message);
      return [];
    }
  },

  count: async function (whereClause = {}) {
    try {
      const count = await prisma.prechat_submissions.count({
        where: whereClause,
      });
      return count;
    } catch (error) {
      console.error("FAILED TO COUNT PRECHAT SUBMISSIONS:", error.message);
      return 0;
    }
  },

  all: async function () {
    try {
      const results = await prisma.prechat_submissions.findMany({
        orderBy: { createdAt: 'desc' },
      });
      return results;
    } catch (error) {
      console.error("FAILED TO GET ALL PRECHAT SUBMISSIONS:", error.message);
      return [];
    }
  },

  update: async function (uuid, updates) {
    try {
      const submission = await prisma.prechat_submissions.update({
        where: { uuid },
        data: updates,
      });
      return { submission, error: null };
    } catch (error) {
      console.error("FAILED TO UPDATE PRECHAT SUBMISSION:", error.message);
      return { submission: null, error: error.message };
    }
  },

  delete: async function (uuid) {
    try {
      await prisma.prechat_submissions.delete({
        where: { uuid },
      });
      return { success: true, error: null };
    } catch (error) {
      console.error("FAILED TO DELETE PRECHAT SUBMISSION:", error.message);
      return { success: false, error: error.message };
    }
  },

  getStats: async function () {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const total = await prisma.prechat_submissions.count();
      
      const todayCount = await prisma.prechat_submissions.count({
        where: {
          createdAt: {
            gte: today,
          },
        },
      });
      
      const uniqueSessions = await prisma.prechat_submissions.groupBy({
        by: ['session_id'],
        where: {
          session_id: {
            not: null,
          },
        },
      });

      const thisMonth = new Date();
      thisMonth.setDate(1);
      thisMonth.setHours(0, 0, 0, 0);
      
      const thisMonthCount = await prisma.prechat_submissions.count({
        where: {
          createdAt: {
            gte: thisMonth,
          },
        },
      });

      return {
        total: total || 0,
        today: todayCount || 0,
        thisMonth: thisMonthCount || 0,
        uniqueSessions: uniqueSessions.length || 0,
      };
    } catch (error) {
      console.error("FAILED TO GET PRECHAT STATS:", error.message);
      return {
        total: 0,
        today: 0,
        thisMonth: 0,
        uniqueSessions: 0,
      };
    }
  }
};

module.exports = { PrechatSubmissions };
