"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";

import {
  Command,
  CommandInput,
  CommandList,
  CommandItem,
  CommandGroup,
} from "../ui/command";

import { db } from "../../firebase/config";
import { getDocs, collection } from "firebase/firestore";

import { Search, Camera } from "react-feather";

const ProductSearch = () => {
  const [productQuery, setProductQuery] = useState("");
  const [productOptions, setProductOptions] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);

  const { t } = useTranslation();
  const router = useRouter();

  const normalize = (str) => {
    if (typeof str !== "string") return "";
    return str.toLowerCase().normalize("NFKD");
  };

  useEffect(() => {
    const fetchProducts = async () => {
      const snapshot = await getDocs(collection(db, "products"));
      const items = snapshot.docs.map((doc) => {
        const data = doc.data();
        const name =
          data.productName ||
          data.productName_en ||
          data.productName_ar ||
          "Unnamed Product";
        const thumbnail = data.mainImageUrl || "/placeholder-product.png";

        return {
          id: doc.id,
          name: typeof name === "string" ? name : String(name),
          thumbnail,
        };
      });

      setProductOptions(items);
      setFilteredProducts(items);
    };

    fetchProducts();
  }, []);

  useEffect(() => {
    if (productQuery === "") {
      setFilteredProducts(productOptions);
    } else {
      setFilteredProducts(
        productOptions.filter((item) =>
          normalize(item.name).includes(normalize(productQuery))
        )
      );
    }
  }, [productQuery, productOptions]);

  const handleSelect = (selectedValue) => {
    const selectedProduct = productOptions.find(
      (item) => item.name.toLowerCase() === selectedValue.toLowerCase()
    );
    if (selectedProduct?.id) {
      router.push(`/product/${selectedProduct.id}`);
    }
  };

  const handleSearch = () => {
    if (productQuery.trim() !== "") {
      const selectedProduct = productOptions.find((item) =>
        normalize(item.name).includes(normalize(productQuery.trim()))
      );
      if (selectedProduct?.id) {
        router.push(`/product/${selectedProduct.id}`);
      } else {
        router.push(`/search?query=${encodeURIComponent(productQuery.trim())}`);
      }
    }
  };

  return (
    <div className='relative w-full'>
      {/* Custom Sticky Navbar Search Layout */}
      <div className='flex items-center w-full border rounded-full overflow-hidden shadow-sm h-10 bg-white'>
        {/* Left Category (static) */}
        <div className='px-3 border-r text-gray-600 text-sm flex items-center gap-1 h-full'>
          {t("sticky.products")}
        </div>

        {/* Search Input */}
        <input
          type='text'
          placeholder={t("sticky.search_placeholder")}
          value={productQuery}
          onChange={(e) => setProductQuery(e.target.value)}
          className='flex-1 px-4 text-sm h-full focus:outline-none'
        />

        {/* Camera Button (dummy for now) */}
        <button className='px-3'>
          <Camera size={20} className='text-gray-500' />
        </button>

        {/* Search Button */}
        <button
          onClick={handleSearch}
          className='bg-primary hover:bg-green-700 text-white text-sm px-4 rounded-r-full flex items-center gap-1 h-full'
        >
          <Search size={16} />
          {t("sticky.research")}
        </button>
      </div>

      {/* Dropdown Results */}
      {productQuery && (
        <div className='absolute left-0 right-0 top-full mt-2 z-50'>
          <Command className='w-full bg-white border border-gray-200 shadow-md rounded-lg overflow-hidden'>
            <CommandInput
              value={productQuery}
              onValueChange={setProductQuery}
              placeholder={t("sticky.search_placeholder")}
              className='hidden'
            />
            <CommandList className='max-h-[400px] overflow-y-auto'>
              {filteredProducts.length > 0 ? (
                <CommandGroup heading={t("search.productsHeading")}>
                  {filteredProducts.map((product) => (
                    <CommandItem
                      key={product.id}
                      value={product.name}
                      onSelect={handleSelect}
                      className='flex items-center gap-4 px-4 py-3 min-h-[64px] cursor-pointer hover:bg-[#2c6449]/10 transition'
                    >
                      <img
                        src={product.thumbnail}
                        alt={product.name}
                        className='w-12 h-12 rounded object-cover flex-shrink-0'
                      />
                      <span className='text-base text-gray-700 truncate'>
                        {product.name}
                      </span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              ) : (
                <div className='flex flex-col items-center justify-center p-6 gap-2 text-center'>
                  <img
                    src='/no-results-search.svg'
                    alt='No results'
                    className='w-24 h-24 object-contain'
                  />
                  <p className='text-gray-500 text-sm'>
                    {t("search.noResults")}
                  </p>
                </div>
              )}
            </CommandList>
          </Command>
        </div>
      )}
    </div>
  );
};

export default ProductSearch;
