import React, { useState, useEffect } from "react";
import { X, User, Mail, Phone, Globe, Send } from "react-feather";
import { COUNTRIES } from "./countries";

export default function PrechatForm({ onSubmit, onClose, workspaceId = null }) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    mobile: "",
    countryCode: "+91",
    region: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (error) setError("");
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      setError("Please enter your full name");
      return false;
    }
    if (!formData.email.trim()) {
      setError("Please enter your email address");
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError("Please enter a valid email address");
      return false;
    }
    if (!formData.mobile.trim()) {
      setError("Please enter your mobile number");
      return false;
    }
    if (!formData.region.trim()) {
      setError("Please select your country");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsSubmitting(true);
    setError("");

    try {
      const response = await fetch("/api/prechat/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          email: formData.email.trim().toLowerCase(),
          mobile: formData.countryCode + formData.mobile.trim(),
          region: formData.region,
          workspaceId: workspaceId,
          sessionId: Date.now().toString()
        }),
      });

      const result = await response.json();

      if (result.success) {
        if (onSubmit) {
          onSubmit(result.userData);
        }
      } else {
        setError(result.error || "Failed to submit form");
      }
    } catch (error) {
      console.error("Prechat form submission error:", error);
      setError("Network error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Sort countries alphabetically
  const sortedCountries = [...COUNTRIES].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md relative overflow-hidden">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors z-10"
        >
          <X size={20} className="text-gray-600" />
        </button>

        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-8 text-white">
          <div className="flex items-center justify-center mb-3">
            <img 
              src="/images/belltpo_logo.jpg" 
              alt="BellTPO Logo" 
              className="w-12 h-12 rounded-lg mr-3"
            />
            <h2 className="text-2xl font-bold">BellTPO Chat</h2>
          </div>
          <p className="text-blue-100 text-center text-sm">
            AI-Powered Support Assistant
          </p>
        </div>

        {/* Form */}
        <div className="p-6">
          <div className="text-center mb-6">
            <p className="text-gray-600 text-sm">
              Please provide your details to start a personalized chat session
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <User size={16} className="inline mr-2" />
                Full Name
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Enter your full name"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                required
              />
            </div>

            {/* Email Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Mail size={16} className="inline mr-2" />
                Email Address
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="Enter your email address"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                required
              />
            </div>

            {/* Mobile Number */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Phone size={16} className="inline mr-2" />
                Mobile Number
              </label>
              <div className="flex gap-3">
                <select
                  name="countryCode"
                  value={formData.countryCode}
                  onChange={handleInputChange}
                  className="px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white min-w-[120px]"
                >
                  {sortedCountries.map((country) => (
                    <option key={country.code} value={country.phoneCode}>
                      {country.flag} {country.phoneCode}
                    </option>
                  ))}
                </select>
                <input
                  type="tel"
                  name="mobile"
                  value={formData.mobile}
                  onChange={handleInputChange}
                  placeholder="Mobile number"
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  required
                />
              </div>
            </div>

            {/* Country Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Globe size={16} className="inline mr-2" />
                Country
              </label>
              <select
                name="region"
                value={formData.region}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                required
              >
                <option value="">Select your country</option>
                {sortedCountries.map((country) => (
                  <option key={country.code} value={country.name}>
                    {country.flag} {country.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:from-blue-600 hover:to-blue-700 focus:ring-4 focus:ring-blue-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Processing...
                </>
              ) : (
                <>
                  <Send size={18} className="mr-2" />
                  Start Chat Session
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
