const { SystemSettings } = require("../../../models/systemSettings");
const { reqBody } = require("../../../utils/http");

function officeHoursEndpoints(app) {
  if (!app) return;

  // Get office hours settings
  app.get("/api/office-hours", async (request, response) => {
    try {
      const settings = await SystemSettings.get({ label: "office_hours" });
      const officeHours = settings?.office_hours ? JSON.parse(settings.office_hours) : getDefaultOfficeHours();
      
      response.status(200).json({
        success: true,
        officeHours,
      });
    } catch (error) {
      console.error("Failed to fetch office hours:", error);
      response.status(500).json({
        success: false,
        error: "Failed to fetch office hours settings",
      });
    }
  });

  // Update office hours settings
  app.post("/api/office-hours", async (request, response) => {
    try {
      const { officeHours } = reqBody(request);
      
      if (!officeHours) {
        return response.status(400).json({
          success: false,
          error: "Office hours configuration is required",
        });
      }

      // Validate office hours structure
      const validationError = validateOfficeHours(officeHours);
      if (validationError) {
        return response.status(400).json({
          success: false,
          error: validationError,
        });
      }

      const { success, error } = await SystemSettings.updateSettings({
        office_hours: JSON.stringify(officeHours),
      });

      if (success) {
        response.status(200).json({
          success: true,
          message: "Office hours updated successfully",
        });
      } else {
        response.status(500).json({
          success: false,
          error: error || "Failed to update office hours",
        });
      }
    } catch (error) {
      console.error("Failed to update office hours:", error);
      response.status(500).json({
        success: false,
        error: "Failed to update office hours settings",
      });
    }
  });

  // Check if currently in office hours
  app.get("/api/office-hours/status", async (request, response) => {
    try {
      const settings = await SystemSettings.get({ label: "office_hours" });
      const officeHours = settings?.office_hours ? JSON.parse(settings.office_hours) : getDefaultOfficeHours();
      
      const status = getCurrentOfficeHoursStatus(officeHours);
      
      response.status(200).json({
        success: true,
        ...status,
      });
    } catch (error) {
      console.error("Failed to check office hours status:", error);
      response.status(500).json({
        success: false,
        error: "Failed to check office hours status",
      });
    }
  });
}

function getDefaultOfficeHours() {
  return {
    enabled: true,
    weekdays: {
      monday: { enabled: true, start: "10:00", end: "17:00" },
      tuesday: { enabled: true, start: "10:00", end: "17:00" },
      wednesday: { enabled: true, start: "10:00", end: "17:00" },
      thursday: { enabled: true, start: "10:00", end: "17:00" },
      friday: { enabled: true, start: "10:00", end: "17:00" },
      saturday: { enabled: false, start: "10:00", end: "17:00" },
      sunday: { enabled: false, start: "10:00", end: "17:00" },
    },
    holidays: [],
    timezone: "Asia/Kolkata",
  };
}

function validateOfficeHours(officeHours) {
  if (typeof officeHours !== 'object') {
    return "Office hours must be an object";
  }

  if (typeof officeHours.enabled !== 'boolean') {
    return "Office hours enabled flag must be a boolean";
  }

  if (!officeHours.weekdays || typeof officeHours.weekdays !== 'object') {
    return "Weekdays configuration is required";
  }

  const requiredDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  for (const day of requiredDays) {
    if (!officeHours.weekdays[day]) {
      return `Missing configuration for ${day}`;
    }
    
    const dayConfig = officeHours.weekdays[day];
    if (typeof dayConfig.enabled !== 'boolean') {
      return `Invalid enabled flag for ${day}`;
    }
    
    if (dayConfig.enabled) {
      if (!dayConfig.start || !dayConfig.end) {
        return `Missing start/end time for ${day}`;
      }
      
      // Validate time format (HH:MM)
      const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
      if (!timeRegex.test(dayConfig.start) || !timeRegex.test(dayConfig.end)) {
        return `Invalid time format for ${day}`;
      }
    }
  }

  if (!Array.isArray(officeHours.holidays)) {
    return "Holidays must be an array";
  }

  for (const holiday of officeHours.holidays) {
    if (!holiday.name || !holiday.date) {
      return "Each holiday must have a name and date";
    }
    
    // Validate date format
    if (isNaN(Date.parse(holiday.date))) {
      return `Invalid date format for holiday: ${holiday.name}`;
    }
  }

  return null; // No validation errors
}

function getCurrentOfficeHoursStatus(officeHours) {
  if (!officeHours.enabled) {
    return {
      isOfficeHours: false,
      reason: "Office hours system is disabled",
      showPrechatForm: true,
    };
  }

  const now = new Date();
  const timezone = officeHours.timezone || "Asia/Kolkata";
  
  // Convert to the configured timezone
  const localTime = new Date(now.toLocaleString("en-US", { timeZone: timezone }));
  const dayOfWeek = localTime.toLocaleDateString("en-US", { weekday: "lowercase", timeZone: timezone });
  
  // Check if today is a holiday
  const today = localTime.toISOString().split('T')[0]; // YYYY-MM-DD format
  const todayMonth = localTime.getMonth() + 1; // 1-12
  const todayDay = localTime.getDate();
  
  for (const holiday of officeHours.holidays) {
    const holidayDate = new Date(holiday.date);
    if (holiday.recurring) {
      // Check if month and day match for recurring holidays
      if (holidayDate.getMonth() + 1 === todayMonth && holidayDate.getDate() === todayDay) {
        return {
          isOfficeHours: false,
          reason: `Today is ${holiday.name} (holiday)`,
          showPrechatForm: true,
        };
      }
    } else {
      // Check exact date match for non-recurring holidays
      const holidayDateStr = holidayDate.toISOString().split('T')[0];
      if (holidayDateStr === today) {
        return {
          isOfficeHours: false,
          reason: `Today is ${holiday.name} (holiday)`,
          showPrechatForm: true,
        };
      }
    }
  }

  // Check if today is a configured work day
  const dayConfig = officeHours.weekdays[dayOfWeek];
  if (!dayConfig || !dayConfig.enabled) {
    return {
      isOfficeHours: false,
      reason: `${dayOfWeek} is not a work day`,
      showPrechatForm: true,
    };
  }

  // Check if current time is within office hours
  const currentTime = localTime.toTimeString().slice(0, 5); // HH:MM format
  const startTime = dayConfig.start;
  const endTime = dayConfig.end;

  if (currentTime >= startTime && currentTime <= endTime) {
    return {
      isOfficeHours: true,
      reason: `Within office hours (${startTime} - ${endTime})`,
      showPrechatForm: false,
    };
  } else {
    return {
      isOfficeHours: false,
      reason: `Outside office hours (${startTime} - ${endTime})`,
      showPrechatForm: true,
    };
  }
}

module.exports = { officeHoursEndpoints };
