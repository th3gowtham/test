import React from "react";
import { Link } from "react-router-dom";
import "../styles/all.min.css";
import "../styles/bootstrap.min.css";
import "../styles/swiper-bundle.min.css";
import "../styles/main.css";
import img2r from "../assets/2r.png";
import p1 from "../assets/p1.jpg";
import p2 from "../assets/p2.jpg";
import p3 from "../assets/p3.jpg";
import p4 from "../assets/p4.jpg";
import p5 from "../assets/p5.jpg";
import p6 from "../assets/p6.jpg";
import p7 from "../assets/p7.jpg";

import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination, Autoplay } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import { useAuth } from "../context/AuthContext";

const Teachers = () => {
  const { user, userName, currentUser } = useAuth();
  
  return (
  <>
   
    <nav aria-label="breadcrumb" className="breadcrumb-section position-relative">
      <div className="position-absolute top-50 start-50 translate-middle">
        <h2 className="text-center display-3 text-white">Our Teachers</h2>
      </div>
    </nav>
    <div className="our-teachers">
      <div className="container">
        <div className="main-heading text-center">
          <span className="text-uppercase position-relative d-inline-block px-2">Our Teachers</span>
          <h2 className="fw-bold my-3">Meet Our Team</h2>
        </div>
        <div className="row row-cols-1 row-cols-sm-2 row-cols-lg-4">
          <div className="col p-3"><div className="item text-center"><div className="image position-relative"><img src={p2} className="img-fluid w-100 rounded-circle" alt="img" /></div><div className="fw-bold my-3 h4">Mrs.Akilandeswari ArunKumar</div><div className="fst-italic text-muted">Chief Educator</div></div></div>
          <div className="col p-3"><div className="item text-center"><div className="image position-relative"><img src={p4} className="img-fluid w-100 rounded-circle" alt="img" /></div><div className="fw-bold my-3 h4">Mrs.Suma Aleya John</div><div className="fst-italic text-muted">English Teacher</div></div></div>
          <div className="col p-3"><div className="item text-center"><div className="image position-relative"><img src={p3} className="img-fluid w-100 rounded-circle" alt="img" /></div><div className="fw-bold my-3 h4">Ms.Shameksha Raghavan</div><div className="fst-italic text-muted">English Teacher</div></div></div>
          <div className="col p-3"><div className="item text-center"><div className="image position-relative"><img src={p5} className="img-fluid w-100 rounded-circle" alt="img" /></div><div className="fw-bold my-3 h4">Ms.Shalini ArunKumar</div><div className="fst-italic text-muted">Art & Handwriting Teacher</div></div></div>
          <div className="col p-3"><div className="item text-center"><div className="image position-relative"><img src={p6} className="img-fluid w-100 rounded-circle" alt="img" /></div><div className="fw-bold my-3 h4">Mr.Dharun Kumar</div><div className="fst-italic text-muted">Computer Teacher (Basics)</div></div></div>
          <div className="col p-3"><div className="item text-center"><div className="image position-relative"><img src={p7} className="img-fluid w-100 rounded-circle" alt="img" /></div><div className="fw-bold my-3 h4">Mr.Sudharshan Vijay</div><div className="fst-italic text-muted">Programming Teacher</div></div></div>
          <div className="col p-3"><div className="item text-center"><div className="image position-relative"><img src={p1} className="img-fluid w-100 rounded-circle" alt="img" /></div><div className="fw-bold my-3 h4">Ms.Azhagu Shalini</div><div className="fst-italic text-muted">Tamil Phonics Teacher</div></div></div>
        </div>
      </div>
    </div>
    <div className="testimonial">
      <div className="container">
        <div className="main-heading text-center">
          <span className="text-uppercase position-relative d-inline-block px-2">Testimonials</span>
          <h2 className="fw-bold my-3">What Parents Say!</h2>
        </div>
        <Swiper
          modules={[Pagination, Autoplay]}
          spaceBetween={30}
          grabCursor={true}
          loop={true}
          autoplay={{ delay: 2500, disableOnInteraction: false }}
          pagination={{ clickable: true, dynamicBullets: false }}
          breakpoints={{
            0: { slidesPerView: 1 },
            640: { slidesPerView: 1 },
            768: { slidesPerView: 2 },
            1024: { slidesPerView: 3 },
          }}
          className="mb-5 pb-5"
        >
          <SwiperSlide>
            <div className="bg-light p-2 shadow rounded">
              <p>
                The journey lasted 10 months, starting when my child could only read alphabets. Now, at 5 years old, they can confidently read sentences. The classes were always engaging with rhymes and fun activities, making learning enjoyable and effective.
              </p>
              
            </div>
            <div className="d-flex align-items-center gap-3">
                <div className="flex-grow-1">
                  <div className="name fw-bold h5 m-2">Nirmala</div>
                </div>
              </div>
          </SwiperSlide>
          <SwiperSlide>
            <div className="bg-light p-2 shadow rounded">
              <p>
                We're thrilled to see our child reading so well at such a young age, while others older than them are still struggling with reading. It's amazing to witness the progress!
              </p>
             
            </div>
            <div className="d-flex align-items-center gap-3">
                <div className="flex-grow-1">
                  <div className="name fw-bold h5 m-2">Yaazhini</div>
                </div>
              </div>
          </SwiperSlide>
          <SwiperSlide>
            <div className="bg-light p-2 shadow rounded">
              <p>
                Thank you for arranging these sessions. The teacher’s patience and clear explanations made the classes enjoyable, and I’m grateful for the wonderful learning experience.
              </p>
              
            </div>
            <div className="d-flex align-items-center gap-3">
                <div className="flex-grow-1">
                  <div className="name fw-bold h5 m-2">Shailja</div>
                </div>
              </div>
          </SwiperSlide>
          <SwiperSlide>
            <div className="bg-light p-2 shadow rounded">
              <p>
                My child was sad that it was their last class. They enjoyed and learned a lot throughout the lessons, and we’re very grateful for this enriching experience.
              </p>
             
            </div>
            <div className="d-flex align-items-center gap-3">
                <div className="flex-grow-1">
                  <div className="name fw-bold h5 m-2">Jothi</div>
                </div>
              </div>
  
          </SwiperSlide>
          <SwiperSlide>
            <div className="bg-light p-2 shadow rounded">
              <p>
                Thank you to the teacher for helping my child learn phonics. The kids will surely miss the engaging sessions and the support provided.
              </p>
             
            </div>
            <div className="d-flex align-items-center gap-3">
                <div className="flex-grow-1">
                  <div className="name fw-bold h5 m-2">Surya</div>
                </div>
              </div>
          </SwiperSlide>
          <SwiperSlide>
            <div className="bg-light p-2 shadow rounded">
              <p>
                Thank you for taking this class! It has been a truly beneficial experience, and we’re grateful for all the hard work and effort put into teaching the kids.
              </p>
             
            </div>
            <div className="d-flex align-items-center gap-3">
                <div className="flex-grow-1">
                  <div className="name fw-bold h5 m-2">Manjula</div>
                </div>
              </div>
            
          </SwiperSlide>
          <SwiperSlide>
            <div className="bg-light p-2 shadow rounded">
              <p>
                Thank you for the positive impact on my child’s learning. Your passion for teaching has made a huge difference, and we feel fortunate to have been part of your class.
              </p>
             
            </div>
            <div className="d-flex align-items-center gap-3">
                <div className="flex-grow-1">
                  <div className="name fw-bold h5 m-2">Deepthi</div>
                </div>
              </div>
              
            
          </SwiperSlide>
          <SwiperSlide>
            <div className="bg-light p-2 shadow rounded">
              <p>
                As the phonics class comes to an end, I want to thank the teacher for their dedication, patience, and incredible teaching. The progress my child has made in reading and pronunciation is remarkable.
              </p>
             
            </div>
            <div className="d-flex align-items-center gap-3">
                <div className="flex-grow-1">
                  <div className="name fw-bold h5 m-2">Rajesh</div>
                </div>
              </div>
          </SwiperSlide>
          <SwiperSlide>
            <div className="bg-light p-2 shadow rounded">
              <p>
                The class was really good and easy to understand. At first, I thought it would be difficult, but the teacher made it simple and enjoyable. I’m excited to continue learning.
              </p>

            </div>
            <div className="d-flex align-items-center gap-3">
                <div className="flex-grow-1">
                  <div className="name fw-bold h5 m-2">Saranya</div>
                </div>
              </div>
          </SwiperSlide>
        </Swiper>
      </div>
    </div>
   
  </>
  );
};

export default Teachers;