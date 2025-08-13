import React, { useState, useEffect, useContext } from 'react';
import { Bell, ArrowLeft, BellIcon} from "lucide-react";
import { collection, getDocs } from 'firebase/firestore';
import { db } from './services/firebase';
import { useAuth } from './context/AuthContext';

import Sidebar from "./pages/Sidebar";
import WelcomeScreen from './pages/WelcomeScreen';
import PrivateChat from './pages/PrivateChat';
import AnnouncementsView from './pages/AnnouncementsView';
import NotificationModal from "./pages/NotificationModal";
import ProfileSettingsModal from './pages/ProfileSettingsModal';
import BatchBroadcast from "./pages/BatchBroadcast";
import SlotBooking from './pages/SlotBooking';
import "./styles/ChatApp.css"
const ChatApp = () => {
  const { currentUser, userRole} = useAuth();
   
  const [currentView, setCurrentView] = useState('welcome');
  const [activeChat, setActiveChat] = useState(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileSettings, setShowProfileSettings] = useState(false);
  const [profileTab, setProfileTab] = useState('Profile');
  const [isMobileView, setIsMobileView] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const [users, setUsers] = useState([]);
  useEffect(() => {
    const handleResize = () => {
      setIsMobileView(window.innerWidth < 768);
      if (window.innerWidth >= 768) setShowSidebar(true);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // Fetch users from Firestore
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const usersCollection = collection(db, 'users');
        const userSnapshot = await getDocs(usersCollection);
        const usersList = userSnapshot.docs.map(doc => ({
          ...doc.data(),
          id: doc.id
        }));
        
        // Filter out current user from the list
        const filteredUsers = currentUser ? 
          usersList.filter(user => user.uid !== currentUser.uid) : 
          usersList;
          
        setUsers(filteredUsers);
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    };
    
    fetchUsers();
  }, [currentUser]);
  return (
    <div className="chat-app">
      {/* Sidebar */}
      <div className={`chat-sidebar ${showSidebar ? '' : 'hidden'} ${isMobileView ? 'mobile' : ''}`}>
        <Sidebar
          currentView={currentView}
          setCurrentView={(view) => {
            setCurrentView(view);
            setActiveChat(null);

          }}
          setActiveChat={(chat) => {
            setActiveChat(chat);
            if (isMobileView) setShowSidebar(false);
          }}
          setProfileTab={setProfileTab}
          setShowProfileSettings={setShowProfileSettings}
          users={users}
        />
      </div>

      {/* Main Content */}
      <main className="chat-main">
        {isMobileView && activeChat && (
          <button
            onClick={() => {
              setShowSidebar(true);
              setActiveChat(null);
            }}
            className="chat-back-btn"
            
          >
            <ArrowLeft size={20} color="black" strokeWidth={2} className='arrowleft'/>

          </button>
        )}
       
      
        {activeChat === null && <WelcomeScreen />}
        {activeChat && activeChat.type === 'batch' && <BatchBroadcast activeChat={activeChat} />}
        {activeChat && activeChat.type === 'private' && <PrivateChat receiverId={activeChat.id} activeChat={activeChat.name} chatId={activeChat.chatId} courseName={activeChat.courseName} />}
        {activeChat && activeChat.type === 'announcement' && <AnnouncementsView />}
        
      </main>

      {/* 🔔 Notification Icon */}
      {!activeChat && (
        <div className="chat-notification" onClick={() => setShowNotifications(true)}>
      <BellIcon />
      </div>
      )}
      {/* Modals */}
      {showNotifications && <NotificationModal onClose={() => setShowNotifications(false)} />}
      {showProfileSettings && (
        <ProfileSettingsModal
          onClose={() => setShowProfileSettings(false)}
          activeTab={profileTab}
          setActiveTab={setProfileTab}
            userRole={userRole} // ✅ Add this
        />
      )}
    </div>
  );
};

export default ChatApp;