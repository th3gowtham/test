import { User, X } from "lucide-react";
import ProfileTab from "./ProfileTab";
import SettingsTab from "./SettingsTab";
import AccountTab from "./AccountTab";
import SlotBooking from "./SlotBooking"; // Only needed for Teacher
import "../styles/ProfileSettingsModal.css";

const ProfileSettingsModal = ({ onClose, activeTab, setActiveTab, userRole }) => {
  // Base tabs for everyone
  const tabs = ["Profile", "Settings", "Account"];

  // --- MODIFICATION START ---
  // Add "Slots" tab only for Teacher
  if (userRole === "Teacher") {
    tabs.push("Slots");
  }
  // --- MODIFICATION END ---

  return (
    <div className="modal-backdrop">
      <div className="modal-container">
        {/* Header */}
        <div className="modal-header">
          <div>
            <h2 className="modal-title">
              <User size={20} />
              Profile Settings
            </h2>
            <p className="modal-subtitle">
              Manage your account settings and preferences
            </p>
          </div>
          <button
            onClick={onClose}
            className="modal-close-btn"
            aria-label="Close profile settings modal"
          >
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="modal-tabs">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`modal-tab ${activeTab === tab ? "active" : ""}`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="modal-content">
          {activeTab === "Profile" && <ProfileTab />}
          {activeTab === "Settings" && <SettingsTab />}
          {activeTab === "Account" && <AccountTab />}
          {activeTab === "Slots" && userRole === "Teacher" && <SlotBooking />}
        </div>
      </div>
    </div>
  );
};

export default ProfileSettingsModal;
