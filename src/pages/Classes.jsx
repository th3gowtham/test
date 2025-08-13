import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import CourseCard from "../components/CourseCard";
import EnquiryModal from "../components/EnquiryModal";
import "swiper/css";
import "../styles/all.min.css";
import "../styles/bootstrap.min.css";
import "../styles/swiper-bundle.min.css";
import "../styles/main.css";
import { usePayment } from "../context/PaymentContext";
import { db } from "../services/firebase";
import { collection, onSnapshot, query } from "firebase/firestore";



const Classes = () => {
  const { user, userName, currentUser } = useAuth();
  const { startPayment, loading } = usePayment();
  const [showLoginNeeded, setShowLoginNeeded] = useState(false);
  const [showEnquiryModal, setShowEnquiryModal] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [courses, setCourses] = useState([]);
  const [advancedCourses, setAdvancedCourses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch courses from Firestore
  useEffect(() => {
    // Set up listener for regular courses
    const coursesRef = collection(db, "courses");
    const coursesQuery = query(coursesRef);
    
    const unsubscribeCourses = onSnapshot(coursesQuery, (snapshot) => {
      const coursesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setCourses(coursesData);
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching courses:", error);
      setIsLoading(false);
    });

    // Set up listener for advanced courses
    const advancedCoursesRef = collection(db, "advancedCourses");
    const advancedCoursesQuery = query(advancedCoursesRef);
    
    const unsubscribeAdvancedCourses = onSnapshot(advancedCoursesQuery, (snapshot) => {
      const advancedCoursesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setAdvancedCourses(advancedCoursesData);
    }, (error) => {
      console.error("Error fetching advanced courses:", error);
    });

    // Clean up listeners on component unmount
    return () => {
      unsubscribeCourses();
      unsubscribeAdvancedCourses();
    };
  }, []);

  // Handler for "Enroll Now" button
  const handleApply = (course) => {
    if (!user || !user.email) {
      setShowLoginNeeded(true);
      setTimeout(() => setShowLoginNeeded(false), 2000);
      return;
    }
    setSelectedCourse(course);
    setShowEnquiryModal(true);
  };

  // Modal handlers
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

  return (
    <>
      <nav aria-label="breadcrumb" className="breadcrumb-section position-relative">
        <div className="position-absolute top-50 start-50 translate-middle">
          <h2 className="text-center display-3 text-white">Our Classes</h2>
        </div>
      </nav>
      
      {/* Popular Classes Section */}
      <div className="popular-classes">
        <div className="container">
          <div className="main-heading text-center">
            <span className="text-uppercase position-relative d-inline-block px-2">Popular Classes</span>
            <h2 className="fw-bold my-3">Classes We Provide</h2>
          </div>
          
          {isLoading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="mt-3">Loading courses...</p>
            </div>
          ) : courses.length === 0 ? (
            <div className="alert alert-info text-center" role="alert">
              No courses available at the moment. Please check back later.
            </div>
          ) : (
            <div className="row row-cols-1 row-cols-md-2 row-cols-lg-3">
              {courses.map((course) => (
                <CourseCard
                  key={course.id}
                  {...course}
                  onApply={() => handleApply(course)}
                  loading={loading && selectedCourse && selectedCourse.id === course.id}
                />
              ))}
            </div>
          )}
        </div>
      </div>
      
      {/* Advanced Courses Section */}
      <div className="popular-classes">
        <div className="container">
          <div className="main-heading text-center">
            <span className="text-uppercase position-relative d-inline-block px-2">Advanced Courses</span>
            <h2 className="fw-bold my-3">Technical & Non-Tech Classes</h2>
          </div>
          
          {isLoading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="mt-3">Loading advanced courses...</p>
            </div>
          ) : advancedCourses.length === 0 ? (
            <div className="alert alert-info text-center" role="alert">
              No advanced courses available at the moment. Please check back later.
            </div>
          ) : (
            <div className="container mb-5">
              <div className="row row-cols-1 row-cols-md-2 row-cols-lg-3">
                {advancedCourses.map((course) => (
                  <CourseCard
                    key={course.id}
                    {...course}
                    onApply={() => handleApply(course)}
                    loading={loading && selectedCourse && selectedCourse.id === course.id}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      
      <EnquiryModal
        show={showEnquiryModal}
        onClose={handleCloseModal}
        onSubmit={handleEnquirySubmit}
        onSkip={handleSkipEnquiry}
        selectedCourse={selectedCourse?.title}
        selectedCourseId={selectedCourse?.id}
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
    </>
  );
};

export default Classes;