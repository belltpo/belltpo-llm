import React, { useState, useEffect } from "react";
import Sidebar from "@/components/SettingsSidebar";
import { isMobile } from "react-device-detect";
import Admin from "@/models/admin";
import showToast from "@/utils/toast";
import { Clock, Calendar, Plus, X } from "@phosphor-icons/react";

export default function OfficeHours() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
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
  });

  const [newHoliday, setNewHoliday] = useState({
    name: "",
    date: "",
    recurring: false,
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      
      // Use the dedicated office hours API endpoint
      const response = await fetch('/api/office-hours', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();
      
      if (result.success && result.officeHours) {
        setSettings(result.officeHours);
      }
    } catch (error) {
      console.error("Failed to fetch office hours settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      // Use the dedicated office hours API endpoint
      const response = await fetch('/api/office-hours', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          officeHours: settings,
        }),
      });

      const result = await response.json();

      if (result.success) {
        showToast("Office hours settings saved successfully!", "success");
      } else {
        showToast(`Failed to save settings: ${result.error}`, "error");
      }
    } catch (error) {
      showToast("Failed to save office hours settings", "error");
      console.error("Save error:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleWeekdayChange = (day, field, value) => {
    setSettings(prev => ({
      ...prev,
      weekdays: {
        ...prev.weekdays,
        [day]: {
          ...prev.weekdays[day],
          [field]: value,
        },
      },
    }));
  };

  const addHoliday = () => {
    if (!newHoliday.name || !newHoliday.date) {
      showToast("Please enter both holiday name and date", "error");
      return;
    }

    setSettings(prev => ({
      ...prev,
      holidays: [...prev.holidays, { ...newHoliday, id: Date.now() }],
    }));

    setNewHoliday({ name: "", date: "", recurring: false });
  };

  const removeHoliday = (id) => {
    setSettings(prev => ({
      ...prev,
      holidays: prev.holidays.filter(h => h.id !== id),
    }));
  };

  const weekdayNames = {
    monday: "Monday",
    tuesday: "Tuesday", 
    wednesday: "Wednesday",
    thursday: "Thursday",
    friday: "Friday",
    saturday: "Saturday",
    sunday: "Sunday",
  };

  if (loading) {
    return (
      <div className="w-screen h-screen overflow-hidden bg-theme-bg-container flex">
        <Sidebar />
        <div className="relative w-full h-full flex flex-col">
          <div className="w-full h-full flex justify-center items-center">
            <div className="text-theme-text-primary">Loading office hours settings...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-screen h-screen overflow-hidden bg-theme-bg-container flex">
      <Sidebar />
      <div
        style={{ height: isMobile ? "100%" : "calc(100% - 32px)" }}
        className="relative md:ml-[2px] md:mr-[16px] md:my-[16px] md:rounded-[16px] bg-theme-bg-secondary w-full h-full overflow-y-scroll no-scroll border-2 border-theme-sidebar-border"
      >
        <div className="flex flex-col w-full px-1 md:pl-6 md:pr-[86px] md:py-6 py-16">
          <div className="w-full flex flex-col gap-y-1 pb-6 border-white border-b-2 border-opacity-10">
            <div className="items-center flex gap-x-4">
              <p className="text-lg leading-6 font-bold text-theme-text-primary">
                Office Hours Settings
              </p>
            </div>
            <p className="text-xs leading-[18px] font-base text-theme-text-secondary">
              Configure when the chat widget should show the prechat form vs direct chat access.
              During office hours, users go directly to chat. Outside office hours, they see the prechat form.
            </p>
          </div>

          <div className="w-full justify-end flex">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-x-2 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 font-medium transition-colors duration-200"
            >
              {saving ? "Saving..." : "Save Settings"}
            </button>
          </div>

          {/* Enable/Disable Office Hours */}
          <div className="flex flex-col gap-y-4 mt-6">
            <div className="bg-theme-bg-primary rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-theme-text-primary">
                  Office Hours System
                </h3>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.enabled}
                    onChange={(e) => setSettings(prev => ({ ...prev, enabled: e.target.checked }))}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                </label>
              </div>
              <p className="text-sm text-theme-text-secondary">
                When enabled, office hours determine whether users see the prechat form or go directly to chat.
              </p>
            </div>

            {/* Timezone */}
            <div className="bg-theme-bg-primary rounded-lg p-6">
              <h3 className="text-lg font-semibold text-theme-text-primary mb-4">
                Timezone
              </h3>
              <select
                value={settings.timezone}
                onChange={(e) => setSettings(prev => ({ ...prev, timezone: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg bg-theme-bg-secondary border border-theme-sidebar-border text-theme-text-primary"
              >
                <option value="Asia/Kolkata">India Standard Time (IST)</option>
                <option value="America/New_York">Eastern Time (EST/EDT)</option>
                <option value="America/Chicago">Central Time (CST/CDT)</option>
                <option value="America/Denver">Mountain Time (MST/MDT)</option>
                <option value="America/Los_Angeles">Pacific Time (PST/PDT)</option>
                <option value="Europe/London">Greenwich Mean Time (GMT)</option>
                <option value="Europe/Paris">Central European Time (CET)</option>
                <option value="Asia/Tokyo">Japan Standard Time (JST)</option>
                <option value="Australia/Sydney">Australian Eastern Time (AEST)</option>
              </select>
            </div>

            {/* Weekly Schedule */}
            <div className="bg-theme-bg-primary rounded-lg p-6">
              <h3 className="text-lg font-semibold text-theme-text-primary mb-4">
                Weekly Schedule
              </h3>
              <div className="space-y-4">
                {Object.entries(weekdayNames).map(([key, name]) => (
                  <div key={key} className="flex items-center gap-4 p-3 bg-theme-bg-secondary rounded-lg">
                    <div className="w-24">
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.weekdays[key].enabled}
                          onChange={(e) => handleWeekdayChange(key, 'enabled', e.target.checked)}
                          className="mr-2"
                        />
                        <span className="text-theme-text-primary font-medium">{name}</span>
                      </label>
                    </div>
                    {settings.weekdays[key].enabled && (
                      <div className="flex items-center gap-2">
                        <input
                          type="time"
                          value={settings.weekdays[key].start}
                          onChange={(e) => handleWeekdayChange(key, 'start', e.target.value)}
                          className="px-2 py-1 rounded bg-theme-bg-container border border-theme-sidebar-border text-theme-text-primary"
                        />
                        <span className="text-theme-text-secondary">to</span>
                        <input
                          type="time"
                          value={settings.weekdays[key].end}
                          onChange={(e) => handleWeekdayChange(key, 'end', e.target.value)}
                          className="px-2 py-1 rounded bg-theme-bg-container border border-theme-sidebar-border text-theme-text-primary"
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Holidays */}
            <div className="bg-theme-bg-primary rounded-lg p-6">
              <h3 className="text-lg font-semibold text-theme-text-primary mb-4 flex items-center gap-2">
                <Calendar size={20} />
                Holidays & Special Dates
              </h3>
              <p className="text-sm text-theme-text-secondary mb-4">
                Add holidays or special dates when the prechat form should be shown regardless of regular office hours.
              </p>

              {/* Add New Holiday */}
              <div className="bg-theme-bg-secondary rounded-lg p-4 mb-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <input
                    type="text"
                    placeholder="Holiday name"
                    value={newHoliday.name}
                    onChange={(e) => setNewHoliday(prev => ({ ...prev, name: e.target.value }))}
                    className="px-3 py-2 rounded bg-theme-bg-container border border-theme-sidebar-border text-theme-text-primary"
                  />
                  <input
                    type="date"
                    value={newHoliday.date}
                    onChange={(e) => setNewHoliday(prev => ({ ...prev, date: e.target.value }))}
                    className="px-3 py-2 rounded bg-theme-bg-container border border-theme-sidebar-border text-theme-text-primary"
                  />
                  <label className="flex items-center gap-2 text-theme-text-primary">
                    <input
                      type="checkbox"
                      checked={newHoliday.recurring}
                      onChange={(e) => setNewHoliday(prev => ({ ...prev, recurring: e.target.checked }))}
                    />
                    <span className="text-sm">Recurring yearly</span>
                  </label>
                  <button
                    onClick={addHoliday}
                    className="flex items-center justify-center gap-2 px-3 py-2 bg-theme-action-primary text-theme-text-primary rounded hover:bg-theme-action-primary-hover"
                  >
                    <Plus size={16} />
                    Add
                  </button>
                </div>
              </div>

              {/* Holiday List */}
              <div className="space-y-2">
                {settings.holidays.map((holiday) => (
                  <div key={holiday.id} className="flex items-center justify-between p-3 bg-theme-bg-secondary rounded-lg">
                    <div className="flex items-center gap-3">
                      <Calendar size={16} className="text-theme-text-secondary" />
                      <div>
                        <span className="text-theme-text-primary font-medium">{holiday.name}</span>
                        <span className="text-theme-text-secondary ml-2">
                          {new Date(holiday.date).toLocaleDateString()}
                          {holiday.recurring && " (Yearly)"}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => removeHoliday(holiday.id)}
                      className="p-1 text-red-500 hover:text-red-700"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
                {settings.holidays.length === 0 && (
                  <p className="text-theme-text-secondary text-center py-4">
                    No holidays configured. Add holidays above to override regular office hours.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
