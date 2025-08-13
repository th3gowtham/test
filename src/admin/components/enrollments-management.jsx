"use client"

import { useState, useEffect } from "react"
import { FiPlus, FiSearch, FiEdit, FiTrash2, FiX, FiCalendar, FiClock, FiUsers, FiDollarSign } from "react-icons/fi"
import { db } from "../../services/firebase"
import { collection, onSnapshot, query, doc, updateDoc, deleteDoc, serverTimestamp, where } from "firebase/firestore"
import { toast } from "react-toastify"

export default function EnrollmentsManagement() {
  const [enrollments, setEnrollments] = useState([])
  const [students, setStudents] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [editingEnrollment, setEditingEnrollment] = useState(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const itemsPerPage = 8

  const [formData, setFormData] = useState({
    studentName: "",
    email: "",
    phone: "",
    courseTitle: "",
    courseId: "",
    enrollmentDate: "",
    paymentStatus: "Pending"
  })

  // Fetch students from Firestore
  useEffect(() => {
    const studentsRef = collection(db, "Students")
    const studentsQuery = query(studentsRef)
    
    const unsubscribe = onSnapshot(studentsQuery, 
      (snapshot) => {
        const studentsData = snapshot.docs.map(doc => ({
          id: doc.id,
          email: doc.data().Gmail || doc.data().email || "",
          name: doc.data().name || "",
          phone: doc.data().phone || ""
        }))
        setStudents(studentsData)
      }, 
      (err) => {
        console.error("Error fetching students:", err)
      }
    )
    
    return () => unsubscribe()
  }, [])

  // Fetch enrollments from Firestore
  useEffect(() => {
    setIsLoading(true)
    setError(null)
    
    const enrollmentsRef = collection(db, "enrollments")
    const enrollmentsQuery = query(enrollmentsRef)
    
    const unsubscribe = onSnapshot(enrollmentsQuery, 
      (snapshot) => {
        const enrollmentsData = snapshot.docs.map(doc => {
          const data = doc.data();
          // Find matching student by email
          const matchingStudent = students.find(student => 
            student.email.toLowerCase() === (data.email || "").toLowerCase()
          );
          
          return {
            id: doc.id,
            ...data,
            // Use studentName from enrollment or from matching student
            studentName: data.studentName || (matchingStudent ? matchingStudent.name : "N/A"),
            // Use phone from enrollment or from matching student
            phone: data.phone || (matchingStudent ? matchingStudent.phone : "N/A"),
            enrollmentDate: data.enrollmentDate?.toDate?.() || new Date(data.enrollmentDate)
          }
        })
        console.log("Fetched enrollments with student data:", enrollmentsData); // Debug log
        setEnrollments(enrollmentsData)
        setIsLoading(false)
      }, 
      (err) => {
        console.error("Error fetching enrollments:", err)
        setError("Failed to load enrollments. Please try again later.")
        setIsLoading(false)
      }
    )
    
    return () => unsubscribe()
  }, [students]) // Re-run when students data changes

  const filteredEnrollments = enrollments.filter((enrollment) => {
    const matchesSearch =
      enrollment.studentName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      enrollment.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      enrollment.courseTitle?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === "all" || enrollment.paymentStatus === statusFilter

    return matchesSearch && matchesStatus
  })

  const totalPages = Math.ceil(filteredEnrollments.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedEnrollments = filteredEnrollments.slice(startIndex, startIndex + itemsPerPage)

  const handleSubmit = async (e) => {
    e.preventDefault()

    try {
      if (editingEnrollment) {
        // Log the form data before update
        console.log("Updating enrollment with data:", formData);
        
        // Update existing enrollment
        await updateDoc(doc(db, "enrollments", editingEnrollment.id), {
          studentName: formData.studentName,
          email: formData.email,
          phone: formData.phone,
          courseTitle: formData.courseTitle,
          courseId: formData.courseId,
          paymentStatus: formData.paymentStatus,
          updatedAt: serverTimestamp()
        })
        toast.success("Enrollment updated successfully!")
      }
      resetForm()
    } catch (error) {
      console.error("Error updating enrollment:", error)
      toast.error("Failed to update enrollment. Please try again.")
    }
  }

  const resetForm = () => {
    setFormData({
      studentName: "",
      email: "",
      phone: "",
      courseTitle: "",
      courseId: "",
      enrollmentDate: "",
      paymentStatus: "Pending"
    })
    setEditingEnrollment(null)
    setShowModal(false)
  }

  const handleEdit = (enrollment) => {
    console.log("Editing enrollment:", enrollment); // Debug log
    setEditingEnrollment(enrollment)
    setFormData({
      studentName: enrollment.studentName || "",
      email: enrollment.email || "",
      phone: enrollment.phone || "",
      courseTitle: enrollment.courseTitle || "",
      courseId: enrollment.courseId || "",
      enrollmentDate: enrollment.enrollmentDate ? new Date(enrollment.enrollmentDate).toISOString().split('T')[0] : "",
      paymentStatus: enrollment.paymentStatus || "Pending"
    })
    setShowModal(true)
  }

  const handleDelete = async (enrollmentId) => {
    if (confirm("Are you sure you want to delete this enrollment record?")) {
      try {
        await deleteDoc(doc(db, "enrollments", enrollmentId))
        toast.success("Enrollment deleted successfully!")
      } catch (error) {
        console.error("Error deleting enrollment:", error)
        toast.error("Failed to delete enrollment. Please try again.")
      }
    }
  }

  const handleUpdatePaymentStatus = async (enrollmentId, newStatus) => {
    try {
      await updateDoc(doc(db, "enrollments", enrollmentId), {
        paymentStatus: newStatus,
        updatedAt: serverTimestamp()
      })
      toast.success(`Payment status updated to ${newStatus}!`)
    } catch (error) {
      console.error("Error updating payment status:", error)
      toast.error("Failed to update payment status. Please try again.")
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case "Paid":
        return "#48bb78"
      case "Pending":
        return "#f6ad55"
      case "Failed":
        return "#f56565"
      case "Refunded":
        return "#9f7aea"
      default:
        return "#a0aec0"
    }
  }

  const formatDate = (date) => {
    if (!date) return "N/A"
    try {
      return new Date(date).toLocaleDateString()
    } catch (error) {
      console.error("Error formatting date:", error)
      return "Invalid Date"
    }
  }

  return (
    <div className="enrollments-management">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2>Enrollments Management</h2>
          <p>Track and manage student course enrollments</p>
        </div>
      </div>

      <div className="filters-section">
        <div className="search-input">
          <FiSearch />
          <input
            type="text"
            placeholder="Search by student name, email or course..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="filter-group">
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="all">All Status</option>
            <option value="Paid">Paid</option>
            <option value="Pending">Pending</option>
            <option value="Failed">Failed</option>
            <option value="Refunded">Refunded</option>
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading enrollments...</p>
        </div>
      ) : error ? (
        <div className="error-container">
          <p>{error}</p>
          <button onClick={() => window.location.reload()}>Retry</button>
        </div>
      ) : (
        <div className="table-container">
          {filteredEnrollments.length === 0 ? (
            <div className="no-data-message">
              <p>No enrollment records found.</p>
            </div>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Student Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Course</th>
                  <th>Enrollment Date</th>
                  <th>Payment Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedEnrollments.map((enrollment) => (
                  <tr key={enrollment.id}>
                    <td>{enrollment.studentName || 'N/A'}</td>
                    <td>{enrollment.email || 'N/A'}</td>
                    <td>{enrollment.phone || 'N/A'}</td>
                    <td>{enrollment.courseTitle || 'N/A'}</td>
                    <td>{formatDate(enrollment.enrollmentDate)}</td>
                    <td>
                      <div className="status-dropdown">
                        <span
                          className="status-badge"
                          style={{
                            backgroundColor: `${getStatusColor(enrollment.paymentStatus)}20`,
                            color: getStatusColor(enrollment.paymentStatus),
                          }}
                        >
                          {enrollment.paymentStatus}
                        </span>
                        <div className="status-dropdown-content">
                          <button onClick={() => handleUpdatePaymentStatus(enrollment.id, "Paid")}>Mark as Paid</button>
                          <button onClick={() => handleUpdatePaymentStatus(enrollment.id, "Pending")}>Mark as Pending</button>
                          <button onClick={() => handleUpdatePaymentStatus(enrollment.id, "Failed")}>Mark as Failed</button>
                          <button onClick={() => handleUpdatePaymentStatus(enrollment.id, "Refunded")}>Mark as Refunded</button>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button className="btn-icon" onClick={() => handleEdit(enrollment)}>
                          <FiEdit />
                        </button>
                        <button className="btn-icon btn-danger" onClick={() => handleDelete(enrollment.id)}>
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

      {/* MODAL: Edit Enrollment */}
      {showModal && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center"
        }}>
          <div style={{ background: "white", padding: 32, borderRadius: 12, maxWidth: 500, width: "90%", maxHeight: "80vh", overflowY: "auto", boxShadow: "0 8px 32px rgba(0,0,0,0.18)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h3 style={{ fontSize: 20, fontWeight: 600, color: "#2d3748" }}>Edit Enrollment</h3>
              <button style={{ background: "none", border: "none", fontSize: 24, cursor: "pointer", color: "#a0aec0", padding: 4 }} onClick={resetForm}>
                <FiX />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Student Name</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.studentName}
                  onChange={(e) => setFormData({ ...formData, studentName: e.target.value })}
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
                <label className="form-label">Course</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.courseTitle}
                  readOnly
                />
              </div>
              <div className="form-group">
                <label className="form-label">Payment Status</label>
                <select
                  className="form-select"
                  value={formData.paymentStatus}
                  onChange={(e) => setFormData({ ...formData, paymentStatus: e.target.value })}
                >
                  <option value="Pending">Pending</option>
                  <option value="Paid">Paid</option>
                  <option value="Failed">Failed</option>
                  <option value="Refunded">Refunded</option>
                </select>
              </div>
              <div className="form-actions">
                <button type="button" className="btn-cancel" onClick={resetForm}>Cancel</button>
                <button type="submit" className="btn-primary">Update Enrollment</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style jsx>{`
        .enrollments-management {
          padding: 24px;
        }
        .page-header {
          margin-bottom: 24px;
        }
        .page-header h2 {
          font-size: 24px;
          font-weight: 600;
          margin: 0;
        }
        .page-header p {
          color: #718096;
          margin: 8px 0 0;
        }
        .filters-section {
          display: flex;
          justify-content: space-between;
          margin-bottom: 24px;
          flex-wrap: wrap;
          gap: 16px;
        }
        .search-input {
          position: relative;
          flex: 1;
          min-width: 250px;
        }
        .search-input svg {
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          color: #a0aec0;
        }
        .search-input input {
          width: 100%;
          padding: 10px 16px 10px 40px;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          font-size: 14px;
        }
        .filter-group {
          display: flex;
          gap: 12px;
        }
        .filter-group select {
          padding: 10px 16px;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          background-color: white;
          font-size: 14px;
          min-width: 150px;
        }
        .admin-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 24px;
          background-color: white;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        .admin-table th, .admin-table td {
          padding: 16px;
          text-align: left;
          border-bottom: 1px solid #e2e8f0;
        }
        .admin-table th {
          background-color: #f7fafc;
          font-weight: 600;
          color: #4a5568;
          font-size: 14px;
        }
        .admin-table tr:last-child td {
          border-bottom: none;
        }
        .action-buttons {
          display: flex;
          gap: 8px;
        }
        .btn-icon {
          background: none;
          border: none;
          font-size: 18px;
          cursor: pointer;
          color: #4a5568;
          padding: 4px;
          border-radius: 4px;
        }
        .btn-icon:hover {
          background-color: #f7fafc;
        }
        .btn-danger {
          color: #e53e3e;
        }
        .btn-danger:hover {
          background-color: #fff5f5;
        }
        .loading-container, .error-container, .no-data-message {
          padding: 48px;
          text-align: center;
          background-color: white;
          border-radius: 8px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        .spinner {
          border: 4px solid rgba(0, 0, 0, 0.1);
          width: 36px;
          height: 36px;
          border-radius: 50%;
          border-left-color: #3182ce;
          animation: spin 1s linear infinite;
          margin: 0 auto 16px;
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .error-container p {
          color: #e53e3e;
          margin-bottom: 16px;
        }
        .error-container button, .no-data-message button {
          background-color: #3182ce;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 4px;
          cursor: pointer;
        }
        .pagination {
          display: flex;
          justify-content: center;
          gap: 8px;
          margin-top: 24px;
        }
        .pagination button {
          padding: 8px 16px;
          border: 1px solid #e2e8f0;
          background-color: white;
          border-radius: 4px;
          cursor: pointer;
        }
        .pagination button.active {
          background-color: #3182ce;
          color: white;
          border-color: #3182ce;
        }
        .pagination button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .form-group {
          margin-bottom: 20px;
        }
        .form-label {
          display: block;
          margin-bottom: 8px;
          font-weight: 500;
          color: #4a5568;
        }
        .form-input, .form-select {
          width: 100%;
          padding: 10px 16px;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          font-size: 14px;
        }
        .form-actions {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          margin-top: 24px;
        }
        .btn-cancel {
          padding: 10px 16px;
          background-color: white;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          cursor: pointer;
        }
        .btn-primary {
          padding: 10px 16px;
          background-color: #3182ce;
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
        }
        .status-badge {
          display: inline-block;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 500;
        }
        .status-dropdown {
          position: relative;
          display: inline-block;
        }
        .status-dropdown-content {
          display: none;
          position: absolute;
          right: 0;
          background-color: white;
          min-width: 160px;
          box-shadow: 0 8px 16px rgba(0,0,0,0.1);
          z-index: 1;
          border-radius: 6px;
          overflow: hidden;
        }
        .status-dropdown:hover .status-dropdown-content {
          display: block;
        }
        .status-dropdown-content button {
          width: 100%;
          text-align: left;
          padding: 10px 16px;
          border: none;
          background: none;
          cursor: pointer;
          font-size: 14px;
        }
        .status-dropdown-content button:hover {
          background-color: #f7fafc;
        }
      `}</style>
    </div>
  )
}