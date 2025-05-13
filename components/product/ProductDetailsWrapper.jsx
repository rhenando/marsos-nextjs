"use client";

import { useEffect, useState } from "react";
import ProductDetails from "./ProductDetails";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/firebase/config";

// 🧼 Recursive conversion function
function convertTimestamps(obj) {
  if (obj === null || typeof obj !== "object") return obj;

  if (typeof obj.toMillis === "function") {
    return obj.toMillis();
  }

  if (Array.isArray(obj)) {
    return obj.map(convertTimestamps);
  }

  const newObj = {};
  for (const key in obj) {
    newObj[key] = convertTimestamps(obj[key]);
  }

  return newObj;
}

export default function ProductDetailsWrapper({ id }) {
  const [product, setProduct] = useState(null);

  useEffect(() => {
    async function fetchProduct() {
      const docRef = doc(db, "products", id);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const rawData = docSnap.data();
        const cleanData = convertTimestamps(rawData);

        setProduct({
          id,
          ...cleanData,
        });
      }
    }

    if (id) fetchProduct();
  }, [id]);

  if (!product) return <p className='text-center'>Loading product...</p>;

  return <ProductDetails product={product} />;
}
