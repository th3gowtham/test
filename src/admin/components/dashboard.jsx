"use client"

import { useState, useEffect } from "react"
import { FiUsers, FiUserCheck, FiBook, FiLayers, FiTrendingUp, FiCalendar, FiClock, FiArrowRight } from "react-icons/fi"
import { db } from "../../services/firebase"
import { collection, onSnapshot, query, where } from "firebase/firestore"

// Skeleton data structure for analytics
const analyticsDataStructure = [
  { title: "Total Students", value: 0, icon: FiUsers, color: "#127d8e", change: "", loading: true },
  { title: "Total Teachers", value: 0, icon: FiUserCheck, color: "#48bb78", change: "", loading: true },
  { title: "Total Courses", value: 0, icon: FiBook, color: "#ed8936", change: "", loading: true },
  { title: "Active Batches", value: 0, icon: FiLayers, color: "#9f7aea", change: "", loading: true },
]

const recentActivities = [
  { action: "New student enrolled", course: "React Fundamentals", time: "2 hours ago" },
  { action: "Course completed", course: "JavaScript Basics", time: "4 hours ago" },
  { action: "New teacher added", course: "Python Development", time: "6 hours ago" },
  { action: "Batch created", course: "Web Design", time: "1 day ago" },
  { action: "Event scheduled", course: "Tech Workshop", time: "2 days ago" },
]

const upcomingEvents = [
  { title: "React Workshop", date: "Dec 25, 2024", time: "10:00 AM", participants: 45 },
  { title: "Python Bootcamp", date: "Dec 28, 2024", time: "2:00 PM", participants: 32 },
  { title: "Design Thinking Session", date: "Jan 2, 2025", time: "11:00 AM", participants: 28 },
]

export default function Dashboard() {
  const [analyticsData, setAnalyticsData] = useState(analyticsDataStructure)

  // Fetch counts from Firestore collections
  useEffect(() => {
    // Create a copy of the analytics data to update
    const updatedAnalyticsData = [...analyticsDataStructure]

    // 1. Fetch total students count
    const studentsRef = collection(db, "Students")
    const studentsUnsubscribe = onSnapshot(query(studentsRef), (snapshot) => {
      const count = snapshot.size
      updatedAnalyticsData[0] = {
        ...updatedAnalyticsData[0],
        value: count,
        loading: false,
      }
      setAnalyticsData([...updatedAnalyticsData])
    }, (error) => {
      console.error("Error fetching students count:", error)
      updatedAnalyticsData[0] = {
        ...updatedAnalyticsData[0],
        loading: false,
      }
      setAnalyticsData([...updatedAnalyticsData])
    })

    // 2. Fetch total teachers count
    const teachersRef = collection(db, "Teacher")
    const teachersUnsubscribe = onSnapshot(query(teachersRef), (snapshot) => {
      const count = snapshot.size
      updatedAnalyticsData[1] = {
        ...updatedAnalyticsData[1],
        value: count,
        loading: false,
      }
      setAnalyticsData([...updatedAnalyticsData])
    }, (error) => {
      console.error("Error fetching teachers count:", error)
      updatedAnalyticsData[1] = {
        ...updatedAnalyticsData[1],
        loading: false,
      }
      setAnalyticsData([...updatedAnalyticsData])
    })

    // 3. Fetch total courses count
    const coursesRef = collection(db, "courses")
    const coursesUnsubscribe = onSnapshot(query(coursesRef), (snapshot) => {
      const count = snapshot.size
      updatedAnalyticsData[2] = {
        ...updatedAnalyticsData[2],
        value: count,
        loading: false,
      }
      setAnalyticsData([...updatedAnalyticsData])
    }, (error) => {
      console.error("Error fetching courses count:", error)
      updatedAnalyticsData[2] = {
        ...updatedAnalyticsData[2],
        loading: false,
      }
      setAnalyticsData([...updatedAnalyticsData])
    })

    // 4. Fetch active batches count
    const batchesRef = collection(db, "batches")
    const activeBatchesQuery = query(batchesRef, where("status", "==", "active"))
    const batchesUnsubscribe = onSnapshot(activeBatchesQuery, (snapshot) => {
      const count = snapshot.size
      updatedAnalyticsData[3] = {
        ...updatedAnalyticsData[3],
        value: count,
        loading: false,
      }
      setAnalyticsData([...updatedAnalyticsData])
    }, (error) => {
      console.error("Error fetching active batches count:", error)
      updatedAnalyticsData[3] = {
        ...updatedAnalyticsData[3],
        loading: false,
      }
      setAnalyticsData([...updatedAnalyticsData])
    })

    // Clean up listeners on unmount
    return () => {
      studentsUnsubscribe()
      teachersUnsubscribe()
      coursesUnsubscribe()
      batchesUnsubscribe()
    }
  }, [])

  return (
    <div className="dashboard">
      <style>{styles}</style>
      <div className="dashboard-header">
        <h2>Dashboard Overview</h2>
        <p>Welcome back! Here's what's happening with your platform today.</p>
      </div>

      <div className="analytics-grid">
        {analyticsData.map((item, index) => {
          const Icon = item.icon
          return (
            <div key={index} className="analytics-card">
              <div className="card-header">
                <div className="card-icon" style={{ backgroundColor: `${item.color}20`, color: item.color }}>
                  <Icon />
                </div>
                {item.change && (
                  <div className="card-change">
                    <FiTrendingUp />
                    {item.change}
                  </div>
                )}
              </div>
              <div className="card-content">
                {item.loading ? (
                  <div className="skeleton-loader">
                    <div className="skeleton-value"></div>
                    <div className="skeleton-title"></div>
                  </div>
                ) : (
                  <>
                    <h3>{item.value.toLocaleString()}</h3>
                    <p>{item.title}</p>
                  </>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <div className="dashboard-content">
        <div className="activities-section">
          <div className="section-header">
            <h3>Recent Activities</h3>
            <button className="view-all-btn">
              View All <FiArrowRight />
            </button>
          </div>
          <div className="activities-list">
            {recentActivities.map((activity, index) => (
              <div key={index} className="activity-item">
                <div className="activity-dot"></div>
                <div className="activity-content">
                  <p className="activity-action">{activity.action}</p>
                  <p className="activity-course">{activity.course}</p>
                </div>
                <span className="activity-time">{activity.time}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="events-section">
          <div className="section-header">
            <h3>Upcoming Events</h3>
            <button className="view-all-btn">
              View All <FiArrowRight />
            </button>
          </div>
          <div className="events-list">
            {upcomingEvents.map((event, index) => (
              <div key={index} className="event-item">
                <div className="event-date">
                  <FiCalendar />
                  <span>{event.date}</span>
                </div>
                <div className="event-details">
                  <h4>{event.title}</h4>
                  <div className="event-meta">
                    <span className="event-time">
                      <FiClock /> {event.time}
                    </span>
                    <span className="event-participants">
                      <FiUsers /> {event.participants} participants
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Add CSS for skeleton loaders
const styles = `
  .skeleton-loader {
    width: 100%;
  }
  
  .skeleton-value {
    height: 28px;
    width: 70%;
    background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
    background-size: 200% 100%;
    animation: shimmer 1.5s infinite;
    border-radius: 4px;
    margin-bottom: 8px;
  }
  
  .skeleton-title {
    height: 16px;
    width: 90%;
    background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
    background-size: 200% 100%;
    animation: shimmer 1.5s infinite;
    border-radius: 4px;
  }
  
  @keyframes shimmer {
    0% {
      background-position: 200% 0;
    }
    100% {
      background-position: -200% 0;
    }
  }
`
