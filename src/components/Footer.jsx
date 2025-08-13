import React from "react";
import { Link } from "react-router-dom";
import {  FaFacebookF, FaInstagram, FaEnvelope, FaPhoneAlt } from "react-icons/fa";
import { SiLinkedin } from "react-icons/si";




const Footer = () => (
  <footer data-label-id="0">
    <div className="container text-white">
      <div className="row row-cols-1 row-cols-md-2 row-cols-lg-4">
        {/* About / Brand */}
        <div className="col p-3">
          <div className="box">
            <Link className="display-5 fw-bold text-decoration-none text-white" to="/">The Honeybee Learning</Link>
            <p className="my-3">
              Our team of passionate educators and experts are dedicated to crafting innovative and effective learning solutions that cater to the diverse needs of our students. We strive to create a warm, inclusive, and supportive community that encourages children to ask questions, think critically, and dream big.
            </p>
            <ul className="list-unstyled mb-0 p-0 d-flex gap-2">
              <li>
                <a href="https://www.facebook.com/share/1Fda1AeJ9o/" aria-label="facebook-icon">
                  <FaFacebookF className="text-white border rounded-circle p-2" />
                </a>
              </li>
              <li>
                <a href="https://www.instagram.com/thehoneybeelearning?igsh=ZmhvNXFoeGtpNGV0" aria-label="instagram-icon">
                  <FaInstagram className="text-white border rounded-circle p-2" />
                </a>
              </li>
              <li>
                <a href="https://www.linkedin.com/in/the-honey-bee-learning-006512370/" aria-label="linkedin-icon">
                  <SiLinkedin className="text-white border rounded-circle p-2" />
                </a>
              </li>
            </ul>
          </div>
        </div>
        {/* Get In Touch */}
        <div className="col p-3">
          <div className="box">
            <div className="title fw-bold h4">Get In Touch</div>
            <div className="email d-flex mt-3 gap-3">
              <div className="flex-shrink-0">
                <FaEnvelope className="icon fa-xl" />
              </div>
              <div className="flex-grow-1">
                <div className="h4">Email</div>
                <div>thehoneybeelearning@gmail.com</div>
              </div>
            </div>
            <div className="phone d-flex mt-3 gap-3">
              <div className="flex-shrink-0">
                <FaPhoneAlt className="icon fa-xl" />
              </div>
              <div className="flex-grow-1">
                <div className="h4">Phone</div>
                <div>+91 88704 01288</div>
              </div>
            </div>
          </div>
        </div>
        {/* Quick Links */}
        <div className="col p-3">
          <div className="box">
            <div className="title fw-bold h4">Quick Links</div>
            <div className="links">
              <Link to="/" className="d-block text-decoration-none text-white mt-2 px-4 position-relative">Home</Link>
              <Link to="/about" className="d-block text-decoration-none text-white mt-2 px-4 position-relative">About Us</Link>
              <Link to="/classes" className="d-block text-decoration-none text-white mt-2 px-4 position-relative">Our Classes</Link>
              <Link to="/teachers" className="d-block text-decoration-none text-white mt-2 px-4 position-relative">Our Teachers</Link>
              <Link to="/product" className="d-block text-decoration-none text-white mt-2 px-4 position-relative">Products</Link>
              <Link to="/contact" className="d-block text-decoration-none text-white mt-2 px-4 position-relative">Contact Us</Link>
            </div>
          </div>
        </div>
        {/* Newsletter */}
        <div className="col p-3">
          <div className="box">
            <div className="title fw-bold h4">Newsletter</div>
            <form action="">
              <input type="text" placeholder="Your Name" className="form-control shadow-none fs-5 my-3" />
              <input type="email" placeholder="Your Email" className="form-control shadow-none fs-5 my-3" />
              <input type="submit" value="Submit Now" className="form-control  fs-5 my-3 rounded-pill border-0 text-#127d8e" />
            </form>
          </div>
        </div>
      </div>
      <div className="copy-right text-center border-top">
        &copy;
        <Link to="#" className="text-decoration-none">
          <span>The Honeybee Learning</span>
        </Link>
         All Rights Reserved
      </div>
    </div>
  </footer>
);

export default Footer;
