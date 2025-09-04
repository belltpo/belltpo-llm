import React from "react";
import { Navigate } from "react-router-dom";

export default function GeneralSettings() {
  // Redirect to the main settings page
  return <Navigate to="/settings/llm-preference" replace />;
}
