"use client"

import { useState, useEffect } from "react"
import { FiPlus, FiSearch, FiEdit, FiTrash2, FiX } from "react-icons/fi"
import { db } from "../../services/firebase"
import { collection, onSnapshot, query, doc, deleteDoc, updateDoc, addDoc, serverTimestamp, getDocs } from "firebase/firestore"
import { toast, ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'


export default function CoursesManagement() {
  const [courses, setCourses] = useState([])
  const [advancedCourses, setAdvancedCourses] = useState([])
  const [teachers, setTeachers] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [editingCourse, setEditingCourse] = useState(null)
  const [searchTerm, setSearchTerm] = useState("") 
  const [currentPage, setCurrentPage] = useState(1)
  const [courseType, setCourseType] = useState("regular") // regular or advanced
  const [loading, setLoading] = useState({
    courses: true,
    advancedCourses: true,
    teachers: true
  })
  const [error, setError] = useState({
    courses: null,
    advancedCourses: null,
    teachers: null
  })
  const itemsPerPage = 5

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    imgSrc: "",
    age: "",
    seats: "",
    duration: "",
    fee: 0,
    status: "active",
    courseType: "regular" // regular or advanced
  })
  
  // Fetch regular courses from Firestore
  useEffect(() => {
    setLoading(prev => ({ ...prev, courses: true }))
    setError(prev => ({ ...prev, courses: null }))

    // Create a query against the courses collection
    const coursesRef = collection(db, "courses")
    const q = query(coursesRef)

    // Set up real-time listener
    const unsubscribe = onSnapshot(q, 
      (querySnapshot) => {
        const coursesData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          courseType: "regular"
        }))
        setCourses(coursesData)
        setLoading(prev => ({ ...prev, courses: false }))
      },
      (err) => {
        console.error("Error fetching courses:", err)
        setError(prev => ({ ...prev, courses: "Failed to load course data" }))
        setLoading(prev => ({ ...prev, courses: false }))
      }
    )

    // Clean up listener on unmount
    return () => unsubscribe()
  }, [])

  // Fetch advanced courses from Firestore
  useEffect(() => {
    setLoading(prev => ({ ...prev, advancedCourses: true }))
    setError(prev => ({ ...prev, advancedCourses: null }))

    // Create a query against the advancedCourses collection
    const advancedCoursesRef = collection(db, "advancedCourses")
    const q = query(advancedCoursesRef)

    // Set up real-time listener
    const unsubscribe = onSnapshot(q, 
      (querySnapshot) => {
        const advancedCoursesData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          courseType: "advanced"
        }))
        setAdvancedCourses(advancedCoursesData)
        setLoading(prev => ({ ...prev, advancedCourses: false }))
      },
      (err) => {
        console.error("Error fetching advanced courses:", err)
        setError(prev => ({ ...prev, advancedCourses: "Failed to load advanced course data" }))
        setLoading(prev => ({ ...prev, advancedCourses: false }))
      }
    )

    // Clean up listener on unmount
    return () => unsubscribe()
  }, [])

  // Fetch teachers from Firestore
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
        }))
        setTeachers(teachersData.filter(teacher => teacher.name !== "Unknown"))
        setLoading(prev => ({ ...prev, teachers: false }))
      },
      (err) => {
        console.error("Error fetching teachers:", err)
        setError(prev => ({ ...prev, teachers: "Failed to load teacher data" }))
        setLoading(prev => ({ ...prev, teachers: false }))
      }
    )

    // Clean up listener on unmount
    return () => unsubscribe()
  }, [])

  // Combine courses based on selected type
  const allCourses = courseType === "regular" ? courses : advancedCourses

  // Filter courses based on search term
  const filteredCourses = allCourses.filter(
    (course) =>
      (course.title?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
      (course.description?.toLowerCase() || "").includes(searchTerm.toLowerCase())
  )

  const totalPages = Math.ceil(filteredCourses.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedCourses = filteredCourses.slice(startIndex, startIndex + itemsPerPage)

  const handleSubmit = async (e) => {
    e.preventDefault()

    try {
      // Determine which collection to use based on course type
      const collectionName = formData.courseType === "regular" ? "courses" : "advancedCourses"
      
      // Prepare course data
      const courseData = {
        title: formData.title,
        description: formData.description,
        imgSrc: formData.imgSrc,
        age: formData.age,
        seats: formData.seats,
        duration: formData.duration,
        fee: Number(formData.fee),
        status: formData.status,
        updatedAt: serverTimestamp()
      }

      if (editingCourse) {
        // Update existing course in Firestore
        await updateDoc(doc(db, collectionName, editingCourse.id), courseData)
        toast.success("Course updated successfully!")
      } else {
        // Add new course to Firestore
        courseData.createdAt = serverTimestamp()
        await addDoc(collection(db, collectionName), courseData)
        toast.success("New course added successfully!")
      }

      resetForm()
    } catch (err) {
      console.error("Error saving course:", err)
      toast.error("Failed to save course. Please try again.")
    }
  }

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      imgSrc: "",
      age: "",
      seats: "",
      duration: "",
      fee: 0,
      status: "active",
      courseType: courseType // Maintain current selected course type
    })
    setEditingCourse(null)
    setShowModal(false)
  }

  const handleEdit = (course) => {
    setEditingCourse(course)
    setFormData({
      title: course.title || "",
      description: course.description || "",
      imgSrc: course.imgSrc || "",
      age: course.age || "",
      seats: course.seats || "",
      duration: course.duration || "",
      fee: course.fee || 0,
      status: course.status || "active",
      courseType: course.courseType || "regular"
    })
    setShowModal(true)
  }

  const handleDelete = async (course) => {
    if (confirm("Are you sure you want to delete this course?")) {
      try {
        // Determine which collection to use based on course type
        const collectionName = course.courseType === "regular" ? "courses" : "advancedCourses"
        
        // Delete the document from Firestore
        await deleteDoc(doc(db, collectionName, course.id))
        
        // Show success toast
        toast.success("Course deleted successfully!")
        // No need to update state as the onSnapshot will handle that
      } catch (err) {
        console.error("Error deleting course:", err)
        toast.error("Failed to delete course. Please try again.")
      }
    }
  }

  return (
    <div className="courses-management">
      <ToastContainer position="top-right" autoClose={3000} />
      
      <div className="page-header">
        <div>
          <h2>Courses Management</h2>
          <p>Manage all courses and their assignments</p>
          <div className="course-type-selector">
            <button 
              className={`btn ${courseType === "regular" ? "btn-primary" : "btn-outline-primary"}`}
              onClick={() => setCourseType("regular")}
            >
              Regular Courses
            </button>
            <button 
              className={`btn ${courseType === "advanced" ? "btn-primary" : "btn-outline-primary"}`}
              onClick={() => setCourseType("advanced")}
            >
              Advanced Courses
            </button>
          </div>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <FiPlus /> Add New Course
        </button>
      </div>

      <div className="search-bar">
        <div className="search-input">
          <FiSearch />
          <input
            type="text"
            placeholder="Search courses..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="table-container">
        {loading[courseType === "regular" ? "courses" : "advancedCourses"] ? (
          <div className="loading-container">
            <p>Loading {courseType} courses...</p>
          </div>
        ) : error[courseType === "regular" ? "courses" : "advancedCourses"] ? (
          <div className="error-container">
            <p>{error[courseType === "regular" ? "courses" : "advancedCourses"]}</p>
            <button onClick={() => window.location.reload()}>Retry</button>
          </div>
        ) : filteredCourses.length === 0 ? (
          <div className="empty-container">
            <p>No {courseType} courses found. Add your first course to get started.</p>
          </div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Course ID</th>
                <th>Image</th>
                <th>Title</th>
                <th>Age Group</th>
                <th>Seats</th>
                <th>Duration</th>
                <th>Fee</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedCourses.map((course) => (
                <tr key={course.id}>
                  <td>{course.id.slice(0, 8)}...</td>
                  <td>
                    {course.imgSrc && (
                      <img 
                        src={course.imgSrc} 
                        alt={course.title} 
                        style={{ width: '50px', height: '50px', objectFit: 'cover' }} 
                      />
                    )}
                  </td>
                  <td>
                    <div>
                      <div className="course-title">{course.title}</div>
                      <div className="course-description">{course.description?.substring(0, 50)}...</div>
                    </div>
                  </td>
                  <td>{course.age}</td>
                  <td>{course.seats}</td>
                  <td>{course.duration}</td>
                  <td>${course.fee}</td>
                  <td>
                    <span className={`status-badge ${course.status === "active" ? "status-active" : "status-inactive"}`}>
                      {course.status || "active"}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button className="btn-icon" onClick={() => handleEdit(course)}>
                        <FiEdit />
                      </button>
                      <button className="btn-icon btn-danger" onClick={() => handleDelete(course)}>
                        <FiTrash2 />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {totalPages > 1 && (
        <div className="pagination">
          <button onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))} disabled={currentPage === 1}>
            Previous
          </button>
          {Array.from({ length: totalPages }, (_, i) => (
            <button key={i + 1} onClick={() => setCurrentPage(i + 1)} className={currentPage === i + 1 ? "active" : ""}>
              {i + 1}
            </button>
          ))}
          <button
            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
          >
            Next
          </button>
        </div>
      )}

      {/* MODAL: Add/Edit Course */}
      {showModal && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center"
        }}>
          <div style={{ background: "white", padding: 32, borderRadius: 12, maxWidth: 500, width: "90%", maxHeight: "80vh", overflowY: "auto", boxShadow: "0 8px 32px rgba(0,0,0,0.18)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h3 style={{ fontSize: 20, fontWeight: 600, color: "#2d3748" }}>{editingCourse ? "Edit Course" : "Add New Course"}</h3>
              <button style={{ background: "none", border: "none", fontSize: 24, cursor: "pointer", color: "#a0aec0", padding: 4 }} onClick={resetForm}>
                <FiX />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Course Type</label>
                <select
                  className="form-select"
                  value={formData.courseType}
                  onChange={(e) => setFormData({ ...formData, courseType: e.target.value })}
                >
                  <option value="regular">Regular Course</option>
                  <option value="advanced">Advanced Course</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Course Title</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea
                  className="form-textarea"
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Image URL</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.imgSrc}
                  onChange={(e) => setFormData({ ...formData, imgSrc: e.target.value })}
                  required
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Age Group</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.age}
                    onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Available Seats</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.seats}
                    onChange={(e) => setFormData({ ...formData, seats: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Course Duration</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g., 8 weeks"
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Fee ($)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={formData.fee}
                    onChange={(e) => setFormData({ ...formData, fee: Number(e.target.value) })}
                    required
                  />
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
                  {editingCourse ? "Update Course" : "Add Course"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* END MODAL */}

    </div>
  )
}
