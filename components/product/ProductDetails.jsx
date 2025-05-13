// ✅ ProductDetails.jsx for Next.js 15 App Router
"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Thumbs, Autoplay } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/thumbs";
import Currency from "../global/CurrencySymbol";
import { toast } from "react-toastify";
import { useTranslation } from "react-i18next";

import { getAuth } from "firebase/auth";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { v4 as uuidv4 } from "uuid";
import { db } from "../../firebase/config";

const ProductDetails = ({ product }) => {
  const router = useRouter();
  const id = product.id;

  const [activeTab, setActiveTab] = useState("description");
  const [thumbsSwiper, setThumbsSwiper] = useState(null);
  const [quantity, setQuantity] = useState("");
  const [selectedColor, setSelectedColor] = useState("");
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("");
  const [shippingCost, setShippingCost] = useState("0.00");
  const [error, setError] = useState({
    size: "",
    color: "",
    location: "",
    quantity: "",
  });
  const [currentUserId, setCurrentUserId] = useState(null);

  const { i18n } = useTranslation();

  useEffect(() => {
    const auth = getAuth();
    const user = auth.currentUser;
    if (user) setCurrentUserId(user.uid);
  }, []);

  const isOwner = currentUserId && currentUserId === product?.supplierId;

  const handleContactSupplier = () => {
    const auth = getAuth();
    const currentUser = auth.currentUser;

    if (!currentUser)
      return toast.error("Please log in to contact the supplier");
    if (!product?.supplierId) return toast.error("Supplier ID is missing.");

    const newChatId = `${currentUser.uid}_${product.supplierId}_${id}`;
    router.push(`/product-chat/${newChatId}`);
  };

  const getLocalizedProductName = () => {
    const name = product.productName;
    if (typeof name === "string") return name;
    if (typeof name === "object" && name !== null)
      return name[i18n.language] || name["en"] || "Unnamed Product";
    return "Unnamed Product";
  };

  const getLocalizedDescription = () => {
    const desc = product.description;
    if (typeof desc === "string") return desc;
    if (typeof desc === "object" && desc !== null)
      return desc[i18n.language] || desc["en"] || "No description available.";
    return "No description available.";
  };

  const getUnitPrice = () => {
    if (!product.priceRanges || product.priceRanges.length === 0) return 0;
    const match = product.priceRanges.find((range) => {
      const min = parseInt(range.minQty);
      const max =
        range.maxQty === "Unlimited" ? Infinity : parseInt(range.maxQty);
      return quantity >= min && quantity <= max;
    });
    return match?.price || 0;
  };

  const handleAddToCart = async () => {
    const auth = getAuth();
    const currentUser = auth.currentUser;

    if (!currentUser) return toast.error("Please log in to add items to cart.");

    const qty = parseInt(quantity);
    if (!qty || qty <= 0 || isNaN(qty))
      return toast.error("Please enter a valid quantity.");
    if (!selectedColor || !selectedSize || !selectedLocation)
      return toast.warn("Please choose size, color, and location.");

    const cartId = uuidv4();
    const userId = currentUser.uid;
    const unitPrice = getUnitPrice();
    const itemShippingCost = parseFloat(shippingCost || 0);

    const cartItem = {
      cartId,
      productId: id,
      name: getLocalizedProductName(),
      mainImageUrl: product.mainImageUrl,
      price: unitPrice,
      quantity: qty,
      color: selectedColor,
      size: selectedSize,
      shippingCost: itemShippingCost,
      deliveryLocation: selectedLocation,
      supplierName: product.supplierName,
      supplierId: product.supplierId || null,
      addedAt: Timestamp.now(),
      buyerId: userId,
    };

    try {
      const cartRef = doc(db, "carts", userId);
      const cartSnap = await getDoc(cartRef);

      if (cartSnap.exists()) {
        await updateDoc(cartRef, {
          items: [...cartSnap.data().items, cartItem],
          updatedAt: serverTimestamp(),
        });
      } else {
        await setDoc(cartRef, {
          buyerId: userId,
          items: [cartItem],
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }

      toast.success("Product added to cart!");
    } catch (error) {
      console.error("Add to cart error:", error);
      toast.error("Failed to add to cart. Try again.");
    }
  };

  // ... render UI (same as your original component)

  return (
    <div className='max-w-screen-xl mx-auto p-4 text-gray-800'>
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
        <div className='w-full'>
          {/* Main Product Image */}
          <Swiper
            loop={true}
            spaceBetween={10}
            navigation
            autoplay={{ delay: 4000 }}
            thumbs={{ swiper: thumbsSwiper }}
            modules={[Navigation, Thumbs, Autoplay]}
            className='mainSwiper mb-4'
          >
            {/* Main Image */}
            <SwiperSlide>
              <div className='relative group overflow-hidden'>
                <img
                  src={product.mainImageUrl}
                  alt='Main Product'
                  className='object-contain w-full h-96 transition-transform duration-300 group-hover:scale-110 border rounded'
                />
              </div>
            </SwiperSlide>

            {/* Additional Images */}
            {product.additionalImageUrls?.map((img, idx) => (
              <SwiperSlide key={idx}>
                <div className='relative group overflow-hidden'>
                  <img
                    src={img}
                    alt={`Product Slide ${idx}`}
                    className='object-contain w-full h-96 transition-transform duration-300 group-hover:scale-110 border rounded'
                  />
                </div>
              </SwiperSlide>
            ))}
          </Swiper>

          {/* Thumbnails */}
          {product.additionalImageUrls?.length > 0 && (
            <Swiper
              onSwiper={setThumbsSwiper}
              loop={true}
              spaceBetween={10}
              freeMode={true}
              watchSlidesProgress={true}
              slidesPerView={4}
              breakpoints={{
                0: {
                  slidesPerView: 3,
                },
                640: {
                  slidesPerView: 4,
                },
                768: {
                  slidesPerView: 5,
                },
                1024: {
                  slidesPerView: 6,
                },
              }}
              modules={[Thumbs]}
              className='thumbSwiper'
            >
              {/* Main Image as Thumbnail */}
              <SwiperSlide>
                <img
                  src={product.mainImageUrl}
                  alt='Main Thumbnail'
                  className='h-20 w-24 object-cover rounded border-2 cursor-pointer hover:opacity-80 transition'
                />
              </SwiperSlide>

              {/* Additional Thumbnails */}
              {product.additionalImageUrls.map((img, idx) => (
                <SwiperSlide key={idx}>
                  <img
                    src={img}
                    alt={`Thumb ${idx}`}
                    className='h-20 w-24 object-cover rounded border-2 cursor-pointer hover:opacity-80 transition'
                  />
                </SwiperSlide>
              ))}
            </Swiper>
          )}
        </div>

        <div className='space-y-4'>
          <h1 className='text-xl font-bold leading-tight capitalize'>
            {getLocalizedProductName()}
          </h1>
          <p className='text-sm text-gray-600'>Category: {product.category}</p>

          <div className='mt-2 border-t pt-2 text-sm'>
            <p className='font-bold capitalize'>
              Supplier:{" "}
              {product.supplierId ? (
                <Link
                  href={`/supplier/${product.supplierId}`}
                  className='text-[#2c6449] underline hover:text-[#1e4e37] capitalize'
                >
                  {product.supplierName}
                </Link>
              ) : (
                product.supplierName || "N/A"
              )}
            </p>

            <p className='text-gray-600'>{product.mainLocation || "N/A"}</p>

            {/* {product.verified === true ? (
            <div className='flex items-center gap-3 text-green-600 mt-2'>
              <p className='font-medium'>✔ Verified Supplier</p>
            </div>
          ) : (
            <p className='italic text-red-600 mt-2'>Not Verified Supplier</p>
          )} */}
          </div>

          {/* Pricing */}
          <div className='mb-4'>
            <h6 className='font-bold mb-2 text-base sm:text-lg'>Pricing:</h6>
            <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2'>
              {product.priceRanges?.map((tier, idx) => {
                const isUnlimited =
                  !tier.price ||
                  Number(tier.price) <= 0 ||
                  isNaN(Number(tier.price));

                // Format quantity range
                const qtyLabel = tier.maxQty
                  ? `${tier.minQty} - ${tier.maxQty} Pc/s`
                  : `${tier.minQty}+ Pc/s`;

                return (
                  <div key={idx}>
                    <p className='mb-0.5'>
                      {isUnlimited ? (
                        <span className='italic text-[#2c6449]'>
                          Pricing Negotiable - Contact Supplier
                        </span>
                      ) : (
                        <Currency
                          amount={tier.price}
                          className='text-2xl font-bold'
                          iconClass='text-[#c40000]'
                        />
                      )}
                    </p>
                    <p className='text-sm text-gray-700'>{qtyLabel}</p>
                  </div>
                );
              })}
            </div>
          </div>

          <p className='text-sm italic text-green-700'>
            Contact Supplier to Customized Products
          </p>

          {/* Product Options */}
          <div className='grid grid-cols-1 gap-4 text-sm'>
            {/* Row 1: Quantity + Size */}
            <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
              {/* Quantity */}
              <div className='flex flex-col w-52'>
                <label htmlFor='quantity' className='font-semibold mb-1'>
                  Quantity:
                </label>

                <div className='flex items-center gap-2'>
                  <button
                    className='px-2 py-1 border rounded'
                    onClick={() =>
                      setQuantity((prev) => {
                        const newQty = Math.max(1, Number(prev || 1) - 1);
                        const firstMin = parseInt(
                          product.priceRanges?.[0]?.minQty || 1
                        );
                        if (newQty < firstMin) {
                          setError((prev) => ({
                            ...prev,
                            quantity: `Minimum order is ${firstMin} pieces.`,
                          }));
                        } else {
                          setError((prev) => ({ ...prev, quantity: "" }));
                        }
                        return newQty;
                      })
                    }
                  >
                    −
                  </button>

                  <input
                    type='number'
                    id='quantity'
                    min={1}
                    value={quantity}
                    onChange={(e) => {
                      const value = e.target.value;

                      // Allow empty string
                      if (value === "") {
                        setQuantity("");
                        setError((prev) => ({
                          ...prev,
                          quantity: "Quantity is required.",
                        }));
                        return;
                      }

                      const numericValue = Number(value);
                      setQuantity(numericValue);

                      const firstMin = parseInt(
                        product.priceRanges?.[0]?.minQty || 1
                      );
                      if (numericValue < firstMin || isNaN(numericValue)) {
                        setError((prev) => ({
                          ...prev,
                          quantity: `Minimum order is ${firstMin} pieces.`,
                        }));
                      } else {
                        setError((prev) => ({ ...prev, quantity: "" }));
                      }
                    }}
                    onBlur={() => {
                      if (quantity === "" || Number(quantity) < 1) {
                        const firstMin = parseInt(
                          product.priceRanges?.[0]?.minQty || 1
                        );
                        setQuantity(firstMin);
                        setError((prev) => ({
                          ...prev,
                          quantity: "",
                        }));
                      }
                    }}
                    className='w-24 text-center border rounded px-2 py-1'
                  />

                  <button
                    className='px-2 py-1 border rounded'
                    onClick={() =>
                      setQuantity((prev) => {
                        const newQty = Number(prev || 0) + 1;
                        const firstMin = parseInt(
                          product.priceRanges?.[0]?.minQty || 1
                        );
                        if (newQty < firstMin) {
                          setError((prev) => ({
                            ...prev,
                            quantity: `Minimum order is ${firstMin} pieces.`,
                          }));
                        } else {
                          setError((prev) => ({ ...prev, quantity: "" }));
                        }
                        return newQty;
                      })
                    }
                  >
                    +
                  </button>
                </div>

                {error.quantity && (
                  <p className='text-red-600 italic text-sm mt-1'>
                    {error.quantity}
                  </p>
                )}
              </div>

              {/* Size */}
              <div className='flex flex-col w-52'>
                {" "}
                {/* Adjust width here */}
                <label htmlFor='size' className='font-semibold mb-1'>
                  Size:
                </label>
                <select
                  id='size'
                  value={selectedSize}
                  onChange={(e) => {
                    setSelectedSize(e.target.value);
                    setError((prev) => ({ ...prev, size: "" }));
                  }}
                  className='border rounded px-2 py-1'
                >
                  <option value=''>Select Size</option>
                  {product.sizes?.length > 0 ? (
                    product.sizes.map((size, idx) => (
                      <option key={idx} value={size}>
                        {size}
                      </option>
                    ))
                  ) : (
                    <option disabled>No sizes available</option>
                  )}
                </select>
                {error.size && (
                  <p className='text-red-600 italic text-sm mt-1'>
                    {error.size}
                  </p>
                )}
              </div>
            </div>

            {/* Row 2: Color + Delivery Location */}
            <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
              {/* Color */}
              <div className='flex flex-col w-52'>
                {" "}
                {/* Adjust width here */}
                <label htmlFor='color' className='font-semibold mb-1'>
                  Color:
                </label>
                <select
                  id='color'
                  value={selectedColor}
                  onChange={(e) => {
                    setSelectedColor(e.target.value);
                    setError((prev) => ({ ...prev, color: "" }));
                  }}
                  className='border rounded px-2 py-1'
                >
                  <option value=''>Select Color</option>
                  {product.colors?.length > 0 ? (
                    product.colors.map((color, idx) => (
                      <option key={idx} value={color}>
                        {color}
                      </option>
                    ))
                  ) : (
                    <option disabled>No colors available</option>
                  )}
                </select>
                {error.color && (
                  <p className='text-red-600 italic text-sm mt-1'>
                    {error.color}
                  </p>
                )}
              </div>

              {/* Delivery Location */}
              <div className='flex flex-col w-52'>
                {" "}
                {/* Keep width consistent with Size and Color */}
                <label htmlFor='location' className='font-semibold mb-1'>
                  Delivery Location:
                </label>
                <select
                  id='location'
                  className='border rounded px-2 py-1'
                  value={selectedLocation}
                  onChange={(e) => {
                    const location = e.target.value;
                    setSelectedLocation(location);
                    setError((prev) => ({ ...prev, location: "" }));

                    // Find corresponding locationPrice from Firestore structure
                    let found = false;
                    for (const range of product.priceRanges || []) {
                      for (const loc of range.locations || []) {
                        if (loc.location === location) {
                          setShippingCost(loc.locationPrice);
                          found = true;
                          break;
                        }
                      }
                      if (found) break;
                    }

                    // Fallback if not found
                    if (!found) setShippingCost(null);
                  }}
                >
                  <option value=''>Select Location</option>
                  {product.priceRanges?.some((range) =>
                    Array.isArray(range.locations)
                  ) ? (
                    [
                      ...new Set(
                        product.priceRanges
                          .flatMap((range) => range.locations || [])
                          .map((loc) => loc.location)
                          .filter(Boolean)
                      ),
                    ].map((uniqueLoc, idx) => (
                      <option key={idx} value={uniqueLoc}>
                        {uniqueLoc}
                      </option>
                    ))
                  ) : (
                    <option disabled>No delivery locations</option>
                  )}
                </select>
                {error.location && (
                  <p className='text-red-600 italic text-sm mt-1'>
                    {error.location}
                  </p>
                )}
              </div>
            </div>

            {/* Totals */}
            <div className='flex flex-wrap gap-6 mt-2 text-sm text-gray-700'>
              <p className='text-base'>
                <strong>Shipping:</strong>{" "}
                {shippingCost !== null ? (
                  <Currency amount={shippingCost} />
                ) : (
                  "N/A"
                )}
              </p>
              <p className='text-base font-bold text-[#2c6449]'>
                <strong>Subtotal:</strong>{" "}
                <Currency amount={getUnitPrice() * quantity} />
              </p>
            </div>
          </div>

          {/* Action Buttons */}

          {isOwner && (
            <p className='italic text-red-600'>
              You are the supplier of this product.
            </p>
          )}
          {!isOwner && (
            <div className='flex flex-wrap gap-3'>
              <button
                onClick={() => {
                  let newError = {
                    size: "",
                    color: "",
                    location: "",
                    quantity: "",
                  };

                  const qty = parseInt(quantity);
                  const firstMin = parseInt(
                    product.priceRanges?.[0]?.minQty || 1
                  );

                  if (!selectedSize) newError.size = "Please choose a size.";
                  if (!selectedColor) newError.color = "Please choose a color.";
                  if (!selectedLocation)
                    newError.location = "Please choose a delivery location.";
                  if (!quantity || isNaN(qty)) {
                    newError.quantity = "Quantity is required.";
                  } else if (qty < firstMin) {
                    newError.quantity = `Minimum order is ${firstMin} pieces.`;
                  }

                  setError(newError);

                  const hasError = Object.values(newError).some(
                    (v) => v !== ""
                  );

                  if (!hasError) {
                    handleAddToCart();
                  }
                }}
                className='bg-[#2c6449] hover:bg-[#24513b] text-white font-semibold py-1.5 px-4 text-sm rounded-full'
              >
                Add to Cart
              </button>

              <button
                onClick={handleContactSupplier}
                className='text-[#2c6449] border border-[#2c6449] hover:bg-[#2c6449] hover:text-white font-semibold py-1.5 px-4 text-sm rounded-full'
              >
                Contact Supplier
              </button>
            </div>
          )}

          {/* Product Details Summary */}
          {/* <div className='border border-gray-200 rounded p-4 text-sm'>
          <h3 className='font-semibold mb-3 text-base text-[#2c6449]'>
            Product Details
          </h3>
          {product.productDetails ? (
            <div className='grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4'>
              <p>
                <strong>Model Number:</strong>{" "}
                {product.productDetails.modelNumber || "N/A"}
              </p>
              <p>
                <strong>Power Type:</strong>{" "}
                {product.productDetails.powerType || "N/A"}
              </p>
              <p>
                <strong>Usage:</strong>{" "}
                {product.productDetails.usage || "N/A"}
              </p>
              <p>
                <strong>Certification:</strong>{" "}
                {product.productDetails.certification || "N/A"}
              </p>
              <p>
                <strong>Trademark:</strong>{" "}
                {product.productDetails.trademark || "N/A"}
              </p>
              <p>
                <strong>Transport Package:</strong>{" "}
                {product.productDetails.transportPackage || "N/A"}
              </p>
              <p>
                <strong>Origin:</strong> {product.supplier?.location || "N/A"}
              </p>
            </div>
          ) : (
            <p className='italic text-red-600'>
              Products Not Available, Contact Supplier for Full Product
              Details.
            </p>
          )}
        </div> */}
        </div>
      </div>
      {/* Tabs */}
      <div className='mt-10'>
        <div className='flex gap-6 border-b'>
          <button
            onClick={() => setActiveTab("description")}
            className={`pb-2 text-sm font-semibold ${
              activeTab === "description"
                ? "text-[#2c6449] border-b-2 border-[#2c6449]"
                : "text-gray-500"
            }`}
          >
            Product Description
          </button>
          <button
            onClick={() => setActiveTab("company")}
            className={`pb-2 text-sm font-semibold ${
              activeTab === "company"
                ? "text-[#2c6449] border-b-2 border-[#2c6449]"
                : "text-gray-500"
            }`}
          >
            Company Profile
          </button>
        </div>

        <div className='mt-6 text-sm leading-relaxed'>
          {activeTab === "description" && (
            <div>
              <h2 className='font-bold mb-2'>Overview</h2>
              <p className='mb-4'>{getLocalizedDescription()}</p>
            </div>
          )}

          {activeTab === "company" && (
            <div>
              <h2 className='font-bold mb-2'>Company Profile</h2>
              <p>{product.companyProfile}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductDetails;
