"use client"

import { useState } from "react"
import { FiPlus, FiSearch, FiEdit, FiTrash2, FiX, FiCalendar, FiClock, FiUsers, FiPaperclip } from "react-icons/fi"

const mockEvents = [
  {
    id: "E001",
    name: "React Workshop",
    description: "Hands-on React development workshop for beginners",
    date: "2024-12-25",
    time: "10:00",
    participants: 45,
    status: "upcoming",
    attachments: ["workshop-materials.pdf"],
  },
  {
    id: "E002",
    name: "Python Bootcamp",
    description: "Intensive Python programming bootcamp",
    date: "2024-12-28",
    time: "14:00",
    participants: 32,
    status: "upcoming",
  },
  {
    id: "E003",
    name: "Design Thinking Session",
    description: "Creative problem-solving workshop",
    date: "2025-01-02",
    time: "11:00",
    participants: 28,
    status: "upcoming",
  },
  {
    id: "E004",
    name: "JavaScript Fundamentals",
    description: "Basic JavaScript concepts and practices",
    date: "2024-12-20",
    time: "09:00",
    participants: 38,
    status: "completed",
  },
]

export default function EventsManagement() {
  const [events, setEvents] = useState(mockEvents)
  const [showModal, setShowModal] = useState(false)
  const [editingEvent, setEditingEvent] = useState(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 8

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    date: "",
    time: "",
    status: "upcoming",
  })

  const filteredEvents = events.filter((event) => {
    const matchesSearch =
      event.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || event.status === statusFilter

    return matchesSearch && matchesStatus
  })

  const totalPages = Math.ceil(filteredEvents.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedEvents = filteredEvents.slice(startIndex, startIndex + itemsPerPage)

  const handleSubmit = (e) => {
    e.preventDefault()

    if (editingEvent) {
      setEvents(
        events.map((event) =>
          event.id === editingEvent.id
            ? {
                ...event,
                ...formData,
                participants: event.participants,
              }
            : event,
        ),
      )
    } else {
      const newEvent = {
        id: `E${String(events.length + 1).padStart(3, "0")}`,
        ...formData,
        participants: 0,
      }
      setEvents([...events, newEvent])
    }

    resetForm()
  }

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      date: "",
      time: "",
      status: "upcoming",
    })
    setEditingEvent(null)
    setShowModal(false)
  }

  const handleEdit = (event) => {
    setEditingEvent(event)
    setFormData({
      name: event.name,
      description: event.description,
      date: event.date,
      time: event.time,
      status: event.status,
    })
    setShowModal(true)
  }

  const handleDelete = (eventId) => {
    if (confirm("Are you sure you want to delete this event?")) {
      setEvents(events.filter((event) => event.id !== eventId))
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case "upcoming":
        return "#127d8e"
      case "ongoing":
        return "#48bb78"
      case "completed":
        return "#9f7aea"
      case "cancelled":
        return "#f56565"
      default:
        return "#a0aec0"
    }
  }

  return (
    <div className="events-management">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2>Events Management</h2>
          <p>Create and manage educational events and workshops</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          + Add Event
        </button>
      </div>

      <div className="filters-section">
        <div className="search-input">
          <FiSearch />
          <input
            type="text"
            placeholder="Search events..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="filter-group">
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="all">All Status</option>
            <option value="upcoming">Upcoming</option>
            <option value="ongoing">Ongoing</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      <div className="table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Event ID</th>
              <th>Event Name</th>
              <th>Date & Time</th>
              <th>Participants</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedEvents.map((event) => (
              <tr key={event.id}>
                <td>{event.id}</td>
                <td>
                  <div className="event-info">
                    <div className="event-name">{event.name}</div>
                    <div className="event-description">{event.description}</div>
                    {event.attachments && event.attachments.length > 0 && (
                      <div className="event-attachments">
                        <FiPaperclip />
                        <span>{event.attachments.length} attachment(s)</span>
                      </div>
                    )}
                  </div>
                </td>
                <td>
                  <div className="datetime-info">
                    <div className="event-date">
                      <FiCalendar />
                      {new Date(event.date).toLocaleDateString()}
                    </div>
                    <div className="event-time">
                      <FiClock />
                      {event.time}
                    </div>
                  </div>
                </td>
                <td>
                  <div className="participants-info">
                    <FiUsers />
                    <span>{event.participants}</span>
                  </div>
                </td>
                <td>
                  <span
                    className="status-badge"
                    style={{
                      backgroundColor: `${getStatusColor(event.status)}20`,
                      color: getStatusColor(event.status),
                    }}
                  >
                    {event.status}
                  </span>
                </td>
                <td>
                  <div className="action-buttons">
                    <button className="btn-icon" onClick={() => handleEdit(event)}>
                      <FiEdit />
                    </button>
                    <button className="btn-icon btn-danger" onClick={() => handleDelete(event.id)}>
                      <FiTrash2 />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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

      {/* MODAL: Add/Edit Event */}
      {showModal && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center"
        }}>
          <div style={{ background: "white", padding: 32, borderRadius: 12, maxWidth: 500, width: "90%", maxHeight: "80vh", overflowY: "auto", boxShadow: "0 8px 32px rgba(0,0,0,0.18)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h3 style={{ fontSize: 20, fontWeight: 600, color: "#2d3748" }}>{editingEvent ? "Edit Event" : "Add New Event"}</h3>
              <button style={{ background: "none", border: "none", fontSize: 24, cursor: "pointer", color: "#a0aec0", padding: 4 }} onClick={resetForm}>
                <FiX />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Event Name</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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
              <div className="form-row" style={{ display: 'flex', gap: 12 }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Date</label>
                  <input
                    type="date"
                    className="form-input"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Time</label>
                  <input
                    type="time"
                    className="form-input"
                    value={formData.time}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
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
                  <option value="upcoming">Upcoming</option>
                  <option value="ongoing">Ongoing</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Attachments (Optional)</label>
                <div className="file-upload">
                  <input type="file" multiple className="file-input" accept=".pdf,.doc,.docx,.ppt,.pptx" />
                  <div className="file-upload-text">
                    <FiPaperclip />
                    <span>Click to upload files or drag and drop</span>
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", marginTop: 24 }}>
                <button type="button" className="btn btn-secondary" onClick={resetForm}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingEvent ? "Update Event" : "Create Event"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* END MODAL */}

      <style jsx>{`
        .events-management {
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

        .filters-section {
          display: flex;
          gap: 24px;
          margin-bottom: 24px;
          align-items: center;
        }

        .search-input {
          position: relative;
          display: flex;
          align-items: center;
          flex: 1;
          max-width: 400px;
        }

        .search-input svg {
          position: absolute;
          left: 12px;
          color: #a0aec0;
        }

        .search-input input {
          padding-left: 40px;
          width: 100%;
        }

        .filter-group select {
          padding: 8px 12px;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          background: white;
          cursor: pointer;
        }

        .event-info {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .event-name {
          font-weight: 600;
          color: #2d3748;
        }

        .event-description {
          font-size: 14px;
          color: #718096;
          line-height: 1.4;
        }

        .event-attachments {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 12px;
          color: #127d8e;
          margin-top: 4px;
        }

        .datetime-info {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .event-date,
        .event-time {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 14px;
          color: #4a5568;
        }

        .participants-info {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #4a5568;
        }

        .status-badge {
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 500;
          text-transform: capitalize;
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

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }

        .file-upload {
          position: relative;
          border: 2px dashed #e2e8f0;
          border-radius: 8px;
          padding: 24px;
          text-align: center;
          transition: border-color 0.2s ease;
          cursor: pointer;
        }

        .file-upload:hover {
          border-color: #4299e1;
        }

        .file-input {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          opacity: 0;
          cursor: pointer;
        }

        .file-upload-text {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          color: #718096;
        }

        .file-upload-text svg {
          font-size: 24px;
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

          .filters-section {
            flex-direction: column;
            align-items: stretch;
          }

          .search-input {
            max-width: none;
          }

          .form-row {
            grid-template-columns: 1fr;
          }

          .table-container {
            overflow-x: auto;
          }
        }
      `}</style>
    </div>
  )
}
