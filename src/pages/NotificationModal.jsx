import { X } from "lucide-react";
import "../styles/NotificationModal.css"

const NotificationModal = ({ onClose }) => {
  return (
    <div className="modal-backdrop">
      {/* Modal Container */}
      <div className="modal-container">
        {/* Header */}
        <div className="modal-header">
          <h2 className="modal-title">Notifications</h2>
          <button
            onClick={onClose}
            className="close-btn"
            aria-label="Close notification modal"
          >
            <X className="w-5 h-5 block" />
          </button>
        </div>

        {/* Body */}
        <div className="modal-body">
          <p>No notifications</p>
        </div>
      </div>
    </div>
  );
};

export default NotificationModal;

