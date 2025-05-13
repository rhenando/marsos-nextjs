"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useSelector, useDispatch } from "react-redux";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Currency from "@/components/global/CurrencySymbol";
import { toast } from "sonner";

import {
  updateField,
  setPaymentMethod,
  createSadadOrder,
  createHyperpayCheckout,
  resetCheckout,
} from "@/store/checkoutSlice";
import { clearSupplierCart } from "@/store/cartThunks";

import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible";
import { ChevronDown, ChevronUp } from "lucide-react";

export default function CheckoutForm({ supplierId }) {
  const router = useRouter();
  const dispatch = useDispatch();

  // Auth
  const user = useSelector((state) => state.auth.user);

  // Cart items per supplier
  const items = useSelector((state) =>
    state.cart.items.filter((i) => i.supplierId === supplierId)
  );

  // Totals
  const total = useMemo(
    () => items.reduce((sum, i) => sum + (i.subtotal || 0), 0),
    [items]
  );
  const shippingCost = useMemo(
    () => items.reduce((sum, i) => sum + (i.shippingCost || 0), 0),
    [items]
  );
  const vat = Number(((total + shippingCost) * 0.15).toFixed(2));
  const grandTotal = Number((total + shippingCost + vat).toFixed(2));

  // Checkout state
  const form = useSelector((state) => state.checkout.form);
  const paymentMethod = useSelector((state) => state.checkout.paymentMethod);
  const loading = useSelector((state) => state.checkout.loading);
  const error = useSelector((state) => state.checkout.error);
  const hyperpayId = useSelector((state) => state.checkout.hyperpayId);

  // Redirect if not logged in
  useEffect(() => {
    if (!user) {
      toast.error("Please log in");
      router.push("/user-login");
    }
  }, [user, router]);

  // Inject HyperPay widget script once we have a checkoutId
  useEffect(() => {
    if (!hyperpayId) return;

    // remove old scripts
    document.querySelectorAll("script[data-hp]").forEach((s) => s.remove());

    const script = document.createElement("script");
    script.src = `https://eu-test.oppwa.com/v1/paymentWidgets.js?checkoutId=${hyperpayId}`;
    script.setAttribute("data-hp", hyperpayId);
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document
        .querySelectorAll(`script[data-hp="${hyperpayId}"]`)
        .forEach((s) => s.remove());
    };
  }, [hyperpayId]);

  // Handle form field changes
  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    dispatch(
      updateField({
        name,
        value: type === "checkbox" ? checked : value,
      })
    );
  }

  // onPay: route to correct flow
  function onPay() {
    const base = { supplierId, items, shippingCost, vat, amount: grandTotal };

    if (paymentMethod === "hyperpay") {
      dispatch(createHyperpayCheckout({ amount: grandTotal, form }))
        .unwrap()
        .catch((e) => toast.error(e.toString()));
      return;
    }

    if (paymentMethod === "sadad") {
      dispatch(createSadadOrder({ base, form }))
        .unwrap()
        .then((billNumber) => {
          dispatch(resetCheckout());
          if (user.uid) {
            dispatch(clearSupplierCart({ userId: user.uid, supplierId }));
          }
          router.push(`/payment-details?orderId=${billNumber}`);
        })
        .catch((e) => toast.error(e.toString()));
      return;
    }

    toast.error("Please select a payment method");
  }

  return (
    <div className='grid md:grid-cols-2 gap-8'>
      {/* ─── LEFT COLUMN ───────────────────────────────────────── */}
      <div className='space-y-6'>
        <fieldset className='space-y-4 border p-4 rounded'>
          <legend className='font-medium'>Shipping address</legend>
          {/* First / Last */}
          <div className='grid grid-cols-2 gap-4'>
            <div>
              <label htmlFor='firstName' className='block text-sm'>
                First name*
              </label>
              <Input
                id='firstName'
                name='firstName'
                required
                value={form.firstName}
                onChange={handleChange}
              />
            </div>
            <div>
              <label htmlFor='lastName' className='block text-sm'>
                Last name*
              </label>
              <Input
                id='lastName'
                name='lastName'
                required
                value={form.lastName}
                onChange={handleChange}
              />
            </div>
          </div>
          {/* Phone */}
          <div>
            <label htmlFor='phone' className='block text-sm'>
              Phone*
            </label>
            <Input
              id='phone'
              name='phone'
              type='tel'
              required
              value={form.phone}
              onChange={handleChange}
            />
          </div>
          {/* Address */}
          <div>
            <label htmlFor='address' className='block text-sm'>
              Address*
            </label>
            <Input
              id='address'
              name='address'
              required
              value={form.address}
              onChange={handleChange}
            />
          </div>
          {/* Apt/Suite */}
          <div>
            <label htmlFor='suite' className='block text-sm'>
              Apt / Suite (opt.)
            </label>
            <Input
              id='suite'
              name='suite'
              value={form.suite}
              onChange={handleChange}
            />
          </div>
          {/* City / State / ZIP */}
          <div className='grid grid-cols-3 gap-4'>
            <div>
              <label htmlFor='city' className='block text-sm'>
                City*
              </label>
              <Input
                id='city'
                name='city'
                required
                value={form.city}
                onChange={handleChange}
              />
            </div>
            <div>
              <label htmlFor='state' className='block text-sm'>
                State*
              </label>
              <select
                id='state'
                name='state'
                required
                value={form.state}
                onChange={handleChange}
                className='border rounded px-2 py-1 w-full'
              >
                <option value=''>Select</option>
                <option>CA</option>
                <option>NY</option>
              </select>
            </div>
            <div>
              <label htmlFor='zip' className='block text-sm'>
                ZIP*
              </label>
              <Input
                id='zip'
                name='zip'
                required
                value={form.zip}
                onChange={handleChange}
              />
            </div>
          </div>
        </fieldset>

        {/* Payment Methods */}
        <div className='space-y-2'>
          {/* HyperPay */}
          <label
            htmlFor='pay-hyperpay'
            className={`flex items-center p-3 bg-white rounded-lg border transition ${
              paymentMethod === "hyperpay"
                ? "border-blue-600 shadow-sm"
                : "border-gray-200 hover:shadow-sm hover:border-gray-300"
            } cursor-pointer`}
            onClick={() => dispatch(setPaymentMethod("hyperpay"))}
          >
            <input
              type='radio'
              id='pay-hyperpay'
              name='payment'
              value='hyperpay'
              checked={paymentMethod === "hyperpay"}
              onChange={() => dispatch(setPaymentMethod("hyperpay"))}
              className='sr-only'
            />
            <div className='flex-1'>
              <p className='text-base font-semibold'>Debit / Credit Card</p>
            </div>
            <img src='/visa.png' alt='Visa' className='h-8 w-auto ml-2' />
            <img
              src='/master.png'
              alt='Mastercard'
              className='h-6 w-auto ml-2'
            />
            <img src='/mada.png' alt='Mada' className='h-8 w-auto ml-2' />
          </label>

          {/* in CheckoutForm.jsx */}
          {paymentMethod === "hyperpay" && (
            <form
              className='paymentWidgets mt-2 w-full'
              action={`http://localhost:5002/api/payment-status?userId=${user.uid}&supplierId=${supplierId}`}
              data-brands='VISA MASTER MADA'
              data-shopper-result-url={`http://localhost:3000/payment-success`}
              crossOrigin='anonymous'
              integrity='sha384-<your-hash>'
            />
          )}

          {/* Sadad */}
          <label
            htmlFor='pay-sadad'
            className={`flex items-center p-3 bg-white rounded-lg border transition ${
              paymentMethod === "sadad"
                ? "border-blue-600 shadow-sm"
                : "border-gray-200 hover:shadow-sm hover:border-gray-300"
            } cursor-pointer`}
            onClick={() => dispatch(setPaymentMethod("sadad"))}
          >
            <input
              type='radio'
              id='pay-sadad'
              name='payment'
              value='sadad'
              checked={paymentMethod === "sadad"}
              onChange={() => dispatch(setPaymentMethod("sadad"))}
              className='sr-only'
            />
            <div className='flex-1'>
              <p className='text-base font-semibold'>Sadad</p>
            </div>
            <img src='/sadad.png' alt='Sadad' className='h-8 w-auto ml-2' />
          </label>

          {/* Wallet */}
          <Collapsible
            open={paymentMethod.startsWith("wallet")}
            onOpenChange={(open) =>
              open && dispatch(setPaymentMethod("wallet"))
            }
          >
            <div
              className={`border rounded-lg transition ${
                paymentMethod.startsWith("wallet")
                  ? "border-blue-600 shadow-sm"
                  : "border-gray-200 hover:border-gray-300 hover:shadow-sm"
              }`}
            >
              <CollapsibleTrigger asChild>
                <div
                  className='flex items-center justify-between p-3 bg-white rounded-lg cursor-pointer border-gray-200 hover:border-gray-300 hover:shadow-sm transition'
                  onClick={() => dispatch(setPaymentMethod("wallet"))}
                >
                  <span className='text-base font-semibold'>
                    Digital Wallet
                  </span>
                  <div className='flex items-center gap-2'>
                    <img
                      src='/applepay.png'
                      alt='Apple Pay'
                      className='h-8 w-auto'
                    />
                    <img
                      src='/googlepay.jpeg'
                      alt='Google Pay'
                      className='h-5 w-auto'
                    />
                    {paymentMethod.startsWith("wallet") ? (
                      <ChevronUp className='h-4 w-4 text-gray-600' />
                    ) : (
                      <ChevronDown className='h-4 w-4 text-gray-600' />
                    )}
                  </div>
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className='border-t border-gray-200'>
                  {[
                    {
                      key: "applepay",
                      label: "Apple Pay",
                      icon: "/applepay.png",
                    },
                    {
                      key: "googlepay",
                      label: "Google Pay",
                      icon: "/googlepay.jpeg",
                    },
                  ].map(({ key, label, icon }) => (
                    <label
                      key={key}
                      className={`flex items-center p-2 cursor-pointer ${
                        paymentMethod === key
                          ? "bg-gray-50"
                          : "hover:bg-gray-50"
                      }`}
                      onClick={() => dispatch(setPaymentMethod(key))}
                    >
                      <input
                        type='radio'
                        name='payment'
                        value={key}
                        checked={paymentMethod === key}
                        onChange={() => dispatch(setPaymentMethod(key))}
                        className='sr-only'
                      />
                      <img src={icon} alt={label} className='h-5 w-auto mr-2' />
                      <span className='text-sm font-medium'>{label}</span>
                    </label>
                  ))}
                </div>
              </CollapsibleContent>
            </div>
          </Collapsible>

          {error && <p className='text-red-600 text-sm mt-1'>{error}</p>}
        </div>
      </div>

      {/* ─── RIGHT COLUMN ──────────────────────────────────────── */}
      <div className='border p-6 rounded bg-gray-50 space-y-4'>
        <h2 className='text-xl font-semibold text-center'>Order summary</h2>
        {items.map((i) => (
          <div key={i.id} className='flex justify-between text-sm'>
            <span>
              {i.productName} × {i.quantity}
            </span>
            <Currency amount={i.subtotal} />
          </div>
        ))}
        <div className='border-t pt-4 space-y-2 text-sm'>
          <div className='flex justify-between'>
            <span>Subtotal</span>
            <Currency amount={total} />
          </div>
          <div className='flex justify-between'>
            <span>Shipping</span>
            <Currency amount={shippingCost} />
          </div>
          <div className='flex justify-between'>
            <span>VAT (15%)</span>
            <Currency amount={vat} />
          </div>
        </div>
        <div className='border-t pt-4 flex justify-between font-semibold text-lg'>
          <span>Total</span> <Currency amount={grandTotal} />
        </div>
        <Button onClick={onPay} disabled={loading} className='w-full mt-4'>
          {loading ? "Processing…" : "Continue to Payment"}
        </Button>
        {error && <p className='text-red-600 mt-2'>{error}</p>}
      </div>
    </div>
  );
}
