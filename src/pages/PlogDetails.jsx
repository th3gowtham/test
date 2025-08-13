import React from "react";
import { Link } from "react-router-dom";
import "../styles/all.min.css";
import "../styles/bootstrap.min.css";
import "../styles/swiper-bundle.min.css";
import "../styles/main.css";
import { FaFacebookF, FaInstagram, FaTwitter, FaLinkedinIn } from "react-icons/fa6";
import { useAuth } from "../context/AuthContext";

const PlogDetails = () => {
  const { user, userName, currentUser } = useAuth();
  
  return (
  <>
    
    <nav aria-label="breadcrumb" className="breadcrumb-section position-relative">
      <div className="position-absolute top-50 start-50 translate-middle">
        <h2 className="text-center display-3 text-white">Blog Detail</h2>
        <ol className="breadcrumb justify-content-center">
          <li className="breadcrumb-item">
            <Link to="/" className="text-white">Home</Link>
          </li>
          <li className="breadcrumb-item active text-white" aria-current="page">
            Blog Detail
          </li>
        </ol>
      </div>
    </nav>
    <footer>
      <div className="container text-white">
        <div className="row row-cols-1 row-cols-md-2 row-cols-lg-4">
          <div className="col p-3">
            <div className="box">
              <Link className="display-5 fw-bold text-decoration-none text-white" to="/">The Honeybee Learning</Link>
              <p className="my-3">Labore dolor amet ipsum ea, erat sit ipsum duo eos. Volup amet ea dolor et magna dolor, elitr rebum duo est sed diam elitr. Stet elitr stet diam duo eos rebum ipsum diam ipsum elitr.</p>
              <ul className="list-unstyled mb-0 p-0 d-flex gap-2">
                <li><a href="#" aria-label="facebook-icon"><FaFacebookF className="text-white border rounded-circle p-2" /></a></li>
                <li><a href="#" aria-label="instagram-icon"><FaInstagram className="text-white border rounded-circle p-2" /></a></li>
                <li><a href="#" aria-label="twitter-icon"><FaTwitter className="text-white border rounded-circle p-2" /></a></li>
                <li><a href="#" aria-label="linkedin-icon"><FaLinkedinIn className="text-white border rounded-circle p-2" /></a></li>
              </ul>
            </div>
          </div>
          <div className="col p-3">
            <div className="box">
              <div className="title fw-bold h4">Get In Touch</div>
              <div className="address d-flex mt-3 gap-3">
                <div className="flex-shrink-0"><i className="icon fa-solid fa-location-dot fa-xl"></i></div>
                <div className="flex-grow-1"><div className="h4">Address</div><div>123 Street, New York, USA</div></div>
              </div>
              <div className="email d-flex mt-3 gap-3">
                <div className="flex-shrink-0"><i className="icon fa-solid fa-envelope fa-xl"></i></div>
                <div className="flex-grow-1"><div className="h4">Email</div><div>info@example.com</div></div>
              </div>
              <div className="phone d-flex mt-3 gap-3">
                <div className="flex-shrink-0"><i className="icon fa-solid fa-phone fa-xl"></i></div>
                <div className="flex-grow-1"><div className="h4">Phone</div><div>+012 345 67890</div></div>
              </div>
            </div>
          </div>
          <div className="col p-3">
            <div className="box">
              <div className="title fw-bold h4">Quick Links</div>
              <div className="links">
                <Link to="/" className="d-block text-decoration-none text-white mt-2 px-4 position-relative">Home</Link>
                <Link to="/about" className="d-block text-decoration-none text-white mt-2 px-4 position-relative">About Us</Link>
                <Link to="/classes" className="d-block text-decoration-none text-white mt-2 px-4 position-relative">Our Classes</Link>
                <Link to="/teachers" className="d-block text-decoration-none text-white mt-2 px-4 position-relative">Our Teachers</Link>
                <Link to="/plog_grid" className="d-block text-decoration-none text-white mt-2 px-4 position-relative">Our Blog</Link>
                <Link to="/contact" className="d-block text-decoration-none text-white mt-2 px-4 position-relative">Contact Us</Link>
              </div>
            </div>
          </div>
          <div className="col p-3">
            <div className="box">
              <div className="title fw-bold h4">Newsletter</div>
              <form onSubmit={e => e.preventDefault()}>
                <input 
                  type="text" 
                  placeholder="Your Name" 
                  className="form-control shadow-none fs-5 my-3" 
                  defaultValue={userName || currentUser?.displayName || ''}
                />
                <input 
                  type="email" 
                  placeholder="Your Email" 
                  className="form-control shadow-none fs-5 my-3" 
                  defaultValue={user?.email || currentUser?.email || ''}
                />
                <input type="submit" value="Submit Now" className="form-control shadow-none fs-5 my-3 rounded-pill border-0 text-white" />
              </form>
            </div>
          </div>
        </div>
        <div className="copy-right text-center border-top">
          &copy;{' '}
          <a href="#" className="text-decoration-none"><span>The Honeybee Learning</span></a>{' '}
          All Rights Reserved Designed by <span>HTML Codex</span>
        </div>
      </div>
    </footer>
  </>
  );
};

export default PlogDetails;