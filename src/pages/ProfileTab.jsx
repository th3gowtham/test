import { useState, useEffect, useRef } from "react";
import { User, Phone, MapPin, Camera, CheckCircle } from "lucide-react";
import "../styles/ProfileTab.css";
import { useAuth } from "../context/AuthContext";
import { ToastContainer, toast } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';

// Firestore imports
import { doc, setDoc, getDoc, collection, onSnapshot, query, where, getDocs } from "firebase/firestore";
import { db } from "../services/firebase";

const ProfileTab = () => {
  const { userName, user, currentUser, userRole } = useAuth();
  const [profileData, setProfileData] = useState({
    phone: "",
    location: "",
    bio: "",
  });

  // Real-time assigned batches
  const [enrolledBatches, setEnrolledBatches] = useState([]);
  const [myStudentDocId, setMyStudentDocId] = useState(null);
  const [myTeacherRef, setMyTeacherRef] = useState(null);
  const [teachers, setTeachers] = useState([]);

  const [isEditMode, setIsEditMode] = useState(false);
  const [originalProfileData, setOriginalProfileData] = useState({});
  const [avatarImage, setAvatarImage] = useState(null); // State for avatar image
  const [showValidation, setShowValidation] = useState(false);

  // NEW: File input ref and handlers for camera
  const fileInputRef = useRef(null)

  const handleCameraClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (event) => {
    const file = event.target.files && event.target.files[0];
    if (file) {
      // Check if file is an image
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setAvatarImage(e.target.result);
          toast.success("Profile picture updated!");
        };
        reader.readAsDataURL(file);
      } else {
        toast.error("Please select a valid image file.");
      }
    }
  };

  useEffect(() => {
    const fetchProfileData = async () => {
      if (!user?.email) return;
      const roleLower = (userRole || '').toLowerCase();
      let collectionName = 'Students'; // Default
      if (roleLower === 'teacher') collectionName = 'Teacher';
      if (roleLower === 'admin') collectionName = 'Admin';
      try {
        const profileRef = doc(db, collectionName, user.uid);
        const profileSnap = await getDoc(profileRef);
        if (profileSnap.exists()) {
          const data = profileSnap.data();
          setProfileData({
            phone: data.phone || "",
            location: data.location || "",
            bio: data.bio || "",
          });
        } else {
          setProfileData({ phone: "", location: "", bio: "" });
        }
      } catch (error) {
        console.error("Error fetching profile data:", error);
      }
    };
    fetchProfileData();
  }, [user]);

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
      } catch (e) {
        setMyStudentDocId(null);
      }
    };
    if (currentUser) {
      resolveStudentDocId();
    } else {
      setMyStudentDocId(null);
    }
  }, [currentUser]);

  // Subscribe to batches and filter by role to get assigned batches
  useEffect(() => {
    const roleLower = (userRole || '').toLowerCase();
    if (!currentUser || (roleLower !== 'student' && roleLower !== 'teacher' && roleLower !== 'admin')) return;

    const batchesQuery = query(collection(db, 'batches'), where('status', '==', 'active'));
    const unsubscribe = onSnapshot(batchesQuery, (snapshot) => {
      const myUid = currentUser?.uid;
      const myEmail = currentUser?.email?.toLowerCase();

      const visible = snapshot.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter(batch => {
          if (roleLower === 'admin') return true;
          if (roleLower === 'teacher') {
            const teacherCandidates = [
              batch.teacherId,
              batch.teacherUid,
              batch.teacherEmail ? batch.teacherEmail.toLowerCase() : null
            ].filter(Boolean);
            const myCandidates = [
              myTeacherRef?.id,
              myTeacherRef?.uid,
              myTeacherRef?.emailLower,
              myUid,
              myEmail,
            ].filter(Boolean);

            // Direct match against known identifiers
            if (myCandidates.some(val => teacherCandidates.includes(val))) return true;

            // Fallback: resolve by teacherId via Teacher collection and compare emails
            if (batch.teacherId) {
              const matchingTeacher = teachers.find(t => t.id === batch.teacherId);
              if (matchingTeacher) {
                const tEmail = matchingTeacher.emailLower || '';
                if (myEmail && tEmail === myEmail) return true;
              }
            }
            return false;
          }
          if (roleLower === 'student') {
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
        })
        .map(b => ({ id: b.id, batchName: b.batchName || 'Batch' }));

      setEnrolledBatches(visible);
    });

    return () => unsubscribe();
  }, [currentUser, userRole, myStudentDocId, myTeacherRef, teachers]);

  // Resolve current teacher reference for matching batches where teacherId stores Teacher doc id
  useEffect(() => {
    const resolveTeacherRef = async () => {
      try {
        if (!currentUser) { setMyTeacherRef(null); return; }
        const lowerEmail = currentUser.email?.toLowerCase();
        // Try direct doc by uid
        if (currentUser.uid) {
          const directDoc = await getDoc(doc(db, 'Teacher', currentUser.uid));
          if (directDoc.exists()) {
            const data = directDoc.data();
            setMyTeacherRef({
              id: directDoc.id,
              uid: data?.uid || directDoc.id,
              emailLower: (data?.Gmail || data?.email || '').toLowerCase()
            });
            return;
          }
        }
        // Try query by Gmail/email
        if (lowerEmail) {
          let snapshot = await getDocs(query(collection(db, 'Teacher'), where('Gmail', '==', lowerEmail)));
          if (snapshot.empty) {
            snapshot = await getDocs(query(collection(db, 'Teacher'), where('email', '==', lowerEmail)));
          }
          if (!snapshot.empty) {
            const docSnap = snapshot.docs[0];
            const data = docSnap.data();
            setMyTeacherRef({
              id: docSnap.id,
              uid: data?.uid || docSnap.id,
              emailLower: (data?.Gmail || data?.email || '').toLowerCase()
            });
            return;
          }
        }
        // Try query by uid field
        if (currentUser.uid) {
          const byUid = await getDocs(query(collection(db, 'Teacher'), where('uid', '==', currentUser.uid)));
          if (!byUid.empty) {
            const docSnap = byUid.docs[0];
            const data = docSnap.data();
            setMyTeacherRef({
              id: docSnap.id,
              uid: data?.uid || docSnap.id,
              emailLower: (data?.Gmail || data?.email || '').toLowerCase()
            });
            return;
          }
        }
        setMyTeacherRef(null);
      } catch (e) {
        setMyTeacherRef(null);
      }
    };
    resolveTeacherRef();
  }, [currentUser]);

  // Load teachers for fallback matching (mirrors Sidebar logic)
  useEffect(() => {
    const q = query(collection(db, 'Teacher'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const teachersData = snapshot.docs.map(doc => ({
        id: doc.id,
        uid: doc.data().uid || doc.id,
        emailLower: (doc.data().Gmail || doc.data().email || '').toLowerCase(),
      }));
      setTeachers(teachersData);
    });
    return () => unsubscribe();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === "phone") {
      // Only allow numbers and limit to 15 digits
      const numericValue = value.replace(/[^0-9]/g, "").slice(0, 15);
      setProfileData((prevData) => ({ ...prevData, [name]: numericValue }));
    } else {
      setProfileData((prevData) => ({ ...prevData, [name]: value }));
    }
  };

  // Validation function to check if required fields are filled
  const isFormValid = () => {
    return profileData.phone.trim() !== "" && profileData.location.trim() !== "";
  };

  const handleEdit = () => {
    setOriginalProfileData(profileData);
    setIsEditMode(true);
    setShowValidation(false);
  };

  const handleSaveChanges = async () => {
    // Check if required fields are filled
    if (!isFormValid()) {
      setShowValidation(true);
      toast.error("Please fill all required details.");
      return;
    }
    if (!user?.uid) {
      toast.error("Could not save profile. User not found.");
      return;
  }

  // Determine collection based on user role
  const roleLower = (userRole || '').toLowerCase();
  let collectionName = 'Students'; // Default
  if (roleLower === 'teacher') collectionName = 'Teacher';
  if (roleLower === 'admin') collectionName = 'Admin';

  // Prepare the complete data object to save
  const dataToSave = {
      ...profileData, // phone, location, bio
      name: userName,   // Add the user's name
      email: user.email // Add the user's email
  };
  try {
    const profileRef = doc(db, collectionName, user.uid);
    await setDoc(profileRef, dataToSave, { merge: true });
    toast.success("Profile updated successfully!");
    setIsEditMode(false);
    setShowValidation(false);
  } catch (error) {
    console.error("Error saving profile:", error);
    toast.error("Failed to update profile.");
  }
};

  const handleCancel = () => {
    setProfileData(originalProfileData);
    setIsEditMode(false);
  };

  return (
    <div className="profile-container">
      {/* Toast Message at the top */}
      <ToastContainer
        position="top-center"
        autoClose={3000}
        hideProgressBar
        closeOnClick
        pauseOnHover
        draggable
      />

      {/* Validation message only after attempted save */}
      {isEditMode && showValidation && !isFormValid() && (
        <div className="validation-message-top">
          Please fill all required details
        </div>
      )}

      <div className="profile-overview">
        <div className="chat-profile-avatar">
          {avatarImage ? (
            <img 
              src={avatarImage} 
              alt="Profile Avatar" 
              className="profile-avatar-image"
            />
          ) : (
            <span className="profile-avatar-initial">{userName ? userName.charAt(0).toUpperCase() : 'U'}</span>
          )}
          <div
            className="profile-avatar-camera"
            style={{ cursor: "pointer" }}
            onClick={handleCameraClick}
            title="Change avatar"
          >
            <Camera size={22} color="#ffffff" />
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              style={{ display: "none" }}
              onChange={handleFileChange}
            />
          </div>
        </div>

        <div className="profile-info">
          <h3 className="profile-name">{userName}</h3>
          <span className="profile-role">{userRole}</span>
          <p className="profile-description">Learner with access to enrolled batches</p>
        </div>
        <div className="w-full sm:w-auto sm:ml-auto">
          <button className="edit-button" onClick={handleEdit}>Edit Profile</button>
        </div>
      </div>

      <div className="info-grid">
        <div>
          <label className="info-label">Full Name</label>
          <div className="info-box">
            <User size={16} color="#9ca3af" />
            <span className="info-text">{userName || 'User'}</span>
          </div>
        </div>
        <div>
          <label className="info-label">Email</label>
          <div className="info-box">
            <span className="info-text">{user?.email || 'No email available'}</span>
          </div>
        </div>
        <div>
          <label className="info-label">Phone</label>
          <div className="info-box">
            <Phone size={16} color="#9ca3af" />
            {isEditMode ? (
              <input
                type="tel"
                name="phone"
                placeholder="Enter Phone Number"
                className="info-input"
                value={profileData.phone}
                onChange={handleInputChange}
                maxLength="15"
                pattern="[0-9]*"
                inputMode="numeric"
              />
            ) : (
              <span className="info-text">{profileData.phone || "Ex: 893834937"}</span>
            )}
          </div>
        </div>
        <div>
          <label className="info-label">Location</label>
          <div className="info-box">
            <MapPin size={16} color="#9ca3af" />
            {isEditMode ? (
              <input
                type="text"
                name="location"
                placeholder="Enter Location"
                className="info-input"
                value={profileData.location}
                onChange={handleInputChange}
              />
            ) : (
              <span className="info-text">{profileData.location || "Ex: United States"}</span>
            )}
          </div>
        </div>
      </div>

      <div>
        <label className="info-label">Bio</label>
        {isEditMode ? (
          <textarea
            name="bio"
            placeholder="Tell us about yourself..."
            className="bio-textarea"
            value={profileData.bio}
            onChange={handleInputChange}
          />
        ) : (
          <div className="info-box">
            <p className="info-text">{profileData.bio || "Tell us about yourself..."}</p>
          </div>
        )}
      </div>

      <div>
        <label className="info-label">
          {(() => {
            const roleLower = (userRole || '').toLowerCase();
            if (roleLower === 'admin') return 'Active Batches';
            if (roleLower === 'teacher') return 'Assigned Batches';
            return 'Enrolled Batches';
          })()}
        </label>
        <div className="enrolled-batches">
          {enrolledBatches.length > 0 ? (
            enrolledBatches.map((b) => (
              <span key={b.id} className="enrolled-tag">✓ {b.batchName}</span>
            ))
          ) : (
            <span className="info-text">No batches assigned yet</span>
          )}
        </div>
      </div>

      {isEditMode && (
        <div className="action-buttons-container">
          <button className="cancel-button" onClick={handleCancel}>Cancel</button>
          <button 
            className="save-button"
            onClick={handleSaveChanges}
          >
            Save Changes
          </button>
        </div>
      )}
    </div>
  );
};

export default ProfileTab;
