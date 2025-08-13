import { Calendar, MoreVertical, Bell, Send, X } from "lucide-react";
import "../styles/AnnouncementsView.css";
import { useState, useEffect, useRef } from "react";
import { useAuth } from '../context/AuthContext';
import { db } from '../services/firebase';
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp } from 'firebase/firestore';
import BookCallModal from '../components/BookCallModal';

const AnnouncementsView = () => {
  const { currentUser, userRole } = useAuth();
  const [showMenu, setShowMenu] = useState(false);
  const [showBookModal, setShowBookModal] = useState(false);
  const [announcements, setAnnouncements] = useState([]);
  const [newAnnouncement, setNewAnnouncement] = useState('');
  const menuRef = useRef(null);
  const messagesEndRef = useRef(null);

  // Check if user is admin
  const isAdmin = userRole?.toLowerCase() === 'admin';

  // Scroll to bottom when new announcements arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [announcements]);

  // Fetch announcements in real-time
  useEffect(() => {
    const announcementsRef = collection(db, 'communityAnnouncements');
    const q = query(announcementsRef, orderBy('timestamp', 'asc'));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const msgs = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate()
      }));
      setAnnouncements(msgs);
    });

    return () => unsubscribe();
  }, []);

  // Handle sending announcement (only for admins)
  const handleSendAnnouncement = async (e) => {
    e.preventDefault();
    if (!isAdmin || newAnnouncement.trim() === '') return;

    try {
      const announcementsRef = collection(db, 'communityAnnouncements');
      await addDoc(announcementsRef, {
        text: newAnnouncement,
        senderId: currentUser.uid,
        senderName: currentUser.displayName || (currentUser.email ? currentUser.email.split('@')[0] : 'Admin'),
        senderRole: 'admin',
        timestamp: serverTimestamp(),
      });

      setNewAnnouncement('');
    } catch (error) {
      console.error("Error sending announcement: ", error);
    }
  };

  // Helper to get a date key (YYYY-MM-DD)
  const getDateKey = (dateObj) => {
    return dateObj.toISOString().split("T")[0];
  };

  // Group announcements by date
  const groupByDate = (msgs) => {
    return msgs.reduce((groups, msg) => {
      if (!msg.timestamp) return groups;
      const dateKey = getDateKey(msg.timestamp);
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(msg);
      return groups;
    }, {});
  };

  // Format date header like WhatsApp
  const formatDateHeader = (dateObj) => {
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    if (dateObj.toDateString() === today.toDateString()) return "Today";
    if (dateObj.toDateString() === yesterday.toDateString()) return "Yesterday";

    return dateObj.toLocaleDateString("en-US", {
      day: "numeric",
      month: "short",
      year: today.getFullYear() === dateObj.getFullYear() ? undefined : "numeric"
    });
  };

  const groupedAnnouncements = groupByDate(announcements);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="announcements-container">
      {/* Header */}
      <div className="announcements-header">
        <div className="announcements-header-info">
          <div className="announcements-avatar">
            <Bell size={24} />
          </div>
          <div className="announcements-header-text">
            <h2>Community Announcements</h2>
            <p>🔔 Stay updated with the latest updates</p>
          </div>
        </div>
        <div className="session-btn-dropdown-container" ref={menuRef}>
          <button
            className="session-btn-dropdown-toggle"
            onClick={() => setShowMenu((prev) => !prev)}
            role='button'
            tabIndex={0}
          >
            <MoreVertical size={23} />
          </button>
          {showMenu && (
            <div className="session-btn-dropdown-menu">
              <button
                className="session-btn-dropdown-item"
                onClick={() => { 
                  setShowBookModal(true); 
                  setShowMenu(false); 
                }}
              >
                Book Session
              </button>
              <button
                className="session-btn-dropdown-item"
                onClick={() => {
                  console.log("View File clicked");
                  setShowMenu(false);
                }}
              >
                View File
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Announcements List */}
      <div className="announcements-list">
        {announcements.length === 0 ? (
          <div className="no-announcements">
            <Bell size={48} />
            <p>No announcements yet</p>
            <span>Check back later for updates</span>
          </div>
        ) : (
          Object.keys(groupedAnnouncements).map((dateKey) => {
            const dateObj = new Date(dateKey);
            return (
              <div key={dateKey}>
                {/* Date header */}
                <div className="date-header">
                  {formatDateHeader(dateObj)}
                </div>

                {/* Messages under this date */}
                {groupedAnnouncements[dateKey].map((announcement) => {
                  // Check if message is from admin or current user
                  const isFromAdmin = announcement.senderRole?.toLowerCase() === 'admin';
                  const isFromCurrentUser = announcement.senderId === currentUser?.uid;
                  
                  // Determine message alignment:
                  // - If current user is admin and sent the message: right side
                  // - If message is from admin but current user is not admin: left side  
                  // - All other messages: left side
                  const shouldAlignRight = isFromCurrentUser && isAdmin;
                  
                  return (
                    <div 
                      key={announcement.id} 
                      className={`message-wrapper ${shouldAlignRight ? 'admin-message' : 'user-message'}`}
                    >
                      <div className="announcement-card">
                        <div className="announcement-header">
                          {/* {!shouldAlignRight && (
                            <div className={`announcement-avatar ${
                              isFromAdmin ? 'avatar-admin' : 
                              announcement.senderRole?.toLowerCase() === 'teacher' ? 'avatar-teacher' : 'avatar-student'
                            }`}>
                              {announcement.senderName?.charAt(0).toUpperCase() || 
                               (isFromAdmin ? 'A' : 'U')}
                            </div>
                          )} */}
                          <div className="announcement-info">
                            {!shouldAlignRight && (
                              <span className="announcement-author">
                                {announcement.senderName || (isFromAdmin ? 'Admin' : 'Unknown User')}
                              </span>
                            )}
                          </div>
                        </div>
                        <p className="announcement-text">{announcement.text}</p>
                        <div className="announcement-footer">
                          <span className="announcement-time">
                            {announcement.timestamp
                              ? announcement.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                              : "Sending..."}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Section - Only for Admins */}
      {isAdmin ? (
        <form className="announcement-input" onSubmit={handleSendAnnouncement}>
          <div className="announcement-input-wrapper">
            <input
              type="text"
              placeholder="Type your announcement for the community..."
              className="announcement-text-input"
              value={newAnnouncement}
              onChange={(e) => setNewAnnouncement(e.target.value)}
            />
            <button type="submit" className="announcement-send-btn">
              <Send size={20} />
            </button>
          </div>
        </form>
      ) : (
        <div>
          <p className="admin-footer-message">Only admins can send messages</p>
        </div>
      )}

      {/* Book Call Modal */}
      <BookCallModal 
        isOpen={showBookModal} 
        onClose={() => setShowBookModal(false)} 
        collectionName="communityAnnouncementBookings" 
      />
    </div>
  );
};

export default AnnouncementsView;