import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { db } from "@/firebase/config";
import { setDoc, doc, serverTimestamp } from "firebase/firestore";
import axios from "axios";
import { clearSupplierCart } from "@/store/cartThunks";

// two separate bases for Sadad/GoPay and HyperPay/debit-credit
const SADAD_API_BASE =
  process.env.NEXT_PUBLIC_SADAD_URL || "https://gopay-api.onrender.com";

// <-- updated to point at your Render URL by default
const HYPERPAY_API_BASE =
  process.env.NEXT_PUBLIC_HYPERPAY_URL || "https://hyperpay-api.onrender.com";

// 1️⃣ Thunk for HyperPay checkout
export const createHyperpayCheckout = createAsyncThunk(
  "checkout/createHyperpayCheckout",
  async ({ amount, form }, { rejectWithValue }) => {
    try {
      const res = await fetch(`${HYPERPAY_API_BASE}/api/create-checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount,
          email: form.email || form.phone || "buyer@example.com",
          name: `${form.firstName} ${form.lastName}`.trim(),
          street: form.address,
          city: form.city,
          state: form.state,
          country: form.country || "SA",
          postcode: form.zip,
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      return data.checkoutId;
    } catch (err) {
      return rejectWithValue(err.message || err.toString());
    }
  }
);

// 2️⃣ Existing SADAD thunk
export const createSadadOrder = createAsyncThunk(
  "checkout/createSadadOrder",
  async ({ base, form }, { rejectWithValue }) => {
    try {
      const res = await fetch(`${SADAD_API_BASE}/api/create-invoice`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...base,
          ...form,
          billNumber: Date.now().toString(),
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const invoice = await res.json();

      // persist to Firestore
      await setDoc(doc(db, "orders", invoice.billNumber), {
        orderId: invoice.billNumber,
        method: "sadad",
        ...base,
        customer: {
          uid: form.uid,
          name: `${form.firstName} ${form.lastName}`.trim(),
          phone: form.phone,
          address: {
            address: form.address,
            suite: form.suite,
            city: form.city,
            state: form.state,
            zip: form.zip,
          },
        },
        sadadNumber: invoice.billNumber,
        createdAt: serverTimestamp(),
        status: "pending",
      });

      return invoice.billNumber;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

// 3️⃣ New thunk: verify HyperPay, persist order, clear cart & checkout
export const verifyHyperpayPayment = createAsyncThunk(
  "checkout/verifyHyperpayPayment",
  async (
    { resourcePath, cartItems, form, supplierId, userId },
    { rejectWithValue, dispatch }
  ) => {
    try {
      const res = await axios.post(`${HYPERPAY_API_BASE}/api/verify-payment`, {
        resourcePath,
      });
      const data = res.data;
      if (!data.success) throw new Error(data.error || "Verification failed");

      const orderId = data.transactionId;
      // persist to Firestore
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

      // reset checkout and clear cart
      dispatch(resetCheckout());
      if (userId) dispatch(clearSupplierCart({ userId, supplierId }));

      return orderId;
    } catch (err) {
      return rejectWithValue(err instanceof Error ? err.message : String(err));
    }
  }
);

const initialForm = {
  firstName: "",
  lastName: "",
  phone: "",
  email: "",
  address: "",
  suite: "",
  city: "",
  state: "",
  zip: "",
  isGift: false,
  uid: "",
};

const slice = createSlice({
  name: "checkout",
  initialState: {
    form: { ...initialForm },
    paymentMethod: "hyperpay",
    loading: false,
    error: null,
    orderId: null,
    hyperpayId: null,
    verifying: false,
    verifyError: null,
    verifiedOrderId: null,
  },
  reducers: {
    updateField(state, { payload: { name, value } }) {
      state.form[name] = value;
    },
    setPaymentMethod(state, { payload }) {
      state.paymentMethod = payload;
    },
    resetCheckout(state) {
      state.form = { ...initialForm };
      state.paymentMethod = "hyperpay";
      state.loading = false;
      state.error = null;
      state.orderId = null;
      state.hyperpayId = null;
      state.verifying = false;
      state.verifyError = null;
      state.verifiedOrderId = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // HyperPay checkout
      .addCase(createHyperpayCheckout.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createHyperpayCheckout.fulfilled, (state, action) => {
        state.loading = false;
        state.hyperpayId = action.payload;
      })
      .addCase(createHyperpayCheckout.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Sadad
      .addCase(createSadadOrder.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createSadadOrder.fulfilled, (state, action) => {
        state.loading = false;
        state.orderId = action.payload;
      })
      .addCase(createSadadOrder.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Verify HyperPay payment
      .addCase(verifyHyperpayPayment.pending, (state) => {
        state.verifying = true;
        state.verifyError = null;
        state.verifiedOrderId = null;
      })
      .addCase(verifyHyperpayPayment.fulfilled, (state, action) => {
        state.verifying = false;
        state.verifiedOrderId = action.payload;
      })
      .addCase(verifyHyperpayPayment.rejected, (state, action) => {
        state.verifying = false;
        state.verifyError = action.payload;
      });
  },
});

export const { updateField, setPaymentMethod, resetCheckout } = slice.actions;
export default slice.reducer;
