import React, { useEffect, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../../firebase/config";

const chatCollections = ["productChats", "cartChats", "orderChats", "rfqChats"];

const AdminMessages = () => {
  const [allMessages, setAllMessages] = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const unsubscribes = [];

    const subscribeToChats = () => {
      chatCollections.forEach((coll) => {
        const unsub = onSnapshot(collection(db, coll), (snap) => {
          setAllMessages((prevChats) => {
            const filtered = prevChats.filter((chat) => chat.type !== coll);
            const updated = snap.docs.map((doc) => ({
              ...doc.data(),
              id: doc.id,
              type: coll,
            }));

            const combined = [...filtered, ...updated];

            const sorted = combined.sort((a, b) => {
              const aLast = a.messages?.[a.messages.length - 1]?.timestamp;
              const bLast = b.messages?.[b.messages.length - 1]?.timestamp;

              const aTime = aLast ? new Date(aLast).getTime() : 0;
              const bTime = bLast ? new Date(bLast).getTime() : 0;

              return bTime - aTime;
            });

            return sorted;
          });
        });

        unsubscribes.push(unsub);
      });
    };

    subscribeToChats();

    return () => {
      unsubscribes.forEach((unsub) => unsub());
    };
  }, []);

  // Apply search filter
  const filteredMessages = allMessages.filter((chat) => {
    const lower = searchQuery.toLowerCase();
    return (
      chat.buyerName?.toLowerCase().includes(lower) ||
      chat.supplierName?.toLowerCase().includes(lower) ||
      chat.type?.toLowerCase().includes(lower)
    );
  });

  return (
    <div className='p-6'>
      <h2 className='text-2xl font-bold mb-4 text-[#2c6449]'>Messages</h2>

      {/* 🔍 Search Filter */}
      <input
        type='text'
        placeholder='Search by buyer, supplier, or chat type...'
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className='mb-4 p-2 border border-gray-300 rounded w-full'
      />

      {filteredMessages.length === 0 ? (
        <p>No messages found.</p>
      ) : (
        <div className='space-y-4'>
          {filteredMessages.map((chat, idx) => {
            const lastMsg = chat.messages?.[chat.messages.length - 1];
            const isUnanswered =
              lastMsg?.senderId === chat.buyerId && chat.messages?.length > 0;

            return (
              <div
                key={idx}
                className={`border rounded p-4 cursor-pointer transition hover:bg-gray-50 ${
                  isUnanswered ? "border-red-500 bg-red-50" : ""
                }`}
                onClick={() =>
                  setActiveChatId(activeChatId === chat.id ? null : chat.id)
                }
              >
                <div className='flex justify-between items-start'>
                  <div>
                    <p className='text-sm italic text-[#2c6449] font-medium'>
                      Chat Type:{" "}
                      {{
                        productChats: "Product Chat Query",
                        cartChats: "Cart Inquiry",
                        orderChats: "Order Message",
                        rfqChats: "Quotation Request",
                      }[chat.type] || "General"}
                    </p>

                    <p className='font-semibold text-gray-800'>
                      {chat.buyerName || "Buyer"} →{" "}
                      {chat.supplierName || "Supplier"}
                    </p>

                    {chat.messages?.length > 0 && (
                      <p className='text-xs text-red-500 mt-1'>
                        Last message:{" "}
                        {(() => {
                          const lastTime = lastMsg?.timestamp
                            ? new Date(lastMsg.timestamp)
                            : null;

                          if (!lastTime) return "—";

                          const diffMs = new Date() - lastTime;
                          const diffMins = Math.floor(diffMs / 60000);
                          const diffHours = Math.floor(diffMins / 60);
                          const diffDays = Math.floor(diffHours / 24);

                          if (diffDays > 0) return `${diffDays} day(s) ago`;
                          if (diffHours > 0) return `${diffHours} hour(s) ago`;
                          if (diffMins > 0) return `${diffMins} minute(s) ago`;
                          return "just now";
                        })()}
                      </p>
                    )}
                  </div>

                  <span className='text-sm text-gray-400 text-right'>
                    {chat.createdAt?.toDate
                      ? chat.createdAt.toDate().toLocaleString()
                      : typeof chat.createdAt === "string"
                      ? new Date(chat.createdAt).toLocaleString()
                      : "—"}
                  </span>
                </div>

                {activeChatId === chat.id && chat.messages?.length > 0 && (
                  <div className='mt-4 space-y-2 bg-gray-50 p-3 rounded'>
                    {chat.messages.map((msg, i) => (
                      <div key={i} className='border-b pb-2 mb-2'>
                        <div className='flex justify-between text-xs text-gray-500'>
                          <span>{msg.senderName || msg.senderId}</span>
                          <span>
                            {msg.timestamp
                              ? new Date(msg.timestamp).toLocaleString()
                              : "—"}
                          </span>
                        </div>
                        <p className='text-sm text-gray-800'>{msg.message}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AdminMessages;
