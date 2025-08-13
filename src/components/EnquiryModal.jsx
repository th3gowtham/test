// src/components/EnquiryModal.jsx
import React, { useRef, useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import emailjs from '@emailjs/browser';
import './EnquiryModal.css';
import { db } from '../services/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

const EnquiryModal = ({ show, onClose, onSubmit, onSkip, selectedCourse, selectedCourseId }) => {
  const { userRole, userName, user } = useAuth();

  const [formData, setFormData] = useState({
    name: userName || user?.displayName || '',
    email: user?.email || '',
    phone: '',
    course: selectedCourse || '',
    preferredDate: '',
    preferredTimeSlot: '',
    message: ''
  });

  // Update all fields when modal opens, user info changes, or course changes
  useEffect(() => {
    if (show) {
      setFormData({
        name: userName || user?.displayName || '',
        email: user?.email || '',
        phone: '',
        course: selectedCourse || '',
        preferredDate: '',
        preferredTimeSlot: '',
        message: ''
      });
    }
  }, [show, user, userName, selectedCourse]);

  const [status, setStatus] = useState({
    success: false,
    error: false,
    show: false
  });

  const timeSlots = [
    { value: '09:00', label: '9:00 AM' },
    { value: '10:00', label: '10:00 AM' },
    { value: '11:00', label: '11:00 AM' },
    { value: '13:00', label: '1:00 PM' },
    { value: '14:00', label: '2:00 PM' },
    { value: '15:00', label: '3:00 PM' },
    { value: '16:00', label: '4:00 PM' },
    { value: '17:00', label: '5:00 PM' }
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Send email notification
      await emailjs.send(
        'service_ihc4di7',
        'template_mauhknb',
        formData,
        'L8cGXGnMaq2Pj005_'
      );
      
      // Create enrollment record in Firestore
      await addDoc(collection(db, "enrollments"), {
        studentName: formData.name,
        email: formData.email,
        phone: formData.phone,
        courseTitle: formData.course,
        courseId: selectedCourseId || '',
        enrollmentDate: serverTimestamp(),
        paymentStatus: "Pending",
        preferredDate: formData.preferredDate,
        preferredTimeSlot: formData.preferredTimeSlot,
        message: formData.message,
        userId: user?.uid || null
      });
      
      setStatus({ success: true, error: false, show: true });
      setFormData({
        name: '',
        email: '',
        phone: '',
        course: '',
        preferredDate: '',
        preferredTimeSlot: '',
        message: ''
      });
      
      // Call onSubmit after successful form submission
      setTimeout(() => {
        onSubmit();
      }, 1500);
    } catch (error) {
      setStatus({ success: false, error: true, show: true });
      console.error('Failed to process enrollment:', error);
    }
  };

  const handleSkip = async () => {
    try {
      // Create enrollment record in Firestore with minimal information
      await addDoc(collection(db, "enrollments"), {
        studentName: user?.displayName || '',
        email: user?.email || '',
        phone: '',
        courseTitle: selectedCourse || '',
        courseId: selectedCourseId || '',
        enrollmentDate: serverTimestamp(),
        paymentStatus: "Pending",
        userId: user?.uid || null
      });
      
      onSkip();
    } catch (error) {
      console.error('Failed to create enrollment record:', error);
      onSkip(); // Still proceed to payment even if enrollment record creation fails
    }
  };

  useEffect(() => {
    if (status.show) {
      const timer = setTimeout(() => {
        setStatus({ success: false, error: false, show: false });
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [status.show]);

  const dateInputRef = useRef(null);

  // Date logic
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split('T')[0];
  const maxDate = new Date();
  maxDate.setDate(maxDate.getDate() + 31);
  const maxDateStr = maxDate.toISOString().split('T')[0];

  // Only return null after all hooks are called
  if (!show || userRole !== 'Student') return null;

  return (
    <div className="enquiry-modal-overlay">
      <div className="enquiry-modal">
        <button className="enquiry-modal-close" onClick={onClose}>&times;</button>
        <div className="enquiry-modal-header">
          <h2>Course Enquiry Form</h2>
          <p className="text-muted">Fill this form to get more information about the course or skip to proceed with enrollment</p>
        </div>
        <form onSubmit={handleSubmit} className="enquiry-modal-form">
          <div className="enquiry-modal-row">
            <div className="enquiry-modal-group">
              <label htmlFor="name">Name</label>
              <input
                id="name"
                type="text"
                name="name"
                placeholder="Enter your full name"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>
            <div className="enquiry-modal-group">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                name="email"
                placeholder="Enter your email address"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>
          </div>
          <div className="enquiry-modal-row">
            <div className="enquiry-modal-group">
              <label htmlFor="phone">Phone Number</label>
              <input
                id="phone"
                type="tel"
                name="phone"
                placeholder="Enter your phone number"
                value={formData.phone}
                onChange={handleChange}
                required
              />
            </div>
            <div className="enquiry-modal-group">
              <label htmlFor="course">Course</label>
              <input
                id="course"
                type="text"
                name="course"
                value={formData.course}
                readOnly
                className="readonly-input"
              />
            </div>
          </div>
          <div className="enquiry-modal-row">
            <div className="enquiry-modal-group">
              <label htmlFor="preferredDate">Preferred Date</label>
              <div className="date-input-wrapper">
                <input
                  id="preferredDate"
                  type="date"
                  name="preferredDate"
                  value={formData.preferredDate}
                  onChange={handleChange}
                  min={minDate}
                  max={maxDateStr}
                  required
                  ref={dateInputRef}
                />
                <svg
                  className="calendar-icon"
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  fill="black"
                  viewBox="0 0 24 24"
                  onClick={() =>
                    dateInputRef.current &&
                    (dateInputRef.current.showPicker
                      ? dateInputRef.current.showPicker()
                      : dateInputRef.current.focus())
                  }
                  style={{ cursor: 'pointer', pointerEvents: 'auto' }}
                >
                  <path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V9h14v11zm0-13H5V6h14v1z"/>
                </svg>
              </div>
            </div>
            <div className="enquiry-modal-group">
              <label htmlFor="preferredTimeSlot">Preferred Time Slot</label>
              <select
                id="preferredTimeSlot"
                name="preferredTimeSlot"
                value={formData.preferredTimeSlot}
                onChange={handleChange}
                required
              >
                <option value="">Select a time slot</option>
                {timeSlots.map(slot => (
                  <option key={slot.value} value={slot.value}>
                    {slot.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="enquiry-modal-row">
            <div className="enquiry-modal-group full-width">
              <label htmlFor="message">Message</label>
              <textarea
                id="message"
                name="message"
                placeholder="Type your message or query here"
                value={formData.message}
                onChange={handleChange}
                required
              />
            </div>
          </div>
          <div className="enquiry-modal-row">
            <div className="enquiry-modal-button-group">
              <button type="button" onClick={handleSkip} className="skip-button">Skip & Proceed to Payment</button>
              <button type="submit" className="submit-button">Submit Enquiry</button>
            </div>
          </div>
        </form>
        {status.show && status.success && (
          <div className="enquiry-modal-message success">
            Your enquiry has been sent successfully! Proceeding to payment...
          </div>
        )}
        {status.show && status.error && (
          <div className="enquiry-modal-message error">
            Failed to send your enquiry. Please try again later.
          </div>
        )}
      </div>
    </div>
  );
};

export default EnquiryModal;
