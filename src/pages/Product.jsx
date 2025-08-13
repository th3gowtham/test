import React from "react";
import { Link, useNavigate } from "react-router-dom";
import "../styles/all.min.css";
import "../styles/bootstrap.min.css";
import "../styles/swiper-bundle.min.css";
import "../styles/main.css";
import img2r from "../assets/2r.png";
import { FaFacebookF, FaInstagram, FaLinkedinIn } from "react-icons/fa6";
import { useAuth } from "../context/AuthContext";
import App from "../App";
const Product = () => {
  const { user, userName, currentUser } = useAuth();

  // For Chat App
  const navigate = useNavigate();
  const handleApp = () => {
    navigate("/chat");
  }


  return (
    <>

      <nav aria-label="breadcrumb" className="breadcrumb-section position-relative">
        <div className="position-absolute top-50 start-50 translate-middle">
          {/* <h2 className="text-center display-3 text-white">Page Under Construction</h2> */}
          <div className="chat-hero">
        <h1>Welcome to The Honeybee Chat App</h1>
        <p>
          Stay connected with your teachers and classmates instantly.  
          Click the button below to start chatting now!
        </p>
         {user ? (
            <button onClick={handleApp} className="chat-hero-btn">
              🚀 Click Here to Access the Chat App
            </button>
          ) : (
            <Link to="/login" className="chat-hero-btn">
              🔑 Please login to access your chat
            </Link>
          )}
      </div>
        </div>
      </nav>

    </>
  );
};

export default Product;


