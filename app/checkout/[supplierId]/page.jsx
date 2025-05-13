// app/checkout/[supplierId]/page.jsx
"use client";

import React from "react";
import { useSelector } from "react-redux";
import { useParams } from "next/navigation";
import CheckoutForm from "@/components/checkout/CheckoutForm";

export default function CheckoutPage() {
  const { supplierId } = useParams();

  // Pull all cart items from Redux
  const cartItems = useSelector((state) => state.cart.items);

  // Filter to only this supplier’s items
  const items = cartItems.filter((i) => i.supplierId === supplierId);

  // Compute total (falling back to price * quantity if no subtotal)
  const total = items.reduce(
    (sum, i) => sum + (i.subtotal ?? i.price * i.quantity),
    0
  );

  return (
    <div className='max-w-6xl mx-auto p-6'>
      <h1 className='text-3xl font-bold mb-6'>Checkout</h1>
      <CheckoutForm supplierId={supplierId} items={items} total={total} />
    </div>
  );
}
