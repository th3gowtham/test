
import { db } from '../services/firebase';
import { collection, doc, getDoc, getDocs, setDoc, addDoc, serverTimestamp, query, orderBy, onSnapshot, where, writeBatch, increment } from 'firebase/firestore';

const chatCreationLocks = new Set();

/**
 * Create a new chat document with auto-generated ID
 * Adds admin to participants and sets course name as title when provided
 * @param {string} userId1 - First user ID (student)
 * @param {string} userId2 - Second user ID (teacher)
 * @param {string} [courseName] - Optional course name for the chat
 * @returns {string} - The auto-generated chat ID
 */
export const createChatDocument = async (userId1, userId2, courseName = "") => {
  // This function is complex because user identifiers can be inconsistent (e.g., auth UID vs. DB doc ID).
  // We must first resolve them to a canonical ID before we can safely check for an existing chat.

  const resolveUserVariants = async (userId) => {
    if (!userId) return [];
    const variants = new Set([String(userId)]);
    try {
      const studentDoc = await getDoc(doc(db, 'Students', String(userId)));
      if (studentDoc.exists()) {
        const data = studentDoc.data();
        if (data.uid) variants.add(data.uid);
      }
    } catch { /* noop */ }
    try {
      const teacherDoc = await getDoc(doc(db, 'Teacher', String(userId)));
      if (teacherDoc.exists()) {
        const data = teacherDoc.data();
        if (data.uid) variants.add(data.uid);
      }
    } catch { /* noop */ }
    return Array.from(variants);
  };

  const u1Variants = await resolveUserVariants(userId1);
  const u2Variants = await resolveUserVariants(userId2);

  // Use the first resolved variant as the canonical key for locking and creation.
  const studentKey = u1Variants[0] || String(userId1);
  const teacherKey = u2Variants[0] || String(userId2);
  const courseKey = String(courseName || '').trim();

  // The lock key MUST be based on the final, canonical IDs to prevent race conditions.
  const lockKey = [studentKey, teacherKey, courseKey].sort().join('-');

  if (chatCreationLocks.has(lockKey)) {
    console.log(`Chat creation for ${lockKey} is locked. Retrying...`);
    return new Promise(resolve => setTimeout(() => resolve(createChatDocument(userId1, userId2, courseName)), 1000));
  }

  chatCreationLocks.add(lockKey);

  try {
    // Now that we have the lock, safely check for an existing chat.
    const q = query(
      collection(db, 'chats'),
      where('studentId', '==', studentKey),
      where('teacherId', '==', teacherKey),
      where('name', '==', courseKey)
    );
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      console.log(`Existing chat found: ${querySnapshot.docs[0].id}.`);
      return querySnapshot.docs[0].id;
    }

    // If no chat exists, create a new one.
    console.log(`Creating new chat for ${lockKey}...`);
    const adminId = 'admin';
    const users = Array.from(new Set([studentKey, teacherKey, adminId]));

    const chatData = {
      users,
      studentId: studentKey,
      teacherId: teacherKey,
      lastMessage: '',
      lastMessageTime: serverTimestamp(),
      unreadCount: { [studentKey]: 0, [teacherKey]: 0 },
      createdAt: serverTimestamp(),
      name: courseKey,
      createdBy: adminId,
    };

    const newChatRef = await addDoc(collection(db, 'chats'), chatData);
    console.log(`Successfully created new chat: ${newChatRef.id}`);
    return newChatRef.id;

  } catch (error) {
    console.error(`Error in createChatDocument for ${lockKey}:`, error);
    return null;
  } finally {
    // CRITICAL: Always release the lock when the operation is complete.
    chatCreationLocks.delete(lockKey);
  }
};

/**
 * Send a message to a chat
 * @param {string} chatId - The auto-generated chat ID
 * @param {string} senderId - The sender's user ID
 * @param {string} receiverId - The receiver's user ID
 * @param {string} text - The message text
 */
export const sendMessage = async (chatId, senderId, receiverId, text) => {
  try {
    const messagesRef = collection(db, 'chats', chatId, 'messages');
    const messageData = {
      senderId,
      receiverId,
      text,
      timestamp: serverTimestamp(),
      read: false
    };
    
    await addDoc(messagesRef, messageData);
    
    // Update the chat document with last message info
    const chatDocRef = doc(db, 'chats', chatId);
    await setDoc(chatDocRef, {
      lastMessage: text,
      lastMessageTime: serverTimestamp(),
      [`unreadCount.${receiverId}`]: increment(1)
    }, { merge: true });
    
  } catch (error) {
    console.error('Error sending message:', error);
  }
};

/**
 * Subscribe to messages in a chat
 * @param {string} chatId - The auto-generated chat ID
 * @param {function} callback - Callback function to handle messages
 */
export const subscribeToMessages = (chatId, callback) => {
  try {
    const messagesRef = collection(db, 'chats', chatId, 'messages');
    const q = query(messagesRef, orderBy('timestamp', 'asc'));
    
    return onSnapshot(q, (snapshot) => {
      const messages = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      callback(messages);
    });
  } catch (error) {
    console.error('Error subscribing to messages:', error);
    return () => {};
  }
};

/**
 * Get all chats for a user using auto-generated IDs
 * @param {string} userId - The user's ID
 * @param {function} callback - Callback function to handle chats
 * @param {string} currentUserEmail - Current user's email for fallback lookups
 */
export const getUserChats = (userId, callback, currentUserEmail) => {
  try {
    const chatsRef = collection(db, 'chats');
    const all = new Map();
    let isAdminUser = false;
    const unsubscribers = [];

    // Check if user is admin by role first
    const checkAdminRole = async () => {
      try {
        const userSnap = await getDoc(doc(db, 'users', userId));
        if (userSnap.exists()) {
          const data = userSnap.data() || {};
          const roleLower = String(data.role || data.userRole || '').toLowerCase();
          if (roleLower === 'admin') {
            isAdminUser = true;
            return;
          }
        }
      } catch { /* noop */ }
      
      // Additional fallbacks: dedicated admin collections
      const adminCollections = ['Admins', 'Admin', 'administrators', 'adminUsers'];
      try {
        for (const coll of adminCollections) {
          const byUid = await getDocs(query(collection(db, coll), where('uid', '==', userId)));
          const byEmail = currentUserEmail ? await getDocs(query(collection(db, coll), where('email', '==', currentUserEmail))) : { empty: true, docs: [] };
          if ((byUid && !byUid.empty) || (byEmail && !byEmail.empty)) { 
            isAdminUser = true; 
            break; 
          }
        }
      } catch { /* noop */ }
      
      // Also check if userId is literally 'admin'
      if (userId === 'admin') {
        isAdminUser = true;
      }
    };

    const prepareStandard = async (docSnapshot) => {
      const chatData = docSnapshot.data();
      const participants = Array.isArray(chatData.users) ? chatData.users : [];
      const otherUserId = participants.find(id => id !== userId && id !== 'admin') || participants.find(id => id !== userId);
      let otherUserData = { displayName: 'Unknown User' };
      if (otherUserId) {
        const userDoc = await getDoc(doc(db, 'users', otherUserId));
        otherUserData = userDoc.exists() ? userDoc.data() : otherUserData;
      }
      const unreadCount = chatData.unreadCount && chatData.unreadCount[userId] ? chatData.unreadCount[userId] : 0;
      const usersAugmented = Array.isArray(chatData.users)
        ? Array.from(new Set([...
            chatData.users,
            userId,
            ...(isAdminUser ? ['admin'] : [])
          ]))
        : [userId, ...(isAdminUser ? ['admin'] : [])];
      return {
        id: docSnapshot.id, // This is now the auto-generated ID
        ...chatData,
        users: usersAugmented,
        title: chatData.name || otherUserData.displayName || 'Chat',
        otherUser: otherUserData,
        otherParticipantId: otherUserId,
        unreadCount
      };
    };

    // Admin-only: before emitting, dedupe by (studentId, teacherId, name)
    const emitWithDedupe = () => {
      const items = Array.from(all.values());
      if (!isAdminUser) {
        callback(items);
        return;
      }
      const keyFor = (c) => `${c.studentId || ''}::${c.teacherId || ''}::${String(c.name || '').toLowerCase()}`;
      const score = (c) => {
        let s = 0;
        if (Array.isArray(c.users)) s += Math.min(c.users.length, 5);
        if (c.name) s += 2;
        if (c.lastMessageTime) s += 1;
        if (c.otherParticipantId) s += 1;
        return s;
      };
      const best = new Map();
      for (const chat of items) {
        const k = keyFor(chat);
        const prev = best.get(k);
        if (!prev || score(chat) > score(prev)) best.set(k, chat);
      }
      callback(Array.from(best.values()));
    };

    // Teacher fallback: find teacher doc and ensure chats exist + include additional variants
    const startTeacherFallback = async () => {
      // Try find by uid, then by email/Gmail
      const teacherCol = collection(db, 'Teacher');
      let teacherDocs = [];
      const byUid = await getDocs(query(teacherCol, where('uid', '==', userId)));
      if (!byUid.empty) teacherDocs = byUid.docs;
      if (teacherDocs.length === 0 && currentUserEmail) {
        const [byGmail, byEmail] = await Promise.all([
          getDocs(query(teacherCol, where('Gmail', '==', currentUserEmail))),
          getDocs(query(teacherCol, where('email', '==', currentUserEmail)))
        ]);
        teacherDocs = [...byGmail.docs, ...byEmail.docs];
      }
      if (teacherDocs.length === 0) return;

      const teacherDoc = teacherDocs[0];
      const teacherData = teacherDoc.data() || {};
      const teacherUid = teacherData.uid || teacherDoc.id;
      const teacherDocId = teacherDoc.id;

      // Backfill from chatAssignments to guarantee chat docs exist
      const ensureFromAssignments = (teacherIdentifier) => {
        const assignRef = collection(db, 'chatAssignments');
        const qa = query(assignRef, where('teacherId', '==', teacherIdentifier));
        const unsubA = onSnapshot(qa, async (snapshot) => {
          for (const d of snapshot.docs) {
            const a = d.data();
            if (!a.studentId) continue;
            
            // If chat doesn't exist, create it
            if (!a.chatId) {
              const chatId = await createChatDocument(a.studentId, teacherUid, a.course || '');
              if (chatId) {
                // Update assignment with the new chat ID
                await setDoc(doc(db, 'chatAssignments', d.id), { chatId }, { merge: true });
              }
            }
          }
        });
        unsubscribers.push(unsubA);
      };
      ensureFromAssignments(teacherUid);
      if (teacherDocId !== teacherUid) ensureFromAssignments(teacherDocId);

      // Legacy chats with teacherId field
      const legacyQueries = [ query(chatsRef, where('teacherId', '==', teacherUid)) ];
      if (teacherDocId !== teacherUid) legacyQueries.push(query(chatsRef, where('teacherId', '==', teacherDocId)));
      for (const lq of legacyQueries) {
        const unsub = onSnapshot(lq, async (snapshot) => {
          for (const d of snapshot.docs) {
            const data = d.data();
            if (Array.isArray(data.users)) {
              // handled by primary, but still ensure admin visibility below
              const std = await prepareStandard(d);
              all.set(d.id, std);
              continue;
            }
            let otherUser = { displayName: 'Unknown User' };
            let otherId;
            if (data.studentId) {
              otherId = data.studentId;
              const sDoc = await getDoc(doc(db, 'Students', data.studentId));
              if (sDoc.exists()) {
                const sd = sDoc.data();
                otherUser = { displayName: sd.name || sd.displayName || 'Student', email: sd.Gmail || sd.email || '' };
              }
            }
            const unread = data.unreadCount && data.unreadCount[userId] ? data.unreadCount[userId] : 0;
            const usersForItem = Array.from(new Set([
              userId,
              otherId,
              ...(isAdminUser ? ['admin'] : [])
            ].filter(Boolean)));
            all.set(d.id, { id: d.id, ...data, users: usersForItem, title: data.name || otherUser.displayName || 'Chat', otherUser, otherParticipantId: otherId, unreadCount: unread });
          }
          emitWithDedupe();
        });
        unsubscribers.push(unsub);
      }

      // Chats where users mistakenly contains teacher doc id instead of auth uid
      const userVariants = [teacherUid, teacherDocId].filter((id, index, arr) => arr.indexOf(id) === index);
      for (const variant of userVariants) {
        const qc = query(chatsRef, where('users', 'array-contains', variant));
        const unsub = onSnapshot(qc, async (snapshot) => {
          for (const d of snapshot.docs) {
            all.set(d.id, await prepareStandard(d));
          }
          emitWithDedupe();
        });
        unsubscribers.push(unsub);
      }
    };

    // Helper to resolve a teacher uid from an arbitrary identifier (uid or doc id)
    const resolveTeacherUid = async (teacherIdentifier) => {
      if (!teacherIdentifier) return null;
      try {
        // Try by doc id first
        const teacherDocRef = doc(db, 'Teacher', teacherIdentifier);
        const teacherDocSnap = await getDoc(teacherDocRef);
        if (teacherDocSnap.exists()) {
          const td = teacherDocSnap.data() || {};
          return td.uid || teacherDocSnap.id;
        }
      } catch { /* noop */ }
      try {
        // Try by uid
        const qByUid = query(collection(db, 'Teacher'), where('uid', '==', teacherIdentifier));
        const snap = await getDocs(qByUid);
        if (!snap.empty) {
          const d = snap.docs[0];
          const td = d.data() || {};
          return td.uid || d.id;
        }
      } catch { /* noop */ }
      return teacherIdentifier; // fallback
    };

    const resolveStudentVariants = async (studentUid, email) => {
      const variants = new Set([studentUid]);
      try {
        // by uid -> get doc id
        const qByUid = query(collection(db, 'Students'), where('uid', '==', studentUid));
        const qs = await getDocs(qByUid);
        if (!qs.empty) {
          variants.add(qs.docs[0].id);
        }
      } catch { /* noop */ }
      if (email) {
        try {
          // sometimes Students doc id is lowercased email
          const ref = doc(db, 'Students', String(email).toLowerCase());
          const snap = await getDoc(ref);
          if (snap.exists()) variants.add(snap.id);
        } catch { /* noop */ }
      }
      return Array.from(variants);
    };

    // Student backfill: ensure chats exist for assignments where this user is the student
    const startStudentBackfill = async () => {
      const studentVariants = await resolveStudentVariants(userId, currentUserEmail);
      const subs = [];
      for (const studentIdVariant of studentVariants) {
        // Subscribe to assignments to ensure chat docs exist
        const qa = query(collection(db, 'chatAssignments'), where('studentId', '==', studentIdVariant));
        const unsubAssign = onSnapshot(qa, async (snapshot) => {
          for (const d of snapshot.docs) {
            const a = d.data();
            const teacherUid = await resolveTeacherUid(a.teacherId);
            if (!teacherUid || !a.studentId) continue;
            
            // If chat doesn't exist, create it
            if (!a.chatId) {
              const chatId = await createChatDocument(a.studentId, teacherUid, a.course || '');
              if (chatId) {
                // Update assignment with the new chat ID
                await setDoc(doc(db, 'chatAssignments', d.id), { chatId }, { merge: true });
              }
            }
          }
        });
        subs.push(unsubAssign);

        // Subscribe to chats where users contains any student id variant
        const qc = query(chatsRef, where('users', 'array-contains', studentIdVariant));
        const unsubChats = onSnapshot(qc, async (snapshot) => {
          for (const d of snapshot.docs) {
            all.set(d.id, await prepareStandard(d));
          }
          emitWithDedupe();
        });
        subs.push(unsubChats);
      }
      unsubscribers.push(...subs);
    };

    // Admin backfill: ensure all assignment chats exist
    const startAdminBackfill = async () => {
      if (!isAdminUser) return;
      const qa = query(collection(db, 'chatAssignments'));
      const unsub = onSnapshot(qa, async (snapshot) => {
        for (const d of snapshot.docs) {
          const a = d.data();
          const teacherUid = await resolveTeacherUid(a.teacherId);
          if (!teacherUid || !a.studentId) continue;
          
          // If chat doesn't exist, create it
          if (!a.chatId) {
            const chatId = await createChatDocument(a.studentId, teacherUid, a.course || '');
            if (chatId) {
              // Update assignment with the new chat ID
              await setDoc(doc(db, 'chatAssignments', d.id), { chatId }, { merge: true });
            }
          }
        }
      });
      unsubscribers.push(unsub);
    };

    // Start the admin role check and then initialize all subscriptions
    const initializeChats = async () => {
      await checkAdminRole();

      // Primary subscription: where users contains current user
      const primaryQuery = query(chatsRef, where('users', 'array-contains', userId));
      const primaryUnsub = onSnapshot(primaryQuery, async (snapshot) => {
        // Remove previous standard entries before re-adding
        for (const [id, item] of Array.from(all.entries())) {
          if (Array.isArray(item.users)) all.delete(id);
        }
        for (const docSnapshot of snapshot.docs) {
          all.set(docSnapshot.id, await prepareStandard(docSnapshot));
        }
        emitWithDedupe();
      });
      unsubscribers.push(primaryUnsub);

      // If admin, subscribe to ALL chats using auto-generated IDs
      if (isAdminUser) {
        const adminUnsub = onSnapshot(query(chatsRef), async (snapshot) => {
          for (const docSnapshot of snapshot.docs) {
            all.set(docSnapshot.id, await prepareStandard(docSnapshot));
          }
          emitWithDedupe();
        });
        unsubscribers.push(adminUnsub);
      }

      // Start teacher fallback if user might be a teacher
      startTeacherFallback();

      // Start student and admin backfills
      startStudentBackfill();
      startAdminBackfill();
    };

    // Initialize chats and return cleanup function
    initializeChats().catch(error => {
      console.error('Error initializing chats:', error);
    });

    // Return cleanup function that unsubscribes all listeners
    return () => {
      unsubscribers.forEach(unsub => unsub());
    };
  } catch (error) {
    console.error('Error getting user chats:', error);
    return () => {};
  }
};

/**
 * Mark all messages in a chat as read for a specific user
 * @param {string} chatId - The auto-generated chat ID
 * @param {string} userId - User ID who is reading the messages
 */
export const markMessagesAsRead = async (chatId, userId) => {
  try {
    // Get all unread messages sent to this user
    const messagesRef = collection(db, 'chats', chatId, 'messages');
    const unreadMessagesQuery = query(
      messagesRef, 
      where('receiverId', '==', userId),
      where('read', '==', false)
    );
    
    const unreadSnapshot = await getDocs(unreadMessagesQuery);
    
    if (unreadSnapshot.empty) return; // No unread messages
    
    // Use a batch to update all messages at once
    const batch = writeBatch(db);
    
    unreadSnapshot.docs.forEach(doc => {
      batch.update(doc.ref, { read: true });
    });
    
    // Reset unread counter for this user in the chat document
    const chatDocRef = doc(db, 'chats', chatId);
    const chatDoc = await getDoc(chatDocRef);
    
    if (chatDoc.exists()) {
      const chatData = chatDoc.data();
      const unreadCount = { ...(chatData.unreadCount || {}) };
      
      // Reset unread count for this user
      if (unreadCount && unreadCount[userId]) {
        unreadCount[userId] = 0;
        batch.update(chatDocRef, { unreadCount });
      }
    }
    
    // Commit all updates
    await batch.commit();
    
  } catch (error) {
    console.error('Error marking messages as read:', error);
  }
};