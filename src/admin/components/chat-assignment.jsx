"use client"
import { useState, useEffect } from "react"
import { FiMessageCircle, FiTrash2, FiUser, FiUserCheck, FiAlertCircle, FiBookOpen } from "react-icons/fi"
import { db } from "../../services/firebase"
import { collection, onSnapshot, query, doc, deleteDoc, addDoc, updateDoc, serverTimestamp, where, getDocs } from "firebase/firestore"
import { createChatDocument } from "../../utils/chatUtils"

export default function ChatAssignment() {
  const [assignments, setAssignments] = useState([])
  const [students, setStudents] = useState([])
  const [teachers, setTeachers] = useState([])
  const [courses, setCourses] = useState([]) 
  const [selectedStudent, setSelectedStudent] = useState("")
  const [selectedTeacher, setSelectedTeacher] = useState("")
  const [selectedCourse, setSelectedCourse] = useState("")
  const [toast, setToast] = useState({ show: false, message: "", type: "" })
  const [loading, setLoading] = useState({
    courses: true
  })
  const [error, setError] = useState({
    courses: null
  })

  // Fetch courses from both collections (courses and advancedCourses)
  useEffect(() => {
    setLoading(prev => ({ ...prev, courses: true }))
    setError(prev => ({ ...prev, courses: null }))
    
    // Create queries against both collections
    const regularCoursesRef = collection(db, "courses")
    const advancedCoursesRef = collection(db, "advancedCourses")
    
    // Set up real-time listeners for both collections
    const unsubscribeRegular = onSnapshot(
      query(regularCoursesRef),
      (querySnapshot) => {
        const regularCoursesData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          title: doc.data().name || doc.data().courseName || doc.data().title || "Unknown Course",
          status: doc.data().status || "active",
          courseType: "regular"
        }))
        
        // We'll combine the data in the second listener
        setLoading(prev => ({ ...prev, courses: false }))
        
        // Set up listener for advanced courses
        const unsubscribeAdvanced = onSnapshot(
          query(advancedCoursesRef),
          (querySnapshot) => {
            const advancedCoursesData = querySnapshot.docs.map(doc => ({
              id: doc.id,
              title: doc.data().name || doc.data().courseName || doc.data().title || "Unknown Course",
              status: doc.data().status || "active",
              courseType: "advanced"
            }))
            
            // Combine both course types and filter active ones
            const allCoursesData = [...regularCoursesData, ...advancedCoursesData]
            setCourses(allCoursesData.filter(course => course.status === "active"))
            setLoading(prev => ({ ...prev, courses: false }))
          },
          (err) => {
            console.error("Error fetching advanced courses:", err)
            // Even if advanced courses fail, we still have regular courses
            setCourses(regularCoursesData.filter(course => course.status === "active"))
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

  useEffect(() => {
    const unsub = onSnapshot(query(collection(db, 'Students')),(snap)=>{
      const list = snap.docs.map(d=>({ id:d.id, uid:d.data().uid||d.id, name:d.data().name||'Unknown', email:d.data().Gmail||d.data().email||'', status:d.data().status||'active' }))
      setStudents(list.filter(s=>s.status==='active'))
    })
    return ()=>unsub()
  }, [])

  useEffect(() => {
    const unsub = onSnapshot(query(collection(db, 'Teacher')),(snap)=>{
      const list = snap.docs.map(d=>({ id:d.id, uid:d.data().uid||d.id, name:d.data().name||'Unknown', email:d.data().Gmail||d.data().email||'', status:d.data().status||'active' }))
      setTeachers(list.filter(t=>t.status==='active'))
    })
    return ()=>unsub()
  }, [])

  useEffect(() => {
    const unsub = onSnapshot(query(collection(db, 'chatAssignments')),(snap)=>{
      const rows = snap.docs.map(d=>{
        const data = d.data()
        const assignedAt = data.assignedAt
        let assignedDate = 'Unknown'
        if (assignedAt && typeof assignedAt.toDate === 'function') {
          try { assignedDate = assignedAt.toDate().toISOString().split('T')[0] } catch { /* ignore parse error */ }
        } else if (assignedAt instanceof Date) {
          try { assignedDate = assignedAt.toISOString().split('T')[0] } catch { /* ignore parse error */ }
        }
        return {
          id: d.id,
          assignmentId: data.assignmentId || d.id,
          studentId: data.studentId,
          teacherId: data.teacherId,
          course: data.course || 'N/A',
          assignedDate,
          status: data.status || 'active'
        }
      })
      const resolved = rows.map(a=>{
        const s = students.find(s=>s.uid===a.studentId || s.id===a.studentId)
        const t = teachers.find(t=>t.uid===a.teacherId || t.id===a.teacherId)
        return { ...a, studentName: s?.name || 'Unknown Student', teacherName: t?.name || 'Unknown Teacher' }
      })
      setAssignments(resolved)
    })
    return ()=>unsub()
  }, [students, teachers])

  const showToast = (message, type='info') => {
    setToast({ show:true, message, type });
    setTimeout(()=> setToast({ show:false, message:'', type:''}), 3000)
  }

  const handleAssign = async () => {
    if (!selectedStudent || !selectedTeacher || !selectedCourse) {
      showToast('Please select student, teacher and course','error')
      return
    }

    // Prevent duplicates
    const existsQ = query(
      collection(db,'chatAssignments'),
      where('studentId','==',selectedStudent),
      where('teacherId','==',selectedTeacher),
      where('course','==',selectedCourse)
    )
    const existsSnap = await getDocs(existsQ)
    if (!existsSnap.empty) { showToast('This assignment already exists','error'); return }

    try {
      const assignmentId = `A${String(assignments.length + 1).padStart(3,'0')}`
      // Optimistic UI
      const optimistic = {
        id:`optimistic-${Date.now()}`,
        assignmentId,
        studentId:selectedStudent,
        teacherId:selectedTeacher,
        course:selectedCourse,
        assignedDate: new Date().toISOString().split('T')[0],
        status:'active',
        studentName: students.find(s=>s.uid===selectedStudent || s.id===selectedStudent)?.name || 'Student',
        teacherName: teachers.find(t=>t.uid===selectedTeacher || t.id===selectedTeacher)?.name || 'Teacher'
      }
      setAssignments(prev=>[optimistic, ...prev])

      await addDoc(collection(db,'chatAssignments'),{
        assignmentId,
        studentId:selectedStudent,
        teacherId:selectedTeacher,
        course:selectedCourse,
        assignedAt: serverTimestamp(),
        status:'active'
      })

      await createChatDocument(selectedStudent, selectedTeacher, selectedCourse)

      showToast('Assignment and chat created successfully','success')
      setSelectedStudent(''); setSelectedTeacher(''); setSelectedCourse('')
    } catch (err) {
      console.error(err)
      showToast('Failed to create assignment','error')
    }
  }

  const handleUnassign = async (id) => {
    if (!confirm('Remove this assignment?')) return
    try { await deleteDoc(doc(db,'chatAssignments', id)); showToast('Assignment removed','success') }
    catch(err){ console.error(err); showToast('Failed to remove','error') }
  }

  const toggleAssignmentStatus = async (id, status) => {
    const newStatus = status === 'active' ? 'inactive' : 'active'
    try { await updateDoc(doc(db,'chatAssignments', id), { status:newStatus }); showToast(`Assignment ${newStatus}`,'success') }
    catch(err){ console.error(err); showToast('Failed to update status','error') }
  }

  return (
    <div className="chat-assignment">
      <div className="page-header">
        <div>
          <h2>One-on-One Chat Assignment</h2>
          <p>Assign students to teachers for direct communication</p>
        </div>
      </div>

      {toast.show && (
        <div className={`toast-notification ${toast.type}`}>
          <FiAlertCircle />
          <span>{toast.message}</span>
        </div>
      )}

      <div className="assignment-form">
        <div className="form-card">
          <div className="form-row">
            <div className="form-group">
              <label className="form-label"><FiUser /> Select Student</label>
              <select className="form-select" value={selectedStudent} onChange={e=>setSelectedStudent(e.target.value)}>
                <option value="">Choose a student...</option>
                {students.map(s=> (
                  <option key={s.id} value={s.uid || s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label"><FiUserCheck /> Select Teacher</label>
              <select className="form-select" value={selectedTeacher} onChange={e=>setSelectedTeacher(e.target.value)}>
                <option value="">Choose a teacher...</option>
                {teachers.map(t=> (
                  <option key={t.id} value={t.uid || t.id}>{t.name}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label"><FiBookOpen /> Select Course</label>
              <select 
                className="form-select" 
                value={selectedCourse} 
                onChange={e=>setSelectedCourse(e.target.value)}
                disabled={loading.courses}
              >
                <option value="">Choose a course...</option>
                {loading.courses ? (
                  <option disabled>Loading courses...</option>
                ) : error.courses ? (
                  <option disabled>Error: {error.courses}</option>
                ) : courses.length === 0 ? (
                  <option disabled>No courses available</option>
                ) : (
                  courses.map(course => (
                    <option key={course.id} value={course.title}>{course.title}</option>
                  ))
                )}
              </select>
            </div>

            <div>
              <button className="btn btn-primary assign-btn" onClick={handleAssign}>
                <FiMessageCircle /> Assign Chat
              </button>
            </div>
          </div>
        </div>

        <div className="assignments-section">
          <h3>Current Assignments</h3>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Assignment ID</th>
                <th>Student</th>
                <th>Teacher</th>
                <th>Course</th>
                <th>Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {assignments.length > 0 ? assignments.map(a => (
                <tr key={a.id}>
                  <td>{a.assignmentId}</td>
                  <td>{a.studentName}</td>
                  <td>{a.teacherName}</td>
                  <td>{a.course}</td>
                  <td>{a.assignedDate}</td>
                  <td>
                    <button className={`status-toggle ${a.status}`} onClick={()=>toggleAssignmentStatus(a.id, a.status)}>
                      {a.status}
                    </button>
                  </td>
                  <td>
                    <button className="btn-icon btn-danger" onClick={()=>handleUnassign(a.id)} title="Remove">
                      <FiTrash2 />
                    </button>
                  </td>
                </tr>
              )) : (
                <tr><td colSpan="7">No assignments found.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <style jsx>{`
          .form-row { display:grid; grid-template-columns: 1fr 1fr 1fr auto; gap:24px; align-items:end; }
          .chat-assignment { max-width: 1400px; }
          .page-header { margin-bottom: 32px; }
          .page-header h2 { font-size:32px; font-weight:700; color:#2d3748; margin-bottom:8px; }
          .page-header p { color:#718096; font-size:16px; }
          .assignment-form { margin-bottom:40px; }
          .form-card { background:white; border-radius:16px; padding:32px; box-shadow:0 1px 3px rgba(0,0,0,0.1); border:1px solid #e2e8f0; }
          .form-label { display:flex; align-items:center; gap:8px; margin-bottom:8px; font-weight:500; color:#4a5568; }
          .assign-btn { height:fit-content; white-space:nowrap; }
          .assignments-section h3 { font-size:24px; font-weight:600; color:#2d3748; margin-bottom:24px; }
          .status-toggle { padding:6px 16px; border:none; border-radius:20px; font-size:12px; font-weight:500; cursor:pointer; transition:all .2s; text-transform:capitalize; }
          .status-toggle.active { background:#c6f6d5; color:#22543d; }
          .status-toggle.inactive { background:#fed7d7; color:#742a2a; }
          .btn-icon { padding:8px; border:none; border-radius:6px; cursor:pointer; transition:all .2s; background:#f7fafc; color:#4a5568; }
          .btn-icon:hover { background:#e2e8f0; }
          .btn-icon.btn-danger { background:#fed7d7; color:#c53030; }
          .btn-icon.btn-danger:hover { background:#fbb6ce; }
          .toast-notification { position:fixed; top:20px; right:20px; padding:12px 20px; border-radius:8px; display:flex; align-items:center; gap:10px; box-shadow:0 4px 12px rgba(0,0,0,.15); z-index:1000; animation: slideIn .3s ease-out; }
          .toast-notification.success { background:#c6f6d5; color:#22543d; }
          .toast-notification.error { background:#fed7d7; color:#c53030; }
          .toast-notification.info { background:#bee3f8; color:#2c5282; }
          @keyframes slideIn { from { transform: translateX(100%); opacity:0; } to { transform: translateX(0); opacity:1; } }
          @media (max-width:768px){ .form-row{ grid-template-columns:1fr; gap:16px } }
        `}</style>
      </div>
    </div>
  )
}
