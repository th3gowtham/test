import { Search, MessageSquare, BellDot, Users2, User } from 'lucide-react';
import "../styles/Sidebar.css";
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getUserChats } from '../utils/chatUtils';
import WelcomeScreen from  "../pages/WelcomeScreen"
import { db } from '../services/firebase'; 
import { collection, onSnapshot, query, where, doc, getDoc, getDocs } from 'firebase/firestore'; 

const Sidebar = ({ currentView, setCurrentView, setActiveChat, setShowProfileSettings }) => {
  const { currentUser, userRole } = useAuth();
  const [isMobile, setIsMobile] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [chats, setChats] = useState([]);
  const [batches, setBatches] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [myStudentDocId, setMyStudentDocId] = useState(null);

  // Effect to fetch all teachers (normalized fields)
  useEffect(() => {
    const teachersQuery = query(collection(db, 'Teacher'));
    const unsubscribe = onSnapshot(teachersQuery, (snapshot) => {
      const teachersData = snapshot.docs.map(doc => ({
        id: doc.id,
        uid: doc.data().uid || doc.id,
        name: doc.data().name || 'Unknown',
        email: doc.data().Gmail || doc.data().email || '',
        status: doc.data().status || 'active',
        ...doc.data()
      }));
      setTeachers(teachersData);
    });
    return () => unsubscribe();
  }, []);

  // Effect to fetch all courses (with fallback for empty collection)
  useEffect(() => {
    const coursesQuery = query(collection(db, 'courses'));
    const unsubscribe = onSnapshot(coursesQuery, (snapshot) => {
      if (snapshot.empty) {
        // Fallback to mock list like admin batch screen so UI shows names
        const mockCoursesData = [
          { id: 'C001', courseName: 'React Fundamentals', status: 'active' },
          { id: 'C002', courseName: 'JavaScript Advanced', status: 'active' },
          { id: 'C003', courseName: 'Python Basics', status: 'active' },
          { id: 'C004', courseName: 'Web Design', status: 'active' },
          { id: 'C005', courseName: 'UI/UX', status: 'active' },
          { id: 'C006', courseName: 'Data Science', status: 'active' }
        ];
        setCourses(mockCoursesData);
      } else {
        const coursesData = snapshot.docs.map(doc => ({
          id: doc.id,
          courseName: doc.data().name || doc.data().courseName || '',
          status: doc.data().status || 'active',
          ...doc.data()
        })).filter(c => c.status === 'active');
        setCourses(coursesData);
      }
    });
    return () => unsubscribe();
  }, []);

  // Effect to fetch batches and resolve names
  useEffect(() => {
    const batchesQuery = query(collection(db, 'batches'), where('status', '==', 'active'));
    const unsubscribe = onSnapshot(batchesQuery, (snapshot) => {
      const batchesData = snapshot.docs.map(doc => {
        const data = doc.data();
        // Find the teacher's name using the teacherId
        const teacherInfo = teachers.find(t => t.id === data.teacherId);
        let teacherName = teacherInfo?.name || 'Unknown Teacher';

        // Find the course name using the courseId
        const courseInfo = courses.find(c => c.id === data.courseId);
        const courseName = courseInfo?.courseName || courseInfo?.name || '';

        if (userRole === 'student') {
          teacherName = 'Teacher';
        } else if (userRole === 'teacher' && teacherInfo?.uid !== currentUser?.uid) {
          teacherName = 'Teacher';
        }
        return {
          id: doc.id,
          ...data,
          teacher: teacherName,
          students: Array.isArray(data.students) ? data.students : [],
          studentsCount: Array.isArray(data.students) ? data.students.length : 0,
          courseName
        };
      });

      // Role-aware filtering: Admin sees all, Teacher sees own, Student sees assigned
      const roleLower = (userRole || '').toLowerCase();
      const myUid = currentUser?.uid;
      const myEmail = currentUser?.email?.toLowerCase();
      const myTeacher = teachers.find(t => {
        const tEmail = t.email ? t.email.toLowerCase() : '';
        return t.uid === myUid || t.id === myUid || (myEmail && tEmail === myEmail);
      });

      const visibleBatches = batchesData.filter(batch => {
        if (roleLower === 'admin') return true;
        if (roleLower === 'teacher') {
          // Normalize possible identifiers for teacher matching
          const teacherCandidates = [
            batch.teacherId,
            batch.teacherUid,
            batch.teacherEmail ? batch.teacherEmail.toLowerCase() : null
          ].filter(Boolean);

          // Direct match against current user's identifiers
          const directMatch = (
            teacherCandidates.includes(myTeacher?.id) ||
            teacherCandidates.includes(myTeacher?.uid) ||
            (myEmail && teacherCandidates.includes(myEmail)) ||
            (myUid && teacherCandidates.includes(myUid))
          );

          if (directMatch) return true;

          // Fallback: resolve by teacherId -> Teacher collection email comparison
          if (batch.teacherId) {
            const matchingTeacher = teachers.find(t => t.id === batch.teacherId);
            if (matchingTeacher) {
              const tEmail = matchingTeacher.email ? matchingTeacher.email.toLowerCase() : '';
              if (myEmail && tEmail === myEmail) return true;
            }
          }

          return false;
        }
        if (roleLower === 'student') {
          // Normalize assigned entries (supports strings or objects with uid/email/id/Gmail)
          const assigned = Array.isArray(batch.students) ? batch.students : [];
          const normalizedAssigned = assigned.map((entry) => {
            if (typeof entry === 'string') return entry.toLowerCase();
            if (!entry || typeof entry !== 'object') return '';
            return (
              entry.email?.toLowerCase() ||
              entry.Gmail?.toLowerCase() ||
              entry.uid ||
              (typeof entry.id === 'string' ? entry.id.toLowerCase() : entry.id) ||
              ''
            );
          }).filter(Boolean);

          const myStudentIdLower = myStudentDocId ? myStudentDocId.toLowerCase() : null;

          return (
            (myEmail && normalizedAssigned.includes(myEmail)) ||
            (myUid && normalizedAssigned.includes(myUid)) ||
            (myStudentIdLower && normalizedAssigned.includes(myStudentIdLower))
          );
        }
        return false;
      });

      setBatches(visibleBatches);
    });

    return () => unsubscribe();
  }, [teachers, courses, currentUser, userRole, myStudentDocId]); // Rerun when deps change

  // Resolve current user's Students doc id to support batches storing doc ids
  useEffect(() => {
    const resolveStudentDocId = async () => {
      try {
        const lowerEmail = currentUser?.email?.toLowerCase();
        let resolvedId = null;
        if (lowerEmail) {
          const ref = doc(db, 'Students', lowerEmail);
          const snap = await getDoc(ref);
          if (snap.exists()) {
            resolvedId = snap.id;
          }
        }
        if (!resolvedId && currentUser?.uid) {
          const q = query(collection(db, 'Students'), where('uid', '==', currentUser.uid));
          const qs = await getDocs(q);
          if (!qs.empty) {
            resolvedId = qs.docs[0].id;
          }
        }
        setMyStudentDocId(resolvedId);
      } catch {
        setMyStudentDocId(null);
      }
    };
    if (currentUser) {
      resolveStudentDocId();
    } else {
      setMyStudentDocId(null);
    }
  }, [currentUser]);


  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  
  // Subscribe to user chats to get unread message counts
  useEffect(() => {
    if (!currentUser) return;
    
    const unsubscribe = getUserChats(currentUser.uid, (userChats) => {
      setChats(userChats);
    }, currentUser.email || currentUser.Gmail || '');
    
    return () => unsubscribe && unsubscribe();
  }, [currentUser]);
  
  // Get assigned private chats (only show chats created through admin assignment)
  const assignedChats = chats.filter(chat => 
    (chat.type === 'assigned_private' && chat.isAssigned === true && (chat.visibleUsers || chat.users)?.includes(currentUser?.uid))
    || (!chat.type && Array.isArray(chat.users) && chat.users.includes(currentUser?.uid))
  ) || [];
  
  const filteredAssignedChats = assignedChats.filter(chat => 
    (chat.otherUser?.displayName || chat.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (chat.courseName || chat.name || '').toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  // Get group chats for the current user
  const groupChats = chats.filter(chat => 
    chat.type === 'group' && Array.isArray(chat.users) && chat.users.includes(currentUser?.uid)
  ) || [];
  
  const filteredGroupChats = groupChats.filter(chat => 
    (chat.groupName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (chat.courseName || '').toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  // Handle batch click
  const handleBatchClick = (batch) => {
    setActiveChat({
      type: 'batch',
      id: batch.id,
      name: batch.batchName,
      students: batch.studentsCount,
      teacher: batch.teacher,
      subject: batch.courseName || batch.course || ''
    });
  };

  const LeftNavBar = () => (
    <div className="left-nav-icons">
      <div
        className={`nav-icon ${currentView === 'batch-broadcasts' ? 'active' : ''}`}
        onClick={() => setCurrentView('batch-broadcasts')}
      >
        <MessageSquare />
         <span className="tooltip">Batch</span>

      </div>
      <div
        className={`nav-icon ${currentView === 'private-chat' ? 'active' : ''}`}
        onClick={() => setCurrentView('private-chat')}
      >
        <BellDot />
         <span className="tooltip">Private</span>
      </div>
      <div
        className={`nav-icon ${currentView === 'announcements' ? 'active' : ''}`}
        onClick={() => setCurrentView('announcements')}
      >
        <Users2 />
         <span className="tooltip">Communities</span>
      </div>
      <div
        className="nav-icon"
        onClick={() => setShowProfileSettings(true)}
      >
        <User />
         <span className="tooltip">Profile</span>
      </div>
    </div>
  );
  const BottomNav = () => (
    <div className="chatapp-mobile-bottom-nav">
      <div className={`chatapp-nav-item ${currentView === 'batch-broadcasts' ? 'active' : ''}`} onClick={() => setCurrentView('batch-broadcasts')}>
        <MessageSquare />
        <span>Batch</span>
      </div>
      <div className={`chatapp-nav-item ${currentView === 'private-chat' ? 'active' : ''}`} onClick={() => setCurrentView('private-chat')}>
        <BellDot />
        <span>Private</span>
      </div>
      <div className={`chatapp-nav-item ${currentView === 'announcements' ? 'active' : ''}`} onClick={() => setCurrentView('announcements')}>
        <Users2 />
        <span>Communities</span>
      </div>
      <div className={`chatapp-nav-item ${currentView === 'profile' ? 'active' : ''}`} onClick={() => {
        setCurrentView('profile');
        setShowProfileSettings(true);
      }}>

    
        <User />
        <span>Profile</span>
      </div>
    </div>
  );
  const Header = () => (
    <div className="sidebar-user-info">
      <div className="sidebar-user-header">
        <h1 className="sidebar-title">HoneyBee Learning</h1>
      </div>
    </div>
  );
  return (
    <div className="chat-layout">
      {/* ✅ Only for Desktop */}
      {!isMobile && <LeftNavBar />}
      <div className={`sidebar ${isMobile ? 'mobile-sidebar' : ''}`}>
        <Header />
        <div className="sidebar-search">
          <div className="search-container">
            <Search className="search-icon" />
            <input 
              type="text" 
              placeholder="Search chats..." 
              className="search-input" 
              value={searchTerm}
              onChange={(ev) => setSearchTerm(ev.target.value)}
            />
          </div>
          {isMobile && currentView=="welcome" && <WelcomeScreen /> }
        </div>
        {/* ✅ Chat list based on view */}
        <div className="sidebar-chat-list">
          {currentView === 'batch-broadcasts' && (
            <>
              {batches.map((batch) => (
                <div 
                  key={batch.id} 
                  className="chat-item" 
                  onClick={() => handleBatchClick(batch)}
                >
                  <div>
                    <h3 className="chat-title">{batch.batchName}</h3>
                    <p className="chat-subtitle">{batch.studentsCount} Students{batch.courseName ? ` • ${batch.courseName}` : ''}</p>
                  </div>
                  {batch.unread > 0 && (
                    <div className="chat-badge">{batch.unread}</div>
                  )}
                </div>
              ))}
            </>
          )}
          {currentView === 'private-chat' && (
            <>
              {/* Display group chats first */}
              {filteredGroupChats.map(chat => (
                <div 
                  key={chat.id} 
                  className="chat-item group-chat" 
                  onClick={() => setActiveChat({ 
                    type: 'group', 
                    name: chat.groupName || 'Group Chat', 
                    id: chat.id,
                    courseName: chat.courseName,
                    otherUsers: chat.otherUsers
                  })}
                >
                  <div className="chat-user">
                    <div>
                      <h3 className="chat-title">{chat.groupName || 'Group Chat'}</h3>
                      <p className="chat-subtitle">{chat.courseName || 'Course'} • {chat.otherUsers?.length || 0} participants</p>
                    </div>
                  </div>
                  {/* Show unread message count if it exists and is greater than 0 */}
                  {chat.unreadCount > 0 && (
                    <div className="chat-badge">{chat.unreadCount}</div>
                  )}
                </div>
              ))}
              
              {/* Display assigned chats */}
              {(() => {
                const uniqueChats = [];
                const seenChats = new Set();

                filteredAssignedChats.forEach(chat => {
                  const studentId = chat.studentId || '';
                  const teacherId = chat.teacherId || '';
                  const courseName = chat.courseName || chat.name || '';
                  
                  // Normalize to handle cases where student/teacher IDs might be swapped
                  const userIds = [studentId, teacherId].sort();
                  const uniqueKey = `${userIds[0]}-${userIds[1]}-${courseName}`;

                  if (!seenChats.has(uniqueKey)) {
                    seenChats.add(uniqueKey);
                    uniqueChats.push(chat);
                  }
                });

                return uniqueChats.map(chat => {
                  const receiverId = chat.otherParticipantId || (Array.isArray(chat.users) ? chat.users.find(u => u !== currentUser?.uid && u !== 'admin') : undefined);
                  return (
                    <div 
                      key={chat.id} 
                      className="chat-item assigned-chat" 
                      onClick={() => receiverId && setActiveChat({ 
                        type: 'private', 
                        name: chat.title || chat.otherUser?.displayName || 'User', 
                        id: receiverId,
                        chatId: chat.id,
                        courseName: chat.courseName || chat.name,
                        isAssigned: true
                      })}
                    >
                      <div className="chat-user">
                        <div>
                          <h3 className="chat-title">{chat.title || chat.otherUser?.displayName || 'User'}</h3>
                          <p className="chat-subtitle">{(chat.courseName || chat.name || 'Course')}</p>
                        </div>
                      </div>
                      {/* Show unread message count if it exists and is greater than 0 */}
                      {chat.unreadCount > 0 && (
                        <div className="chat-badge">{chat.unreadCount}</div>
                      )}
                    </div>
                  );
                });
              })()}

              {filteredGroupChats.length === 0 && filteredAssignedChats.length === 0 && (
                <div className="empty-state">No chats found</div>
              )}
            </>
          )}
          {currentView === 'announcements' && (
            <div className="chat-item" onClick={() => setActiveChat({ type: 'announcement', name: 'Community Announcements', id: 'community' })}> 
              <div>
                <h3 className="chat-title">Community Announcements</h3>
               {/* <p className="chat-subtitle">2 pinned</p>*/}
              </div>
            {/*  <div className="chat-badge">1</div>*/}
            </div>
          )}
        </div>
      </div>
      {/* ✅ Only for Mobile */}
      {isMobile && <BottomNav /> }
    </div>
  );
};

export default Sidebar;