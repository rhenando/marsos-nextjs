// app/RootProvider.jsx
"use client";

import React, { useEffect } from "react";
import dynamic from "next/dynamic";
import { Provider, useDispatch, useSelector } from "react-redux";
import { store } from "@/store/store";
import "../i18n";

import { getAuth, onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { setUser, clearUser } from "@/store/authSlice";
import { db } from "@/firebase/config";

import { fetchCart } from "@/store/cartSlice";
import { LoadingProvider } from "@/context/LoadingContext";
import { LocalizationProvider } from "@/context/LocalizationContext";

import GlobalLoading from "@/components/global/GlobalLoading";
const Header = dynamic(() => import("@/components/header/Header"), {
  ssr: false,
});
const StickySearchBar = dynamic(
  () => import("@/components/header/StickySearchBar"),
  { ssr: false }
);
const Footer = dynamic(() => import("@/components/global/Footer"), {
  ssr: false,
});

import RfqModal from "@/components/rfq/Rfq";
import { Toaster } from "@/components/ui/sonner";

import Lenis from "@studio-freight/lenis";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2 } from "lucide-react";

// 1️⃣ Auth watcher sets up a single onAuthStateChanged listener
function AuthWatcher({ children }) {
  const dispatch = useDispatch();

  useEffect(() => {
    const auth = getAuth();

    // set loading true at start
    dispatch(clearUser());
    dispatch({ type: "auth/watchAuthState/pending" });

    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        const userDoc = await getDoc(doc(db, "users", fbUser.uid));
        const profile = userDoc.exists() ? userDoc.data() : {};

        dispatch(
          setUser({
            uid: fbUser.uid,
            email: fbUser.email,
            displayName:
              profile.displayName ?? profile.name ?? fbUser.displayName ?? "",
            role: profile.role ?? "",
            createdAt: profile.createdAt?.toMillis?.() ?? null,
          })
        );
      } else {
        dispatch(clearUser());
      }
    });

    return () => unsubscribe();
  }, [dispatch]);

  return children;
}

// 1.5️⃣ Reload cart whenever we get a non-null user
function CartRefresher({ children }) {
  const dispatch = useDispatch();
  const { user, loading: authLoading } = useSelector((s) => s.auth);

  useEffect(() => {
    if (!authLoading && user?.uid) {
      dispatch(fetchCart(user.uid));
    }
  }, [authLoading, user, dispatch]);

  return children;
}

// 2️⃣ Layout reads loading from Redux
function AppLayout({ children }) {
  const loading = useSelector((state) => state.auth.loading);
  const [showSticky, setShowSticky] = React.useState(false);
  const [showRFQModal, setShowRFQModal] = React.useState(false);

  useEffect(() => {
    const onScroll = () => setShowSticky(window.scrollY > 100);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smooth: true,
      smoothTouch: false,
    });
    const raf = (time) => {
      lenis.raf(time);
      requestAnimationFrame(raf);
    };
    requestAnimationFrame(raf);
    return () => lenis.destroy();
  }, []);

  if (loading) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <Loader2 className='animate-spin' size={32} />
      </div>
    );
  }

  return (
    <>
      <AnimatePresence mode='wait'>
        {!showSticky ? (
          <motion.div
            key='header'
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className='z-[9999]'
          >
            <Header setShowRFQModal={setShowRFQModal} />
          </motion.div>
        ) : (
          <motion.div
            key='sticky'
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className='sticky top-0 z-[9999]'
          >
            <StickySearchBar />
          </motion.div>
        )}
      </AnimatePresence>

      <div>{children}</div>

      <Footer />

      <RfqModal show={showRFQModal} onClose={() => setShowRFQModal(false)} />

      <Toaster richColors position='top-center' containerStyle={{ top: 150 }} />
    </>
  );
}

// 3️⃣ Wrap entire app under Redux
export default function RootProvider({ children }) {
  return (
    <Provider store={store}>
      <AuthWatcher>
        <CartRefresher>
          <LoadingProvider>
            <LocalizationProvider>
              <GlobalLoading />
              <AppLayout>{children}</AppLayout>
            </LocalizationProvider>
          </LoadingProvider>
        </CartRefresher>
      </AuthWatcher>
    </Provider>
  );
}
