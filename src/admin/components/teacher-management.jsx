"use client"

import { useState, useEffect, useRef } from "react"
import { FiSearch, FiFilter, FiEdit, FiTrash2, FiPlus, FiCopy, FiCheck } from "react-icons/fi"
import { db } from "../../services/firebase"
import { collection, onSnapshot, query, doc, deleteDoc, updateDoc, addDoc, serverTimestamp } from "firebase/firestore"
import { toast, ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

// Courses will be fetched from Firestore

export default function TeacherManagement() {
  const [teachers, setTeachers] = useState([])
  const [courses, setCourses] = useState([]) // State for storing courses from Firestore
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [showModal, setShowModal] = useState(false)
  const [showLoginLinkModal, setShowLoginLinkModal] = useState(false)
  const [currentLoginLink, setCurrentLoginLink] = useState("")
  const [currentTeacherName, setCurrentTeacherName] = useState("")
  const [editingTeacher, setEditingTeacher] = useState(null)
  const [loading, setLoading] = useState({
    teachers: true,
    courses: true
  })
  const [error, setError] = useState({
    teachers: null,
    courses: null
  })
  const [copied, setCopied] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
   // specialization: "",
    courses: [],
    status: "active"
  })
  
  // Get domain URL from environment variables or use default
  const domainUrl = import.meta.env.VITE_CLIENT_URL || window.location.origin

  // Fetch real-time courses data from both collections (courses and advancedCourses)
  useEffect(() => {
    setLoading(prev => ({ ...prev, courses: true }))
    setError(prev => ({ ...prev, courses: null }))

    // Create queries against both collections
    const regularCoursesRef = collection(db, "courses")
    const advancedCoursesRef = collection(db, "advancedCourses")
    
    // Set up real-time listeners for regular courses
    const unsubscribeRegular = onSnapshot(
      query(regularCoursesRef),
      (regularSnapshot) => {
        const regularCoursesData = regularSnapshot.docs.map(doc => ({
          id: doc.id,
          title: doc.data().name || doc.data().courseName || doc.data().title || "Unknown Course",
          courseType: "regular"
        }))
        
        // Set up listener for advanced courses
        const unsubscribeAdvanced = onSnapshot(
          query(advancedCoursesRef),
          (advancedSnapshot) => {
            const advancedCoursesData = advancedSnapshot.docs.map(doc => ({
              id: doc.id,
              title: doc.data().name || doc.data().courseName || doc.data().title || "Unknown Course",
              courseType: "advanced"
            }))
            
            // Combine both course types
            const allCoursesData = [...regularCoursesData, ...advancedCoursesData]
            setCourses(allCoursesData)
            setLoading(prev => ({ ...prev, courses: false }))
          },
          (err) => {
            console.error("Error fetching advanced courses:", err)
            // Even if advanced courses fail, we still have regular courses
            setCourses(regularCoursesData)
            setError(prev => ({ ...prev, courses: "Failed to load advanced course data" }))
            setLoading(prev => ({ ...prev, courses: false }))
          }
        )
        
        // Return cleanup for advanced courses
        return () => unsubscribeAdvanced()
      },
      (err) => {
        console.error("Error fetching regular courses:", err)
        setError(prev => ({ ...prev, courses: "Failed to load course data" }))
        setLoading(prev => ({ ...prev, courses: false }))
      }
    )

    // Clean up listener on unmount
    return () => unsubscribeRegular()
  }, [])

  // Fetch real-time teachers data from Firestore
  useEffect(() => {
    setLoading(prev => ({ ...prev, teachers: true }))
    setError(prev => ({ ...prev, teachers: null }))

    // Create a query against the Teacher collection
    const teachersRef = collection(db, "Teacher")
    const q = query(teachersRef)

    // Set up real-time listener
    const unsubscribe = onSnapshot(q, 
      (querySnapshot) => {
        const teachersData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          name: doc.data().name || "Unknown",
          email: doc.data().Gmail || doc.data().email || "",
          phone: doc.data().phone || "",
         // specialization: doc.data().specialization || "",
          courses: doc.data().courses || [],
          status: doc.data().status || "active",
          joinDate: doc.data().joinDate || doc.data().createdAt ? 
            new Date(doc.data().joinDate || doc.data().createdAt.toDate()).toISOString().split('T')[0] : 
            new Date().toISOString().split('T')[0],
          ...doc.data()
        }))
        setTeachers(teachersData)
        setLoading(prev => ({ ...prev, teachers: false }))
      },
      (err) => {
        console.error("Error fetching teachers:", err)
        setError(prev => ({ ...prev, teachers: "Failed to load teacher data. Please try again." }))
        setLoading(prev => ({ ...prev, teachers: false }))
      }
    )

    // Clean up listener on unmount
    return () => unsubscribe()
  }, [])

  const filteredTeachers = teachers.filter((teacher) => {
    const matchesSearch =
      teacher.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      teacher.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || teacher.status === statusFilter

    return matchesSearch && matchesStatus
  })

  const generateLoginLink = (email) => {
    // Encode the email for security
    const encodedEmail = encodeURIComponent(email)
    // Create the login URL
    return `${domainUrl}/teacher-login?email=${encodedEmail}`
  }

  const handleCopyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(currentLoginLink)
      setCopied(true)
      toast.success("Login link copied to clipboard!")
      setTimeout(() => setCopied(false), 3000)
    } catch (err) {
      console.error("Failed to copy:", err)
      toast.error("Failed to copy link. Please try manually.")
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editingTeacher) {
        // Update existing teacher in Firestore
        await updateDoc(doc(db, "Teacher", editingTeacher.id), {
          name: formData.name,
          email: formData.email,
          Gmail: formData.email, // Ensure Gmail field is updated too
          phone: formData.phone,
          //specialization: formData.specialization,
          courses: formData.courses,
          status: formData.status,
          updatedAt: serverTimestamp()
        })
        toast.success("Teacher updated successfully!")
      } else {
        // Generate login link
        const loginLink = generateLoginLink(formData.email)
        
        // Add new teacher to Firestore
        const docRef = await addDoc(collection(db, "Teacher"), {
          name: formData.name,
          email: formData.email,
          Gmail: formData.email, // Add Gmail field for consistency
          phone: formData.phone,
          //specialization: formData.specialization,
          courses: formData.courses,
          status: "active",
          joinDate: new Date().toISOString().split("T")[0],
          createdAt: serverTimestamp(),
          loginLink: loginLink
        })
        
        // Show the login link in a modal
        setCurrentLoginLink(loginLink)
        setCurrentTeacherName(formData.name)
        resetForm()
        setShowModal(false)
        setShowLoginLinkModal(true)
        toast.success("Teacher added successfully!")
      }
    } catch (err) {
      console.error("Error saving teacher:", err)
      toast.error("Failed to save teacher. Please try again.")
    }
  }

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      phone: "",
     // specialization: "",
      courses: [],
      status: "active"
    })
    setEditingTeacher(null)
    setShowModal(false)
  }

  const handleEdit = (teacher) => {
    setEditingTeacher(teacher)
    setFormData({
      name: teacher.name,
      email: teacher.email,
      phone: teacher.phone,
     // specialization: teacher.specialization,
      courses: teacher.courses || [],
      status: teacher.status || "active"
    })
    setShowModal(true)
  }
  
  const handleViewLoginLink = (teacher) => {
    // If the teacher doesn't have a login link yet, generate one
    if (!teacher.loginLink) {
      const loginLink = generateLoginLink(teacher.email)
      // Update the teacher document with the new login link
      updateDoc(doc(db, "Teacher", teacher.id), {
        loginLink: loginLink,
        updatedAt: serverTimestamp()
      }).then(() => {
        // Show the login link modal
        setCurrentLoginLink(loginLink)
        setCurrentTeacherName(teacher.name)
        setShowLoginLinkModal(true)
        toast.success("Login link generated successfully!")
      }).catch(err => {
        console.error("Error generating login link:", err)
        toast.error("Failed to generate login link. Please try again.")
      })
    } else {
      // Show the existing login link
      setCurrentLoginLink(teacher.loginLink)
      setCurrentTeacherName(teacher.name)
      setShowLoginLinkModal(true)
    }
  }

  const handleDelete = async (teacherId) => {
    if (confirm("Are you sure you want to delete this teacher?")) {
      try {
        // Delete the document from Firestore
        await deleteDoc(doc(db, "Teacher", teacherId))
        // Show success toast
        toast.success("Teacher deleted successfully!")
        // No need to update state as the onSnapshot will handle that
      } catch (err) {
        console.error("Error deleting teacher:", err)
        toast.error("Failed to delete teacher. Please try again.")
      }
    }
  }

  const handleCourseToggle = (course) => {
    setFormData((prev) => ({
      ...prev,
      courses: prev.courses.includes(course)
        ? prev.courses.filter((c) => c !== course)
        : [...prev.courses, course],
    }))
  }

  const toggleTeacherStatus = async (teacherId, currentStatus) => {
    try {
      const newStatus = currentStatus === "active" ? "inactive" : "active"
      // Update the document in Firestore
      await updateDoc(doc(db, "Teacher", teacherId), {
        status: newStatus,
        updatedAt: serverTimestamp()
      })
      // Show success toast
      toast.success(`Teacher status changed to ${newStatus}!`)
      // No need to update state as the onSnapshot will handle that
    } catch (err) {
      console.error("Error updating teacher status:", err)
      toast.error("Failed to update teacher status. Please try again.")
    }
  }

  return (
    <div className="teacher-management">
      <ToastContainer position="top-right" autoClose={3000} />
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2>Teacher Management</h2>
          <p>Manage all teachers and their course assignments</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          + Add Teacher
        </button>
      </div>

      <div className="filters-section">
        <div className="search-input">
          <FiSearch />
          <input
            type="text"
            placeholder="Search teachers by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="filter-group">
          <div className="filter-item">
            <FiFilter />
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      {loading.teachers && <div className="loading-state">Loading teacher data...</div>}
      {error.teachers && <div className="error-state">{error.teachers}</div>}

      {!loading.teachers && !error.teachers && (
        <div className="table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Teacher ID</th>
                <th>Name</th>
              
                <th>Email</th>
                <th>Phone</th>
                <th>Courses</th>
                <th>Join Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTeachers.length > 0 ? (
                filteredTeachers.map((teacher) => (
                  <tr key={teacher.id}>
                    <td>{teacher.id}</td>
                    <td>
                      <div className="teacher-info">
                        <div className="teacher-avatar">{teacher.name.charAt(0).toUpperCase()}</div>
                        <span className="teacher-name">{teacher.name}</span>
                      </div>
                    </td>
                    
                    <td>{teacher.email || "N/A"}</td>
                    <td>{teacher.phone || "N/A"}</td>
                    <td>
                      <div className="courses-list">
                        {teacher.courses && teacher.courses.length > 0 ? (
                          <>
                            {teacher.courses.slice(0, 2).map((course) => (
                              <span key={course} className="course-tag">
                                {course}
                              </span>
                            ))}
                            {teacher.courses.length > 2 && (
                              <span className="course-tag">+{teacher.courses.length - 2} more</span>
                            )}
                          </>
                        ) : (
                          <span className="no-courses">No courses assigned</span>
                        )}
                      </div>
                    </td>
                    <td>{teacher.joinDate ? new Date(teacher.joinDate).toLocaleDateString() : "N/A"}</td>
                    <td>
                      <button 
                        className={`status-toggle ${teacher.status || "inactive"}`} 
                        onClick={() => toggleTeacherStatus(teacher.id, teacher.status)}
                      >
                        {teacher.status || "inactive"}
                      </button>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button className="btn-icon" onClick={() => handleViewLoginLink(teacher)} title="View Login Link">
                          <FiCopy />
                        </button>
                        <button className="btn-icon" onClick={() => handleEdit(teacher)} title="Edit Teacher">
                          <FiEdit />
                        </button>
                        <button className="btn-icon btn-danger" onClick={() => handleDelete(teacher.id)} title="Delete Teacher">
                          <FiTrash2 />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="9" className="empty-state">
                    No teachers found matching your filters
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* MODAL: Add/Edit Teacher */}
      {showModal && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center"
        }}>
          <div style={{ background: "white", padding: 32, borderRadius: 12, maxWidth: 500, width: "90%", maxHeight: "80vh", overflowY: "auto", boxShadow: "0 8px 32px rgba(0,0,0,0.18)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h3 style={{ fontSize: 20, fontWeight: 600, color: "#2d3748" }}>{editingTeacher ? "Edit Teacher" : "Add New Teacher"}</h3>
              <button style={{ background: "none", border: "none", fontSize: 24, cursor: "pointer", color: "#a0aec0", padding: 4 }} onClick={resetForm}>
                ×
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Name</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input
                  type="email"
                  className="form-input"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Phone</label>
                <input
                  type="tel"
                  className="form-input"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Specialization</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.specialization}
                  onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Assign Courses</label>
                <div className="courses-grid">
                  {loading.courses ? (
                    <p>Loading courses...</p>
                  ) : error.courses ? (
                    <p>Error loading courses: {error.courses}</p>
                  ) : courses.length === 0 ? (
                    <p>No courses available</p>
                  ) : (
                    courses.map((course) => (
                      <label key={course.id} className="admin_course-checkbox">
                        <input
                          type="checkbox"
                          checked={formData.courses.includes(course.title)}
                          onChange={() => handleCourseToggle(course.title)}
                        />
                        {course.title}
                      </label>
                    ))
                  )}
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Status</label>
                <select
                  className="form-select"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", marginTop: 24 }}>
                <button type="button" className="btn btn-secondary" onClick={resetForm}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingTeacher ? "Update Teacher" : "Add Teacher"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* END MODAL */}

      {/* Login Link Modal */}
      {showLoginLinkModal && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center"
        }}>
          <div style={{ background: "white", padding: 32, borderRadius: 12, maxWidth: 500, width: "90%", boxShadow: "0 8px 32px rgba(0,0,0,0.18)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h3 style={{ fontSize: 20, fontWeight: 600, color: "#2d3748" }}>Teacher Login Link Generated</h3>
              <button style={{ background: "none", border: "none", fontSize: 24, cursor: "pointer", color: "#a0aec0", padding: 4 }} 
                onClick={() => setShowLoginLinkModal(false)}>
                ×
              </button>
            </div>
            <div style={{ marginBottom: 16, padding: 12, borderRadius: 6, background: "#ebf8ff", border: "1px solid #bee3f8" }}>
              <p style={{ color: "#2b6cb0", marginBottom: 8 }}>
                <strong>Success!</strong> Teacher account created for {currentTeacherName}.
              </p>
              <p style={{ color: "#4a5568", fontSize: 14 }}>
                Share this unique login link with the teacher to give them access:
              </p>
            </div>
            <div style={{ display: "flex", alignItems: "center", marginBottom: 24, background: "#f7fafc", padding: 12, borderRadius: 6, border: "1px solid #e2e8f0" }}>
              <input 
                type="text" 
                value={currentLoginLink} 
                readOnly 
                style={{ flex: 1, border: "none", background: "transparent", outline: "none", fontSize: 14 }}
              />
              <button 
                onClick={handleCopyToClipboard} 
                style={{ 
                  background: copied ? "#48bb78" : "#4299e1", 
                  border: "none", 
                  cursor: "pointer", 
                  display: "flex", 
                  alignItems: "center", 
                  justifyContent: "center",
                  color: "white",
                  padding: "8px 12px",
                  borderRadius: 4,
                  fontSize: 14,
                  transition: "all 0.2s"
                }}
              >
                {copied ? (
                  <>
                    <FiCheck style={{ marginRight: 4 }} /> Copied
                  </>
                ) : (
                  <>
                    <FiCopy style={{ marginRight: 4 }} /> Copy Link
                  </>
                )}
              </button>
            </div>
            <div style={{ fontSize: 14, color: "#718096", marginBottom: 24 }}>
              <p>This link has been saved to the teacher's profile and can be accessed at any time.</p>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button 
                onClick={() => setShowLoginLinkModal(false)}
                className="btn btn-primary"
                style={{ 
                  background: "#4299e1", 
                  color: "white", 
                  border: "none", 
                  padding: "8px 16px", 
                  borderRadius: 4, 
                  cursor: "pointer",
                  fontWeight: 500
                }}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
      {/* End Login Link Modal */}
    </div>
  );
}