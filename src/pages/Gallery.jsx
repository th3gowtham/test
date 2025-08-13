import React, { useState } from "react";
import { Link } from "react-router-dom";
import "../styles/all.min.css";
import "../styles/bootstrap.min.css";
import "../styles/swiper-bundle.min.css";
import "../styles/main.css";
import portfolio1 from "../assets/portfolio-1.jpg";
import portfolio2 from "../assets/portfolio-2.jpg";
import portfolio3 from "../assets/portfolio-3.jpg";
import portfolio4 from "../assets/portfolio-4.jpg";
import portfolio6 from "../assets/portfolio-6.jpg";
import img2r from "../assets/2r.png";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import { FaFacebookF, FaInstagram, FaLinkedinIn } from "react-icons/fa6";
import { useAuth } from "../context/AuthContext";

const images = [
  { src: portfolio1, alt: "img", category: ["all", "playing"] },
  { src: portfolio2, alt: "img", category: ["all", "drawing"] },
  { src: portfolio3, alt: "img", category: ["all", "reading"] },
  { src: portfolio4, alt: "img", category: ["all", "playing"] },
  { src: portfolio4, alt: "img", category: ["all", "drawing"] },
  { src: portfolio6, alt: "img", category: ["all", "reading"] },
];

const Gallery = () => {
  const { user, userName, currentUser } = useAuth();
  const [modalImg, setModalImg] = useState(null);
  const [filter, setFilter] = useState("all");

  const filteredImages =
    filter === "all"
      ? images
      : images.filter((img) => img.category.includes(filter));

  return (
    <>
     
      <nav aria-label="breadcrumb" className="breadcrumb-section position-relative">
        <div className="position-absolute top-50 start-50 translate-middle">
          <h2 className="text-center display-3 text-white">Gallery</h2>
          <ol className="breadcrumb justify-content-center">
            <li className="breadcrumb-item">
              <Link to="/" className="text-white">Home</Link>
            </li>
            <li className="breadcrumb-item active text-white" aria-current="page">
              Gallery
            </li>
          </ol>
        </div>
      </nav>
      <div className="gallery">
        <div className="container">
          <div className="main-heading text-center">
            <span className="text-uppercase position-relative d-inline-block px-2">Our Gallery</span>
            <h2 className="fw-bold my-3">Our Kids School Gallery</h2>
          </div>
          <div className="btn-group d-block text-center my-4" role="group" aria-label="Basic radio toggle button group">
            <input type="radio" className="btn-check" name="btnradio" id="btnradio1" autoComplete="off" checked={filter === "all"} onChange={() => setFilter("all")}/>
            <label className="btn shadow-none rounded-pill mx-1" htmlFor="btnradio1">All</label>
            <input type="radio" className="btn-check" name="btnradio" id="btnradio2" autoComplete="off" checked={filter === "playing"} onChange={() => setFilter("playing")}/>
            <label className="btn shadow-none rounded-pill mx-1" htmlFor="btnradio2">Playing</label>
            <input type="radio" className="btn-check" name="btnradio" id="btnradio3" autoComplete="off" checked={filter === "drawing"} onChange={() => setFilter("drawing")}/>
            <label className="btn shadow-none rounded-pill mx-1" htmlFor="btnradio3">Drawing</label>
            <input type="radio" className="btn-check" name="btnradio" id="btnradio4" autoComplete="off" checked={filter === "reading"} onChange={() => setFilter("reading")}/>
            <label className="btn shadow-none rounded-pill mx-1" htmlFor="btnradio4">Reading</label>
          </div>
          <Swiper
            spaceBetween={30}
            grabCursor={true}
            loop={true}
            autoplay={{ delay: 2500, disableOnInteraction: false }}
            pagination={{ clickable: true }}
            breakpoints={{
              640: { slidesPerView: 1 },
              768: { slidesPerView: 2 },
              1024: { slidesPerView: 3 },
            }}
            className="mb-5"
          >
            {filteredImages.map((img, idx) => (
              <SwiperSlide key={idx}>
                <div className={`item position-relative p-3 ${img.category.join(" ")}`} onClick={() => setModalImg(img.src)} style={{cursor:'pointer'}}>
                  <div className="image">
                    <img src={img.src} className="img-fluid" alt={img.alt} />
                  </div>
                  <div className="overlay position-absolute top-50 start-50 translate-middle text-white display-1 d-flex justify-content-center align-items-center">
                    +
                  </div>
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      </div>
      {modalImg && (
        <div className="modal fade show" style={{display:'block', background:'rgba(0,0,0,0.7)'}} tabIndex="-1" role="dialog">
          <div className="modal-dialog modal-dialog-centered" role="document">
            <div className="modal-content">
              <div className="modal-header">
                <button type="button" className="btn-close m-0 shadow-none" onClick={() => setModalImg(null)} aria-label="Close"></button>
              </div>
              <div className="modal-body">
                <img src={modalImg} alt="img" className="img-fluid" />
              </div>
            </div>
          </div>
        </div>
      )}
      <footer>
        <div className="container text-white">
          <div className="row row-cols-1 row-cols-md-2 row-cols-lg-4">
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
                      <FaLinkedinIn className="text-white border rounded-circle p-2" />
                    </a>
                  </li>
                </ul>
              </div>
            </div>
            <div className="col p-3">
              <div className="box">
                <div className="title fw-bold h4">Get In Touch</div>
                <div className="email d-flex mt-3 gap-3">
                  <div className="flex-shrink-0">
                    <i className="icon fa-solid fa-envelope fa-xl"></i>
                  </div>
                  <div className="flex-grow-1">
                    <div className="h4">Email</div>
                    <div>thehoneybeelearning@gmail.com</div>
                  </div>
                </div>
                <div className="phone d-flex mt-3 gap-3">
                  <div className="flex-shrink-0">
                    <i className="icon fa-solid fa-phone fa-xl"></i>
                  </div>
                  <div className="flex-grow-1">
                    <div className="h4">Phone</div>
                    <div>+91 88704 01288</div>
                  </div>
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
                  <Link to="/product" className="d-block text-decoration-none text-white mt-2 px-4 position-relative">Products</Link>
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
            <a href="#" className="text-decoration-none">
              <span>The Honeybee Learning</span>
            </a>{' '}
            All Rights Reserved
          </div>
        </div>
      </footer>
    </>
  );
};

export default Gallery;