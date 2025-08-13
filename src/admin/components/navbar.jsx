

import { FiBell, FiUser, FiChevronDown, FiLogOut, FiSettings, FiActivity, FiUsers, FiBookOpen } from "react-icons/fi"
import { useState, useRef, useEffect } from "react"
import { useIsMobile } from "../hooks/use-mobile"
import { db } from "../../services/firebase"
import { collection, onSnapshot, query, orderBy, limit } from "firebase/firestore"
import { useAuth } from "../../context/AuthContext"
import { useNavigate } from "react-router-dom"
import { toast } from "react-toastify"

export default function Navbar() {
  const [showProfileDropdown, setShowProfileDropdown] = useState(false)
  const [showActivityModal, setShowActivityModal] = useState(false)
  const [activeTab, setActiveTab] = useState('enrollments')
  const [enrollments, setEnrollments] = useState([])
  const [newUsers, setNewUsers] = useState([])
  const [loading, setLoading] = useState({
    enrollments: false,
    users: false
  })
  
  const dropdownRef = useRef(null)
  const activityBtnRef = useRef(null)
  const modalRef = useRef(null)
  const isMobile = useIsMobile()
  const { logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    try {
      await logout()
      navigate('/')
    } catch (error) {
      toast.error("Logout failed", {
        position: "top-right",
        autoClose: 4000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "light",
      })
    }
  }

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowProfileDropdown(false)
      }
      if (showActivityModal && modalRef.current && !modalRef.current.contains(event.target) && 
          activityBtnRef.current && !activityBtnRef.current.contains(event.target)) {
        setShowActivityModal(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [dropdownRef, showActivityModal])
  
  // Fetch course enrollments (batches)
  useEffect(() => {
    if (showActivityModal && activeTab === 'enrollments') {
      setLoading(prev => ({ ...prev, enrollments: true }))
      
      // Create a query against the batches collection
      const batchesRef = collection(db, "batches")
      const q = query(batchesRef, orderBy("createdAt", "desc"), limit(10))
      
      // Set up real-time listener
      const unsubscribe = onSnapshot(q, 
        async (querySnapshot) => {
          const batchesData = querySnapshot.docs.map(doc => ({
            id: doc.id,
            batchId: doc.data().batchId || doc.id,
            batchName: doc.data().batchName || "Unknown Batch",
            courseId: doc.data().courseId || "",
            teacherId: doc.data().teacherId || "",
            students: doc.data().students || [],
            status: doc.data().status || "active",
            createdAt: doc.data().createdAt ? doc.data().createdAt.toDate() : new Date(),
            // These will be populated later
            course: "",
            teacher: "",
            totalStudents: doc.data().students ? doc.data().students.length : 0
          }))
          
          // Fetch courses and teachers to resolve names
          const coursesRef = collection(db, "courses")
          const coursesSnapshot = await onSnapshot(query(coursesRef), (snapshot) => {
            const coursesData = snapshot.docs.map(doc => ({
              id: doc.id,
              courseName: doc.data().name || doc.data().courseName || "Unknown Course"
            }))
            
            // Fetch teachers
            const teachersRef = collection(db, "Teacher")
            const teachersSnapshot = onSnapshot(query(teachersRef), (snapshot) => {
              const teachersData = snapshot.docs.map(doc => ({
                id: doc.id,
                uid: doc.data().uid || doc.id,
                name: doc.data().name || "Unknown"
              }))
              
              // Resolve course and teacher names
              const resolvedBatches = batchesData.map(batch => {
                const course = coursesData.find(c => c.id === batch.courseId)
                const teacher = teachersData.find(t => t.id === batch.teacherId || t.uid === batch.teacherId)
                
                return {
                  ...batch,
                  course: course ? course.courseName : "Unknown Course",
                  teacher: teacher ? teacher.name : "Unknown Teacher"
                }
              })
              
              setEnrollments(resolvedBatches)
              setLoading(prev => ({ ...prev, enrollments: false }))
            })
            
            return () => teachersSnapshot()
          })
          
          return () => coursesSnapshot()
        },
        (err) => {
          console.error("Error fetching batches:", err)
          setLoading(prev => ({ ...prev, enrollments: false }))
        }
      )
      
      // Clean up listener on unmount
      return () => unsubscribe()
    }
  }, [showActivityModal, activeTab])
  
  // Fetch new registered users
  useEffect(() => {
    if (showActivityModal && activeTab === 'users') {
      setLoading(prev => ({ ...prev, users: true }))
      
      // Create a query against the Students collection
      const studentsRef = collection(db, "Students")
      const q = query(studentsRef, orderBy("createdAt", "desc"), limit(10))
      
      // Set up real-time listener
      const unsubscribe = onSnapshot(q, 
        (querySnapshot) => {
          const studentsData = querySnapshot.docs.map(doc => ({
            id: doc.id,
            name: doc.data().name || "Unknown",
            email: doc.data().Gmail || doc.data().email || "",
            createdAt: doc.data().createdAt ? doc.data().createdAt.toDate() : new Date()
          }))
          
          setNewUsers(studentsData)
          setLoading(prev => ({ ...prev, users: false }))
        },
        (err) => {
          console.error("Error fetching students:", err)
          setLoading(prev => ({ ...prev, users: false }))
        }
      )
      
      // Clean up listener on unmount
      return () => unsubscribe()
    }
  }, [showActivityModal, activeTab])

  return (
    <>
      <nav className="Admin-navbar">
        <div className="navbar-left">
          <h1 className="page-title">Admin Dashboard</h1>
        </div>

        <div className="navbar-right">
          <button 
            className="activity-btn" 
            onClick={() => setShowActivityModal(!showActivityModal)}
            aria-label="View Activity"
            ref={activityBtnRef}
          >
            <FiActivity />
            <span className="activity-btn-text">View Activity</span>
          </button>
          
        {/* <button className="notification-btn" aria-label="Notifications">
            <FiBell />
            <span className="notification-badge">3</span>
          </button> 
          */}

          <div className="profile-dropdown" ref={dropdownRef}>
            <button 
              className="profile-btn" 
              onClick={() => setShowProfileDropdown(!showProfileDropdown)}
              aria-expanded={showProfileDropdown}
              aria-haspopup="true"
            >
              <div className="profile-avatar">
                <FiUser />
              </div>
              <span className="profile-name">Admin User</span>
              <FiChevronDown className={`dropdown-arrow ${showProfileDropdown ? "open" : ""}`} />
            </button>

            {showProfileDropdown && (
              <div className="dropdown-menu">
                <button className="dropdown-item">
                  <FiSettings />
                  Profile Settings
                </button>
                <button className="dropdown-item" onClick={handleLogout}>
                  <FiLogOut />
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>
      
      {/* Activity Modal */}
      {showActivityModal && (
        <div className="activity-modal-overlay">
          <div className="activity-modal" ref={modalRef}>
            <div className="activity-modal-header">
              <h3>Activity Dashboard</h3>
              <button className="close-btn" onClick={() => setShowActivityModal(false)}>
                &times;
              </button>
            </div>
            
            <div className="activity-tabs">
              <button 
                className={`tab-btn ${activeTab === 'enrollments' ? 'active' : ''}`}
                onClick={() => setActiveTab('enrollments')}
              >
                <FiBookOpen />
                <span>Courses Enrolled</span>
              </button>
              <button 
                className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`}
                onClick={() => setActiveTab('users')}
              >
                <FiUsers />
                <span>New Registered Users</span>
              </button>
            </div>
            
            <div className="activity-content">
              {activeTab === 'enrollments' && (
                <div className="enrollments-tab">
                  {loading.enrollments ? (
                    <div className="loading-state">Loading enrollments...</div>
                  ) : enrollments.length === 0 ? (
                    <div className="empty-state">No course enrollments found</div>
                  ) : (
                    <div className="activity-table-container">
                      <table className="activity-table">
                        <thead>
                          <tr>
                            <th>Batch Name</th>
                            <th>Course</th>
                            <th>Teacher</th>
                            <th>Students</th>
                            <th>Enrollment Date</th>
                          </tr>
                        </thead>
                        <tbody>
                          {enrollments.map((enrollment) => (
                            <tr key={enrollment.id}>
                              <td>{enrollment.batchName}</td>
                              <td>{enrollment.course}</td>
                              <td>{enrollment.teacher}</td>
                              <td>{enrollment.totalStudents}</td>
                              <td>{enrollment.createdAt.toLocaleDateString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
              
              {activeTab === 'users' && (
                <div className="users-tab">
                  {loading.users ? (
                    <div className="loading-state">Loading new users...</div>
                  ) : newUsers.length === 0 ? (
                    <div className="empty-state">No new registered users found</div>
                  ) : (
                    <div className="activity-table-container">
                      <table className="activity-table">
                        <thead>
                          <tr>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Registration Date</th>
                          </tr>
                        </thead>
                        <tbody>
                          {newUsers.map((user) => (
                            <tr key={user.id}>
                              <td>{user.name}</td>
                              <td>{user.email}</td>
                              <td>{user.createdAt.toLocaleDateString()} {user.createdAt.toLocaleTimeString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
