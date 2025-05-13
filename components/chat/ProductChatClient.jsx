"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { doc, getDoc, onSnapshot } from "firebase/firestore";
import { db } from "@/firebase/config";
import { useSelector } from "react-redux";
import ChatMessages from "@/components/chat/ChatMessages";
import MiniProductDetails from "@/components/chat/MiniProductDetails";
import { toast } from "sonner";

export default function ProductChatClient({ chatId }) {
  const router = useRouter();
  const { user: currentUser, loading: authLoading } = useSelector(
    (state) => state.auth
  );
  const [chatMeta, setChatMeta] = useState(null);
  const [miniProduct, setMiniProduct] = useState(null);
  const [messages, setMessages] = useState([]);
  const [notification, setNotification] = useState(null);

  // 1️⃣ Fetch chat metadata & subscribe to updates
  useEffect(() => {
    if (authLoading || !chatId || !currentUser) return;

    const chatRef = doc(db, "productChats", chatId);

    // Initial load
    getDoc(chatRef)
      .then((snap) => {
        if (!snap.exists()) {
          setNotification("Chat not found.");
        } else {
          const data = snap.data();
          setChatMeta(data);
          setMessages(data.messages || []);
        }
      })
      .catch((err) => {
        console.error("Failed to load chat:", err);
        toast.error("Could not load chat.");
      });

    // Real-time updates
    const unsub = onSnapshot(
      chatRef,
      (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          setChatMeta(data);
          setMessages(data.messages || []);
        }
      },
      (err) => {
        console.error("Chat subscription error:", err);
        toast.error("Chat connection error.");
      }
    );

    return () => unsub();
  }, [authLoading, chatId, currentUser]);

  // 2️⃣ Fetch mini-product details
  useEffect(() => {
    if (!chatId) return;
    const miniRef = doc(db, "miniProductsData", chatId);

    getDoc(miniRef)
      .then((snap) => {
        if (snap.exists()) setMiniProduct(snap.data());
        else setNotification("Product snapshot not found.");
      })
      .catch((err) => {
        console.error("Failed to load product snapshot:", err);
        toast.error("Could not load product info.");
      });
  }, [chatId]);

  // 3️⃣ Authorization: only buyer or supplier may view
  useEffect(() => {
    if (!authLoading && chatMeta && currentUser) {
      const isBuyer = currentUser.uid === chatMeta.buyerId;
      const isSupplier = currentUser.uid === chatMeta.supplierId;
      if (!isBuyer && !isSupplier) {
        toast.error("You’re not authorized to view this chat.");
        router.replace("/"); // bounce away
      }
    }
  }, [authLoading, chatMeta, currentUser, router]);

  // Loading state
  if (authLoading || !chatMeta || !miniProduct) {
    return <p className='p-6 text-center text-gray-500'>Loading…</p>;
  }

  const isBuyer = currentUser.uid === chatMeta.buyerId;

  return (
    <div className='grid grid-cols-1 md:grid-cols-3 gap-6 p-6 max-w-6xl mx-auto'>
      {/* Sidebar: product snapshot */}
      <aside className='col-span-1 border rounded p-4 bg-white space-y-4'>
        <h2 className='text-lg font-semibold text-[#2c6449]'>
          Product Details
        </h2>
        <MiniProductDetails data={miniProduct} />
      </aside>

      {/* Main chat area */}
      <section className='col-span-2 flex flex-col'>
        {notification && (
          <div className='mb-2 p-2 bg-red-100 text-red-700 text-sm rounded'>
            {notification}
          </div>
        )}
        <h2 className='text-lg font-semibold mb-3 text-[#2c6449]'>
          Chat with {isBuyer ? "Supplier" : "Buyer"}
        </h2>
        <div className='h-[480px] pb-2 border rounded-lg overflow-hidden'>
          <ChatMessages chatId={chatId} chatMeta={chatMeta} />
        </div>
      </section>
    </div>
  );
}
