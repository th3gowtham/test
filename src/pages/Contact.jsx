import React from "react";
import { Link } from "react-router-dom";
import "../styles/all.min.css";
import "../styles/bootstrap.min.css";
import "../styles/swiper-bundle.min.css";
import "../styles/main.css";
import img2r from "../assets/2r.png";
import { FaEnvelope, FaPhone, FaLocationDot, FaClock} from "react-icons/fa6";
import { useAuth } from "../context/AuthContext";

const Contact = () => {
  const { user, userName, currentUser } = useAuth();
  
  return (
  <>
   
    <nav aria-label="breadcrumb" className="breadcrumb-section position-relative">
      <div className="position-absolute top-50 start-50 translate-middle">
        <h2 className="text-center display-3 text-white">Contact Us</h2>
      </div>
    </nav>
    <form className="contact-us">
      <div className="container">
        <div className="main-heading text-center">
          <span className="text-uppercase position-relative d-inline-block px-2">Get in touch</span>
          <h2 className="fw-bold my-3">Contact Us For Any Query</h2>
        </div>
        <div className="row row-cols-1 row-cols-lg-2">
          <div className="d-flex align-items-center gap-4 py-3">
            <div className="icon">
              <FaEnvelope className="p-3 text-white " />
            </div>
            <div className="content">
              <div className="h5 fw-bold">Email</div>
              <span className="text-muted">thehoneybeelearning@gmail.com</span>
            </div>
          </div>
          <div className="d-flex align-items-center gap-4 py-3">
            <div className="icon">
              <FaPhone className="p-3 text-white" />
            </div>
            <div className="content">
              <div className="h5 fw-bold">Phone</div>
              <span className="text-muted">+91 88704 01288</span>
            </div>
          </div>
          <div className="d-flex align-items-center gap-4 py-3">
            <div className="icon">
              <FaLocationDot className="p-3 text-white" />
            </div>
            <div className="content">
              <div className="h5 fw-bold">Address</div>
              <span className="text-muted">101 Mandapam Street, Erode, Tamil Nadu</span>
            </div>
          </div>
          <div className="d-flex align-items-center gap-4 py-3">
            <div className="icon">
              <FaClock className="p-3 text-white rounded-circle" />
            </div>
            <div className="content">
              <div className="h5 fw-bold">Opening Hours</div>
              <span className="text-muted">
                <span className="fw-bold">Sunday - Friday :</span>
                08:00 AM - 05:00 PM
              </span>
            </div>
          </div>
        </div>
      </div>
    </form>
   
  </>
  );
};

export default Contact;