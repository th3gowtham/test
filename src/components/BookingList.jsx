import React, { useEffect, useState } from 'react';
import '../styles/BookingList.css';

const BookingList = ({ refreshBookings }) => {
  const [bookings, setBookings] = useState([]);

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem('bookedCalls') || '[]');
    setBookings(Array.isArray(stored) ? stored : []);
  }, [refreshBookings]);

  const formatDate = (dateStr) => {
    // If it's already 'YYYY-MM-DD', return as is
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;

    // If it's in ISO format, convert it
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-CA'); // 'YYYY-MM-DD'
    } catch {
      return dateStr;
    }
  };

  if (bookings.length === 0) {
    return <div className="booking-list-empty">No bookings yet.</div>;
  }

  return (
    <div>
      <div className="booking-list-title">Your Bookings</div>
      <ul className="booking-list-ul">
        {bookings.map((b, idx) => (
          <li key={idx} className="booking-list-item">
            <div className="booking-list-row">
              <span role="img" aria-label="calendar">📅</span>
              {formatDate(b.date)}
            </div>
            <div className="booking-list-row">
              <span role="img" aria-label="clock">🕒</span>
              {b.time || '--:--'}
            </div>
            <div className="booking-list-row">
              <span role="img" aria-label="call">
                {b.callType === 'video' ? '📹' : b.callType === 'audio' ? '🎤' : '❓'}
              </span>
              {b.callType === 'video' ? 'Video Call' : b.callType === 'audio' ? 'Audio Call' : 'Unknown'}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default BookingList;
