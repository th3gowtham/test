import React, { useEffect, useState } from 'react';
import '../styles/BookCallModal.css';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { collection, addDoc, query, where, onSnapshot, orderBy, doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from '../services/firebase';
import emailjs from 'emailjs-com';
import { useAuth } from '../context/AuthContext';

const MEET_LINK = 'https://meet.google.com/your-static-link';
const ADMIN_EMAIL = 'admin@example.com';

// Define static available time slots (no teacher filtering)
const TIME_SLOTS = [
  '09:00 AM', '10:00 AM', '11:00 AM',
  '02:00 PM', '03:00 PM', '04:00 PM',
  '05:00 PM', '06:00 PM',
];

const BookCallModal = ({ isOpen, onClose, onBooking, collectionName = "bookings", privateChatId }) => {
  const [date, setDate] = useState(null);
  const [time, setTime] = useState('');
  const [success, setSuccess] = useState(false);
  const [existingBookings, setExistingBookings] = useState([]);
  const { currentUser, userRole } = useAuth();
  const [chatTeacherUid, setChatTeacherUid] = useState(null);
  const [teacherSlots, setTeacherSlots] = useState([]);

  // Subscribe to existing bookings for this chat so students see assigned slots
  useEffect(() => {
    if (!isOpen || !privateChatId) return;
    try {
      const q = query(
        collection(db, collectionName),
        where('chatId', '==', privateChatId),
        orderBy('bookedAt', 'desc')
      );
      const unsub = onSnapshot(q, (snap) => {
        const items = snap.docs.map((d) => ({ id: d.id, ...(d.data() || {}) }));
        setExistingBookings(items);
      });
      return () => unsub();
    } catch {
      /* ignore */
    }
  }, [isOpen, privateChatId, collectionName]);

  // Fetch chat to resolve teacher uid if available
  useEffect(() => {
    if (!isOpen || !privateChatId) return;
    (async () => {
      try {
        const chatRef = doc(db, 'chats', privateChatId);
        const snap = await getDoc(chatRef);
        if (snap.exists()) {
          const data = snap.data() || {};
          if (data.teacherId) setChatTeacherUid(String(data.teacherId));
        }
      } catch {
        /* ignore */
      }
    })();
  }, [isOpen, privateChatId]);

  // Subscribe to teacherSlots availability (global or per-teacher if identifiable)
  useEffect(() => {
    if (!isOpen) return;
    try {
      const unsub = onSnapshot(collection(db, 'teacherSlots'), (snapshot) => {
        const items = snapshot.docs.map((d) => ({ id: d.id, ...(d.data() || {}) }));
        // If slots contain a teacher identifier, filter to this chat's teacher
        const filtered = chatTeacherUid
          ? items.filter((s) => {
              const t = String(s.teacherUid || s.createdByUid || '') || null;
              return !t || t === chatTeacherUid; // if no teacher tag, keep (backward compat), else match
            })
          : items;
        setTeacherSlots(filtered);
      });
      return () => unsub();
    } catch {
      /* ignore */
    }
  }, [isOpen, chatTeacherUid]);

  // Build dynamic available time slots for selected date from teacherSlots
  const slotsToShow = (() => {
    if (!date) return [];
    const selected = date instanceof Date ? date.toISOString().slice(0, 10) : null; // YYYY-MM-DD
    if (!selected) return [];

    const toMinutes = (hhmm, period) => {
      if (!hhmm) return null;
      const [hStr, mStr] = String(hhmm).split(':');
      let h = parseInt(hStr || '0', 10);
      const m = parseInt(mStr || '0', 10);
      const isPM = String(period || 'AM').toUpperCase() === 'PM';
      if (h === 12) h = 0;
      const base = h * 60 + m;
      return base + (isPM ? 12 * 60 : 0);
    };

    const toLabel = (minutes) => {
      const total = ((minutes % (24 * 60)) + (24 * 60)) % (24 * 60);
      let hr24 = Math.floor(total / 60);
      const min = total % 60;
      const period = hr24 >= 12 ? 'PM' : 'AM';
      let hr12 = hr24 % 12;
      if (hr12 === 0) hr12 = 12;
      return `${String(hr12).padStart(2, '0')}:${String(min).padStart(2, '0')} ${period}`;
    };

    // Collect all ranges for the selected date
    const ranges = teacherSlots
      .filter((s) => String(s.date || '') === selected && s.fromTime && s.toTime)
      .map((s) => ({
        start: toMinutes(s.fromTime, s.fromPeriod),
        end: toMinutes(s.toTime, s.toPeriod)
      }))
      .filter((r) => r.start !== null && r.end !== null && r.end > r.start);

    if (ranges.length === 0) return []; // no availability for selected date

    // Generate 30-min slots within ranges
    const slots = new Set();
    for (const r of ranges) {
      for (let t = r.start; t <= r.end; t += 30) {
        slots.add(toLabel(t));
      }
    }
    return Array.from(slots);
  })();

  // Persist student's selected date to Firestore for this chat (lightweight signal)
  useEffect(() => {
    if (!isOpen || !privateChatId || !date) return;
    try {
      const selected = date instanceof Date ? date.toISOString().slice(0, 10) : null;
      if (!selected) return;
      const ref = doc(db, 'bookingSelections', privateChatId);
      setDoc(ref, {
        chatId: privateChatId,
        selectedDate: selected,
        updatedAt: serverTimestamp(),
        lastSelectedByUid: currentUser?.uid || null,
        lastSelectedByRole: userRole || null,
      }, { merge: true }).catch(() => {});
    } catch {}
  }, [isOpen, privateChatId, date, currentUser, userRole]);

  const handleTimeClick = (slot) => {
    setTime(slot);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!date || !time) return;

    const booking = {
      date: date.toLocaleDateString('en-CA'),
      time: time,
      meetLink: MEET_LINK,
      bookedAt: new Date().toISOString(),
      chatId: privateChatId || null,
      createdByUid: currentUser?.uid || null,
      createdByRole: userRole || null,
    };

    try {
      await addDoc(collection(db, collectionName), booking);

      const templateParams = {
        admin_email: ADMIN_EMAIL,
        student_date: booking.date,
        student_time: booking.time,
        meet_link: MEET_LINK,
      };

      emailjs.send(
        'your_service_id',     // Replace with your EmailJS service ID
        'your_template_id',    // Replace with your EmailJS template ID
        templateParams,
        'your_user_id'         // Replace with your EmailJS user/public key
      )
      .then(() => console.log('✅ Email sent!'))
      .catch(err => console.error('❌ Email error:', err));

      if (onBooking) onBooking();
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 1000);
    } catch (error) {
      console.error("Error adding booking to Firebase: ", error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="bookcall-modal-overlay">
      <div className="bookcall-modal">
        <button className="bookcall-close" onClick={onClose}>&times;</button>
        <h2>📅 Book a Session</h2>
        <p>Schedule your session via the Meet link below</p>

        <form onSubmit={handleSubmit} className="bookcall-form">

          {/* Date Picker */}
          <div className='date-picker-wrapper'>
            <div className="bookcall-date">
            <label>Select Date</label>
            <DatePicker
              selected={date}
              onChange={setDate}
              dateFormat="dd/MM/yyyy"
              minDate={new Date()}
              inline
              required
            />
          </div>

          </div>
          {/* Time Slots */}
          <div className="bookcall-times">
            <label>Available Times</label>
            <div className="bookcall-times-list">
              {slotsToShow.map((slot) => (
                <button
                  type="button"
                  key={slot}
                  className={'bookcall-time-pill' + (time === slot ? ' selected' : '')}
                  onClick={() => handleTimeClick(slot)}
                >
                  <span className="bookcall-time-icon">🕒</span>
                  {slot}
                </button>
              ))}
              {slotsToShow.length === 0 && (
                <div style={{ color: '#6b7280', fontSize: 14 }}>No availability for the selected date.</div>
              )}
            </div>
          </div>

          {/* Static Meet Link */}
          <div className="bookcall-meet-link" style={{ margin: '10px 0' }}>
            <strong>Meet Link: </strong>
            <a href={MEET_LINK} target="_blank" rel="noopener noreferrer">{MEET_LINK}</a>
          </div>

          {/* Summary */}
          <div className="bookcall-summary">
            <div className="summary-title">Booking Summary</div>
            <div className="summary-row">
              <span role="img" aria-label="calendar">📅</span>
              {date ? date.toLocaleDateString() : '--/--/----'}
            </div>
            <div className="summary-row">
              <span role="img" aria-label="clock">🕒</span>
              {time || '--:--'}
            </div>
            <div className="summary-row">
              <span role="img" aria-label="link">🔗</span>
              <a href={MEET_LINK} target="_blank" rel="noopener noreferrer">
                Join Meet
              </a>
            </div>
          </div>

          {/* Existing bookings for this chat (student can see assigned slots) */}
          {privateChatId && (
            <div className="bookcall-summary" style={{ marginTop: 10 }}>
              <div className="summary-title">Upcoming Sessions</div>
              {existingBookings.length === 0 ? (
                <div className="summary-row" style={{ color: '#64748b' }}>No sessions assigned yet.</div>
              ) : (
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 6 }}>
                  {existingBookings.map((b) => (
                    <li key={`${b.date}-${b.time}-${b.id}`} className="summary-row" style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>📅 {b.date}</span>
                      <span>🕒 {b.time}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {success && <div className="bookcall-success">Booking Successful!</div>}

          {/* Actions */}
          <div className="bookcall-actions">
            <button type="button" className="bookcall-cancel" onClick={onClose}>Cancel</button>
            <button
              type="submit"
              className="bookcall-submit"
              disabled={!date || !time}
            >
              Book Session
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BookCallModal;
