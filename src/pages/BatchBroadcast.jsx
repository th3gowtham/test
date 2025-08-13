import { MoreVertical, Send, Paperclip, X, Video } from 'lucide-react';
import "../styles/BatchBroadcast.css";
import BookCallModal from '../components/BookCallModal';
import FileUploadModal from '../components/FileUploadModal';
import FileViewer from '../components/FileViewer';
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../services/firebase';
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, getDoc, doc } from 'firebase/firestore';

const BatchBroadcast = ({ activeChat }) => {
  const { currentUser, userRole } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [showBookModal, setShowBookModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showFiles, setShowFiles] = useState(false);
  const [fileCount, setFileCount] = useState(0);
  const [showMenu, setShowMenu] = useState(false);
  const [showStudents, setShowStudents] = useState(false);
  const [batchStudents, setBatchStudents] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(false);

  const menuRef = useRef(null);
  const messagesEndRef = useRef(null);
  const [zoomLink, setZoomLink] = useState('');

  const { id: batchId, name: batchName, students: studentCount, subject } = activeChat || {};
  // Fetch batch students when showStudents is true
  useEffect(() => {
    if (!showStudents || !batchId) return;

    const fetchBatchStudents = async () => {
      setLoadingStudents(true);
      try {
        // Get the batch document to get student IDs
        const batchDoc = await getDoc(doc(db, 'batches', batchId));
        if (!batchDoc.exists()) {
          console.error('Batch not found');
          setBatchStudents([]);
          return;
        }

        const batchData = batchDoc.data();
        const studentIds = batchData.students || [];

        if (studentIds.length === 0) {
          setBatchStudents([]);
          return;
        }

        // Fetch student details from the Students collection
        const studentsData = [];
        for (const studentId of studentIds) {
          try {
            const studentDoc = await getDoc(doc(db, 'Students', studentId));
            if (studentDoc.exists()) {
              studentsData.push({
                id: studentId,
                name: studentDoc.data().name || 'Unknown Student',
                email: studentDoc.data().Gmail || studentDoc.data().email || 'No email',
                ...studentDoc.data()
              });
            }
          } catch (error) {
            console.error(`Error fetching student ${studentId}:`, error);
            // Add a placeholder for failed fetches
            studentsData.push({
              id: studentId,
              name: 'Unknown Student',
              email: 'Unable to load'
            });
          }
        }

        setBatchStudents(studentsData);
      } catch (error) {
        console.error('Error fetching batch students:', error);
        setBatchStudents([]);
      } finally {
        setLoadingStudents(false);
      }
    };

    fetchBatchStudents();
  }, [showStudents, batchId]);

  // Scroll to the bottom of the messages container
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Fetch messages in real-time
  useEffect(() => {
    if (!batchId) return;

    const messagesRef = collection(db, 'batches', batchId, 'messages');
    const q = query(messagesRef, orderBy('timestamp', 'asc'));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const msgs = querySnapshot.docs
        .map((doc) => ({
          id: doc.id,
          ...doc.data(),
          timestamp: doc.data().timestamp?.toDate()
        }))
        .filter((msg) => !msg.isPinned);
      setMessages(msgs);
    });

    return () => unsubscribe();
  }, [batchId]);

  // Subscribe to batch document to surface a pinned Zoom link banner
  useEffect(() => {
    if (!batchId) return;
    const batchRef = doc(db, 'batches', batchId);
    const unsub = onSnapshot(batchRef, (snap) => {
      const data = snap.data() || {};
      const link = typeof data.zoomLink === 'string' ? data.zoomLink : '';
      setZoomLink(link);
    });
    return () => unsub();
  }, [batchId]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (newMessage.trim() === '') return;

    try {
      // First get the batch document to get all receiver IDs
      const batchDoc = await getDoc(doc(db, 'batches', batchId));
      if (!batchDoc.exists()) {
        console.error('Batch not found');
        return;
      }

      const batchData = batchDoc.data();
      const receiverIds = (Array.isArray(batchData.receiverIds) && batchData.receiverIds.length > 0)
        ? batchData.receiverIds
        : Array.from(new Set([
          batchData.teacherId,
          batchData.receiverId,
          ...(Array.isArray(batchData.students) ? batchData.students : [])
        ].filter(Boolean)));

      // Save the message with all receiver IDs
      const messagesRef = collection(db, 'batches', batchId, 'messages');
      await addDoc(messagesRef, {
        text: newMessage,
        senderId: currentUser.uid,
        senderName: currentUser.displayName || (currentUser.email ? currentUser.email.split('@')[0] : 'User'),
        senderRole: userRole || 'student',
        receiverIds: receiverIds, // Store all receiver IDs with the message
        timestamp: serverTimestamp(),
      });

      setNewMessage('');
    } catch (error) {
      console.error("Error sending message: ", error);
    }
  };

  const handleFileUploaded = () => setShowUploadModal(false);
  const handleFileCountUpdate = (count) => setFileCount(count);

  // Handle clicks outside of the dropdown menu
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
    <div className="batch-broadcast">
      <div className="batch-header">
        <div className="batch-header-info">
          <div className="batch-avatar">
            <span>{batchName?.charAt(0)}</span>
          </div>
          <div className="batch-header-text">
            <h2>{batchName}</h2>
            <p> {studentCount} Students </p>
          </div>
        </div>
        <div className="session-btn-dropdown-container" ref={menuRef}>
          <button className="session-btn-dropdown-toggle" onClick={() => setShowMenu(p => !p)}>
            <MoreVertical size={23} />
          </button>
          {showMenu && (
            <div className="session-btn-dropdown-menu">
              <button className="session-btn-dropdown-item" onClick={() => { setShowBookModal(true); setShowMenu(false); }}>Book Session</button>
              <button className="session-btn-dropdown-item" onClick={() => { setShowFiles(true); setShowMenu(false); }}>
                View Files {fileCount > 0 && <span className="file-count-badge">{fileCount}</span>}
              </button>
              <button className='session-btn-dropdown-item' onClick={() => { setShowStudents(true); setShowMenu(false); }}>View Students</button>
            </div>
          )}
        </div>
      </div>

      <div className="batch-messages">
        {zoomLink && (
          <div
            className="pinned-zoom-banner"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              background: '#e6fffa',
              border: '1px solid #99f6e4',
              color: '#0f766e',
              padding: '10px 12px',
              borderRadius: 8,
              margin: '8px 12px',
            }}
          >
            <Video size={18} />
            <span style={{ fontWeight: 600 }}>Pinned session link:</span>
            <a
              href={zoomLink}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: '#0ea5e9', textDecoration: 'underline', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
              title={zoomLink}
            >
              {zoomLink}
            </a>
          </div>
        )}
        {(() => {
          // Helper: format date like PrivateChat
          const formatDate = (dateObj) => {
            if (!(dateObj instanceof Date)) return '';
            const today = new Date();
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const dStr = dateObj.toDateString();
            if (dStr === today.toDateString()) return 'Today';
            if (dStr === yesterday.toDateString()) return 'Yesterday';
            return dateObj.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
          };

          const elems = [];
          let lastDateKey = null;
          for (const msg of messages) {
            const senderRoleLower = String(msg.senderRole || '').toLowerCase();
            const viewerRoleLower = String(userRole || '').toLowerCase();

            const isYou = msg.senderId === currentUser.uid;
            const nameToShow = isYou
              ? 'You'
              : senderRoleLower === 'teacher'
                ? 'Teacher'
                : senderRoleLower === 'student'
                  ? 'Student'
                  : senderRoleLower === 'admin'
                    ? 'Admin'
                    : 'User';

            const avatarChar = isYou
              ? 'Y'
              : senderRoleLower === 'teacher'
                ? 'T'
                : senderRoleLower === 'student'
                  ? 'S'
                  : senderRoleLower === 'admin'
                    ? 'A'
                    : 'U';

            // Role class for avatar styling
            const roleClass = (isYou ? 'you' : (senderRoleLower || 'user')).toLowerCase();

            // Date separator logic
            const dateObj = msg.timestamp instanceof Date ? msg.timestamp : null;
            const dateKey = dateObj ? dateObj.toDateString() : null;
            if (dateKey && dateKey !== lastDateKey) {
              elems.push(
                <div key={`date-${dateKey}`} className="date-separator">{formatDate(dateObj)}</div>
              );
              lastDateKey = dateKey;
            }

            elems.push(
              <div key={msg.id} className={`batch-message ${isYou ? 'sent' : 'received'}`}>
                {/* <div className={`message-avatar role-${roleClass}`}>
                  <span>{avatarChar}</span>
                </div> */}
                <div className="message-content">
                  <div className="sender-name">{nameToShow}</div>
                  <div className="message-bubble">
                    <p className="bubble-text">{msg.text}</p>
                    <span className="bubble-time">
                      {dateObj ? dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Sending...'}
                    </span>
                  </div>
                </div>
              </div>
            );
          }
          return (<>{elems}</>);
        })()}
        <div ref={messagesEndRef} />
      </div>

      <form className="batch-input" onSubmit={handleSendMessage}>
        <div className="batch-input-wrapper">
          {(userRole?.toLowerCase() === 'teacher' || userRole?.toLowerCase() === 'admin') && (
            <button type="button" className="batch-attach-btn" onClick={() => setShowUploadModal(true)} title="Upload File">
              <Paperclip size={18} />
            </button>
          )}
          <input
            type="text"
            placeholder={`Type your message in ${batchName}...`}
            className="batch-text-input"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
          />
          <button type="submit" className="batch-send-btn">
            <Send size={20} />
          </button>
        </div>
      </form>

      <BookCallModal isOpen={showBookModal} onClose={() => setShowBookModal(false)} collectionName="batchBroadcastBookings" />
      <FileUploadModal isOpen={showUploadModal} onClose={() => setShowUploadModal(false)} batchId={batchId} onFileUploaded={handleFileUploaded} />

      {showFiles && (
        <div className="modal-overlay">
          <div className="modal-content file-viewer-modal">
            <div className="modal-header">
              <h3 data-file-count={`${fileCount} file${fileCount !== 1 ? 's' : ''}`}>
                Files - {batchName}
              </h3>
              <button className="modal-close-btn" onClick={() => setShowFiles(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <FileViewer batchId={batchId} userRole={userRole} onFileCountUpdate={handleFileCountUpdate} />
            </div>
          </div>
        </div>
      )}
      {showStudents && (
        <div className='batch-modal-student'>
            <div className='modal-overlay'>
          <div className='modal-content students-modal'>
            <div className="modal-header">
              <h3>Batch Students - {batchName}</h3>
              <button className="modal-close-btn" onClick={() => setShowStudents(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              {loadingStudents ? (
                <div className="loading-state">Loading students...</div>
              ) : batchStudents.length === 0 ? (
                <div className="empty-state">
                  <p>No students assigned to this batch yet.</p>
                </div>
              ) : (
                <div className="students-list">
                  {batchStudents.map((student, index) => (
                    <div key={student.id} className="student-item">
                      <div className="student-info">
                        <div className="student-name">{student.name}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
        </div>
      )}
    </div>
  );
};

export default BatchBroadcast;