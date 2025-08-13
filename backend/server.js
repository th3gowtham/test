/*
Required Environment Variables:
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret
CLIENT_URL=your_frontend_url
PORT=5000
*/

/* eslint-env node */
/* global require, process, Buffer */
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const bodyParser = require('body-parser');
const { db: adminDb, admin } = require('./config/firebaseAdmin');
const authRoutes = require('./routes/auth');
const fileRoutes = require('./routes/files');
const cookieParser = require('cookie-parser');
const { connectDB } = require('./config/mongodb');

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
//connectDB();

// CORS Configuration
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}));

// Raw body parser for webhook (must be before other body parsers)
app.use('/api/payment/webhook', bodyParser.raw({ type: 'application/json' }));

// Middleware
app.use(express.json());
app.use(cookieParser());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/files', fileRoutes);

// Razorpay Setup
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
  console.error('Razorpay credentials not found. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET');
  process.exit(1);
}

const FieldValue = admin.firestore.FieldValue;

// Payment: Create Order
app.post('/api/payment/order', async (req, res) => {
  try {
    console.log('Creating payment order:', req.body);

    const { userId, courseId, amount, currency = 'INR', customerEmail, customerContact, notes = {} } = req.body;

    // Validate required fields
    if (!userId || !courseId || !amount || !customerEmail) {
      return res.status(400).json({
        error: 'Missing required fields: userId, courseId, amount, customerEmail'
      });
    }

    // Generate enrollment ID
    const enrollmentId = uuidv4();

    // Create Razorpay order
    const orderOptions = {
      amount: parseInt(amount), // amount in paise
      currency,
      receipt: enrollmentId,
      notes: {
        ...notes,
        enrollmentId,
        userId,
        courseId
      }
    };

    const razorpayOrder = await razorpay.orders.create(orderOptions);
    console.log('Razorpay order created:', razorpayOrder.id);

    // Save enrollment to Firestore
    const enrollmentData = {
      enrollmentId,
      userId,
      courseId,
      amount: parseInt(amount),
      currency,
      customerEmail,
      customerContact: customerContact || null,
      razorpayOrderId: razorpayOrder.id,
      status: 'Pending',
      notes,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      rawWebhookEvents: []
    };

    await adminDb.collection('enrollments').doc(enrollmentId).set(enrollmentData);
    console.log('Enrollment saved to Firestore:', enrollmentId);

    // Return order details to frontend
    res.json({
      orderId: razorpayOrder.id,
      key: process.env.RAZORPAY_KEY_ID,
      amount: parseInt(amount),
      currency,
      enrollmentId
    });

  } catch (error) {
    console.error('Error creating payment order:', error);
    res.status(500).json({
      error: 'Failed to create payment order',
      message: error.message
    });
  }
});

// Webhook signature verification function
function verifyWebhookSignature(body, signature, secret) {
  try {
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(body)
      .digest('hex');

    const actualSignature = signature.replace('sha256=', '');

    // Use timing-safe comparison
    return crypto.timingSafeEqual(
      Buffer.from(expectedSignature, 'hex'),
      Buffer.from(actualSignature, 'hex')
    );
  } catch (error) {
    console.error('Signature verification error:', error);
    return false;
  }
}

// Razorpay Webhook
app.post('/api/payment/webhook', async (req, res) => {
  try {
    const signature = req.headers['x-razorpay-signature'];
    const body = req.body;

    console.log('Webhook received, signature:', signature);

    if (!signature) {
      console.error('Missing webhook signature');
      return res.status(400).json({ error: 'Missing signature' });
    }

    // Verify webhook signature
    const isValidSignature = verifyWebhookSignature(
      body,
      signature,
      process.env.RAZORPAY_WEBHOOK_SECRET
    );

    if (!isValidSignature) {
      console.error('Invalid webhook signature');
      return res.status(400).json({ error: 'Invalid signature' });
    }

    const event = JSON.parse(body.toString());
    console.log('Webhook event:', event.event, 'Payment ID:', event.payload?.payment?.entity?.id);

    // Log raw webhook event
    console.log('Raw webhook event:', JSON.stringify(event, null, 2));

    if (event.event === 'payment.captured') {
      const payment = event.payload.payment.entity;
      const orderId = payment.order_id;
      const paymentId = payment.id;

      console.log('Processing payment.captured for order:', orderId);

      // Find enrollment by razorpayOrderId or enrollmentId in notes
      let enrollmentDoc = null;
      let enrollmentId = null;

      // First try to find by enrollmentId in payment notes
      if (payment.notes && payment.notes.enrollmentId) {
        enrollmentId = payment.notes.enrollmentId;
        enrollmentDoc = await adminDb.collection('enrollments').doc(enrollmentId).get();
      }

      // If not found, search by razorpayOrderId
      if (!enrollmentDoc || !enrollmentDoc.exists) {
        const enrollmentQuery = await adminDb.collection('enrollments')
          .where('razorpayOrderId', '==', orderId)
          .limit(1)
          .get();

        if (!enrollmentQuery.empty) {
          enrollmentDoc = enrollmentQuery.docs[0];
          enrollmentId = enrollmentDoc.id;
        }
      }

      if (!enrollmentDoc || !enrollmentDoc.exists) {
        console.error('Enrollment not found for order:', orderId);
        return res.status(404).json({ error: 'Enrollment not found' });
      }

      // Update enrollment status
      const updateData = {
        status: 'Paid',
        razorpayPaymentId: paymentId,
        paymentMethod: payment.method || null,
        signature: signature,
        updatedAt: FieldValue.serverTimestamp(),
        rawWebhookEvents: FieldValue.arrayUnion(event)
      };

      await adminDb.collection('enrollments').doc(enrollmentId).update(updateData);
      console.log('Enrollment updated to Paid:', enrollmentId);
    } else {
      console.log('Unhandled webhook event:', event.event);
    }

    res.json({ status: 'ok' });

  } catch (error) {
    console.error('Webhook processing error:', error);
    res.status(500).json({
      error: 'Webhook processing failed',
      message: error.message
    });
  }
});

// Payment: Verify (keeping for backward compatibility)
app.post('/api/payment/verify', async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ error: 'Missing payment verification details' });
    }

    const sign = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSign = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(sign.toString())
      .digest('hex');

    if (razorpay_signature === expectedSign) {
      return res.status(200).json({ message: 'Payment verified successfully' });
    } else {
      return res.status(400).json({ error: 'Invalid payment signature' });
    }
  } catch (error) {
    console.error('Payment verification error:', error);
    res.status(500).json({ error: 'Payment verification failed', details: error.message });
  }
});

// ===================
// Zoom automation (no frontend changes required)
// ===================

async function getZoomAccessToken() {
  try {
    const accountId = process.env.ZOOM_ACCOUNT_ID;
    const clientId = process.env.ZOOM_CLIENT_ID;
    const clientSecret = process.env.ZOOM_CLIENT_SECRET;
    if (!accountId || !clientId || !clientSecret) return null;

    const basic = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
    const url = `https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${accountId}`;
    const res = await zoomApiCall(() => axios.post(url, null, { headers: { Authorization: `Basic ${basic}` } }));
    return res.data && res.data.access_token ? res.data.access_token : null;
  } catch (err) {
    console.error('Zoom token error:', err?.response?.data || err.message);
    return null;
  }
}

async function createZoomMeeting(topic) {
  const token = await getZoomAccessToken();
  if (!token) {
    // Fallback to static link if provided
    const fallback = process.env.DEFAULT_ZOOM_LINK || null;
    if (!fallback) return { joinUrl: null, startUrl: null, id: null };
    return { joinUrl: fallback, startUrl: fallback, id: 'static' };
  }
  try {
    const res = await zoomApiCall(() => axios.post(
      'https://api.zoom.us/v2/users/me/meetings',
      {
        topic: topic || 'Class Session',
        // Recurring meeting with no fixed time → evergreen join URL
        type: 3,
        settings: {
          join_before_host: true,
          approval_type: 2,
          waiting_room: false,
          mute_upon_entry: true,
        },
      },
      { headers: { Authorization: `Bearer ${token}` } }
    ));
    return {
      joinUrl: res.data?.join_url || null,
      startUrl: res.data?.start_url || null,
      id: res.data?.id || null,
    };
  } catch (err) {
    console.error('Create Zoom meeting error:', err?.response?.data || err.message);
    const fallback = process.env.DEFAULT_ZOOM_LINK || null;
    return { joinUrl: fallback, startUrl: fallback, id: 'static' };
  }
}

async function isMeetingValid(meetingId) {
  try {
    if (!meetingId || meetingId === 'static') return false;
    const token = await getZoomAccessToken();
    if (!token) return false;
    const url = `https://api.zoom.us/v2/meetings/${encodeURIComponent(meetingId)}`;
    const res = await zoomApiCall(() => axios.get(url, { headers: { Authorization: `Bearer ${token}` } }));
    // 200 means meeting exists and is usable
    return !!res?.data?.id;
  } catch (err) {
    const code = err?.response?.data?.code;
    // 3001: Meeting does not exist or has expired; 404 similarly
    if (code === 3001 || err?.response?.status === 404) return false;
    // Any other API failure: assume valid to avoid thrashing
    console.error('Zoom validate error:', err?.response?.data || err.message);
    return true;
  }
}

// ----------------------------
// Simple rate limiter + retry for Zoom API to avoid 429
// ----------------------------
const zoomTaskQueue = [];
let zoomWorkerRunning = false;
const PER_REQUEST_DELAY_MS = 400; // about 2.5 requests/sec

function startZoomWorkerIfNeeded() {
  if (zoomWorkerRunning) return;
  zoomWorkerRunning = true;
  const work = async () => {
    const task = zoomTaskQueue.shift();
    if (!task) {
      zoomWorkerRunning = false;
      return;
    }
    try {
      await task();
    } catch { /* swallow; caller handles */ }
    setTimeout(work, PER_REQUEST_DELAY_MS + Math.floor(Math.random() * 120));
  };
  work();
}

function zoomApiCall(fn, maxRetries = 5) {
  return new Promise((resolve, reject) => {
    let attempt = 0;
    const exec = () => {
      attempt += 1;
      fn()
        .then(resolve)
        .catch((err) => {
          const status = err?.response?.status;
          const code = err?.response?.data?.code;
          if ((status === 429 || code === 429) && attempt < maxRetries) {
            const backoff = Math.min(1000 * Math.pow(2, attempt - 1), 8000) + Math.floor(Math.random() * 250);
            setTimeout(() => {
              zoomTaskQueue.push(exec);
              startZoomWorkerIfNeeded();
            }, backoff);
            return;
          }
          reject(err);
        });
    };
    zoomTaskQueue.push(exec);
    startZoomWorkerIfNeeded();
  });
}

async function ensureCourseZoom(courseRef, data) {
  try {
    const isStatic = (data.zoomMeetingId === 'static') ||
      (typeof data.zoomLink === 'string' && /your-static-zoom-link/i.test(data.zoomLink));
    const hasLink = !!data.zoomLink && !isStatic;
    if (hasLink) {
      // Validate existing meeting; rotate if invalid
      const valid = await isMeetingValid(data.zoomMeetingId);
      if (valid) return;
    }
    const title = data.name || data.courseName || 'Course Session';
    const meeting = await createZoomMeeting(title);
    if (!meeting.joinUrl) return;
    await courseRef.set(
      {
        zoomLink: meeting.joinUrl,
        zoomMeetingId: meeting.id,
        zoomStartUrl: meeting.startUrl,
      },
      { merge: true }
    );
    console.log(`[Zoom] Set course link for ${courseRef.id}`);
  } catch (err) {
    console.error('ensureCourseZoom error:', err.message);
  }
}

async function ensureBatchZoom(batchRef, data) {
  try {
    const batchId = batchRef.id;
    let { zoomLink, zoomMessageId, zoomMeetingId } = data;
    const isStatic = (zoomMeetingId === 'static') || (typeof zoomLink === 'string' && /your-static-zoom-link/i.test(zoomLink));

    // 1) Ensure zoomLink exists
    let needsCreate = !zoomLink || isStatic;
    if (!needsCreate && zoomMeetingId) {
      const valid = await isMeetingValid(zoomMeetingId);
      needsCreate = !valid;
    }
    if (needsCreate) {
      const topic = data.batchName || data.courseName || 'Batch Session';
      const meeting = await createZoomMeeting(topic);
      if (meeting.joinUrl) {
        await batchRef.set(
          {
            zoomLink: meeting.joinUrl,
            zoomMeetingId: meeting.id,
            zoomStartUrl: meeting.startUrl,
          },
          { merge: true }
        );
        zoomLink = meeting.joinUrl;
        console.log(`[Zoom] ${isStatic ? 'Replaced static' : 'Refreshed'} batch link for ${batchId}`);
      }
    }

    // 2) Ensure pinned message exists (far-past timestamp so it stays first like a pinned banner)
    if (zoomLink && !zoomMessageId) {
      const msgRef = await batchRef.collection('messages').add({
        text: `Join Zoom: ${zoomLink}`,
        senderId: 'admin',
        senderName: 'Admin',
        senderRole: 'admin',
        isPinned: true, // Add this field
        // Far past so this message sorts first (UI orders ascending by timestamp)
        timestamp: admin.firestore.Timestamp.fromDate(new Date(2000, 0, 1)),
      });
      await batchRef.set({ zoomMessageId: msgRef.id }, { merge: true });
      zoomMessageId = msgRef.id;
      console.log(`[Zoom] Created pinned message for batch ${batchId}`);
    }

    // 3) If link changed later, keep pinned message text in sync
    if (zoomLink && zoomMessageId) {
      const pinnedRef = batchRef.collection('messages').doc(zoomMessageId);
      const pinnedSnap = await pinnedRef.get();
      const currentText = pinnedSnap.exists ? pinnedSnap.data()?.text : '';
      const currentTs = pinnedSnap.exists ? pinnedSnap.data()?.timestamp : null;
      const desired = `Join Zoom: ${zoomLink}`;
      const isPastPinned = (() => {
        try {
          if (!currentTs) return false;
          const d = typeof currentTs.toDate === 'function' ? currentTs.toDate() : new Date(currentTs);
          return d.getFullYear() <= 2000;
        } catch { return false; }
      })();

      if (currentText !== desired || !isPastPinned) {
        await pinnedRef.set({
          text: desired,
          isPinned: true, // Also add here for updates
          // ensure it remains first/visible at top
          timestamp: admin.firestore.Timestamp.fromDate(new Date(2000, 0, 1)),
        }, { merge: true });
        console.log(`[Zoom] Updated pinned message for batch ${batchId}`);
      }
    }
  } catch (err) {
    console.error('ensureBatchZoom error:', err.message);
  }
}

function startZoomAutomation() {
  try {
    // Backfill: courses
    adminDb.collection('courses').get().then((snap) => {
      snap.docs.forEach((d) => ensureCourseZoom(d.ref, d.data() || {}));
    }).catch(() => {});

    // Backfill: batches
    adminDb.collection('batches').get().then((snap) => {
      snap.docs.forEach((d) => ensureBatchZoom(d.ref, d.data() || {}));
    }).catch(() => {});

    // Real-time watchers
    adminDb.collection('courses').onSnapshot((snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added' || change.type === 'modified') {
          const data = change.doc.data() || {};
          ensureCourseZoom(change.doc.ref, data);
        }
      });
    }, (err) => console.error('courses onSnapshot error:', err.message));

    adminDb.collection('batches').onSnapshot((snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added' || change.type === 'modified') {
          const data = change.doc.data() || {};
          ensureBatchZoom(change.doc.ref, data);
        }
      });
    }, (err) => console.error('batches onSnapshot error:', err.message));

    console.log('Zoom automation listeners started');

    // Periodic validation to auto-rotate invalid/expired meetings, no frontend changes needed
    const validateAll = async () => {
      try {
        const [batchesSnap, coursesSnap] = await Promise.all([
          adminDb.collection('batches').get(),
          adminDb.collection('courses').get(),
        ]);

        // Validate batches sequentially to avoid rate limits
        for (const d of batchesSnap.docs) {
          try { await ensureBatchZoom(d.ref, d.data() || {}); } catch { /* ignore per-doc */ }
        }
        for (const d of coursesSnap.docs) {
          try { await ensureCourseZoom(d.ref, d.data() || {}); } catch { /* ignore per-doc */ }
        }
      } catch (err) {
        console.error('validateAll error:', err.message);
      }
    };
    // Run at start and every 15 minutes
    validateAll();
    setInterval(validateAll, 15 * 60 * 1000);
  } catch (err) {
    console.error('startZoomAutomation error:', err.message);
  }
}

// Start automation when server starts
startZoomAutomation();

// Global Error Handler
app.use((err, req, res) => {
  console.error('Global error handler:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start Server
app.listen(PORT, () => {
  const serverUrl = process.env.NODE_ENV === 'production' 
    ? 'Production server running' 
    : `Server running on http://localhost:${PORT}`;
  console.log(serverUrl);
});