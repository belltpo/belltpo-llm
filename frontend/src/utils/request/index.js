import { API_BASE } from "../constants";
import { baseHeaders } from "../request";

const Request = {
  get: (endpoint, queryParams = {}) => {
    const url = new URL(`${API_BASE}${endpoint}`);
    Object.keys(queryParams).forEach(key => 
      url.searchParams.append(key, queryParams[key])
    );
    
    return fetch(url.toString(), {
      method: "GET",
      headers: baseHeaders(),
    })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        return res.json();
      })
      .catch((e) => {
        console.error("Request GET error:", e);
        throw e;
      });
  },

  post: (endpoint, data = {}) => {
    return fetch(`${API_BASE}${endpoint}`, {
      method: "POST",
      body: JSON.stringify(data),
      headers: baseHeaders(),
    })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        return res.json();
      })
      .catch((e) => {
        console.error("Request POST error:", e);
        throw e;
      });
  },

  delete: (endpoint, data = {}) => {
    return fetch(`${API_BASE}${endpoint}`, {
      method: "DELETE",
      body: JSON.stringify(data),
      headers: baseHeaders(),
    })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        return res.json();
      })
      .catch((e) => {
        console.error("Request DELETE error:", e);
        throw e;
      });
  },

  // Alternative dashboard methods
  alternativeDashboard: {
    getSessions: () => {
      const url = `${window.location.origin}/api/alternative-dashboard/sessions`;
      console.log('Fetching sessions from:', url);
      return fetch(url, {
        method: "GET",
        headers: baseHeaders(),
      })
        .then((res) => {
          console.log('Sessions response status:', res.status);
          if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
          return res.json();
        })
        .catch((e) => {
          console.error("Alternative dashboard getSessions error:", e);
          throw e;
        });
    },

    getSessionDetails: (sessionId) => {
      const url = `${window.location.origin}/api/alternative-dashboard/sessions/${sessionId}`;
      console.log('Fetching session details from:', url);
      return fetch(url, {
        method: "GET",
        headers: baseHeaders(),
      })
        .then((res) => {
          console.log('Session details response status:', res.status);
          if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
          return res.json();
        })
        .catch((e) => {
          console.error("Alternative dashboard getSessionDetails error:", e);
          throw e;
        });
    }
  }
};

export default Request;
