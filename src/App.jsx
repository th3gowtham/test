import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate } from "react-router-dom";
import ProtectedAdminRoute from "./components/ProtectedAdminRoute";
import Unauthorized from "./pages/Unauthorized";
import Home from "./pages/Home";
import About from "./pages/About";
import Classes from "./pages/Classes";
import Contact from "./pages/Contact";
import Gallery from "./pages/Gallery";
import TeacherLogin from "./pages/TeacherLogin";
import Pg from "./pages/Pg";
import Teachers from "./pages/Teachers";
import Product from "./pages/Product";
import PlogDetails from "./pages/PlogDetails";
import Login from "./components/Login";
import ForgotPassword from "./components/ForgotPassword"; // retained from your original
import ChatApp from './ChatApp';
import AdminDashboard from './components/AdminDashboard';
import AOS from "aos";
import "aos/dist/aos.css";
import Header from "./components/Header";
import Footer from './components/Footer';
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Toaster } from "react-hot-toast";
import { useAuth } from "./context/AuthContext";

// App inner content
function AppContent({ showLogin, setShowLogin }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { userRole, loading } = useAuth();

  const showFooterPaths = [
    "/", "/about", "/classes", "/contact", "/gallery",
    "/pg", "/teachers", "/product", "/plog_details"
  ];

  
  const showFooter = showFooterPaths.includes(location.pathname);
  const isChatRoute = location.pathname.startsWith('/chat');
  const isAdminRoute = location.pathname.startsWith('/admin');

  // Redirect to /admin once per session when role becomes Admin and loading is done
  React.useEffect(() => {
    if (loading) return;

    const alreadyRedirected = sessionStorage.getItem('adminRedirectedOnce') === 'true';

    if (!alreadyRedirected && userRole === 'Admin' && !isAdminRoute) {
      if (showLogin) setShowLogin(false);
      sessionStorage.setItem('adminRedirectedOnce', 'true');
      navigate('/admin', { replace: true });
    }
  }, [loading, userRole, isAdminRoute, showLogin, setShowLogin, navigate]);

  return (
    <>
      {!isAdminRoute && <Header onLoginClick={() => setShowLogin(true)} />}

      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />

      {/* Global container for auth toasts (e.g., login/signout/payment) with 90px top offset */}
      <ToastContainer
        containerId="auth"
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
        style={{ top: 80 }}
      />
      
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            duration: 3000,
            style: {
              background: '#14b8a6',
              position:'relative',
              top:'60px'
            },
          },
          error: {
            duration: 4000,
            style: {
              background: '#ef4444',
            },
          },
        }}
      />

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/classes" element={<Classes />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/gallery" element={<Gallery />} />
        <Route path="/pg" element={<Pg />} />
        <Route path="/teachers" element={<Teachers />} />
        <Route path="/product" element={<Product />} />
        <Route path="/plog_details" element={<PlogDetails />} />
        <Route path="/chat" element={<ChatApp />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/teacher-login" element={<TeacherLogin />} />
         <Route path="/admin" element={<ProtectedAdminRoute><AdminDashboard /></ProtectedAdminRoute>} />
        <Route path="/unauthorized" element={<Unauthorized />} />
      </Routes>

     

      {!isChatRoute && !isAdminRoute && showFooter && <Footer />}
      {showLogin && <Login onClose={() => setShowLogin(false)} />}
    </>
  );
}

function App() {
  const [showLogin, setShowLogin] = useState(false);

  useEffect(() => {
    AOS.init({ once: true });
  }, []);

  return (
    <Router>
      <AppContent showLogin={showLogin} setShowLogin={setShowLogin} />
    </Router>
  );
}

export default App;

