"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  doc,
} from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

import { db } from "@/firebase/config";
import { defaultCountryCodeOptions } from "@/lib/productOptions";
import { toast } from "sonner";

const initialValues = {
  companyName: "",
  crNumber: "",
  crDocument: null,
  vatNumber: "",
  representativeName: "",
  representativeEmail: "",
  representativePhone: "",
  fullAddress: "",
  city: "",
  region: "",
  mainCategory: "",
  exportCountries: "",
  productionCapacity: "",
  shippingMethod: "",
  paymentTerms: "",
  bankName: "",
  accountNumber: "",
  iban: "",
  swiftCode: "",
  leadTime: "",
  productImages: null,
  description: "",
  accountHolderName: "",
};

const BecomeSupplierPage = () => {
  const router = useRouter();
  const [formData, setFormData] = useState(initialValues);
  const [selectedPhoneCode, setSelectedPhoneCode] = useState("+966");
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "products"));
        const categorySet = new Set();

        querySnapshot.forEach((doc) => {
          const data = doc.data();
          if (data.category) categorySet.add(data.category);
        });

        setCategories([...categorySet]);
      } catch (error) {
        toast.error("Error fetching categories");
      }
    };

    fetchCategories();
  }, []);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "productImages") {
      setFormData({ ...formData, productImages: files });
    } else if (name === "crDocument") {
      setFormData({ ...formData, crDocument: files[0] });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const fullPhoneNumber = `${selectedPhoneCode}${formData.representativePhone}`;
    const storage = getStorage();
    let crDownloadURL = "";
    let productImageURLs = [];

    try {
      // Upload CR Document
      if (formData.crDocument) {
        const crRef = ref(
          storage,
          `cr-documents/${Date.now()}_${formData.crDocument.name}`
        );
        const snapshot = await uploadBytes(crRef, formData.crDocument);
        crDownloadURL = await getDownloadURL(snapshot.ref);
      }

      // Upload Product Images
      if (formData.productImages && formData.productImages.length > 0) {
        for (let file of formData.productImages) {
          const imgRef = ref(
            storage,
            `product-images/${Date.now()}_${file.name}`
          );
          const imgSnap = await uploadBytes(imgRef, file);
          const imgURL = await getDownloadURL(imgSnap.ref);
          productImageURLs.push(imgURL);
        }
      }

      const newUser = {
        ...formData,
        crDocument: crDownloadURL,
        productImages: productImageURLs,
        representativePhone: fullPhoneNumber,
        role: "supplier",
        isApproved: false,
        createdAt: new Date().toISOString(),
      };

      const docRef = await addDoc(collection(db, "users"), newUser);
      await updateDoc(doc(db, "users", docRef.id), { uid: docRef.id });

      toast.success("Registration submitted successfully!");
      setFormData(initialValues);
      setSelectedPhoneCode("+966");

      setTimeout(() => router.push("/supplier-success"), 1500);
    } catch (error) {
      console.error("Error submitting registration:", error);
      toast.error("Failed to submit. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='max-w-5xl mx-auto p-4 sm:p-6 bg-white shadow rounded-lg'>
      <h2 className='text-2xl font-bold text-[#2c6449] mb-4'>
        Become a Supplier
      </h2>
      <form onSubmit={handleSubmit} className='space-y-6'>
        {/* Company Name + CR Number + VAT Number */}
        <div className='flex flex-col md:flex-row gap-4'>
          <div className='flex-1'>
            <label className='block font-semibold text-sm text-gray-700 mb-1'>
              Company Name *
            </label>
            <input
              type='text'
              name='companyName'
              required
              value={formData.companyName}
              onChange={handleChange}
              className='w-full border border-gray-300 p-2 rounded'
            />
          </div>

          <div className='flex-1'>
            <label className='block font-semibold text-sm text-gray-700 mb-1'>
              Commercial Registration (CR) Number *
            </label>
            <input
              type='text'
              name='crNumber'
              required
              value={formData.crNumber}
              onChange={handleChange}
              className='w-full border border-gray-300 p-2 rounded'
            />
          </div>

          <div className='flex-1'>
            <label className='block font-semibold text-sm text-gray-700 mb-1'>
              VAT Registration Number *
            </label>
            <input
              type='text'
              name='vatNumber'
              required
              value={formData.vatNumber}
              onChange={handleChange}
              className='w-full border border-gray-300 p-2 rounded'
            />
          </div>
        </div>

        {/* Upload CR Document */}
        <div>
          <label className='block font-semibold text-sm text-gray-700 mb-1'>
            Upload Commercial Registration (CR) Document *
          </label>
          <input
            type='file'
            name='crDocument'
            accept='.pdf,.jpg,.jpeg,.png'
            required
            onChange={handleChange}
            className='w-full border border-gray-300 p-2 rounded'
          />
          {formData.crDocument && (
            <p className='text-sm text-green-600 mt-1'>
              Uploaded: {formData.crDocument.name}
            </p>
          )}
        </div>

        {/* Representative Name + Email + Phone */}
        <div className='flex flex-col md:flex-row gap-4'>
          <div className='flex-1'>
            <label className='block font-semibold text-sm text-gray-700 mb-1'>
              Representative Name *
            </label>
            <input
              type='text'
              name='representativeName'
              required
              value={formData.representativeName}
              onChange={handleChange}
              className='w-full border border-gray-300 p-2 rounded'
            />
          </div>

          <div className='flex-1'>
            <label className='block font-semibold text-sm text-gray-700 mb-1'>
              Work/Company Email *
            </label>
            <input
              type='email'
              name='representativeEmail'
              required
              value={formData.representativeEmail}
              onChange={handleChange}
              className='w-full border border-gray-300 p-2 rounded'
            />
          </div>

          <div className='flex-1'>
            <label className='block font-semibold text-sm text-gray-700 mb-1'>
              Phone Number *
            </label>
            <div className='flex'>
              <select
                value={selectedPhoneCode}
                onChange={(e) => setSelectedPhoneCode(e.target.value)}
                className='w-22 border border-gray-300 p-2 rounded-l bg-white'
              >
                {defaultCountryCodeOptions.map((opt, idx) => (
                  <option key={idx} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <input
                type='tel'
                name='representativePhone'
                required
                value={formData.representativePhone}
                onChange={handleChange}
                placeholder='5xxxxxxxx'
                className='flex-1 border-t border-b border-r border-gray-300 p-2 rounded-r'
              />
            </div>
          </div>
        </div>

        {/* Full Address + City + Region */}
        <div className='flex flex-col md:flex-row gap-4'>
          <div className='flex-1'>
            <label className='block font-semibold text-sm text-gray-700 mb-1'>
              Full Address *
            </label>
            <input
              type='text'
              name='fullAddress'
              required
              value={formData.fullAddress}
              onChange={handleChange}
              className='w-full border border-gray-300 p-2 rounded'
            />
          </div>

          <div className='flex-1'>
            <label className='block font-semibold text-sm text-gray-700 mb-1'>
              City *
            </label>
            <input
              type='text'
              name='city'
              required
              value={formData.city}
              onChange={handleChange}
              className='w-full border border-gray-300 p-2 rounded'
            />
          </div>

          <div className='flex-1'>
            <label className='block font-semibold text-sm text-gray-700 mb-1'>
              Region *
            </label>
            <input
              type='text'
              name='region'
              required
              value={formData.region}
              onChange={handleChange}
              className='w-full border border-gray-300 p-2 rounded'
            />
          </div>
        </div>

        {/* Main Product Category */}
        <div>
          <label className='block font-semibold text-sm text-gray-700 mb-1'>
            Main Product Category *
          </label>
          <select
            name='mainCategory'
            required
            value={formData.mainCategory}
            onChange={handleChange}
            className='w-full border border-gray-300 p-2 rounded'
          >
            <option value=''>Please select</option>
            {categories.map((cat, index) => (
              <option key={index} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* Export Countries */}
        <div>
          <label className='block font-semibold text-sm text-gray-700 mb-1'>
            Export Countries
          </label>
          <input
            type='text'
            name='exportCountries'
            value={formData.exportCountries}
            onChange={handleChange}
            className='w-full border border-gray-300 p-2 rounded'
            placeholder='e.g., Saudi Arabia, UAE, Egypt'
          />
        </div>

        {/* Production Capacity */}
        <div>
          <label className='block font-semibold text-sm text-gray-700 mb-1'>
            Monthly Production Capacity *
          </label>
          <input
            type='text'
            name='productionCapacity'
            required
            value={formData.productionCapacity}
            onChange={handleChange}
            className='w-full border border-gray-300 p-2 rounded'
            placeholder='e.g., 10,000 units'
          />
        </div>

        {/* Shipping Method */}
        <div>
          <label className='block font-semibold text-sm text-gray-700 mb-1'>
            Shipping Method *
          </label>
          <select
            name='shippingMethod'
            required
            value={formData.shippingMethod}
            onChange={handleChange}
            className='w-full border border-gray-300 p-2 rounded'
          >
            <option value=''>Please select</option> {/* Add this */}
            <option value='Sea freight'>Sea freight</option>
            <option value='Air freight'>Air freight</option>
            <option value='Courier'>Courier</option>
          </select>
        </div>

        {/* Lead Time */}
        <div>
          <label className='block font-semibold text-sm text-gray-700 mb-1'>
            Approximate Delivery Time (days) *
          </label>
          <input
            type='number'
            name='leadTime'
            required
            value={formData.leadTime}
            onChange={handleChange}
            className='w-full border border-gray-300 p-2 rounded'
          />
        </div>

        {/* Payment Terms */}
        <div>
          <label className='block font-semibold text-sm text-gray-700 mb-1'>
            Payment Method *
          </label>
          <select
            name='paymentTerms'
            required
            value={formData.paymentTerms}
            onChange={handleChange}
            className='w-full border border-gray-300 p-2 rounded'
          >
            <option value=''>Please select</option> {/* Add this */}
            <option value='T/T'>T/T or Bank Transfer</option>
            <option value='L/C'>L/C or Purchase Order</option>
          </select>
        </div>

        {/* 🆕 Bank Account Details (separated fields properly) */}
        <div className='space-y-6'>
          {/* First Row: Bank Name + Account Number + Account Holder Name */}
          <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
            {/* Bank Name */}
            <div>
              <label className='block font-semibold text-sm text-gray-700 mb-1'>
                Bank Name *
              </label>
              <input
                type='text'
                name='bankName'
                required
                value={formData.bankName}
                onChange={handleChange}
                className='w-full border border-gray-300 p-2 rounded'
              />
            </div>

            {/* Account Number */}
            <div>
              <label className='block font-semibold text-sm text-gray-700 mb-1'>
                Account Number *
              </label>
              <input
                type='text'
                name='accountNumber'
                required
                value={formData.accountNumber}
                onChange={handleChange}
                className='w-full border border-gray-300 p-2 rounded'
              />
            </div>

            {/* Account Holder Name 🆕 */}
            <div>
              <label className='block font-semibold text-sm text-gray-700 mb-1'>
                Account Holder Name *
              </label>
              <input
                type='text'
                name='accountHolderName'
                required
                value={formData.accountHolderName}
                onChange={handleChange}
                className='w-full border border-gray-300 p-2 rounded'
              />
            </div>
          </div>

          {/* Second Row: IBAN + Swift Code */}
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            {/* IBAN */}
            <div>
              <label className='block font-semibold text-sm text-gray-700 mb-1'>
                IBAN *
              </label>
              <input
                type='text'
                name='iban'
                required
                value={formData.iban}
                onChange={handleChange}
                className='w-full border border-gray-300 p-2 rounded'
              />
            </div>

            {/* Swift Code */}
            <div>
              <label className='block font-semibold text-sm text-gray-700 mb-1'>
                Swift Code *
              </label>
              <input
                type='text'
                name='swiftCode'
                required
                value={formData.swiftCode}
                onChange={handleChange}
                className='w-full border border-gray-300 p-2 rounded'
              />
            </div>
          </div>
        </div>

        {/* Company/Product Description */}
        <div>
          <label className='block font-semibold text-sm text-gray-700 mb-1'>
            Company/Product Description *
          </label>
          <textarea
            name='description'
            required
            value={formData.description}
            onChange={handleChange}
            className='w-full border border-gray-300 p-2 rounded h-28'
            placeholder='Describe your company, production process, certifications, etc.'
          ></textarea>
        </div>

        {/* Upload Product Images */}
        <div>
          <label className='block font-semibold text-sm text-gray-700 mb-1'>
            Upload Product Images
          </label>
          <input
            type='file'
            name='productImages'
            accept='image/*'
            multiple
            onChange={handleChange}
            className='w-full border border-gray-300 p-2 rounded'
          />
        </div>

        {/* Submit Button */}
        <button
          type='submit'
          disabled={loading}
          className='w-full sm:w-auto bg-[#2c6449] hover:bg-[#1b4533] text-white font-bold py-2 px-6 rounded transition-all disabled:opacity-50 disabled:cursor-not-allowed'
        >
          {loading ? (
            <span className='flex items-center gap-2'>
              <svg
                className='animate-spin h-5 w-5 text-white'
                xmlns='http://www.w3.org/2000/svg'
                fill='none'
                viewBox='0 0 24 24'
              >
                <circle
                  className='opacity-25'
                  cx='12'
                  cy='12'
                  r='10'
                  stroke='currentColor'
                  strokeWidth='4'
                ></circle>
                <path
                  className='opacity-75'
                  fill='currentColor'
                  d='M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z'
                ></path>
              </svg>
              Uploading...
            </span>
          ) : (
            "Submit Registration"
          )}
        </button>
      </form>
    </div>
  );
};

export default BecomeSupplierPage;
