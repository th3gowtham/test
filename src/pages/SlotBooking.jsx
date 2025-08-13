import React, { useState, useEffect } from 'react';
import { Calendar, Clock } from 'lucide-react';
import { db } from '../services/firebase';
import { collection, doc, setDoc, onSnapshot } from 'firebase/firestore';
import '../styles/SlotBooking.css';

const SlotBooking = () => {
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [slots, setSlots] = useState([
    { id: 1, date: '', fromTime: '', toTime: '', fromPeriod: 'AM', toPeriod: 'AM' },
    { id: 2, date: '', fromTime: '', toTime: '', fromPeriod: 'AM', toPeriod: 'AM' },
    { id: 3, date: '', fromTime: '', toTime: '', fromPeriod: 'AM', toPeriod: 'AM' }
  ]);



  // 🔄 Listen to real-time updates from Firestore
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'teacherSlots'), (snapshot) => {
      const fetched = snapshot.docs.map(doc => doc.data());

      setSlots(prev =>
        prev.map(slot =>
          fetched.find(s => s.id === slot.id) || slot
        )
      );
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);


  const handleSave = async () => {
    try {
      for (const slot of slots) {
        if (slot.date && slot.fromTime && slot.toTime) {
          const docRef = doc(db, 'teacherSlots', `slot-${slot.id}`);
          await setDoc(docRef, slot);
        }
      }
      alert("Slots saved successfully!");
    } catch (error) {
      console.error("Error saving slots:", error);
    }
  };

  const updateSlot = (slotId, field, value) => {
    setSlots(prev => prev.map(slot => slot.id === slotId ? { ...slot, [field]: value } : slot));
  };

  const copySlot = (sourceSlotId, targetSlotId) => {
    const sourceSlot = slots.find(slot => slot.id === sourceSlotId);
    if (sourceSlot && sourceSlot.date && sourceSlot.fromTime && sourceSlot.toTime) {
      setSlots(prev =>
        prev.map(slot =>
          slot.id === targetSlotId
            ? {
              ...slot,
              date: sourceSlot.date,
              fromTime: sourceSlot.fromTime,
              toTime: sourceSlot.toTime,
              fromPeriod: sourceSlot.fromPeriod,
              toPeriod: sourceSlot.toPeriod
            }
            : slot
        )
      );
    }
  };

  const clearSlot = async (slotId) => {
  const clearedSlot = {
    id: slotId,
    date: '',
    fromTime: '',
    toTime: '',
    fromPeriod: 'AM',
    toPeriod: 'AM',
  };

  setSlots(prev =>
    prev.map(slot =>
      slot.id === slotId ? clearedSlot : slot
    )
  );

  try {
    const docRef = doc(db, 'teacherSlots', `slot-${slotId}`);
    await setDoc(docRef, clearedSlot);
  } catch (error) {
    console.error("Error clearing slot:", error);
  }
};


  const generateTimeOptions = () => {
    const times = [];
    for (let hour = 1; hour <= 12; hour++) {
      for (let minute of ['00', '15', '30', '45']) {
        const timeStr = `${hour.toString().padStart(2, '0')}:${minute}`;
        times.push(timeStr);
      }
    }
    return times;
  };

  const timeOptions = generateTimeOptions();
  const isMobile = windowWidth <= 480;
  const isTablet = windowWidth > 480 && windowWidth <= 768;

  return (
    <div className={`booking-wrapper ${isMobile ? 'mobile' : isTablet ? 'tablet' : 'desktop'}`}>
      <div className="booking-card">
        <h2 className="booking-title">Teacher Availability Booking</h2>

        {slots.map((slot, index) => (
          <div key={slot.id} className="slot-card">
            <div className={`slot-header ${isTablet ? 'tablet' : ''}`}>
              <h3 className="slot-title">
                <Calendar size={20} />
                Slot {slot.id}
              </h3>
              <div className="slot-controls">
                {index > 0 && (
                  <select
                    onChange={(e) => e.target.value && copySlot(parseInt(e.target.value), slot.id)}
                    value=""
                    className="copy-select"
                  >
                    <option value="">Copy from...</option>
                    {slots.filter(s => s.id < slot.id && s.date).map(s => (
                      <option key={s.id} value={s.id}>
                        Slot {s.id} ({s.date})
                      </option>
                    ))}
                  </select>
                )}
                <button onClick={() => clearSlot(slot.id)} className="clear-btn">Clear</button>
              </div>
            </div>

            <div className="booking-form-group">
              <label>Select Date</label>
              <input
                type="date"
                value={slot.date}
                onChange={(e) => updateSlot(slot.id, 'date', e.target.value)}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>

            {/* Time Layout */}
            <div className={`time-picker ${isMobile ? 'stacked' : isTablet ? 'tablet' : 'desktop'}`}>
              {['from', 'to'].map(type => (
                <div key={type} className="time-group">
                  <label>{type === 'from' ? 'From Time' : 'To Time'}</label>
                  <div className="time-row">
                    <select
                      value={slot[`${type}Time`]}
                      onChange={(e) => updateSlot(slot.id, `${type}Time`, e.target.value)}
                    >
                      <option value="">Select time</option>
                      {timeOptions.map(time => (
                        <option key={time} value={time}>{time}</option>
                      ))}
                    </select>
                    <select
                      value={slot[`${type}Period`]}
                      onChange={(e) => updateSlot(slot.id, `${type}Period`, e.target.value)}
                    >
                      <option value="AM">AM</option>
                      <option value="PM">PM</option>
                    </select>
                  </div>
                </div>
              ))}
            </div>

            {slot.date && slot.fromTime && slot.toTime && (
              <div className="slot-summary">
                <div className="slot-day">
                  <Clock size={16} />
                  {new Date(slot.date).toLocaleDateString('en-US', {
                    weekday: isMobile ? 'short' : 'long',
                    year: 'numeric',
                    month: isMobile ? 'short' : 'long',
                    day: 'numeric'
                  })}
                </div>
                <div className="slot-time">
                  {slot.fromTime} {slot.fromPeriod} - {slot.toTime} {slot.toPeriod}
                </div>
              </div>
            )}
          </div>
        ))}

        <button className="submit-btn" onClick={handleSave}>
          Save Slot
        </button>
      </div>
    </div>
  );
};

export default SlotBooking;
