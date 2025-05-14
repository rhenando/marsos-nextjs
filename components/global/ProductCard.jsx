"use client";

import { memo, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { Eye, Mail, Heart } from "react-feather";
import { getAuth } from "firebase/auth";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore"; // ← import getDoc here
import Currency from "@/components/global/CurrencySymbol";
import { toast } from "sonner";
import { db } from "@/firebase/config";

const ProductCard = ({ product, locale, currencySymbol, formatNumber }) => {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const [isPending, startTransition] = useTransition();

  const priceRanges = product.priceRanges || [];
  const prices = priceRanges.map((r) => parseFloat(r.price));
  const lowestPrice = prices.length ? Math.min(...prices) : "N/A";
  const highestPrice = prices.length ? Math.max(...prices) : "N/A";
  const minOrder = priceRanges[0]?.minQty || "N/A";
  const mainImage = product.mainImageUrl || "https://via.placeholder.com/300";
  const category = product.category || t("uncategorized");

  const getLocalizedProductName = () => {
    const name = product.productName;
    if (typeof name === "string") return name;
    if (name && typeof name === "object") {
      return (
        name[i18n.language] || name.en || t("product_card.unnamed_product")
      );
    }
    return t("product_card.unnamed_product");
  };

  const handleViewProduct = () => {
    startTransition(() => {
      router.push(`/product/${product.id}`);
    });
  };

  const handleContactSupplier = async () => {
    const auth = getAuth();
    const currentUser = auth.currentUser;

    // Prevent supplier chatting with their own product
    if (currentUser && currentUser.uid === product.supplierId) {
      toast.error(t("product_card.cannot_chat_own"));
      return;
    }

    // Require login
    if (!currentUser) {
      toast.error(t("product_card.login_first"));
      return;
    }

    // Require valid supplier
    if (!product?.supplierId) {
      toast.error(t("product_card.no_supplier"));
      return;
    }

    const chatId = `${currentUser.uid}_${product.supplierId}_${product.id}`;
    const chatRef = doc(db, "productChats", chatId);
    const miniRef = doc(db, "miniProductsData", chatId);

    try {
      // 0️⃣ Check if chat already exists
      const existing = await getDoc(chatRef);
      if (existing.exists()) {
        // Navigate without re-creating
        router.push(`/chat/product/${chatId}`);
        return;
      }

      // 1️⃣ Create the chat thread (fresh write)
      await setDoc(chatRef, {
        buyerId: currentUser.uid,
        supplierId: product.supplierId,
        productId: product.id,
        participants: [currentUser.uid, product.supplierId],
        createdAt: serverTimestamp(),
      });

      // 2️⃣ Create a snapshot of the product (fresh write)
      await setDoc(miniRef, {
        originalProductId: product.id,
        productName: product.productName,
        mainImageUrl: product.mainImageUrl,
        priceRanges: product.priceRanges,
        supplierName: product.supplierName,
        category: product.category,
        snapshotAt: serverTimestamp(),
      });
    } catch (err) {
      console.error("Error initializing chat or snapshot:", err);
      toast.error(t("product_card.chat_create_failed"));
      return;
    }

    // 3️⃣ Navigate into the new chat
    router.push(`/chat/product/${chatId}`);
  };

  useEffect(() => {
    router.prefetch(`/product/${product.id}`);
  }, [product.id, router]);

  return (
    <div className='p-2 relative'>
      {isPending && (
        <div className='absolute inset-0 bg-white/70 flex items-center justify-center z-50'>
          <span className='text-[#2c6449] text-sm font-medium'>
            {t("product_card.loading")}...
          </span>
        </div>
      )}

      <div className='relative group bg-white border rounded-xl shadow hover:shadow-md transition-all flex flex-col overflow-hidden'>
        <div className='absolute top-2 right-2 z-10'>
          <Heart size={16} className='text-red-500' />
        </div>
        <div className='absolute top-2 left-2 bg-red-600 text-white text-xs font-semibold px-2 py-0.5 rounded shadow z-10'>
          {t("product_card.hot")}
        </div>
        <div
          className='relative aspect-[4/3] bg-white overflow-hidden border-b border-gray-200 cursor-pointer'
          onClick={handleViewProduct}
        >
          <img
            src={mainImage}
            alt={getLocalizedProductName()}
            className='w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 ease-in-out'
            loading='lazy'
          />
        </div>
        <div className='flex flex-col p-4 flex-1 bg-white'>
          <div className='flex-1'>
            <p className='text-xs text-gray-400 mb-1 capitalize'>{category}</p>
            <h3
              onClick={handleViewProduct}
              className='text-sm font-semibold text-gray-800 leading-snug hover:text-[#2c6449] cursor-pointer line-clamp-2 capitalize'
            >
              {getLocalizedProductName()}
            </h3>
            <p className='text-xs text-gray-500 mt-1 mb-2'>
              {t("product_card.supplier")}{" "}
              <span className='capitalize font-medium'>
                {product.supplierName || t("product_card.unknown")}
              </span>
            </p>

            {!isNaN(lowestPrice) && !isNaN(highestPrice) && lowestPrice > 0 ? (
              <p className='text-lg font-bold mb-1 capitalize'>
                <Currency amount={lowestPrice} /> –{" "}
                <Currency amount={highestPrice} />
              </p>
            ) : (
              <p className='text-sm italic text-[#2c6449] mb-1'>
                {t("product_card.negotiable")}
              </p>
            )}

            <p className='text-xs text-gray-500 capitalize'>
              {t("product_card.min_order", { minOrder })}
            </p>
          </div>
          <div className='flex gap-2 mt-4'>
            <button
              onClick={handleViewProduct}
              className='w-1/2 text-xs py-1.5 px-2 border border-[#2c6449] text-[#2c6449] font-medium rounded-full hover:bg-[#2c644910] transition capitalize flex items-center justify-center gap-1 whitespace-nowrap'
            >
              <Eye size={14} />
              {t("product_card.view_details")}
            </button>
            <button
              onClick={handleContactSupplier}
              className='w-1/2 text-xs py-1.5 px-2 border border-blue-600 text-blue-600 font-medium rounded-full hover:bg-blue-50 transition capitalize flex items-center justify-center gap-1 whitespace-nowrap'
            >
              <Mail size={14} />
              {t("product_card.contact_supplier")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default memo(ProductCard);
