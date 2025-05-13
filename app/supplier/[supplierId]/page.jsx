"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { FileText } from "lucide-react";

import { db } from "@/firebase/config";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
} from "firebase/firestore";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

import ProductCard from "@/components/global/ProductCard";

export default function SupplierProductsPage() {
  const { supplierId, supplierName } = useParams();
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language || "en";

  const [productData, setProductData] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedTab, setSelectedTab] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [supplierData, setSupplierData] = useState(null);

  const itemsPerPage = 12;

  // ─── 1) Fetch products ───────────────────────────────
  useEffect(() => {
    if (!supplierId) return;
    (async () => {
      const productsRef = collection(db, "products");
      const q = query(productsRef, where("supplierId", "==", supplierId));
      const snap = await getDocs(q);
      const prods = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setProductData(prods);
      setCategories([
        "All",
        ...new Set(prods.map((p) => p.category || "Uncategorized")),
      ]);
    })();
  }, [supplierId]);

  // ─── 2) Fetch supplier info ──────────────────────────
  useEffect(() => {
    if (!supplierId) return;
    (async () => {
      const ref = doc(db, "users", supplierId);
      const snap = await getDoc(ref);
      if (!snap.exists()) return;
      const d = snap.data();
      setSupplierData({
        id: snap.id,
        name: d.companyName || d.name,
        logoUrl: d.logoUrl,
        address: d.address,
        description: d.companyDescription,
        pdfUrl: d.pdfUrl,
      });
    })();
  }, [supplierId]);

  // ─── 3) Filter & paginate ───────────────────────────
  const filtered = productData.filter((p) => {
    const catOk = selectedTab === "All" || p.category === selectedTab;
    const name =
      typeof p.productName === "object"
        ? p.productName[currentLang]
        : p.productName;
    const textOk =
      !searchQuery || name?.toLowerCase().includes(searchQuery.toLowerCase());
    const priceOk =
      (!minPrice || p.price >= +minPrice) &&
      (!maxPrice || p.price <= +maxPrice);
    return catOk && textOk && priceOk;
  });

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginated = filtered.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const nextPage = () =>
    currentPage < totalPages && setCurrentPage((p) => p + 1);
  const prevPage = () => currentPage > 1 && setCurrentPage((p) => p - 1);

  return (
    <div className='max-w-6xl mx-auto px-4 py-6'>
      {/* Page Header */}
      <header className='mb-6 text-center sm:text-left'>
        <h2 className='text-2xl font-bold text-[#2c6449]'>
          {supplierData?.name ||
            supplierName ||
            t("supplier-products.moreFromSupplier")}
        </h2>
        <p className='text-gray-500 text-sm'>
          {t("supplier-products.subtitle")}
        </p>
      </header>

      {/* Supplier Banner */}
      <section className='flex items-center gap-4 bg-white p-4 rounded shadow-sm mb-8'>
        <img
          src={
            supplierData?.logoUrl ||
            "https://via.placeholder.com/60x60.png?text=Logo"
          }
          alt={supplierData?.name || "Logo"}
          className='w-24 h-24 rounded-full object-cover flex-shrink-0'
        />
        <div>
          <h3 className='text-xl font-bold text-[#2c6449]'>
            {supplierData?.name || supplierName || "Supplier Name"}
          </h3>
          <p className='text-gray-500 text-sm'>Verified Supplier</p>
          {supplierData?.address && (
            <p className='text-gray-700 text-sm mt-1'>{supplierData.address}</p>
          )}
          {supplierData?.description && (
            <p className='text-gray-600 text-sm mt-2'>
              {supplierData.description}
            </p>
          )}
        </div>

        {supplierData?.pdfUrl ? (
          <a
            href={supplierData.pdfUrl}
            target='_blank'
            rel='noopener noreferrer'
            className='ml-auto flex items-center space-x-1 text-red-600 hover:text-red-800'
          >
            <FileText className='w-5 h-5' />
            <span className='text-sm font-medium'>Download Brochure</span>
          </a>
        ) : (
          <div className='ml-auto flex items-center space-x-1 text-gray-400'>
            <FileText className='w-5 h-5' />
            <span className='text-sm font-medium'>
              No company profile added
            </span>
          </div>
        )}
      </section>

      {/* Main Grid */}
      <div className='grid grid-cols-1 lg:grid-cols-4 gap-8'>
        {/* Filters Sidebar */}
        <aside className='hidden lg:block'>
          <div className='bg-white p-4 rounded shadow-sm sticky top-24'>
            <h2 className='text-xl font-bold text-gray-800 mb-6'>
              {t("supplier-products.filters")}
            </h2>

            <div>
              <h3 className='text-lg font-semibold text-[#2c6449] mb-4'>
                {t("supplier-products.categories")}
              </h3>
              <div className='flex flex-col gap-2'>
                {categories.map((cat, i) => (
                  <Button
                    key={i}
                    variant={selectedTab === cat ? "default" : "outline"}
                    size='sm'
                    onClick={() => {
                      setSelectedTab(cat);
                      setCurrentPage(1);
                    }}
                  >
                    {cat}{" "}
                    <span className='ml-2 text-xs text-gray-500'>
                      (
                      {cat === "All"
                        ? productData.length
                        : productData.filter((p) => p.category === cat).length}
                      )
                    </span>
                  </Button>
                ))}
              </div>
            </div>

            <div className='mt-8'>
              <h3 className='text-lg font-semibold text-[#2c6449] mb-4'>
                {t("supplier-products.priceRange")}
              </h3>
              <div className='flex flex-col gap-2'>
                <Input
                  type='number'
                  placeholder={t("supplier-products.minPrice")}
                  value={minPrice}
                  onChange={(e) => {
                    setMinPrice(e.target.value);
                    setCurrentPage(1);
                  }}
                />
                <Input
                  type='number'
                  placeholder={t("supplier-products.maxPrice")}
                  value={maxPrice}
                  onChange={(e) => {
                    setMaxPrice(e.target.value);
                    setCurrentPage(1);
                  }}
                />
              </div>
            </div>
          </div>
        </aside>

        {/* Products & Search */}
        <main className='col-span-1 lg:col-span-3'>
          <div className='mb-8 flex justify-center sm:justify-start'>
            <Input
              type='text'
              placeholder={t("supplier-products.searchPlaceholder")}
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className='max-w-xs'
            />
          </div>

          <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'>
            {paginated.length > 0 ? (
              paginated.map((prod) => (
                <ProductCard
                  key={prod.id}
                  product={prod}
                  locale={currentLang}
                  currencySymbol='SAR'
                />
              ))
            ) : (
              <div className='col-span-full text-center text-gray-400 py-10'>
                {t("supplier-products.noProductsFound")}
              </div>
            )}
          </div>

          {/* Pagination */}
          <div className='mt-8 flex flex-col sm:flex-row items-center justify-between gap-4'>
            <Button
              variant='outline'
              onClick={prevPage}
              disabled={currentPage === 1}
            >
              {t("supplier-products.previous")}
            </Button>
            <span className='text-sm text-gray-600'>
              {t("supplier-products.page")} {currentPage}{" "}
              {t("supplier-products.of")} {totalPages}
            </span>
            <Button
              variant='outline'
              onClick={nextPage}
              disabled={currentPage === totalPages}
            >
              {t("supplier-products.next")}
            </Button>
          </div>
        </main>
      </div>

      {/* Back to Top (mobile only) */}
      <Button
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        className='fixed bottom-6 right-6 sm:hidden bg-[#2c6449] hover:bg-[#1b4533] text-white p-3 rounded-full shadow-lg'
      >
        ↑
      </Button>
    </div>
  );
}
