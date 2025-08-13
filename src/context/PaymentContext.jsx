import React, { createContext, useContext, useState } from "react";
import { useAuth } from "./AuthContext";
import { toast } from "react-toastify";
import { db } from "../services/firebase";
import { collection, query, where, getDocs, updateDoc, doc, addDoc, serverTimestamp } from "firebase/firestore";

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

      // Check if user already has an enrollment for this course
      const enrollmentsRef = collection(db, "enrollments");
      const q = query(
        enrollmentsRef,
        where("userId", "==", user.uid),
        where("courseId", "==", course.id)
      );

      const querySnapshot = await getDocs(q);
      let enrollmentId = null;

      if (!querySnapshot.empty) {
        // Use existing enrollment
        const existingEnrollment = querySnapshot.docs[0];
        enrollmentId = existingEnrollment.id;
        const enrollmentData = existingEnrollment.data();

        if (enrollmentData.status === "Paid") {
          toast.error("You are already enrolled in this course!");
          return;
        }

        console.log("Using existing enrollment:", enrollmentId);
      } else {
        // Create new pending enrollment
        const enrollmentData = {
          userId: user.uid,
          courseId: course.id,
          studentName: userName || user.displayName || "",
          email: user.email,
          phone: user.phoneNumber || "",
          courseTitle: course.title,
          amount: course.fee * 100, // Store in paise
          currency: "INR",
          status: "Pending",
          paymentStatus: "Pending", // For backward compatibility
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        };

        const docRef = await addDoc(enrollmentsRef, enrollmentData);
        enrollmentId = docRef.id;
        console.log("Created new enrollment:", enrollmentId);
      }

      // Now start payment for this enrollment
      await startPaymentForEnrollment(course, enrollmentId);

    } catch (error) {
      console.error("Error creating enrollment:", error);
      toast.error("Failed to create enrollment: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const startPaymentForEnrollment = async (course, existingEnrollmentId = null) => {
    try {
      setLoading(true);
      const apiUrl = import.meta.env.VITE_API_URL;
      const response = await fetch(`${apiUrl}/api/payment/order`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.uid,
          courseId: course.id,
          amount: course.fee * 100, // Convert to paise
          currency: "INR",
          customerEmail: user.email,
          customerContact: user.phoneNumber || null,
          existingEnrollmentId: existingEnrollmentId, // Pass existing enrollment ID
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

      const { orderId, key, amount, currency, enrollmentId } = await response.json();
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
              // Note: Enrollment status is now updated via webhook automatically
              // The backend webhook will update the enrollment status to "Paid"
              toast.success("Payment successful!");
            } else {
              toast.error(verifyData.error || "Payment verification failed");
            }
          } catch (error) {
            toast.error("Payment verification failed: " + error.message);
          }
        },
        prefill: {
          name: user.displayName || "",
          email: user.email || "",
        },
        theme: { color: "#F7A4A4" }
      };
      const razorpayInstance = new window.Razorpay(options);
      razorpayInstance.open();
    } catch (error) {
      toast.error("Failed to process payment: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <PaymentContext.Provider value={{
      startPayment: createEnrollmentAndPay, // Use new function as default
      startPaymentForEnrollment, // For existing enrollments
      loading
    }}>
      {children}
    </PaymentContext.Provider>
  );
};

export const usePayment = () => useContext(PaymentContext);
