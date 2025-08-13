"use client"

import { useState, useEffect } from "react"
import { FiSearch, FiFilter, FiEdit, FiTrash2, FiPlus } from "react-icons/fi"
import { db, auth } from "../../services/firebase"
import { collection, onSnapshot, query, doc, deleteDoc, updateDoc, addDoc, serverTimestamp } from "firebase/firestore"
import { createUserWithEmailAndPassword } from "firebase/auth"

export default function UserManagement() {
  const [users, setUsers] = useState([])
  const [searchTerm, setSearchTerm] = useState("")
  const [roleFilter, setRoleFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    role: "student",
    status: "active",
    joinDate: new Date().toISOString().split("T")[0]
  })
  const [formError, setFormError] = useState("")
  const [formSuccess, setFormSuccess] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const itemsPerPage = 10

  // Fetch real-time data from Firestore
  useEffect(() => {
    setLoading(true)
    setError(null)

    // Create a query against the students collection
    const studentsRef = collection(db, "Students")
    const q = query(studentsRef)

    // Set up real-time listener
    const unsubscribe = onSnapshot(q, 
      (querySnapshot) => {
        const studentsData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          name: doc.data().name || "Unknown",
          role: "student",
          email: doc.data().Gmail || doc.data().email || "",
          phone: doc.data().phone || "",
          status: doc.data().status || "active",
          joinDate: doc.data().createdAt ? new Date(doc.data().createdAt.toDate()).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          ...doc.data()
        }))
        setUsers(studentsData)
        setLoading(false)
      },
      (err) => {
        console.error("Error fetching students:", err)
        setError("Failed to load student data. Please try again.")
        setLoading(false)
      }
    )

    // Clean up listener on unmount
    return () => unsubscribe()
  }, [])

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesRole = roleFilter === "all" || user.role === roleFilter
    const matchesStatus = statusFilter === "all" || user.status === statusFilter

    return matchesSearch && matchesRole && matchesStatus
  })

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedUsers = filteredUsers.slice(startIndex, startIndex + itemsPerPage)

  const handleDelete = async (userId) => {
    if (confirm("Are you sure you want to delete this user?")) {
      try {
        // Delete the document from Firestore
        await deleteDoc(doc(db, "Students", userId))
        // No need to update state as the onSnapshot will handle that
      } catch (err) {
        console.error("Error deleting user:", err)
        alert("Failed to delete user. Please try again.")
      }
    }
  }

  const toggleUserStatus = async (userId, currentStatus) => {
    try {
      const newStatus = currentStatus === "active" ? "inactive" : "active"
      // Update the document in Firestore
      await updateDoc(doc(db, "Students", userId), {
        status: newStatus
      })
      // No need to update state as the onSnapshot will handle that
    } catch (err) {
      console.error("Error updating user status:", err)
      alert("Failed to update user status. Please try again.")
    }
  }

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      phone: "",
      password: "",
      role: "student",
      status: "active",
      joinDate: new Date().toISOString().split("T")[0]
    })
    setFormError("")
    setFormSuccess("")
    setShowModal(false)
    setEditingUser(null)
  }

  const handleEdit = (user) => {
    setEditingUser(user)
    setFormData({
      name: user.name || "",
      email: user.email || "",
      phone: user.phone || "",
      password: "", // Don't populate password for security reasons
      role: user.role || "student",
      status: user.status || "active",
      joinDate: user.joinDate || new Date().toISOString().split("T")[0]
    })
    setShowModal(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setFormError("")
    setFormSuccess("")
    setIsSubmitting(true)

    try {
      // Validate form
      if (!formData.name || !formData.email || !formData.phone) {
        setFormError("Please fill all required fields")
        setIsSubmitting(false)
        return
      }

      // If we're editing an existing user
      if (editingUser) {
        // Update student details in Firestore
        await updateDoc(doc(db, "Students", editingUser.id), {
          name: formData.name,
          Gmail: formData.email,
          email: formData.email,
          phone: formData.phone,
          status: formData.status,
          updatedAt: serverTimestamp(),
          joinDate: formData.joinDate
        })

        setFormSuccess("Student updated successfully!")
        setTimeout(() => {
          resetForm()
        }, 2000)
      } else {
        // For new users, validate password
        if (!formData.password) {
          setFormError("Password is required for new students")
          setIsSubmitting(false)
          return
        }

        // Create user in Firebase Authentication
        const userCredential = await createUserWithEmailAndPassword(
          auth, 
          formData.email, 
          formData.password
        )

        // Get the UID from the newly created user
        const uid = userCredential.user.uid

        // Store student details in Firestore
        await addDoc(collection(db, "Students"), {
          name: formData.name,
          Gmail: formData.email,
          email: formData.email,
          phone: formData.phone,
          status: formData.status,
          role: "student",
          uid: uid,
          createdAt: serverTimestamp(),
          joinDate: formData.joinDate
        })

        setFormSuccess("Student added successfully!")
        setTimeout(() => {
          resetForm()
        }, 2000)
      }
    } catch (err) {
      console.error("Error processing student:", err)
      if (err.code === 'auth/email-already-in-use') {
        setFormError("This email is already registered. Please use a different email.")
      } else {
        setFormError("Failed to process student: " + err.message)
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="user-management">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2>User Management</h2>
          <p>Manage all platform users and their permissions</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          + Add Student
        </button>
      </div>

      <div className="filters-section">
        <div className="search-input">
          <FiSearch />
          <input
            type="text"
            placeholder="Search users by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="filter-group">
          <div className="filter-item">
            <FiFilter />
            <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
              <option value="all">All Roles</option>
              <option value="student">Students</option>
              <option value="admin">Admins</option>
            </select>
          </div>

          <div className="filter-item">
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      {loading && <div className="loading-state">Loading student data...</div>}
      {error && <div className="error-state">{error}</div>}

      {!loading && !error && (
        <div className="table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>User ID</th>
                <th>Name</th>
              
                <th>Email</th>
                <th>Phone</th>
                <th>Join Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedUsers.length > 0 ? (
                paginatedUsers.map((user) => (
                  <tr key={user.id}>
                    <td>{user.id}</td>
                    <td>
                      <div className="user-info">
                        <div className="user-avatar">{user.name?.charAt(0).toUpperCase() || "?"}</div>
                        <span className="user-name">{user.name || "Unknown"}</span>
                      </div>
                    </td>
                   
                    <td>{user.email || "N/A"}</td>
                    <td>{user.phone || "N/A"}</td>
                    <td>{user.joinDate ? new Date(user.joinDate).toLocaleDateString() : "N/A"}</td>
                    <td>
                      <button 
                        className={`status-toggle ${user.status || "inactive"}`} 
                        onClick={() => toggleUserStatus(user.id, user.status)}
                      >
                        {user.status || "inactive"}
                      </button>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button className="btn-icon" onClick={() => handleEdit(user)} type="button">
                          <FiEdit />
                        </button>
                        <button className="btn-icon btn-danger" onClick={() => handleDelete(user.id)} type="button">
                          <FiTrash2 />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="empty-state">
                    No users found matching your filters
                  </td>
                </tr>
              )}
            </tbody>
          </table>
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

      {/* MODAL: Add Student */}
      {showModal && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center"
        }}>
          <div style={{ background: "white", padding: 32, borderRadius: 12, maxWidth: 500, width: "90%", maxHeight: "80vh", overflowY: "auto", boxShadow: "0 8px 32px rgba(0,0,0,0.18)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h3 style={{ fontSize: 20, fontWeight: 600, color: "#2d3748" }}>{editingUser ? "Edit Student" : "Add New Student"}</h3>
              <button style={{ background: "none", border: "none", fontSize: 24, cursor: "pointer", color: "#a0aec0", padding: 4 }} onClick={resetForm}>
                ×
              </button>
            </div>
            
            {formError && (
              <div style={{ padding: "10px", backgroundColor: "#FEE2E2", color: "#B91C1C", borderRadius: "4px", marginBottom: "16px" }}>
                {formError}
              </div>
            )}
            
            {formSuccess && (
              <div style={{ padding: "10px", backgroundColor: "#D1FAE5", color: "#065F46", borderRadius: "4px", marginBottom: "16px" }}>
                {formSuccess}
              </div>
            )}
            
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Name *</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Email *</label>
                <input
                  type="email"
                  className="form-input"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Phone *</label>
                <input
                  type="tel"
                  className="form-input"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Password {!editingUser && "*"}</label>
                <input
                  type="password"
                  className="form-input"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required={!editingUser}
                  placeholder={editingUser ? "Leave blank to keep current password" : ""}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Join Date</label>
                <input
                  type="date"
                  className="form-input"
                  value={formData.joinDate}
                  onChange={(e) => setFormData({ ...formData, joinDate: e.target.value })}
                  required
                />
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
                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? (editingUser ? "Updating..." : "Adding...") : (editingUser ? "Update Student" : "Add Student")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* END MODAL */}
    </div>
  );
}
