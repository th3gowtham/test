import React, { useState, useEffect, useRef } from 'react';
import { Calendar, Send, Bell, MoreVertical, Paperclip } from "lucide-react";
import { useAuth } from '../context/AuthContext';
import { sendMessage, subscribeToMessages } from '../utils/chatUtils';
import { db } from '../services/firebase';
import { doc, getDoc, collection, query, where, getDocs, updateDoc } from 'firebase/firestore';
import "../styles/BatchBroadcast.css";
import BookCallModal from '../components/BookCallModal';
import FileUploadModal from '../components/FileUploadModal';
import FileViewer from '../components/FileViewer';

const PrivateChat = ({ activeChat, receiverId: propReceiverId, chatId: propChatId, courseName: propCourseName }) => {
  const { currentUser, userRole } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [receiverId, setReceiverId] = useState(propReceiverId || '');
  const [chatId, setChatId] = useState(propChatId || null);
  const [otherUserRole, setOtherUserRole] = useState('User');
  const [currentUserRoleLabel, setCurrentUserRoleLabel] = useState('User');
  const [roleCache, setRoleCache] = useState({});
  const [chatMeta, setChatMeta] = useState({ teacherId: null, studentId: null });
  const [teacherIdVariants, setTeacherIdVariants] = useState([]);
  const [studentIdVariants, setStudentIdVariants] = useState([]);
  const messagesEndRef = useRef(null);
  const [showBookModal, setShowBookModal] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showFiles, setShowFiles] = useState(false);
  const [fileCount, setFileCount] = useState(0);
  const [courseName, setCourseName] = useState(propCourseName || '');
  const [isLoading, setIsLoading] = useState(true);

  // Effect to mark messages as read by resetting unread count
  useEffect(() => {
    const markAsRead = async () => {
      const effectiveChatId = propChatId || chatId;
      if (effectiveChatId && currentUser?.uid) {
        try {
          const chatRef = doc(db, 'chats', effectiveChatId);
          const chatSnap = await getDoc(chatRef);

          if (chatSnap.exists()) {
            const chatData = chatSnap.data();
            // Reset unread count for the current user if it exists and is greater than 0
            if (chatData.unread && typeof chatData.unread === 'object' && chatData.unread[currentUser.uid] > 0) {
              await updateDoc(chatRef, {
                [`unread.${currentUser.uid}`]: 0
              });
            }
          }
        } catch (error) {
          console.error('Error marking messages as read:', error);
        }
      }
    };

    if (propChatId || chatId) {
        markAsRead();
    }
  }, [propChatId, chatId, currentUser]);

  useEffect(() => {
    const roleLower = String(userRole || '').toLowerCase();
    if (roleLower === 'admin' || currentUser?.uid === 'admin') setCurrentUserRoleLabel('Admin');
    else if (roleLower === 'teacher') setCurrentUserRoleLabel('Teacher');
    else if (roleLower === 'student') setCurrentUserRoleLabel('Student');
    else setCurrentUserRoleLabel('User');
  }, [userRole, currentUser]);

  // Resolve and cache role by arbitrary user id (prioritize Teacher/Students over generic users)
  const resolveAndCacheRole = async (userId) => {
    if (!userId) return 'User';
    if (roleCache[userId]) return roleCache[userId];
    let role = 'User';
    let userEmail = '';

    // Prefetch email from users doc if present, but do NOT trust its role yet
    try {
      const uSnap = await getDoc(doc(db, 'users', userId));
      if (uSnap.exists()) {
        const d = uSnap.data() || {};
        userEmail = d.email || d.Gmail || '';
      }
    } catch { /* ignore */ }

    // 1) Try Teacher first (uid, doc id, or email-based id/fields)
    try {
      const tByUid = await getDocs(query(collection(db, 'Teacher'), where('uid', '==', userId)));
      const tById = await getDoc(doc(db, 'Teacher', userId));
      let teacherFound = (!tByUid.empty || tById.exists());
      if (!teacherFound && userEmail) {
        const [byGmail, byEmail] = await Promise.all([
          getDocs(query(collection(db, 'Teacher'), where('Gmail', '==', userEmail))),
          getDocs(query(collection(db, 'Teacher'), where('email', '==', userEmail)))
        ]);
        const tByEmailId = await getDoc(doc(db, 'Teacher', String(userEmail).toLowerCase()));
        teacherFound = (!byGmail.empty || !byEmail.empty || tByEmailId.exists());
      }
      if (teacherFound) {
        setRoleCache(prev => ({ ...prev, [userId]: 'Teacher' }));
        return 'Teacher';
      }
    } catch { /* ignore */ }

    // 2) Then Students
    try {
      const sByUid = await getDocs(query(collection(db, 'Students'), where('uid', '==', userId)));
      const sById = await getDoc(doc(db, 'Students', userId));
      let studentFound = (!sByUid.empty || sById.exists());
      if (!studentFound && userEmail) {
        const sByEmailId = await getDoc(doc(db, 'Students', String(userEmail).toLowerCase()));
        studentFound = sByEmailId.exists();
      }
      if (studentFound) {
        setRoleCache(prev => ({ ...prev, [userId]: 'Student' }));
        return 'Student';
      }
    } catch { /* ignore */ }

    // 3) Finally, fall back to role stored in users collection (could be stale)
    try {
      const uSnap = await getDoc(doc(db, 'users', userId));
      if (uSnap.exists()) {
        const d = uSnap.data() || {};
        const r = String(d.role || d.userRole || '').toLowerCase();
        if (r) role = r === 'admin' ? 'Admin' : r.charAt(0).toUpperCase() + r.slice(1);
      }
    } catch { /* ignore */ }

    setRoleCache(prev => ({ ...prev, [userId]: role }));
    return role;
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Resolve receiver's role (prioritize Teacher/Students over users)
  useEffect(() => {
    const fetchOtherRole = async () => {
      if (!receiverId) return;
      // 1) Teacher
      try {
        const tByUid = await getDocs(query(collection(db, 'Teacher'), where('uid', '==', receiverId)));
        const tById = await getDoc(doc(db, 'Teacher', receiverId));
        if (!tByUid.empty || tById.exists()) { setOtherUserRole('Teacher'); return; }
      } catch { /* ignore */ }
      // 2) Student
      try {
        const sByUid = await getDocs(query(collection(db, 'Students'), where('uid', '==', receiverId)));
        const sById = await getDoc(doc(db, 'Students', receiverId));
        if (!sByUid.empty || sById.exists()) { setOtherUserRole('Student'); return; }
      } catch { /* ignore */ }
      // 3) Fallback to users.role
      try {
        const uSnap = await getDoc(doc(db, 'users', receiverId));
        if (uSnap.exists()) {
          const d = uSnap.data() || {};
          const r = String(d.role || d.userRole || '').toLowerCase();
          if (r) { setOtherUserRole(r === 'admin' ? 'Admin' : r.charAt(0).toUpperCase() + r.slice(1)); return; }
        }
      } catch { /* ignore */ }
      setOtherUserRole('User');
    };
    fetchOtherRole();
  }, [receiverId]);

  // Prefetch roles for any unknown message senders
  useEffect(() => {
    const prefetch = async () => {
      const uniqueSenderIds = Array.from(new Set(messages.map(m => m.senderId).filter(Boolean)));
      for (const uid of uniqueSenderIds) {
        if (!roleCache[uid]) {
          await resolveAndCacheRole(uid);
        }
      }
    };
    if (messages.length > 0) prefetch();
  }, [messages]);

  // Load chat meta (teacherId/studentId) from chat doc when chat id is known
  useEffect(() => {
    if (propCourseName) {
      setCourseName(propCourseName);
    }
  }, [propCourseName]);

  useEffect(() => {
    const fetchData = async () => {
      const effectiveChatId = propChatId || chatId;
      if (!effectiveChatId) return;

      try {
        const chatRef = doc(db, 'chats', effectiveChatId);
        const chatSnap = await getDoc(chatRef);

        if (chatSnap.exists()) {
          const chatData = chatSnap.data() || {};
          console.log('DEBUG: Chat Meta:', { teacherId: chatData.teacherId, studentId: chatData.studentId });
          setChatMeta({ teacherId: chatData.teacherId || null, studentId: chatData.studentId || null });

          // Only fetch course name if not passed as a prop
          if (!propCourseName && chatData.courseId) {
            const courseRef = doc(db, 'courses', chatData.courseId);
            const courseSnap = await getDoc(courseRef);
            if (courseSnap.exists()) {
              setCourseName(courseSnap.data().name);
            }
          }
        } else {
          setChatMeta({ teacherId: null, studentId: null });
        }
      } catch (error) {
        console.error('Error fetching chat data:', error);
        setChatMeta({ teacherId: null, studentId: null });
      }
    };

    fetchData();
  }, [propChatId, chatId, propCourseName]);

  // Build id variants for teacher and student to handle uid/doc-id mismatches
  useEffect(() => {
    const buildVariants = async () => {
      const tSet = new Set();
      const sSet = new Set();
      if (chatMeta.teacherId) {
        tSet.add(chatMeta.teacherId);
        try {
          const tById = await getDoc(doc(db, 'Teacher', chatMeta.teacherId));
          if (tById.exists()) {
            const tuid = tById.data()?.uid || tById.id;
            tSet.add(String(tuid));
          }
        } catch { /* ignore */ }
        try {
          const tByUid = await getDocs(query(collection(db, 'Teacher'), where('uid', '==', chatMeta.teacherId)));
          if (!tByUid.empty) {
            tSet.add(String(tByUid.docs[0].id));
          }
        } catch { /* ignore */ }
      }
      if (chatMeta.studentId) {
        sSet.add(chatMeta.studentId);
        try {
          const sById = await getDoc(doc(db, 'Students', chatMeta.studentId));
          if (sById.exists()) {
            const suid = sById.data()?.uid || sById.id;
            sSet.add(String(suid));
          }
        } catch { /* ignore */ }
        try {
          const sByUid = await getDocs(query(collection(db, 'Students'), where('uid', '==', chatMeta.studentId)));
          if (!sByUid.empty) {
            sSet.add(String(sByUid.docs[0].id));
          }
        } catch { /* ignore */ }
      }
      console.log('DEBUG: Teacher ID Variants:', Array.from(tSet));
      console.log('DEBUG: Student ID Variants:', Array.from(sSet));
      setTeacherIdVariants(Array.from(tSet));
      setStudentIdVariants(Array.from(sSet));
    };
    buildVariants().finally(() => setIsLoading(false));
  }, [chatMeta]);

  useEffect(() => {
    if (!currentUser) return;

    if (propReceiverId) setReceiverId(propReceiverId);

    if (!propChatId) {
      if (!receiverId) return;
      // For auto-generated IDs, we need to find existing chat or create new one
      // This will be handled by the chat assignment system
      return;
    } else {
      setChatId(propChatId);
    }

    if (!chatId && !propChatId) return;
    const effectiveChatId = propChatId || chatId;

    const unsubscribe = subscribeToMessages(effectiveChatId, (msgs) => {
      const sortedMsgs = msgs.sort((a, b) => a.timestamp - b.timestamp);
      setMessages(sortedMsgs);
      setTimeout(() => scrollToBottom(), 100);
    }, currentUser.uid);

    return () => unsubscribe();
  }, [currentUser, receiverId, propReceiverId, propChatId, chatId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    const effectiveChatId = propChatId || chatId;
    if (newMessage.trim() === '' || !effectiveChatId || !currentUser) return;

    try {
      await sendMessage(effectiveChatId, currentUser.uid, receiverId, newMessage);
      setNewMessage('');
      setTimeout(() => scrollToBottom(), 100);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  if (isLoading) {
    return <div className="private-chat-loading">Loading chat...</div>;
  }

  if (!currentUser) {
    return <div className="private-chat">Please log in to chat.</div>;
  }

  const renderMessages = () => {
    const messageElements = [];
    let lastDate = null;

    const formatDate = (date) => {
        const today = new Date();
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        if (date.toDateString() === today.toDateString()) return 'Today';
        if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
        return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    };

    messages.forEach(msg => {
      if (msg.timestamp?.toDate) {
        const messageDate = msg.timestamp.toDate();
        const messageDateString = messageDate.toDateString();
        if (messageDateString !== lastDate) {
          messageElements.push(
            <div key={`date-${messageDateString}`} className="date-separator">
              {formatDate(messageDate)}
            </div>
          );
          lastDate = messageDateString;
        }
      }

      const senderRoleLabel = msg.senderId === currentUser.uid ? currentUserRoleLabel : (roleCache[msg.senderId] || otherUserRole);
      const normalizedSender = String(msg.senderId || '');
      console.log(`DEBUG: Msg Sender: ${normalizedSender}, fromTeacher: ${teacherIdVariants.includes(normalizedSender)}, fromStudent: ${studentIdVariants.includes(normalizedSender)}`);
      const fromTeacher = teacherIdVariants.includes(normalizedSender);
      const fromStudent = studentIdVariants.includes(normalizedSender);
      const senderRole = msg.senderId === currentUser.uid
        ? currentUserRoleLabel
        : fromTeacher
        ? 'Teacher'
        : fromStudent
        ? 'Student'
        : (roleCache[msg.senderId] || 'User');

      const nameToShow = msg.senderId === currentUser.uid ? 'You' : senderRole;

      const avatarChar = msg.senderId === currentUser.uid
        ? 'Y'
        : senderRole.charAt(0).toUpperCase();

      const roleClass = (msg.senderId === currentUser.uid ? 'you' : senderRoleLabel || 'user').toLowerCase();

      messageElements.push(
        <div key={msg.id} className={`batch-message ${msg.senderId === currentUser.uid ? 'sent' : 'received'}`}>
          {/* <div className={`message-avatar role-${roleClass}`}>
            <span>{avatarChar}</span>
          </div> */}
          <div className="message-content">
            <div className="sender-name">{nameToShow}</div>
            <div className="message-bubble">
              <p className="bubble-text">{msg.text}</p>
              <span className="bubble-time">
                {msg.timestamp?.toDate ? msg.timestamp.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Sending...'}
              </span>
            </div>
          </div>
        </div>
      );
    });

    return messageElements;
  };

  return (
    <div className="batch-broadcast">
      <div className="batch-header">
        <div className="batch-header-info">
          <div className="batch-avatar">
            <span>{activeChat ? activeChat.charAt(0) : 'U'}</span>
          </div>
          <div className="batch-header-text">
            <h2>{activeChat || 'Chat'}</h2>
            <p>{courseName || 'Private Chat'}</p>
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
                onClick={() => setShowBookModal(true)}
              >
                Book Session
              </button>
              <button
                className="session-btn-dropdown-item"
                onClick={() => { setShowFiles(true); setShowMenu(false); }}
              >
                View Files {fileCount > 0 && <span className="file-count-badge">{fileCount}</span>}
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="batch-messages">
        {messages.length === 0 ? (
          <div className="no-messages">No messages yet. Start the conversation!</div>
        ) : (
          <>
            {renderMessages()}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {showBookModal && (
        <BookCallModal
          isOpen={showBookModal}
          onClose={() => setShowBookModal(false)}
          collectionName="privateChatBookings"
          privateChatId={propChatId || chatId}
        />
      )}
      {showUploadModal && (
        <FileUploadModal
          isOpen={showUploadModal}
          onClose={() => setShowUploadModal(false)}
          batchId={propChatId || chatId}
          privateChatId={propChatId || chatId}
          onFileUploaded={() => {}}
          courseName={courseName}
        />
      )}
      {showFiles && (
        <div className="modal-overlay">
          <div className="modal-content file-viewer-modal">
            <div className="modal-header">
              <h3>Files - {activeChat || 'Chat'}</h3>
              <button className="modal-close-btn" onClick={() => setShowFiles(false)}>×</button>
            </div>
            <div className="modal-body">
              <FileViewer privateChatId={propChatId || chatId} batchId={propChatId || chatId} userRole={userRole} onFileCountUpdate={(c)=>setFileCount(c)} />
            </div>
          </div>
        </div>
      )}

      <form className="batch-input" onSubmit={handleSendMessage}>
        <div className="batch-input-wrapper">
          {(userRole?.toLowerCase() === 'teacher' || userRole?.toLowerCase() === 'admin') && (
            <button type="button" className="batch-attach-btn" onClick={() => setShowUploadModal(true)} title="Upload File">
              <Paperclip size={18} />
            </button>
          )}
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message..."
            className="batch-text-input"
          />
          <button type="submit" className="batch-send-btn">
            <Send size={20} />
          </button>
        </div>
      </form>
    </div>
  );
};

export default PrivateChat;

