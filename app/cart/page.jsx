"use client";

import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { db } from "@/firebase/config";
import {
  collection,
  onSnapshot,
  doc,
  setDoc,
  deleteDoc,
} from "firebase/firestore";

import { Button } from "@/components/ui/button";
import Currency from "@/components/global/CurrencySymbol";
import { useCartNegotiation } from "@/hooks/useCartNegotiation";
import { usePlaceOrder } from "@/hooks/usePlaceOrder";

import { setCartItems, clearCartItems } from "@/store/cartSlice";

export default function CartPage() {
  const dispatch = useDispatch();
  const router = useRouter();
  const { startNegotiation } = useCartNegotiation();
  const { placeOrder, isPlacing } = usePlaceOrder();

  // Pull user from Redux instead of useAuth
  const user = useSelector((state) => state.auth.user);
  const userId = user?.uid;

  // Cart items & count from Redux
  const cartItems = useSelector((state) => state.cart.items);
  const cartItemCount = useSelector((state) => state.cart.count);

  // Local grouping state
  const [groupedItems, setGroupedItems] = useState({});

  // ─── Subscribe to Firestore & sync into Redux ─────────────────────────
  useEffect(() => {
    if (!userId) return;

    const q = collection(db, "carts", userId, "items");
    const unsub = onSnapshot(q, (snap) => {
      const items = snap.docs.map((d) => {
        const data = d.data();
        // normalize Timestamp
        const createdAt = data.createdAt?.toMillis?.() ?? data.createdAt;
        return {
          id: d.id,
          ...data,
          createdAt,
        };
      });
      dispatch(setCartItems(items));
    });

    return () => unsub();
  }, [userId, dispatch]);

  // ─── Group items by supplier ──────────────────────────────────────────
  useEffect(() => {
    const grouped = cartItems.reduce((acc, item) => {
      const key = item.supplierId || "unknown";
      (acc[key] ||= []).push(item);
      return acc;
    }, {});
    setGroupedItems(grouped);
  }, [cartItems]);

  // ─── Handlers ─────────────────────────────────────────────────────────
  const handleRemove = async (itemId) => {
    if (!userId) return;
    await deleteDoc(doc(db, "carts", userId, "items", itemId));
  };

  const handleQuantityChange = async (itemId, value) => {
    if (value < 1) {
      toast.error("Quantity must be at least 1");
      return;
    }
    const ref = doc(db, "carts", userId, "items", itemId);
    await setDoc(
      ref,
      {
        quantity: value,
        subtotal: value * cartItems.find((i) => i.id === itemId).price,
      },
      { merge: true }
    );
  };

  const handleClearCart = () => {
    if (!userId) return;
    dispatch(clearCartItems());
  };

  // ─── Render ────────────────────────────────────────────────────────────
  if (cartItemCount === 0) {
    return (
      <div className='text-center py-12'>
        <h2 className='text-xl font-semibold text-gray-600'>
          Your cart is empty 🛒
        </h2>
        <p className='mt-2 text-gray-500'>
          Explore our products and add some items!
        </p>
        <Button
          className='mt-4 bg-[#2c6449] text-white text-sm py-2 px-3'
          onClick={() => router.push("/products")}
        >
          Browse Products
        </Button>
      </div>
    );
  }

  return (
    <div id='cart-page' className='max-w-6xl mx-auto px-4 py-10'>
      <h1 className='text-2xl font-bold mb-6 text-[#2c6449]'>Your Cart</h1>

      {Object.entries(groupedItems).map(([supplierId, items]) => {
        const supplierName = items[0]?.supplierName || "Unknown Supplier";
        const subtotal = items.reduce((sum, i) => sum + (i.subtotal || 0), 0);
        const shipping = items.reduce(
          (sum, i) => sum + (i.shippingCost || 0),
          0
        );
        const vat = Number(((subtotal + shipping) * 0.15).toFixed(2));
        const total = Number((subtotal + shipping + vat).toFixed(2));

        return (
          <div
            key={supplierId}
            className='border rounded-xl shadow-sm mb-10 p-6 bg-white'
          >
            <h2 className='text-lg font-semibold mb-4 text-[#2c6449]'>
              Supplier: {supplierName}
            </h2>

            <div className='space-y-6'>
              {items.map((item) => (
                <div
                  key={item.id}
                  className='flex flex-col md:flex-row gap-4 items-center border-b pb-4'
                >
                  <img
                    src={item.productImage || "https://via.placeholder.com/100"}
                    alt={item.productName}
                    className='w-24 h-24 object-cover rounded border'
                  />
                  <div className='flex-1'>
                    <h3 className='font-semibold text-gray-800'>
                      {item.productName}
                    </h3>
                    <div className='flex gap-2 items-center text-sm text-gray-600'>
                      <label>Qty:</label>
                      <input
                        type='number'
                        min={1}
                        value={item.quantity}
                        onChange={(e) =>
                          handleQuantityChange(item.id, +e.target.value)
                        }
                        className='border px-2 py-1 rounded w-18'
                      />
                      <span>×</span>
                      <Currency amount={item.price} />
                    </div>
                    <p className='text-sm text-gray-500'>
                      Size: {item.size || "—"} | Color: {item.color || "—"} |{" "}
                      Location: {item.deliveryLocation}
                    </p>
                    <p className='text-sm font-medium text-[#2c6449] mt-1'>
                      Subtotal: <Currency amount={item.subtotal} />
                    </p>
                  </div>
                  <Button
                    variant='destructive'
                    className='text-sm py-2 px-3'
                    onClick={() => handleRemove(item.id)}
                  >
                    Remove
                  </Button>
                </div>
              ))}
            </div>

            <div className='flex flex-col md:flex-row justify-between items-start md:items-center mt-6 pt-4 border-t gap-4'>
              <div className='text-sm text-gray-700 w-full md:w-auto'>
                <div className='grid grid-cols-2 gap-y-1 gap-x-6'>
                  <span className='font-medium'>Subtotal:</span>
                  <span>
                    <Currency amount={subtotal} />
                  </span>
                  <span className='font-medium'>Shipping:</span>
                  <span>
                    <Currency amount={shipping} />
                  </span>
                  <span className='font-medium'>VAT (15%):</span>
                  <span>
                    <Currency amount={vat} />
                  </span>
                  <span className='font-semibold text-lg'>Total:</span>
                  <span className='font-semibold text-lg text-[#2c6449]'>
                    <Currency amount={total} />
                  </span>
                </div>
              </div>

              <div className='flex flex-col md:flex-row gap-2 w-full md:w-auto'>
                <Button
                  onClick={() => router.push(`/checkout/${supplierId}`)}
                  className='bg-[#2c6449] text-white text-sm py-2 px-3 w-full md:w-auto'
                >
                  Proceed to Checkout
                </Button>

                <Button
                  variant='outline'
                  className='text-[#2c6449] border-[#2c6449] text-sm py-2 px-3 w-full md:w-auto'
                  onClick={() => startNegotiation(supplierId, items)}
                >
                  Contact Supplier to Negotiate
                </Button>

                <Button
                  variant='outline'
                  className='text-sm py-2 px-3 w-full md:w-auto'
                  onClick={() => router.push(`/checkout/${supplierId}`)}
                >
                  Review Order
                </Button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
