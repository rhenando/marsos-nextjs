// app/payment-failed/page.jsx
"use client";

import { useSearchParams } from "next/navigation";

export default function PaymentFailedPage() {
  const params = useSearchParams();
  const error = params.get("error");
  const message = params.get("message");

  return (
    <div className='min-h-screen flex flex-col items-center justify-center p-8 bg-gray-50'>
      <h1 className='text-4xl font-bold text-red-600 mb-4'>
        ❌ Payment Failed
      </h1>
      <p className='text-lg mb-2'>Error code: {error}</p>
      <p className='text-md mb-6'>{message}</p>
      <a
        href='/checkout'
        className='px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition'
      >
        Try Again
      </a>
    </div>
  );
}
