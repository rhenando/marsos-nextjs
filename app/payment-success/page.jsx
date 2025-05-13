// app/payment-success/page.jsx
"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useSelector, useDispatch } from "react-redux";
import { resetCheckout } from "@/store/checkoutSlice";
import { clearCart } from "@/store/cartSlice"; // <— your action to clear entire cart
import { db } from "@/firebase/config";
import { setDoc, doc, serverTimestamp } from "firebase/firestore";

export default function PaymentSuccessPage() {
  const params = useSearchParams();
  const router = useRouter();
  const dispatch = useDispatch();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Grab all cart items before we clear them
  const cartItems = useSelector((s) => s.cart.items);

  useEffect(() => {
    const resourcePath = params.get("resourcePath");
    if (!resourcePath) {
      setError("Missing payment information.");
      setLoading(false);
      return;
    }

    // 1️⃣ Verify payment details
    fetch("http://localhost:5002/api/verify-payment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resourcePath }),
    })
      .then((res) => res.json())
      .then(async (data) => {
        if (!data.success) {
          setError("Payment verification failed.");
          setLoading(false);
          return;
        }

        // 2️⃣ Persist order to Firestore
        const orderId = data.transactionId;
        try {
          await setDoc(doc(db, "orders", orderId), {
            orderId,
            method: "hyperpay",
            amount: data.amount,
            paymentType: data.paymentType,
            cardBrand: data.cardBrand,
            customer: {
              name: data.customerName,
              email: data.customerEmail,
            },
            items: cartItems,
            billing: data.billing,
            createdAt: serverTimestamp(),
            status: "completed",
          });

          // 3️⃣ Reset checkout state & clear cart
          dispatch(resetCheckout());
          dispatch(clearCart());

          // 4️⃣ Navigate to order-details
          router.replace(`/order-details/${orderId}`);
        } catch (e) {
          console.error("Error saving order:", e);
          setError("Failed to save order data.");
          setLoading(false);
        }
      })
      .catch((e) => {
        console.error("Verification error:", e);
        setError("Payment verification request failed.");
        setLoading(false);
      });
  }, [params, dispatch, router, cartItems]);

  if (loading) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <p>Processing your order…</p>
      </div>
    );
  }

  return (
    <div className='min-h-screen flex flex-col items-center justify-center p-8'>
      <h1 className='text-2xl font-bold mb-4 text-red-600'>Error</h1>
      <p className='mb-4'>{error}</p>
      <button
        onClick={() => router.replace("/")}
        className='px-4 py-2 bg-blue-600 text-white rounded'
      >
        Back to Home
      </button>
    </div>
  );
}
