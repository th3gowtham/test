"use client"

import { useState, useEffect } from "react"
import { FiPlus, FiSearch, FiEdit, FiTrash2, FiX, FiUsers, FiFile } from "react-icons/fi"
import FileViewer from "../../components/FileViewer";
import { db } from "../../services/firebase"
import { collection, onSnapshot, query, doc, deleteDoc, addDoc, updateDoc, serverTimestamp, where, getDocs } from "firebase/firestore"
import { toast, ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

export default function BatchAssignment() {
  const [batches, setBatches] = useState([])
  const [courses, setCourses] = useState([])
  const [teachers, setTeachers] = useState([])
  const [students, setStudents] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [editingBatch, setEditingBatch] = useState(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [loading, setLoading] = useState({
    batches: true,
    courses: true,
    teachers: true,
    students: true
  })
  const [error, setError] = useState({
    batches: null,
    courses: null,
    teachers: null,
    students: null
  })
  const [searchStudentTerm, setSearchStudentTerm] = useState("")
  const [showFileViewer, setShowFileViewer] = useState(false)
  const [selectedBatchId, setSelectedBatchId] = useState(null)
  const itemsPerPage = 6

  const [formData, setFormData] = useState({
    batchName: "",
    courseId: "",
    teacherId: "",
    students: [],
    status: "active",
  })

  // Fetch courses from both collections (courses and advancedCourses)
  useEffect(() => {
    setLoading(prev => ({ ...prev, courses: true }))
    setError(prev => ({ ...prev, courses: null }))

    // Create queries against both collections
    const regularCoursesRef = collection(db, "courses")
    const advancedCoursesRef = collection(db, "advancedCourses")
    
    // Mock data as fallback if both collections are empty
    const mockCoursesData = [
      { id: "C001", courseName: "React Fundamentals", status: "active" },
      { id: "C002", courseName: "JavaScript Advanced", status: "active" },
      { id: "C003", courseName: "Python Basics", status: "active" },
      { id: "C004", courseName: "Web Design", status: "active" },
      { id: "C005", courseName: "UI/UX", status: "active" },
      { id: "C006", courseName: "Data Science", status: "active" },
    ]

    // Set up real-time listeners for regular courses
    const unsubscribeRegular = onSnapshot(
      query(regularCoursesRef),
      (regularSnapshot) => {
        const regularCoursesData = regularSnapshot.docs.map(doc => ({
          id: doc.id,
          courseName: doc.data().name || doc.data().courseName || doc.data().title || "Unknown Course",
          title: doc.data().name || doc.data().courseName || doc.data().title || "Unknown Course", // Add title field for consistency
          status: doc.data().status || "active",
          courseType: "regular",
          ...doc.data()
        }))
        
        // Set up listener for advanced courses
        const unsubscribeAdvanced = onSnapshot(
          query(advancedCoursesRef),
          (advancedSnapshot) => {
            const advancedCoursesData = advancedSnapshot.docs.map(doc => ({
              id: doc.id,
              courseName: doc.data().name || doc.data().courseName || doc.data().title || "Unknown Course",
              title: doc.data().name || doc.data().courseName || doc.data().title || "Unknown Course",
              status: doc.data().status || "active",
              courseType: "advanced",
              ...doc.data()
            }))
            
            // Combine both course types
            const allCoursesData = [...regularCoursesData, ...advancedCoursesData]
            
            // If both collections are empty, use mock data as fallback
            if (allCoursesData.length === 0) {
              setCourses(mockCoursesData)
            } else {
              setCourses(allCoursesData.filter(course => course.status === "active"))
            }
            
            setLoading(prev => ({ ...prev, courses: false }))
          },
          (err) => {
            console.error("Error fetching advanced courses:", err)
            // Even if advanced courses fail, we still have regular courses
            if (regularCoursesData.length === 0) {
              setCourses(mockCoursesData)
            } else {
              setCourses(regularCoursesData.filter(course => course.status === "active"))
            }
            setError(prev => ({ ...prev, courses: "Failed to load advanced course data" }))
            setLoading(prev => ({ ...prev, courses: false }))
          }
        )
        
        // Return cleanup for advanced courses
        return () => unsubscribeAdvanced()
      },
      (err) => {
        console.error("Error fetching regular courses:", err)
        // If regular courses fail, use mock data as fallback
        setCourses(mockCoursesData)
        setError(prev => ({ ...prev, courses: "Failed to load course data" }))
        setLoading(prev => ({ ...prev, courses: false }))
      }
    )

    // Clean up listener on unmount
    return () => unsubscribeRegular()
  }, [])

  // Fetch teachers from Firestore
  useEffect(() => {
    setLoading(prev => ({ ...prev, teachers: true }))
    setError(prev => ({ ...prev, teachers: null }))

    // Create a query against the Teachers collection
    const teachersRef = collection(db, "Teacher")
    const q = query(teachersRef)

    // Set up real-time listener
    const unsubscribe = onSnapshot(q, 
      (querySnapshot) => {
        const teachersData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          uid: doc.data().uid || doc.id,
          name: doc.data().name || "Unknown",
          email: doc.data().Gmail || doc.data().email || "",
          status: doc.data().status || "active"
        }))
        setTeachers(teachersData.filter(teacher => teacher.status === "active"))
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

  // Fetch students from Firestore
  useEffect(() => {
    setLoading(prev => ({ ...prev, students: true }))
    setError(prev => ({ ...prev, students: null }))

    // Create a query against the Students collection
    const studentsRef = collection(db, "Students")
    const q = query(studentsRef)

    // Set up real-time listener
    const unsubscribe = onSnapshot(q, 
      (querySnapshot) => {
        const studentsData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          uid: doc.data().uid || doc.id,
          name: doc.data().name || "Unknown",
          email: doc.data().Gmail || doc.data().email || "",
          status: doc.data().status || "active"
        }))
        setStudents(studentsData.filter(student => student.status === "active"))
        setLoading(prev => ({ ...prev, students: false }))
      },
      (err) => {
        console.error("Error fetching students:", err)
        setError(prev => ({ ...prev, students: "Failed to load student data" }))
        setLoading(prev => ({ ...prev, students: false }))
      }
    )

    // Clean up listener on unmount
    return () => unsubscribe()
  }, [])

  // Fetch batches from Firestore
  useEffect(() => {
    setLoading(prev => ({ ...prev, batches: true }))
    setError(prev => ({ ...prev, batches: null }))

    // Create a query against the batches collection
    const batchesRef = collection(db, "batches")
    const q = query(batchesRef)

    // Set up real-time listener
    const unsubscribe = onSnapshot(q, 
      (querySnapshot) => {
        const batchesData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          batchId: doc.data().batchId || doc.id,
          batchName: doc.data().batchName || "Unknown Batch",
          courseId: doc.data().courseId || "",
          teacherId: doc.data().teacherId || "",
          students: doc.data().students || [],
          status: doc.data().status || "active",
          createdDate: doc.data().createdAt ? 
            new Date(doc.data().createdAt.toDate()).toISOString().split('T')[0] : 
            new Date().toISOString().split('T')[0],
          // These will be populated later
          course: "",
          teacher: "",
          totalStudents: doc.data().students ? doc.data().students.length : 0
        }))
        
        // Resolve course and teacher names
        const resolvedBatches = batchesData.map(batch => {
          const course = courses.find(c => c.id === batch.courseId)
          const teacher = teachers.find(t => t.id === batch.teacherId || t.uid === batch.teacherId)
          
          return {
            ...batch,
            course: course ? course.courseName : "Unknown Course",
            teacher: teacher ? teacher.name : "Unknown Teacher"
          }
        })
        
        setBatches(resolvedBatches)
        setLoading(prev => ({ ...prev, batches: false }))
      },
      (err) => {
        console.error("Error fetching batches:", err)
        setError(prev => ({ ...prev, batches: "Failed to load batch data" }))
        setLoading(prev => ({ ...prev, batches: false }))
      }
    )

    // Clean up listener on unmount
    return () => unsubscribe()
  }, [courses, teachers])

  const filteredBatches = batches.filter(
    (batch) =>
      batch.batchName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      batch.course.toLowerCase().includes(searchTerm.toLowerCase()) ||
      batch.teacher.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const totalPages = Math.ceil(filteredBatches.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedBatches = filteredBatches.slice(startIndex, startIndex + itemsPerPage)

  // Filter students based on search term
  const filteredStudents = students.filter(student =>
    student.name.toLowerCase().includes(searchStudentTerm.toLowerCase()) ||
    student.email.toLowerCase().includes(searchStudentTerm.toLowerCase())
  )

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.courseId || !formData.teacherId || formData.students.length === 0) {
      toast.error("Please select a course, a teacher, and at least one student")
      return
    }

    // Find the selected course to generate the batch name
    const selectedCourse = courses.find(c => c.id === formData.courseId)
    if (!selectedCourse) {
      toast.error("Selected course not found. Please refresh and try again.")
      return
    }
    const newBatchName = `${selectedCourse.courseName} Batch`;

    try {
      // Check if a batch for this course already exists
      const batchesRef = collection(db, "batches")
      const q = query(batchesRef, where("courseId", "==", formData.courseId))
      const querySnapshot = await getDocs(q)
      
      // If we are creating a new batch (not editing) and a batch for this course already exists, show an error.
      if (!editingBatch && !querySnapshot.empty) {
        toast.error("A batch for this course already exists. You can edit it from the main list.")
        return
      }

      if (editingBatch) {
        // Update existing batch in Firestore
        await updateDoc(doc(db, "batches", editingBatch.id), {
          batchName: newBatchName, // Use the generated name
          courseId: formData.courseId,
          teacherId: formData.teacherId,
          receiverId: formData.teacherId, // Update receiverId when teacher is changed
          students: formData.students,
          status: formData.status,
          updatedAt: serverTimestamp()
        })
        toast.success("Batch updated successfully!")
      } else {
        // Generate a new batch ID
        const batchId = `B${String(batches.length + 1).padStart(3, "0")}`
        
        // Add new batch to Firestore
        await addDoc(collection(db, "batches"), {
          batchId: batchId,
          batchName: newBatchName, // Use the generated name
          courseId: formData.courseId,
          teacherId: formData.teacherId,
          receiverId: formData.teacherId, // Adding receiverId same as teacherId
          students: formData.students,
          status: formData.status,
          createdAt: serverTimestamp()
        })
        toast.success("New batch added successfully!")
      }

      resetForm()
    } catch (err) {
      console.error("Error saving batch:", err)
      toast.error("Failed to save batch. Please try again.")
    }
  }

  const resetForm = () => {
    setFormData({
      batchName: "",
      courseId: "",
      teacherId: "",
      students: [],
      status: "active",
    })
    setEditingBatch(null)
    setShowModal(false)
    setSearchStudentTerm("")
  }

  const handleEdit = (batch) => {
    setEditingBatch(batch)
    setFormData({
      batchName: batch.batchName,
      courseId: batch.courseId,
      teacherId: batch.teacherId,
      students: batch.students,
      status: batch.status,
    })
    setShowModal(true)
  }

  const handleDelete = async (batchId) => {
    if (confirm("Are you sure you want to delete this batch?")) {
      try {
        // Delete the document from Firestore
        await deleteDoc(doc(db, "batches", batchId))
        toast.success("Batch deleted successfully!")
        // No need to update state as the onSnapshot will handle that
      } catch (err) {
        console.error("Error deleting batch:", err)
        toast.error("Failed to delete batch. Please try again.")
      }
    }
  }

  const handleStudentToggle = (studentId) => {
    setFormData((prev) => ({
      ...prev,
      students: prev.students.includes(studentId)
        ? prev.students.filter((s) => s !== studentId)
        : [...prev.students, studentId],
    }))
  }

  return (
    <div className="batch-assignment">
      <ToastContainer position="top-right" autoClose={3000} />
      
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2>Batch Group Assignment</h2>
          <p>Create and manage student batches for courses</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          + Add Batch
        </button>
      </div>

      <div className="search-bar">
        <div className="search-input">
          <FiSearch />
          <input
            type="text"
            placeholder="Search batches, courses, or teachers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {loading.batches ? (
        <div className="loading-state">Loading batches...</div>
      ) : error.batches ? (
        <div className="error-state">{error.batches}</div>
      ) : (
        <div className="table-container">
          {batches.length === 0 ? (
            <div className="empty-state">
              <p>No batches found. Create your first batch by clicking the "Add Batch" button.</p>
            </div>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Batch ID</th>
                  <th>Batch Name</th>
                  <th>Course</th>
                  <th>Assigned Teacher</th>
                  <th>Total Students</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedBatches.map((batch) => (
                  <tr key={batch.id}>
                    <td>{batch.batchId}</td>
                    <td>
                      <div className="batch-info">
                        <div className="batch-name">{batch.batchName}</div>
                        <div className="batch-date">Created: {new Date(batch.createdDate).toLocaleDateString()}</div>
                      </div>
                    </td>
                    <td>{batch.course}</td>
                    <td>
                      <div className="teacher-info">
                        <div className="teacher-avatar">{batch.teacher.charAt(0).toUpperCase()}</div>
                        <span>{batch.teacher}</span>
                      </div>
                    </td>
                    <td>
                      <div className="students-count">
                        <FiUsers />
                        <span>{batch.totalStudents} students</span>
                      </div>
                    </td>
                    <td>
                      <span className={`status-badge ${batch.status === "active" ? "status-active" : "status-inactive"}`}>
                        {batch.status}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button 
                          className="btn-icon" 
                          onClick={() => {
                            setSelectedBatchId(batch.id);
                            setShowFileViewer(true);
                          }}
                          title="View Files"
                        >
                          <FiFile />
                        </button>
                        <button 
                          className="btn-icon" 
                          onClick={() => handleEdit(batch)}
                          title="Edit Batch"
                        >
                          <FiEdit />
                        </button>
                        <button 
                          className="btn-icon btn-danger" 
                          onClick={() => handleDelete(batch.id)}
                          title="Delete Batch"
                        >
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
      )}

      {/* File Viewer Modal */}
      {showFileViewer && selectedBatchId && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0,0,0,0.5)",
          zIndex: 1000,
          display: "flex",
          alignItems: "center",
          justifyContent: "center"
        }}>
          <div style={{
            background: "white",
            padding: 24,
            borderRadius: 12,
            width: "90%",
            maxWidth: 800,
            maxHeight: "80vh",
            overflowY: "auto",
            boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
            position: "relative"
          }}>
            <button 
              onClick={() => setShowFileViewer(false)}
              style={{
                position: "absolute",
                top: 16,
                right: 16,
                background: "none",
                border: "none",
                fontSize: 20,
                cursor: "pointer",
                color: "#6b7280"
              }}
            >
              <FiX />
            </button>
            <h3 style={{ marginTop: 0, marginBottom: 20, color: "#1f2937" }}>Batch Files</h3>
            <FileViewer batchId={selectedBatchId} />
          </div>
        </div>
      )}

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

      {/* MODAL: Add/Edit Batch */}
      {showModal && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center"
        }}>
          <div style={{ background: "white", padding: 32, borderRadius: 12, maxWidth: 500, width: "90%", maxHeight: "80vh", overflowY: "auto", boxShadow: "0 8px 32px rgba(0,0,0,0.18)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h3 style={{ fontSize: 20, fontWeight: 600, color: "#2d3748" }}>{editingBatch ? "Edit Batch" : "Add New Batch"}</h3>
              <button style={{ background: "none", border: "none", fontSize: 24, cursor: "pointer", color: "#a0aec0", padding: 4 }} onClick={resetForm}>
                <FiX />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              
              <div className="form-group">
                <label className="form-label">Select Course</label>
                {loading.courses ? (
                  <div className="loading-state">Loading courses...</div>
                ) : error.courses ? (
                  <div className="error-state">{error.courses}</div>
                ) : (
                  <select
                    className="form-select"
                    value={formData.courseId}
                    onChange={(e) => setFormData({ ...formData, courseId: e.target.value })}
                    required
                  >
                    <option value="">Choose a course...</option>
                    {courses.map((course) => (
                      <option key={course.id} value={course.id}>
                        {course.courseName}
                      </option>
                    ))}
                  </select>
                )}
              </div>
              <div className="form-group">
                <label className="form-label">Select Teacher</label>
                {loading.teachers ? (
                  <div className="loading-state">Loading teachers...</div>
                ) : error.teachers ? (
                  <div className="error-state">{error.teachers}</div>
                ) : (
                  <select
                    className="form-select"
                    value={formData.teacherId}
                    onChange={(e) => setFormData({ ...formData, teacherId: e.target.value })}
                    required
                  >
                    <option value="">Choose a teacher...</option>
                    {teachers.map((teacher) => (
                      <option key={teacher.id} value={teacher.id}>
                        {teacher.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>
              <div className="form-group">
                <label className="form-label">Add Students ({formData.students.length} selected)</label>
                <div className="search-student-input" style={{ marginBottom: '10px' }}>
                  <FiSearch />
                  <input
                    type="text"
                    placeholder="Search students by name or email..."
                    value={searchStudentTerm}
                    onChange={(e) => setSearchStudentTerm(e.target.value)}
                    style={{ width: '100%', padding: '8px 8px 8px 35px' }}
                  />
                </div>
                {loading.students ? (
                  <div className="loading-state">Loading students...</div>
                ) : error.students ? (
                  <div className="error-state">{error.students}</div>
                ) : (
                  <div className="students-grid">
                    {filteredStudents.map((student) => (
                      <label key={student.id} className="student-checkbox">
                        <input
                          type="checkbox"
                          checked={formData.students.includes(student.id)}
                          onChange={() => handleStudentToggle(student.id)}
                        />
                        <div>
                          <span style={{ fontWeight: 'bold' }}>{student.name}</span>
                          <span style={{ fontSize: '12px', color: '#718096', display: 'block' }}>{student.email}</span>
                        </div>
                      </label>
                    ))}
                    {filteredStudents.length === 0 && (
                      <div className="no-results">No students found matching your search</div>
                    )}
                  </div>
                )}
                {formData.students.length > 0 && (
                  <div className="selected-students" style={{ marginTop: '10px' }}>
                    <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>Selected Students:</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                      {formData.students.map(studentId => {
                        const student = students.find(s => s.id === studentId);
                        return student ? (
                          <div key={studentId} style={{
                            background: '#e2e8f0',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontSize: '14px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '5px'
                          }}>
                            {student.name}
                            <button 
                              type="button" 
                              onClick={() => handleStudentToggle(studentId)}
                              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0', fontSize: '14px' }}
                            >
                              <FiX />
                            </button>
                          </div>
                        ) : null;
                      })}
                    </div>
                  </div>
                )}
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
                  {editingBatch ? "Update Batch" : "Add Batch"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* END MODAL */}

      <style jsx>{`
        .batch-assignment {
          max-width: 1400px;
        }

        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 32px;
        }

        .page-header h2 {
          font-size: 32px;
          font-weight: 700;
          color: #2d3748;
          margin-bottom: 8px;
        }

        .page-header p {
          color: #718096;
          font-size: 16px;
        }

        .search-input {
          position: relative;
          display: flex;
          align-items: center;
        }

        .search-input svg {
          position: absolute;
          left: 12px;
          color: #a0aec0;
        }

        .search-input input {
          padding-left: 40px;
        }

        .batch-info {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .batch-name {
          font-weight: 600;
          color: #2d3748;
        }

        .batch-date {
          font-size: 12px;
          color: #718096;
        }

        .teacher-info {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .teacher-avatar {
          width: 32px;
          height: 32px;
          background-color: #48bb78;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: 600;
          font-size: 12px;
        }

        .students-count {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #4a5568;
        }

        .action-buttons {
          display: flex;
          gap: 8px;
        }

        .btn-icon {
          padding: 8px;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s ease;
          background-color: #f7fafc;
          color: #4a5568;
        }

        .btn-icon:hover {
          background-color: #e2e8f0;
        }

        .btn-icon.btn-danger {
          background-color: #fed7d7;
          color: #c53030;
        }

        .btn-icon.btn-danger:hover {
          background-color: #fbb6ce;
        }

        .students-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 12px;
          max-height: 300px;
          overflow-y: auto;
          padding: 16px;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          background-color: #f7fafc;
        }

        .student-checkbox {
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          padding: 8px;
          border-radius: 6px;
          transition: background-color 0.2s ease;
        }

        .student-checkbox:hover {
          background-color: #e2e8f0;
        }

        .student-checkbox input[type="checkbox"] {
          position:relative;
          top:-9px
        }

        .loading-state, .error-state, .empty-state {
          padding: 20px;
          text-align: center;
          background-color: #f7fafc;
          border-radius: 8px;
          margin: 20px 0;
        }

        .error-state {
          color: #c53030;
          background-color: #fed7d7;
        }

        .status-badge {
          display: inline-block;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 500;
          text-transform: capitalize;
        }

        .status-active {
          background-color: #c6f6d5;
          color: #2f855a;
        }

        .status-inactive {
          background-color: #e2e8f0;
          color: #4a5568;
        }

        .search-student-input {
          position: relative;
        }

        .search-student-input svg {
          position: absolute;
          left: 10px;
          top: 50%;
          transform: translateY(-50%);
          color: #a0aec0;
        }

        .no-results {
          grid-column: 1 / -1;
          padding: 10px;
          text-align: center;
          color: #718096;
        }

        @media (max-width: 768px) {
          .page-header {
            flex-direction: column;
            gap: 16px;
            align-items: stretch;
          }

          .page-header h2 {
            font-size: 24px;
          }

          .table-container {
            overflow-x: auto;
          }

          .students-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  )
}
