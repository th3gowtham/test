import React, { useState, useEffect } from "react";
import "../styles/SettingsTab.css";
import { ToastContainer, toast } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';
import { db } from '../services/firebase.js';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { Save } from "lucide-react";
import { useAuth } from '../context/AuthContext';

const defaultSettings = { message: true, booking: true, announcement: false, email: true };

const SettingsTab = () => {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState(defaultSettings);

  useEffect(() => {
    async function fetchSettings() {
      if (!user?.email) return; // Wait for user authentication
      try {
        const docRef = doc(db, 'settings', user.email);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) setPreferences({ ...defaultSettings, ...docSnap.data() });
      } catch (err) {
        toast.error('Failed to load settings');
        console.error(err);
      }
    }
    fetchSettings();
  }, [user]);

  const handleToggle = (key) => {
    setPreferences((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = async () => {
    if (!user?.email) {
      toast.error('User not authenticated');
      return;
    }
    try {
      await setDoc(doc(db, 'settings', user.email), preferences, { merge: true });
      toast.success("Settings saved successfully!");
    } catch (err) {
      toast.error("Failed to update settings!");
      console.error(err);
    }
  };



  return (
    <div className="settings-tab">
      <ToastContainer
        position="top-center"
        autoClose={3000}
        hideProgressBar
        closeOnClick
        pauseOnHover
        draggable
      />
      <div className="settings-section">
        <h3 className="section-title">Notification Preferences</h3>
        <p className="section-description">Manage how you receive notifications from Honeybee.</p>

        <div className="preference-item">
          <div className="preference-text">
            <h4 className="preference-title">Message Notifications</h4>
            <p className="preference-subtitle">Get notified about new messages</p>
          </div>
          <div className="toggle-switch" onClick={() => handleToggle("message")}>
            <div className={`toggle-slider ${preferences.message ? 'active' : ''}`}>
              <div className="toggle-knob"></div>
            </div>
          </div>
        </div>

        <div className="preference-item">
          <div className="preference-text">
            <h4 className="preference-title">Booking Notifications</h4>
            <p className="preference-subtitle">Get notified about booking requests and updates</p>
          </div>
          <div className="toggle-switch" onClick={() => handleToggle("booking")}>
            <div className={`toggle-slider ${preferences.booking ? 'active' : ''}`}>
              <div className="toggle-knob"></div>
            </div>
          </div>
        </div>

        <div className="preference-item">
          <div className="preference-text">
            <h4 className="preference-title">Announcement Notifications</h4>
            <p className="preference-subtitle">Get notified about community announcements</p>
          </div>
          <div className="toggle-switch" onClick={() => handleToggle("announcement")}>
            <div className={`toggle-slider ${preferences.announcement ? 'active' : ''}`}>
              <div className="toggle-knob"></div>
            </div>
          </div>
        </div>

        <div className="preference-item">
          <div className="preference-text">
            <h4 className="preference-title">Email Notifications</h4>
            <p className="preference-subtitle">Receive notifications via email</p>
          </div>
          <div className="toggle-switch" onClick={() => handleToggle("email")}>
            <div className={`toggle-slider ${preferences.email ? 'active' : ''}`}>
              <div className="toggle-knob"></div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", width: "100%", marginTop: "1.5rem" }}>
        <button className="save-button" onClick={handleSave} style={{
          backgroundColor: "#059669", // green-600
          color: "#fff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "0.5em",
          fontWeight: 600,
          fontSize: "1rem",
          border: "none",
          borderRadius: "0.5rem",
          padding: "0.75rem 4rem",
          minWidth: "650px",
          width: "auto",
          cursor: "pointer"
        }}>
          <Save size={20} />
          Save Changes
        </button>
      </div>
    </div>
  );
};
export default SettingsTab;