"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation"; // ✅ FIX: Use this in client components
import { useTranslation } from "react-i18next";
import { db } from "@/firebase/config";
import { collection, getDocs } from "firebase/firestore";
import ProductCard from "@/components/global/ProductCard";
import { Skeleton } from "@/components/ui/skeleton";

// ✅ Slugify utility
const slugify = (text) =>
  text
    .toString()
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\w\-ا-ي]+/g, "")
    .replace(/--+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "");

const CategoryPage = () => {
  const params = useParams(); // ✅ NOW required in Next.js 15+
  const slug = params?.slug;

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categoryName, setCategoryName] = useState("");

  const { t, i18n } = useTranslation();
  const locale = i18n.language;
  const currencySymbol = locale === "ar" ? "ر.س." : "SR ";

  const formatNumber = (number) =>
    new Intl.NumberFormat(locale, { minimumFractionDigits: 2 }).format(number);

  useEffect(() => {
    if (!slug) return;

    const fetchProducts = async () => {
      try {
        const snapshot = await getDocs(collection(db, "products"));
        const allProducts = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        const matched = allProducts.filter((p) => {
          const categorySlug = p.category ? slugify(p.category) : "";
          return categorySlug === slug;
        });

        if (matched.length > 0) {
          setCategoryName(matched[0].category);
        }

        setProducts(matched);
        setLoading(false);
      } catch (err) {
        console.error("Failed to fetch category:", err);
        setLoading(false);
      }
    };

    fetchProducts();
  }, [slug]);

  const readableCategory = categoryName || slug?.replace(/-/g, " ");

  return (
    <div className='container mx-auto px-4 py-6'>
      <h2 className='text-center text-2xl font-semibold text-[#2c6449] mb-6'>
        {readableCategory} {t("category.category")}
      </h2>

      {loading ? (
        <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4'>
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} className='h-48 w-full rounded-md' />
          ))}
        </div>
      ) : products.length > 0 ? (
        <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4'>
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              locale={locale}
              currencySymbol={currencySymbol}
              formatNumber={formatNumber}
            />
          ))}
        </div>
      ) : (
        <p className='text-center text-gray-500'>
          {t("category.noProductsFound")}
        </p>
      )}
    </div>
  );
};

export default CategoryPage;
