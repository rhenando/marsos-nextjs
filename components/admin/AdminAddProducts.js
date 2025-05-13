import React, { useState, useEffect } from "react";
import CreatableSelect from "react-select/creatable";
import { db } from "../../firebase/config";
import { collection, addDoc, getDocs } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import LoadingSpinner from "../global/LoadingSpinner";
import { showSuccess, showError, showWarning } from "../../utils/toastUtils";

import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { translateText } from "../../utils/translate";
import {
  defaultLocationOptions,
  defaultSizeOptions,
  defaultColorOptions,
  defaultQtyOptions,
} from "../../constants/productOptions";

const AdminAddProducts = () => {
  const navigate = useNavigate();

  const [translatedCategories, setTranslatedCategories] = useState({});

  const { t, i18n } = useTranslation();

  const [suppliers, setSuppliers] = useState([]); // To store all suppliers
  const [selectedSupplier, setSelectedSupplier] = useState(null); // Selected supplier object
  const [supplierId, setSupplierId] = useState("");
  const [supplierNumber, setSupplierNumber] = useState("");

  const [category, setCategory] = useState("");
  const [subCategory, setSubCategory] = useState("");
  const [categories, setCategories] = useState({});

  const [sizes, setSizes] = useState([]);
  const [colors, setColors] = useState([]);
  const [mainImage, setMainImage] = useState(null);
  const [additionalImages, setAdditionalImages] = useState([null]);
  const [priceRanges, setPriceRanges] = useState([
    {
      minQty: "",
      maxQty: "",
      price: "",
      locations: [{ location: "", locationPrice: "" }],
    },
  ]);

  const [minQtyError, setMinQtyError] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [mainLocation, setMainLocation] = useState(null);

  const [productNameEn, setProductNameEn] = useState("");
  const [productNameAr, setProductNameAr] = useState("");
  const [descriptionEn, setDescriptionEn] = useState("");
  const [descriptionAr, setDescriptionAr] = useState("");

  const generateUniqueFileName = (file, index = null) => {
    const uniquePart = Date.now() + (index !== null ? `_${index}` : "");
    return `${uniquePart}_${file.name}`;
  };

  const showNotification = (title, message) => {
    if (title.toLowerCase().includes("error")) {
      showError(message);
    } else if (title.toLowerCase().includes("warning")) {
      showWarning(message);
    } else {
      showSuccess(message);
    }
  };

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const productCollection = collection(db, "products");
        const productSnapshot = await getDocs(productCollection);

        const categoryData = {};
        productSnapshot.docs.forEach((doc) => {
          const data = doc.data();
          const category = data.category || "Uncategorized";
          const subCategory = data.subCategory || "Uncategorized";

          if (!categoryData[category]) {
            categoryData[category] = new Set();
          }
          categoryData[category].add(subCategory);
        });

        const formattedCategories = {};
        for (const category in categoryData) {
          formattedCategories[category] = Array.from(categoryData[category]);
        }

        setCategories(formattedCategories);

        if (i18n.language === "ar") {
          const categoriesArray = Object.keys(formattedCategories);

          // ✅ Use Promise.all() to translate all categories at once
          const translatedTexts = await Promise.all(
            categoriesArray.map((cat) => translateText(cat, "ar"))
          );

          // ✅ Map translations correctly
          const translations = categoriesArray.reduce((acc, cat, idx) => {
            acc[cat] = translatedTexts[idx];
            return acc;
          }, {});

          setTranslatedCategories(translations);
        } else {
          setTranslatedCategories({});
        }
      } catch (error) {
        console.error("Error fetching categories and subcategories:", error);
      }
    };

    fetchCategories();
  }, [i18n.language]); // ✅ Re-run when language changes

  useEffect(() => {
    const fetchSuppliers = async () => {
      try {
        const supplierCollection = collection(db, "users");
        const supplierSnapshot = await getDocs(supplierCollection);
        const supplierList = supplierSnapshot.docs
          .filter((doc) => doc.data().role === "supplier") // Adjust the role condition
          .map((doc) => ({
            id: doc.id,
            name: doc.data().name || "Unnamed Supplier",
            contact: doc.data().contact || "N/A",
          }));
        setSuppliers(supplierList);
      } catch (error) {
        console.error("Error fetching suppliers: ", error);
      }
    };

    fetchSuppliers();
  }, []);

  const handleSupplierChange = (e) => {
    const selectedName = e.target.value;
    const supplier = suppliers.find(
      (supplier) => supplier.name === selectedName
    );
    setSelectedSupplier(supplier);
    setSupplierId(supplier?.id || "N/A");
    setSupplierNumber(supplier?.contact || "N/A");
  };

  const [locationOptions, setLocationOptions] = useState(
    defaultLocationOptions
  );

  const options = [
    ...Array.from({ length: 10 }, (_, i) => ({
      value: (i + 1).toString(),
      label: (i + 1).toString(),
    })), // Generates 1 to 10 as options
    { value: "Unlimited", label: "Unlimited" }, // Adds "Unlimited" as an option
  ];

  const deliveryPriceOptions = [
    ...Array.from({ length: 10 }, (_, i) => ({
      value: (i + 1).toString(),
      label: (i + 1).toString(),
    })), // Generate numbers 1 to 10 as options
    { value: "Unlimited", label: "Unlimited" }, // Add "Unlimited" option
  ];

  const [sizeOptions, setSizeOptions] = useState(defaultSizeOptions);
  const [colorOptions, setColorOptions] = useState(defaultColorOptions);
  const [qtyOptions, setQtyOptions] = useState(defaultQtyOptions);

  const handleCreateQtyOption = (newOption) => {
    if (/^-/.test(newOption)) {
      showNotification("Validation Error", "Negative numbers are not allowed.");
      return null;
    }
    if (!qtyOptions.some((opt) => opt.value === newOption)) {
      const newOptionObj = { value: newOption, label: newOption };
      setQtyOptions((prevOptions) => [...prevOptions, newOptionObj]);
      return newOptionObj;
    }
    return null;
  };

  const handleAddLocation = (priceRangeIndex) => {
    const updatedRanges = [...priceRanges];
    updatedRanges[priceRangeIndex].locations.push({
      location: "",
      locationPrice: "",
    });
    setPriceRanges(updatedRanges);
  };

  const handleRemoveLocation = (priceRangeIndex, locationIndex) => {
    const updatedRanges = [...priceRanges];
    updatedRanges[priceRangeIndex].locations.splice(locationIndex, 1);
    setPriceRanges(updatedRanges);
  };

  const handleAddAdditionalImage = () => {
    setAdditionalImages([...additionalImages, null]);
  };

  const handleAdditionalImageChange = (index, file) => {
    const updatedImages = [...additionalImages];
    updatedImages[index] = file;
    setAdditionalImages(updatedImages);
  };

  const handleRemoveAdditionalImage = (index) => {
    const updatedImages = [...additionalImages];
    updatedImages.splice(index, 1);
    setAdditionalImages(updatedImages);
  };

  const handleAddPriceRange = () => {
    setPriceRanges([
      ...priceRanges,
      {
        minQty: "",
        maxQty: "",
        price: "",
        locations: [{ location: "", locationPrice: "" }], // Ensure locations array is initialized
      },
    ]);
  };

  const handleNumericInput = (value) => {
    // Allow empty value to let the user clear the field
    if (value === "") {
      return value; // Return empty string to allow deletion
    }

    // Allow the special value "Unlimited"
    if (value === "Unlimited") {
      return value; // Return "Unlimited" as a valid input
    }

    // Check for non-numeric characters except "."
    if (/[^0-9.]/.test(value)) {
      showNotification(
        "Only numeric values, a decimal point, or 'Unlimited' are allowed."
      );
      return null; // Return null to ignore invalid input
    }

    // Prevent multiple decimal points
    if ((value.match(/\./g) || []).length > 1) {
      showNotification("Only one decimal point is allowed.");
      return null; // Return null to ignore invalid input
    }

    return value; // Return valid numeric input
  };

  const handlePriceRangeChange = (index, field, value) => {
    const validatedValue = handleNumericInput(value);
    if (validatedValue !== null) {
      // Only update state if input is valid
      const updatedRanges = [...priceRanges];
      updatedRanges[index][field] = validatedValue;
      setPriceRanges(updatedRanges);
    }
  };

  const handleLocationChange = (
    priceRangeIndex,
    locationIndex,
    field,
    value
  ) => {
    let validatedValue = value;

    if (field === "location") {
      // Validate alphabetic input for locations
      const isValid = /^[a-zA-Z\s]+$/.test(value);
      if (!isValid) {
        showNotification(
          "Validation Error",
          "Only alphabetic characters are allowed for locations."
        );
        return; // Stop processing if invalid
      }
    } else if (field === "locationPrice") {
      // Validate numeric input for location prices
      validatedValue = handleNumericInput(value);
      if (validatedValue === null) {
        return; // Stop processing if invalid
      }
    }

    // Update the state only if the input is valid
    const updatedRanges = [...priceRanges];
    updatedRanges[priceRangeIndex].locations[locationIndex][field] =
      validatedValue;
    setPriceRanges(updatedRanges);
  };

  const handleRemovePriceRange = (index) => {
    const updatedRanges = [...priceRanges];
    updatedRanges.splice(index, 1);
    setPriceRanges(updatedRanges);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedSupplier) {
      showNotification(
        "System Error",
        "Please select a supplier before submitting."
      );
      return;
    }

    // Validate required fields
    if (
      !productNameEn ||
      !productNameAr ||
      !descriptionEn ||
      !descriptionAr ||
      !category ||
      !subCategory ||
      sizes.length === 0 ||
      colors.length === 0 ||
      !mainImage ||
      !mainLocation ||
      priceRanges.length === 0
    ) {
      showNotification(
        "Validation Error",
        "Please fill in all required fields before submitting."
      );
      return;
    }

    setLoading(true); // Start loading spinner
    setMessage({ type: "", text: "" });

    try {
      const storage = getStorage();

      // Upload main image with a unique file name
      const uniqueMainImageName = generateUniqueFileName(mainImage);
      const mainImageRef = ref(storage, `images/${uniqueMainImageName}`);
      await uploadBytes(mainImageRef, mainImage);
      const mainImageUrl = await getDownloadURL(mainImageRef);

      // Upload additional images with unique file names
      const additionalImageUrls = [];
      for (let index = 0; index < additionalImages.length; index++) {
        const file = additionalImages[index];
        if (file) {
          const uniqueAdditionalImageName = generateUniqueFileName(file, index);
          const imageRef = ref(storage, `images/${uniqueAdditionalImageName}`);
          await uploadBytes(imageRef, file);
          const imageUrl = await getDownloadURL(imageRef);
          additionalImageUrls.push(imageUrl);
        }
      }

      // Save to Firestore
      await addDoc(collection(db, "products"), {
        productName: {
          en: productNameEn,
          ar: productNameAr,
        },
        description: {
          en: descriptionEn,
          ar: descriptionAr,
        },

        category,
        subCategory,

        sizes: sizes.map((size) => size.value),
        colors: colors.map((color) => color.value),
        mainImageUrl,
        additionalImageUrls,
        mainLocation: mainLocation?.value || null,
        priceRanges: priceRanges.map((range) => ({
          ...range,
          locations: range.locations.map((loc) => ({
            location: loc.location,
            locationPrice: parseFloat(loc.locationPrice || 0),
          })),
        })),
        createdAt: new Date(),
        supplierId: supplierId || "N/A",
        supplierName: selectedSupplier?.name || "N/A",
        supplierNumber: supplierNumber || "N/A",
      });

      showNotification(
        "Success",
        "Your product has been uploaded successfully."
      );

      // Reset the form
      setProductNameEn("");
      setProductNameAr("");
      setDescriptionEn("");
      setDescriptionAr("");

      setCategory("");
      setSubCategory("");

      setSizes([]);
      setColors([]);
      setMainImage(null);
      setAdditionalImages([]);
      setPriceRanges([
        {
          minQty: "",
          maxQty: "",
          price: "",
          locations: [{ location: "", locationPrice: "" }],
        },
      ]);

      // Redirect to admin-page
      navigate("/admin-dashboard");
    } catch (error) {
      console.error("Error adding product: ", error);
      showNotification(
        "Submission Error",
        "Failed to upload the product. Please try again later."
      );
    } finally {
      setLoading(false); // Stop loading spinner
    }
  };

  const handleCreateOption = (newOption, currentOptions, setOptions) => {
    const isDuplicate = currentOptions.some(
      (option) => option.value.toLowerCase() === newOption.toLowerCase()
    );
    if (isDuplicate) {
      setMessage({
        type: "warning",
        text: `The option "${newOption}" already exists.`,
      });
      return;
    }
    const newOptionObj = { value: newOption, label: newOption };
    setOptions([...currentOptions, newOptionObj]);
    return newOptionObj;
  };

  const handleCreateLocationOption = (newLocation) => {
    const newOption = { value: newLocation, label: newLocation };
    setLocationOptions([...locationOptions, newOption]);
    return newOption;
  };

  return (
    <div className='px-4 py-6 max-w-7xl mx-auto'>
      <form onSubmit={handleSubmit}>
        <h2 className='text-2xl font-semibold mb-6 text-gray-800'>
          Upload Product
        </h2>
        {loading && <LoadingSpinner />}
        {message.text && (
          <div className={`alert alert-${message.type} mt-2`} role='alert'>
            {message.text}
          </div>
        )}

        <div className='bg-white border rounded-md p-4 mb-6 shadow-sm'>
          <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                {t("admin_product_add.supplier_name")}
              </label>
              <select
                value={selectedSupplier?.name || ""}
                onChange={handleSupplierChange}
                className='w-full border border-gray-300 rounded-md shadow-sm p-2 text-sm focus:ring focus:ring-green-200'
              >
                <option value='' disabled>
                  {t("admin_product_add.select_supplier")}
                </option>
                {suppliers.map((supplier) => (
                  <option key={supplier.id} value={supplier.name}>
                    {supplier.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                {t("admin_product_add.supplier_id")}
              </label>
              <p className='text-sm text-gray-800'>{supplierId || "N/A"}</p>
            </div>

            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                {t("admin_product_add.supplier_number")}
              </label>
              <p className='text-sm text-gray-800'>{supplierNumber || "N/A"}</p>
            </div>
          </div>
        </div>

        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6'>
          {/* Product Name */}
          <div className='space-y-2'>
            <input
              type='text'
              id='productNameEn'
              placeholder='Product Name (English)'
              value={productNameEn}
              onChange={(e) => setProductNameEn(e.target.value)}
              className='w-full border border-gray-300 rounded-md p-2 text-sm focus:ring focus:ring-green-200'
              required
            />
            <input
              type='text'
              id='productNameAr'
              placeholder='اسم المنتج (Arabic)'
              dir='rtl'
              value={productNameAr}
              onChange={(e) => setProductNameAr(e.target.value)}
              className='w-full border border-gray-300 rounded-md p-2 text-sm focus:ring focus:ring-green-200'
              required
            />
          </div>

          {/* Description */}
          <div className='space-y-2'>
            <input
              type='text'
              id='descriptionEn'
              placeholder='Product Description (English)'
              value={descriptionEn}
              onChange={(e) => setDescriptionEn(e.target.value)}
              className='w-full border border-gray-300 rounded-md p-2 text-sm focus:ring focus:ring-green-200'
              required
            />
            <input
              type='text'
              id='descriptionAr'
              placeholder='وصف المنتج (Arabic)'
              dir='rtl'
              value={descriptionAr}
              onChange={(e) => setDescriptionAr(e.target.value)}
              className='w-full border border-gray-300 rounded-md p-2 text-sm focus:ring focus:ring-green-200'
              required
            />
          </div>

          {/* Category */}
          <div>
            <label
              htmlFor='category'
              className='block text-sm font-medium text-gray-700 mb-1'
            >
              {t("admin_product_add.category")}
            </label>
            <CreatableSelect
              options={Object.keys(categories).map((cat) => ({
                value: cat,
                label: translatedCategories[cat] || cat,
              }))}
              value={
                category
                  ? {
                      value: category,
                      label: translatedCategories[category] || category,
                    }
                  : null
              }
              onChange={(selected) => {
                setCategory(selected?.value || "");
                setSubCategory("");
              }}
              onCreateOption={async (newCategory) => {
                if (!categories[newCategory]) {
                  setCategories((prev) => ({
                    ...prev,
                    [newCategory]: ["default"],
                  }));
                }
                const translatedCategory = await translateText(
                  newCategory,
                  "ar"
                );
                setTranslatedCategories((prev) => ({
                  ...prev,
                  [newCategory]: translatedCategory,
                }));
                setCategory(newCategory);
                setSubCategory("default");
              }}
              placeholder={t("admin_product_add.select_or_create_category")}
            />
          </div>

          {/* Subcategory */}
          <div>
            <label
              htmlFor='subCategory'
              className='block text-sm font-medium text-gray-700 mb-1'
            >
              {t("admin_product_add.sub_category")}
            </label>
            <CreatableSelect
              options={(categories[category] || []).map((sub) => ({
                value: sub,
                label: sub,
              }))}
              value={
                subCategory ? { value: subCategory, label: subCategory } : null
              }
              onChange={(selected) => setSubCategory(selected?.value || "")}
              onCreateOption={(newSubCategory) => {
                if (!categories[category]?.includes(newSubCategory)) {
                  setCategories((prev) => ({
                    ...prev,
                    [category]: [...(prev[category] || []), newSubCategory],
                  }));
                }
                setSubCategory(newSubCategory);
              }}
              isDisabled={!category}
              placeholder={t("admin_product_add.select_or_create_subcategory")}
            />
          </div>
        </div>

        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6'>
          {/* Main Location */}
          <div>
            <label
              htmlFor='mainLocation'
              className='block text-sm font-medium text-gray-700 mb-1'
            >
              {t("admin_product_add.main_location")}
            </label>
            <CreatableSelect
              options={locationOptions}
              value={mainLocation}
              onChange={(selected) => setMainLocation(selected)}
              onCreateOption={(newLocation) => {
                const newOption = handleCreateOption(
                  newLocation,
                  locationOptions,
                  setLocationOptions
                );
                if (newOption) setMainLocation(newOption);
              }}
              placeholder={t("admin_product_add.select_or_create_location")}
            />
          </div>

          {/* Sizes */}
          <div>
            <label
              htmlFor='sizes'
              className='block text-sm font-medium text-gray-700 mb-1'
            >
              {t("admin_product_add.sizes")}
            </label>
            <CreatableSelect
              isMulti
              options={sizeOptions}
              value={sizes}
              onChange={(selected) => setSizes(selected)}
              onCreateOption={(newSize) => {
                const newSizeObj = handleCreateOption(
                  newSize,
                  sizeOptions,
                  setSizeOptions
                );
                if (newSizeObj) setSizes([...sizes, newSizeObj]);
              }}
              placeholder={t("admin_product_add.select_or_create_size")}
            />
          </div>

          {/* Colors */}
          <div>
            <label
              htmlFor='colors'
              className='block text-sm font-medium text-gray-700 mb-1'
            >
              {t("admin_product_add.colors")}
            </label>
            <CreatableSelect
              isMulti
              options={colorOptions}
              value={colors}
              onChange={(selected) => setColors(selected)}
              onCreateOption={(newColor) => {
                const newColorObj = handleCreateOption(
                  newColor,
                  colorOptions,
                  setColorOptions
                );
                if (newColorObj) setColors([...colors, newColorObj]);
              }}
              placeholder={t("admin_product_add.select_or_create_color")}
            />
          </div>
        </div>

        <div className='grid grid-cols-1 md:grid-cols-2 gap-6 mb-6'>
          {/* Main Image Upload */}
          <div>
            <label
              htmlFor='mainImage'
              className='block text-sm font-medium text-gray-700 mb-2'
            >
              {t("admin_product_add.main_image")}
            </label>
            <input
              type='file'
              id='mainImage'
              accept='image/*'
              className='block w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 text-sm focus:outline-none focus:ring focus:border-blue-300'
              onChange={(e) => setMainImage(e.target.files[0])}
              required
            />
          </div>

          {/* Additional Images Upload */}
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-2'>
              {t("admin_product_add.additional_images")}
            </label>

            {additionalImages.map((_, index) => (
              <div key={index} className='flex items-center gap-3 mb-2'>
                <input
                  type='file'
                  accept='image/*'
                  className='flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm'
                  onChange={(e) =>
                    handleAdditionalImageChange(index, e.target.files[0])
                  }
                />
                <button
                  type='button'
                  className='text-red-600 hover:text-red-800 text-sm font-medium'
                  onClick={() => handleRemoveAdditionalImage(index)}
                >
                  {t("admin_product_add.remove")}
                </button>
              </div>
            ))}

            <button
              type='button'
              className='mt-2 text-sm text-blue-600 hover:text-blue-800 font-medium'
              onClick={handleAddAdditionalImage}
            >
              + {t("admin_product_add.add_another_image")}
            </button>
          </div>
        </div>

        <div className='mt-8 space-y-8'>
          {priceRanges.map((range, index) => (
            <div
              key={index}
              className='border border-gray-200 rounded-lg p-4 bg-white shadow-sm'
            >
              <div className='flex justify-between items-center mb-4'>
                <h4 className='text-lg font-semibold text-gray-700'>
                  {t("admin_product_add.tier")} #{index + 1}
                </h4>
                <button
                  type='button'
                  className='text-red-500 text-sm hover:underline'
                  onClick={() => handleRemovePriceRange(index)}
                >
                  {t("admin_product_add.remove_price_range")}
                </button>
              </div>

              {/* Price Tier */}
              <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mb-6'>
                <div className='relative'>
                  <CreatableSelect
                    options={qtyOptions}
                    value={
                      range.minQty
                        ? { value: range.minQty, label: range.minQty }
                        : null
                    }
                    onChange={(selected) => {
                      const value = selected?.value || "";

                      if (
                        index === 0 &&
                        (value === "Unlimited" || value === "0" || value === "")
                      ) {
                        setMinQtyError(
                          "Minimum order should be at least quantity of 1."
                        );
                        return;
                      }

                      setMinQtyError("");
                      handlePriceRangeChange(index, "minQty", value);
                    }}
                    onCreateOption={(newQty) => {
                      if (
                        index === 0 &&
                        (newQty === "Unlimited" ||
                          newQty === "0" ||
                          newQty === "")
                      ) {
                        setMinQtyError(
                          "Minimum order should be at least quantity of 1."
                        );
                        return;
                      }

                      const newOption = handleCreateQtyOption(newQty);
                      if (newOption) {
                        setMinQtyError("");
                        handlePriceRangeChange(
                          index,
                          "minQty",
                          newOption.value
                        );
                      }
                    }}
                    placeholder={t("admin_product_add.min_qty")}
                  />

                  {index === 0 && minQtyError && (
                    <p className='text-red-600 italic text-sm mt-1'>
                      {minQtyError}
                    </p>
                  )}
                </div>

                <CreatableSelect
                  options={qtyOptions}
                  value={
                    range.maxQty
                      ? { value: range.maxQty, label: range.maxQty }
                      : null
                  }
                  onChange={(selected) =>
                    handlePriceRangeChange(
                      index,
                      "maxQty",
                      selected?.value || ""
                    )
                  }
                  onCreateOption={(newQty) => {
                    const newOption = handleCreateQtyOption(newQty);
                    if (newOption)
                      handlePriceRangeChange(index, "maxQty", newOption.value);
                  }}
                  placeholder={t("admin_product_add.max_qty")}
                />
                <CreatableSelect
                  options={options}
                  isClearable
                  value={
                    range.price
                      ? { value: range.price, label: range.price }
                      : null
                  }
                  onChange={(selected) =>
                    handlePriceRangeChange(
                      index,
                      "price",
                      selected?.value || ""
                    )
                  }
                  onCreateOption={(inputValue) => {
                    const isValid = /^[0-9]*\.?[0-9]+$/.test(inputValue);
                    if (!isValid) {
                      showNotification(
                        "Validation Error",
                        "Only numeric values are allowed for price."
                      );
                      return;
                    }

                    handlePriceRangeChange(index, "price", inputValue);
                  }}
                  placeholder={t("admin_product_add.price")}
                />
              </div>

              {/* Delivery Locations */}
              <div className='space-y-4'>
                <h5 className='text-md font-medium text-gray-600'>
                  {t("admin_product_add.delivery_locations")}
                </h5>
                {range.locations.map((loc, locIndex) => (
                  <div
                    key={locIndex}
                    className='grid grid-cols-1 md:grid-cols-[2fr_1.5fr_0.5fr] gap-4 items-center'
                  >
                    <CreatableSelect
                      options={locationOptions}
                      value={
                        loc.location
                          ? { value: loc.location, label: loc.location }
                          : null
                      }
                      onChange={(selected) =>
                        handleLocationChange(
                          index,
                          locIndex,
                          "location",
                          selected?.value || ""
                        )
                      }
                      onCreateOption={(newOption) => {
                        const isValid = /^[a-zA-Z\s]+$/.test(newOption);
                        if (isValid) {
                          const newLoc = handleCreateLocationOption(newOption);
                          handleLocationChange(
                            index,
                            locIndex,
                            "location",
                            newLoc.value
                          );
                        } else {
                          showNotification(
                            "Validation Error",
                            "Only alphabetic characters are allowed."
                          );
                        }
                      }}
                      placeholder={t(
                        "admin_product_add.select_or_create_location"
                      )}
                    />
                    <CreatableSelect
                      options={deliveryPriceOptions}
                      isClearable
                      value={
                        loc.locationPrice
                          ? {
                              value: loc.locationPrice,
                              label: loc.locationPrice,
                            }
                          : null
                      }
                      onChange={(selected) =>
                        handleLocationChange(
                          index,
                          locIndex,
                          "locationPrice",
                          selected?.value || ""
                        )
                      }
                      onCreateOption={(inputValue) => {
                        const isValid = /^[0-9]*\.?[0-9]+$/.test(inputValue);
                        if (!isValid) {
                          showNotification(
                            "Validation Error",
                            "Only numeric values are allowed for location price."
                          );
                          return;
                        }

                        handleLocationChange(
                          index,
                          locIndex,
                          "locationPrice",
                          inputValue
                        );
                      }}
                      placeholder={t("admin_product_add.price")}
                    />
                    <button
                      type='button'
                      className='text-red-500 text-sm hover:underline'
                      onClick={() => handleRemoveLocation(index, locIndex)}
                    >
                      {t("admin_product_add.remove")}
                    </button>
                  </div>
                ))}
                <button
                  type='button'
                  className='text-blue-600 text-sm hover:underline mt-2'
                  onClick={() => handleAddLocation(index)}
                >
                  + {t("admin_product_add.add_location")}
                </button>
              </div>
            </div>
          ))}

          <div>
            <button
              type='button'
              onClick={handleAddPriceRange}
              className='bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-2 rounded shadow-sm text-sm'
            >
              + {t("admin_product_add.add_price_range")}
            </button>
          </div>
        </div>

        <div className='mt-6 text-center'>
          <button
            type='submit'
            disabled={loading}
            className='bg-[#2c6449] hover:bg-green-800 text-white px-6 py-2 rounded shadow disabled:opacity-50 disabled:cursor-not-allowed text-sm'
          >
            {loading ? (
              <span className='inline-flex items-center gap-2'>
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
                {t("admin_product_add.uploading")}
              </span>
            ) : (
              t("admin_product_add.title")
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AdminAddProducts;
