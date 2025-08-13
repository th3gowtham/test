import React from 'react';
import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { auth, db } from '../services/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { addCurrentUserToFirestore, initializeSampleUsers } from '../utils/initializeUsers';
import { signOut } from "firebase/auth";
import { toast } from "react-toastify";

const AuthContext = createContext();

export { AuthContext };

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [userName, setUserName] = useState(null);
  const [loading, setLoading] = useState(true);

  const ts = () => new Date().toISOString();
  

  // Initialize Firebase Auth listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        try {
          await addCurrentUserToFirestore();
          await initializeSampleUsers();
        } catch (e) {
          // no-op
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Fetch user info from backend, return promise for awaiting
  const refreshUser = useCallback(() => {
    const apiUrl = import.meta.env.VITE_API_URL;
    return axios.get(`${apiUrl}/api/auth/me`, { withCredentials: true })
      .then(res => {
        

        setUserRole(res.data.role);
        setUserName(res.data.name);
        setUser(res.data.user);
        setLoading(false);

      })
      .catch((err) => {
        
        setUser(null);
        setUserRole(null);
        setUserName(null);
        setLoading(false);
    
      });
  }, []);

  // Only check /api/auth/me if we think the user might be logged in
  useEffect(() => {
    const flag = localStorage.getItem('isLoggedIn');

    if (flag === 'true') {
      refreshUser();
    } else {
      setLoading(false); // Not loading, not logged in
      
    }
  }, [refreshUser]);

  // Listen for cross-tab auth events
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'auth-event') {
        const flag = localStorage.getItem('isLoggedIn');
      
        if (flag === 'true') {
          refreshUser();
        } else {
          // Logged out in another tab: clear state locally without hitting backend
          setUser(null);
          setUserRole(null);
          setUserName(null);
          setLoading(false);
        }
      }
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, [refreshUser]);

  // Broadcast to other tabs
  const broadcastAuthEvent = () => {
    localStorage.setItem('auth-event', Date.now().toString());
  };

  // Call this after login/logout/role change, return promise for awaiting
  const login = () => {
    localStorage.setItem('isLoggedIn', 'true'); // Set flag on login
    const p = refreshUser();
    broadcastAuthEvent();
    return p;
  };

  // Show login success toast - call this after modal closes
  const showLoginSuccess = () => {
    toast.success("Logged in successfully!", {
      position: "top-right",
      containerId: "auth",
      autoClose: 3000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
      theme: "light",
    });
  };

  const logout = async () => {
    setLoading(true);
    try {
      // 1. Firebase sign out
      await signOut(auth);

      // 2. Reset user state immediately to avoid UI showing stale user
      setUser(null);
      setUserRole(null);
      setUserName(null);
      setCurrentUser && setCurrentUser(null); // Only if you have this

      // 3. Backend logout (network) — keep loading=true until done
      const apiUrl = import.meta.env.VITE_API_URL;
      await axios.post(`${apiUrl}/api/auth/logout`, {}, { withCredentials: true });

      // 4. Clear localStorage flag
      localStorage.removeItem('isLoggedIn');

      // 5. Clear session one-time admin redirect flag
      try { sessionStorage.removeItem('adminRedirectedOnce'); } catch {}

      // 6. Broadcast event (optional)
      broadcastAuthEvent && broadcastAuthEvent();
      
      // 7. Show success toast (rendered in global container with id "auth")
      toast.success("Signed out successfully!", {
        containerId: "auth",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "light",
      });
    } catch (err) {
      // no-op
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      userRole,
      userName,
      setUserRole,
      setUserName,
      login,
      logout,
      loading,
      refreshUser,
      currentUser, // Add Firebase currentUser to context
      showLoginSuccess
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
