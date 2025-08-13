import { useAuth } from "./AuthContext";
import { toast } from "react-toastify";

const PaymentContext = createContext();

export const PaymentProvider = ({ children }) => {
  const { user, userRole, userName } = useAuth();
  const [loading, setLoading] = useState(false);

  // Create enrollment first, then start payment
  const createEnrollmentAndPay = async (course) => {
    // Log user and role for debugging
    console.log("[PaymentContext] user:", user, "userRole:", userRole);

    // Only allow students to pay
    if (userRole !== "Student") {
      toast.error("Only students can enroll in courses.");
      return;
    }
    if (!user || !user.email) {
      toast.error("Please login to enroll in the course");
      return;
    }

    try {
      setLoading(true);
      const apiUrl = import.meta.env.VITE_API_URL;

      // Step 1: Create enrollment via backend API
      const enrollmentResponse = await fetch(`${apiUrl}/api/enrollment/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.uid,
          courseId: course.id,
          studentName: userName || user.displayName || "",
          email: user.email,
          phone: user.phoneNumber || "",
          courseTitle: course.title,
          amount: course.fee * 100 // Amount in paise
        }),
      });

      if (!enrollmentResponse.ok) {
        const errorData = await enrollmentResponse.json();
        throw new Error(errorData.error || "Failed to create enrollment");
      }

      const { enrollmentId, status, message } = await enrollmentResponse.json();
      console.log("Enrollment response:", { enrollmentId, status, message });

      if (status === 'exists' && message.includes('already enrolled')) {
        toast.error("You are already enrolled in this course!");
        return;
      }

      // Step 2: Start payment for this enrollment
      await startPaymentForEnrollment(course, enrollmentId);

    } catch (error) {
      console.error("Error creating enrollment:", error);
      toast.error("Failed to create enrollment: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const startPaymentForEnrollment = async (course, enrollmentId) => {
    try {
      setLoading(true);
      const apiUrl = import.meta.env.VITE_API_URL;
      const response = await fetch(`${apiUrl}/api/payment/order`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          enrollmentId: enrollmentId, // Required: existing enrollment ID
          userId: user.uid,
          courseId: course.id,
          amount: course.fee * 100, // Convert to paise
          currency: "INR",
          customerEmail: user.email,
          customerContact: user.phoneNumber || null,
          notes: {
            name: userName || '',
            courseName: course.title
          }
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create order");
      }

      const { orderId, key, amount, currency } = await response.json();
      const options = {
        key: key,
        amount: amount,
        currency: currency,
        name: "The Honey Bee",
        description: `Payment for ${course.title}`,
        order_id: orderId,
        handler: async function (razorpayResponse) {
          try {
            const apiUrl = import.meta.env.VITE_API_URL;
            const verifyResponse = await fetch(`${apiUrl}/api/payment/verify`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_order_id: razorpayResponse.razorpay_order_id,
                razorpay_payment_id: razorpayResponse.razorpay_payment_id,
                razorpay_signature: razorpayResponse.razorpay_signature,
              }),
            });
            const verifyData = await verifyResponse.json();
            if (verifyResponse.ok) {
              toast.success("Payment successful! Processing enrollment...");

              // Poll enrollment status to confirm webhook update
              let attempts = 0;
              const maxAttempts = 10;
              const pollInterval = 2000; // 2 seconds

              const pollStatus = async () => {
                try {
                  const statusResponse = await fetch(`${apiUrl}/api/enrollment/${enrollmentId}/status`);
                  if (statusResponse.ok) {
                    const statusData = await statusResponse.json();
                    if (statusData.status === 'Paid') {
                      toast.success("Enrollment confirmed! You are now enrolled in the course.");
                      return true;
                    }
                  }

                  attempts++;
                  if (attempts < maxAttempts) {
                    setTimeout(pollStatus, pollInterval);
                  } else {
                    toast.warning("Payment successful, but enrollment status is still updating. Please refresh the page.");
                  }
                } catch (error) {
                  console.error("Error polling enrollment status:", error);
                }
              };

              // Start polling
              setTimeout(pollStatus, 1000);

            } else {
