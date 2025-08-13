import React from "react";
import { Link, useNavigate } from "react-router-dom";
import "../styles/all.min.css";
import "../styles/bootstrap.min.css";
import "../styles/swiper-bundle.min.css";
import "../styles/main.css";
import img2r from "../assets/2r.png";
import header from "../assets/header.png";
import blog2 from "../assets/blog-2.jpg";
import about2 from "../assets/about-2.jpg";
import class1 from "../assets/class-1.jpg";
import class2 from "../assets/class-2.jpg";
import class3 from "../assets/class-3.jpg";
// import bookSeat from "../assets/book-seat.jpg";
//import bookSeat2 from "../assets/book-seat-2.jpg";
import testimonial1 from "../assets/testimonial-1.jpg";
import testimonial2 from "../assets/testimonial-2.jpg";
import testimonial3 from "../assets/testimonial-3.jpg";
import { FaBuffer, FaApple } from "react-icons/fa";
import { FaAustralSign, FaAddressCard, FaCalendarCheck, FaAppStoreIos, FaLocationDot, FaPhone, FaEnvelope, FaFacebookF, FaTwitter, FaInstagram, FaLinkedinIn, FaQuoteLeft, FaChevronRight } from "react-icons/fa6";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination, Autoplay } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import AOS from "aos";
import "aos/dist/aos.css";
import phoni from '../assets/phoni.jpeg';
import gram from '../assets/gram.jpg';
import game from '../assets/game.png';
import ha from '../assets/ha.jpg';
import math from '../assets/math.jpeg';
import s from '../assets/s.jpeg';
import portfolio3 from '../assets/portfolio-3.jpg';
import cod from '../assets/cod.jpg';
import com from '../assets/com.jpeg';
import art from '../assets/art.jpeg';
import class3img from '../assets/class-3.jpg';
import { usePayment } from "../context/PaymentContext";
import CourseCard from "../components/CourseCard";
import EnquiryModal from "../components/EnquiryModal";
import { useAuth } from "../context/AuthContext";


const Home = () => {
  React.useEffect(() => {
    AOS.init({
      duration: 800,
      once: true,
      easing: 'ease-in-out',
    });
  }, []);

  const { startPayment, loading } = usePayment();
  const { user, userName, currentUser } = useAuth();
  const [showEnquiryModal, setShowEnquiryModal] = React.useState(false);
  const [selectedCourse, setSelectedCourse] = React.useState(null);
  const [showLoginNeeded, setShowLoginNeeded] = React.useState(false);

  const handleApply = (course) => {
    if (!user || !user.email) {
      setShowLoginNeeded(true);
      setTimeout(() => setShowLoginNeeded(false), 2000);
      return;
    }
    setSelectedCourse(course);
    setShowEnquiryModal(true);
  };

  const handleEnquirySubmit = () => {
    setShowEnquiryModal(false);
    if (selectedCourse) startPayment(selectedCourse);
  };

  const handleSkipEnquiry = () => {
    setShowEnquiryModal(false);
    if (selectedCourse) startPayment(selectedCourse);
  };

  const handleCloseModal = () => {
    setShowEnquiryModal(false);
    setSelectedCourse(null);
  };
  const courses = [
    {
      imgSrc: phoni,
      title: "Jolly Phonics",
      description: "A fun, interactive approach to teaching children essential reading and writing skills through phonics, blending, and engaging activities.",
      age: "3+ Years",
      seats: "Upto 5 Kids per Batch",
      duration: "9 Months",
      fee: 4999,
    },
    {
      imgSrc: gram,
      title: "Jolly Grammar",
      description: "A fun, interactive approach to teaching children essential grammar skills through phonics, blending, and engaging activities.",
      age: "4+ Years",
      seats: "Upto 5 Kids per Batch",
      duration: "1 Year",
      fee: 5999,
    },
    {
      imgSrc: ha,
      title: "Spoken English",
      description: "A fun and interactive spoken English class for building confidence through engaging activities, storytelling, and real-life conversations!",
      age: "6+ Years",
      seats: "Upto 5 Kids per Batch",
      duration: "4 Months",
      fee: 3999,
    },
    {
      imgSrc: portfolio3,
      title: "Handwriting Class (English)",
      description: "A focused and engaging class that helps children improve their handwriting skills through structured practice and creative activities, promoting neatness and clarity.",
      age: "3+ Years",
      seats: "Upto 5 Kids per Batch",
      duration: "4 Months",
      fee :3999,
    },
    {
      imgSrc: math,
      title: "Math Class",
      description: "An engaging and interactive approach to help children develop strong mathematical skills through fun lessons and engaging activities.",
      age: "5+ Years",
      seats: "Upto 5 Kids per Batch",
      duration: "12 Months",
      fee :3999,
    },
    {
      imgSrc: s,
      title: "Tamil Phonics",
      description: "An engaging and interactive method to help children learn Tamil sounds, pronunciation, and reading skills through ancient teaching methods.",
      age: "5+ Years",
      seats: "Upto 5 Kids per Batch",
      duration: "5 Months",
      fee :3999,
    },
    {
      imgSrc: portfolio3,
      title: "Tamil Handwriting Class",
      description: "A focused and engaging class that helps children improve their tamil handwriting skills through structured practice and creative activities, promoting neatness and clarity.",
      age: "5+ Years",
      seats: "Upto 5 Kids per Batch",
      duration: "4 Months",
      fee :3999,
    },
    {
      imgSrc: cod,
      title: "Computer Basics",
      description: "A fun and interactive way for children to learn computer basics, including typing, using software, and safe internet practices!",
      age: "6+ Years",
      seats: "Upto 4 Kids per Batch",
      duration: "3 Months",
      fee :3999,
    },
    {
      imgSrc: com,
      title: "Programming for Beginners & Kids",
      description: "An engaging and interactive way for children and beginners to learn programming, develop problem-solving skills, and create their own digital projects!",
      age: "8+ Years",
      seats: "Upto 4 Kids per Batch",
      duration: "6 Months",
      fee :3999,
    },
    {
      imgSrc: art,
      title: "Mandala & Warli Art Class",
      description: "A dynamic and creative class that encourages children to explore various art forms, develop their artistic skills, and express their imagination through hands-on projects.",
      age: "8+ Years",
      seats: "Upto 5 per Batch",
      duration: "3 Months",
      fee :3999,
    },
  
  ];

  return(
  <div style={{ overflowX: 'hidden' }}>
 <style>{`
  .quote-icon {
    color: #127d8e;
    font-size: 3rem;        
    vertical-align: -0.4em;    
    margin-right: 0.1em;       
    line-height: 0;
  }

  .col.p-3 .item {
    transition: transform 0.3s ease, box-shadow 0.3s ease;
  }

  .col.p-3 .item:hover {
    transform: translateY(-5px);
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
  }
`}</style>

    <section className="landing text-white" data-aos="fade-in">
      <div className="container mh-100 d-flex align-items-center">
        <div className="row align-items-center">
          <div className="col-lg-6">
            <div className="content">
              <h2 className="display-3 fw-bold" data-aos="fade-left">
                The HoneyBee Learning<br />
              </h2>

              

              <h3 data-aos="fade-up-right">
                Unlock Your Child's Potential With The Honeybee Learning - A Multi Learning Platform
              </h3>
              <br />
              <div className="title fs-4" data-aos="fade-right">
                We provide high-quality, engaging, and interactive learning experiences that inspire young minds to explore, learn, and thrive.<br />
              </div>
              <br />
              <Link to="/classes" className="second-link text-decoration-none text-white d-inline-block py-3 px-5 rounded-pill">
                Learn More
              </Link>
            </div>
          </div>
          <div className="col-lg-6">
            <div className="image">
              <img src={header} className="img-fluid" alt="img" />
            </div>
          </div>
        </div>
      </div>
    </section>
    <div className="features" data-aos="fade-up">
      <div className="container">
        <div className="row row-cols-1 row-cols-md-2 row-cols-lg-3">
          <div className="col p-3">
            <div className="item h-100 d-flex gap-3 bg-light shadow p-4 rounded">
              <div className="flex-shrink-0">
                <FaAddressCard className="fa-2xl" />
              </div>
              <div className="flex-grow-1">
                <div className="h4">Personalised Lessons</div>
                <p className="lh-lg text-muted">Our classes are designed to cater to each child's learning style and pace, ensuring an individualized approach that promotes better understanding and growth.</p>
              </div>
            </div>
          </div>
          <div className="col p-3">
            <div className="item h-100 d-flex gap-3 bg-light shadow p-4 rounded">
              <div className="flex-shrink-0">
                <FaCalendarCheck className="fa-2xl" />
              </div>
              <div className="flex-grow-1">
                <div className="h4">Flexible Scheduling</div>
                <p className="lh-lg text-muted">Our flexible class schedules allow you to choose convenient times for your child, ensuring learning fits seamlessly into your family’s routine.</p>
              </div>
            </div>
          </div>
          <div className="col p-3">
            <div className="item h-100 d-flex gap-3 bg-light shadow p-4 rounded">
              <div className="flex-shrink-0">
                <FaBuffer className="fa-2xl" data-aos="fade-down-left" />
              </div>
              <div className="flex-grow-1">
                <div className="h4">Progress Tracking</div>
                <p className="lh-lg text-muted">We keep track of your child's progress and provide regular updates so that you can see the improvements and areas where further attention is needed.</p>
              </div>
            </div>
          </div>
          <div className="col p-3">
            <div className="item h-100 d-flex gap-3 bg-light shadow p-4 rounded">
              <div className="flex-shrink-0">
                <FaAustralSign className="fa-2xl" data-aos="fade-up-right" />
              </div>
              <div className="flex-grow-1">
                <div className="h4">Interactive Learning</div>
                <p className="lh-lg text-muted">Our dynamic and engaging learning plan combines live classes, interactive tools, and collaborative activities to make education fun and effective.</p>
              </div>
            </div>
          </div>
          <div className="col p-3">
            <div className="item h-100 d-flex gap-3 bg-light shadow p-4 rounded">
              <div className="flex-shrink-0">
                <FaApple className="fa-2xl" data-aos="fade-up" />
              </div>
              <div className="flex-grow-1">
                <div className="h4">Qualified Teachers</div>
                <p className="lh-lg text-muted">Our experienced and passionate teachers are dedicated to providing personalized, high-quality education that nurtures every child’s growth.</p>
              </div>
            </div>
          </div>
          <div className="col p-3">
            <div className="item h-100 d-flex gap-3 bg-light shadow p-4 rounded">
              <div className="flex-shrink-0">
                <FaAppStoreIos className="fa-2xl" />
              </div>
              <div className="flex-grow-1">
                <div className="h4">Fostering Creativity</div>
                <p className="lh-lg text-muted">We inspire creativity through hands-on projects and activities, helping children develop imagination, problem-solving, and critical thinking skills.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div className="about-us bg-light" data-aos="fade-up">
      <div className="container">
        <div className="row row-cols-1 row-cols-lg-2">
          <div className="col p-3 d-flex align-items-center">
            <div className="item text-center">
              <img src={blog2} className="img-fluid" alt="img" />
            </div>
          </div>
          <div className="col p-3">
            <div className="main-heading">
              <span className="special text-uppercase position-relative d-inline-block px-2">Learn About Us</span>
              <h2 className="fw-bold my-3">Best Learning Experience For Your Children</h2>
            </div>
            <div className="content">
              <p className="text-muted m-0 m-auto">At The Honeybee Learning, we are committed to providing an exceptional educational experience for children. Our carefully crafted curriculum and engaging online classes empower young learners to reach their full potential. With a focus on personalized learning, we create an environment where your child can grow, explore, and thrive.<br />Our approach is centered around fostering creativity, critical thinking, and a love for learning, all while ensuring each child receives the attention and care they need to succeed.</p>
              <div className="d-flex my-4 gap-3 flex-column flex-md-row">
                <div className="flex-shrink-0">
                  <img src={about2} className="img-fluid" alt="img" />
                </div>
                <div className="flex-grow-1">
                  <div className="item py-2 px-4 position-relative d-flex align-items-center border-top justify-content-center justify-content-md-start">Curiosity-Driven Learning</div>
                  <div className="item py-2 px-4 position-relative d-flex align-items-center border-top justify-content-center justify-content-md-start">Personalized Education Plan</div>
                  <div className="item py-2 px-4 position-relative d-flex align-items-center border-top justify-content-center justify-content-md-start">Creativity and Innovation</div>
                </div>
              </div>
             <div className="d-flex flex-column align-items-center">
  <Link to="/classes" className="d-flex flex-column align-items-center main-link mb-2 text-decoration-none text-white py-2 px-4 rounded-pill">
    Join Class
  </Link>
</div>

            </div>
          </div>
        </div>
      </div>
    </div>
    <div className="popular-classes">
        <div className="container">
          <div className="main-heading text-center">
            <span className="text-uppercase position-relative d-inline-block px-2">Popular Classes</span>
            <h2 className="fw-bold my-3">Classes We Provide</h2>
          </div>
          <div className="row row-cols-1 row-cols-md-2 row-cols-lg-3">
            {courses.map((course, idx) => (
              <CourseCard
                key={idx}
                {...course}
                onApply={() => handleApply(course)}
                loading={loading && selectedCourse && selectedCourse.title === course.title}
              />
            ))}
          </div>
        </div>
      </div>
    <div className="book-seat bg-light" data-aos="fade-up">
      <div className="container">
        <div className="row">
          <div className="col-lg-6 p-3">
            <div className="box" data-aos="fade-up-right">
              <div className="main-heading">
                <span className="special text-uppercase position-relative d-inline-block px-2">BOOK A SEAT</span>
                <h2 className="fw-bold my-3">Book A Seat For Your Children</h2>
              </div>
              <div className="content">
                <p className="my-4 text-muted">
                  Give your child the opportunity to thrive in a nurturing and engaging learning environment. At Honeybee Learning, we offer personalized classes that are designed to meet your child’s needs and help them unlock their full potential. Book a seat now and join us on an exciting educational journey that inspires curiosity, creativity, and growth.
                </p>
                <ul className="list-unstyled px-0 mb-4">
                  <li className="my-3 position-relative px-4">
                    Quality Education at Accessible Prices
                  </li>
                  <li className="my-3 position-relative px-4">
                  Efficient Online Platform
                  </li>
                  <li className="my-3 position-relative px-4">
                    Commitment to Inclusivity
                  </li>
                </ul>
                <a href="https://wa.me/message/BITGLQYLAPJRO1" className=" flex-column align-items-center main-link mb-2 text-decoration-none text-white py-2 px-4 rounded-pill">Join Class</a>
              </div>
            </div>
          </div>
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
   
    <EnquiryModal
      show={showEnquiryModal}
      onClose={handleCloseModal}
      onSubmit={handleEnquirySubmit}
      onSkip={handleSkipEnquiry}
      selectedCourse={selectedCourse?.title}
    />
    {showLoginNeeded && (
      <div
        style={{
          position: 'fixed',
          top: '80px',
          right: '30px',
          background: '#fde7e9',
          color: '#dc3545',
          border: '1px solid #dc3545',
          borderRadius: '8px',
          padding: '1rem 2rem',
          zIndex: 2000,
          fontWeight: 600,
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
        }}
      >
        Please login to enroll in the course
      </div>
    )}
  </div>
  );
}
export default Home;