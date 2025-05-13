import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getDocuments, updateDocument } from "../../utils/firestore";
import {
  getStorage,
  ref,
  uploadBytesResumable,
  getDownloadURL,
} from "firebase/storage";
import Select from "react-select";
import CreatableSelect from "react-select/creatable";
import { showSuccess, showError } from "../../utils/toastUtils";
import { useTranslation } from "react-i18next";

const AdminEditProducts = () => {
  const navigate = useNavigate();
  const { productId } = useParams();
  const [product, setProduct] = useState(null);
  const [originalProduct, setOriginalProduct] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  const [categories, setCategories] = useState([]);
  const [subCategoriesMap, setSubCategoriesMap] = useState({});

  const storage = getStorage(); // Initialize Firebase Storage

  const { i18n } = useTranslation();
  const currentLang = i18n.language || "en"; // fallback if undefined

  const predefinedSizes = [
    { value: "S", label: "S" },
    { value: "M", label: "M" },
    { value: "L", label: "L" },
    { value: "XL", label: "XL" },
  ];

  const predefinedColors = [
    { value: "Red", label: "Red" },
    { value: "Blue", label: "Blue" },
    { value: "Green", label: "Green" },
    { value: "Black", label: "Black" },
  ];

  const predefinedLocations = [
    "Riyadh",
    "Jeddah",
    "Mecca",
    "Medina",
    "Dammam",
    "Khobar",
    "Tabuk",
    "Abha",
    "Khamis Mushait",
    "Buraidah",
    "Najran",
    "Al Hufuf",
    "Yanbu",
    "Al Jubail",
    "Al Khafji",
    "Arar",
    "Sakaka",
    "Hafar Al-Batin",
    "Qatif",
    "Al Bahah",
    "Jizan",
    "Al Majma'ah",
    "Al Zulfi",
    "Unaizah",
    "Rabigh",
    "Ras Tanura",
    "Safwa",
    "Turubah",
    "Turaif",
    "Wadi ad-Dawasir",
  ].map((loc) => ({ value: loc, label: loc }));

  const predefinedPrices = [
    ...Array.from({ length: 10 }, (_, i) => ({
      value: i + 1,
      label: (i + 1).toString(),
    })),
    { value: "Unlimited", label: "Unlimited" },
  ];

  const quantityOptions = [
    ...Array.from({ length: 100 }, (_, i) => ({ value: i + 1, label: i + 1 })),
    { value: "Unlimited", label: "Unlimited" },
  ];

  const [subCategoryOptions, setSubCategoryOptions] = useState([]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const products = await getDocuments("products");
        const categoryData = {};

        products.forEach((product) => {
          const category = product.category || "Uncategorized";
          const subCategory = product.subCategory || "Uncategorized";

          if (!categoryData[category]) {
            categoryData[category] = new Set();
          }
          categoryData[category].add(subCategory);
        });

        // Convert sets to arrays and ensure proper formatting
        const formattedCategories = Object.keys(categoryData).map((cat) => ({
          value: cat,
          label: cat,
        }));

        const formattedSubCategoriesMap = {};
        Object.entries(categoryData).forEach(([category, subCategories]) => {
          formattedSubCategoriesMap[category] = Array.from(subCategories).map(
            (sub) => ({
              value: sub, // Ensure correct formatting
              label: sub,
            })
          );
        });

        setSubCategoriesMap(formattedSubCategoriesMap);

        Object.entries(categoryData).forEach(([category, subCategories]) => {
          formattedSubCategoriesMap[category] = [
            ...Array.from(subCategories).map((sub) => ({
              value: sub,
              label: sub,
            })),
            { value: "Others", label: "Others" },
          ];
        });

        setCategories(formattedCategories);
        setSubCategoriesMap(formattedSubCategoriesMap);
      } catch (error) {
        console.error("Error fetching categories and subcategories:", error);
      }
    };

    fetchCategories();
  }, []);

  useEffect(() => {
    if (!subCategoriesMap || !productId) return;

    const fetchProduct = async () => {
      try {
        const fetchedProducts = await getDocuments("products");
        const foundProduct = fetchedProducts.find(
          (item) => item.id === productId
        );

        if (foundProduct) {
          // Format sizes and colors
          const formattedSizes =
            foundProduct.sizes?.map((size) => ({ value: size, label: size })) ||
            [];
          const formattedColors =
            foundProduct.colors?.map((color) => ({
              value: color,
              label: color,
            })) || [];

          // Format price ranges with nested locations
          const priceRanges = foundProduct.priceRanges?.map((range) => ({
            ...range,
            minQty: { value: range.minQty, label: range.minQty },
            maxQty: { value: range.maxQty, label: range.maxQty },
            price: range.price || 0,
            locations: range.locations?.map((loc) => ({
              value: loc.location,
              label: loc.location,
              locationPrice: loc.locationPrice,
            })),
          }));

          // Update the state with product and subcategories
          setProduct({
            ...foundProduct,
            sizes: formattedSizes,
            colors: formattedColors,
            priceRanges,
          });

          setOriginalProduct({
            ...foundProduct,
            sizes: formattedSizes,
            colors: formattedColors,
            priceRanges,
          });

          // Update sub-category options if category exists
          if (foundProduct.category) {
            const subCatOptions = subCategoriesMap[foundProduct.category]?.map(
              (subCat) => ({
                value: subCat.value || subCat, // Ensure compatibility with format
                label: subCat.label || subCat,
              })
            );

            setSubCategoryOptions(subCatOptions || []);
          }
        } else {
          showError("Product not found!");
          navigate("/admin-dashboard");
        }
      } catch (error) {
        console.error("Error fetching product:", error);
      }
    };

    fetchProduct();
  }, [productId, subCategoriesMap, navigate]);

  const uploadImageToStorage = async (file, path) => {
    const fileRef = ref(storage, `${path}/${file.name}`);
    const uploadTask = uploadBytesResumable(fileRef, file);

    return new Promise((resolve, reject) => {
      uploadTask.on(
        "state_changed",
        null,
        (error) => {
          console.error("Upload error:", error);
          reject(error);
        },
        async () => {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          resolve(downloadURL);
        }
      );
    });
  };

  const handleImageUpload = async (field, files) => {
    setIsUploading(true);

    try {
      // Ensure files is always an array
      const filesArray = Array.isArray(files) ? files : Array.from(files);

      const urls = await Promise.all(
        filesArray.map((file) =>
          uploadImageToStorage(file, `products/${productId}`)
        )
      );

      if (field === "mainImageUrl") {
        handleChange(field, urls[0]);
      } else if (field === "additionalImageUrls") {
        handleChange(field, [...(product.additionalImageUrls || []), ...urls]);
      }
    } catch (error) {
      console.error("Error uploading images:", error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveImage = (field, index) => {
    if (field === "additionalImageUrls") {
      const updatedImages = product.additionalImageUrls.filter(
        (_, i) => i !== index
      );
      handleChange(field, updatedImages);
    } else if (field === "mainImageUrl") {
      handleChange(field, null);
    }
  };

  const handleSave = async () => {
    if (!product) return;

    const updatedProduct = {
      ...product,
      sizes: product.sizes?.map((size) => size.value) || [],
      colors: product.colors?.map((color) => color.value) || [],
      priceRanges:
        product.priceRanges?.map((range) => ({
          minQty: range.minQty?.value || "",
          maxQty: range.maxQty?.value || "",
          price: range.price || 0,
          locations:
            range.locations?.map((loc) => ({
              location: loc.value,
              locationPrice: loc.locationPrice,
            })) || [],
        })) || [],
    };

    try {
      await updateDocument("products", product.id, updatedProduct);
      showSuccess("Product updated successfully!");
      // Delay redirection to allow the notification to be read
      setTimeout(() => {
        navigate("/admin-dashboard");
      }, 3000); // 3 seconds delay
    } catch (error) {
      console.error("Error saving product:", error);
      showError(
        "Error",
        "An error occurred while saving the product. Please try again."
      );
    }
  };

  const handleChange = (field, value) => {
    setProduct((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleCategoryChange = (selectedOption) => {
    const category = selectedOption.value;
    handleChange("category", category);
    setSubCategoryOptions(subCategoriesMap[category] || []);
    handleChange("subCategory", ""); // Reset subcategory when category changes
  };

  const handleSubCategoryChange = (selectedOption) => {
    if (selectedOption.value === "Others") {
      handleChange("subCategory", selectedOption?.value || "");
    } else {
      handleChange("subCategory", selectedOption.value);
    }
  };

  const handleAddPriceRange = () => {
    const newRange = { minQty: "", maxQty: "", price: 0, locations: [] };
    setProduct((prev) => ({
      ...prev,
      priceRanges: [...(prev.priceRanges || []), newRange],
    }));
  };

  const handleRemovePriceRange = (index) => {
    const updatedRanges = product.priceRanges.filter((_, i) => i !== index);
    setProduct((prev) => ({
      ...prev,
      priceRanges: updatedRanges,
    }));
  };

  const handlePriceRangeChange = (index, field, value) => {
    const updatedRanges = [...product.priceRanges];
    updatedRanges[index][field] = value;
    setProduct((prev) => ({
      ...prev,
      priceRanges: updatedRanges,
    }));
  };

  const handleLocationChange = (index, locIndex, field, value) => {
    const updatedRanges = [...product.priceRanges];
    const location = updatedRanges[index].locations[locIndex] || {};

    updatedRanges[index].locations[locIndex] = {
      ...location,
      [field]: field === "value" ? value.value : value, // Update value or locationPrice
      label: field === "value" ? value.label : location.label, // Ensure label is set when changing value
    };

    setProduct((prev) => ({
      ...prev,
      priceRanges: updatedRanges,
    }));
  };

  const handleAddLocation = (index) => {
    const updatedRanges = [...product.priceRanges];
    updatedRanges[index].locations.push({
      value: "",
      label: "",
      locationPrice: 0,
    });
    setProduct((prev) => ({
      ...prev,
      priceRanges: updatedRanges,
    }));
  };

  const handleRemoveLocation = (index, locIndex) => {
    const updatedRanges = [...product.priceRanges];
    updatedRanges[index].locations.splice(locIndex, 1);
    setProduct((prev) => ({
      ...prev,
      priceRanges: updatedRanges,
    }));
  };

  const isOriginalValue = (field, value, index = null, locIndex = null) => {
    if (!originalProduct) return false; // Ensure originalProduct exists
    if (field === "locations") {
      // Check locations inside a price range
      const originalLocation =
        originalProduct.priceRanges?.[index]?.locations?.[locIndex];
      return (
        originalLocation?.value === value.value &&
        originalLocation?.locationPrice === value.locationPrice
      );
    }
    if (["minQty", "maxQty", "price"].includes(field)) {
      // Check price range fields
      const originalRange = originalProduct.priceRanges?.[index];
      return originalRange?.[field]?.value === value?.value;
    }
    return originalProduct[field] === value; // Default check for non-nested fields
  };

  const isValidNumberInput = (value) => /^[0-9]*\.?[0-9]+$/.test(value);

  if (!product) return <p>Loading product details...</p>;

  return (
    <div className='container py-5'>
      <h2 className='text-success fw-bold mb-4'>Admin Product Editor</h2>

      {/* First Row */}
      <div className='row'>
        <div className='col-md-3'>
          <label>Product Name</label>
          <input
            type='text'
            className='form-control'
            style={{
              color: isOriginalValue("productName", product.productName)
                ? "#2c6449"
                : "black",
            }}
            value={
              typeof product.productName === "object"
                ? product.productName[currentLang] || ""
                : product.productName || ""
            }
          />
        </div>
        <div className='col-md-3'>
          <label>Category</label>
          <Select
            options={categories}
            value={categories.find(
              (option) => option.value === product.category
            )}
            onChange={handleCategoryChange}
            placeholder='Select a category'
            styles={{
              singleValue: (base, { data }) => ({
                ...base,
                color: isOriginalValue("category", data.value)
                  ? "#2c6449"
                  : "black",
              }),
            }}
          />
        </div>
        <div className='col-md-3'>
          <label>Sub-Category</label>
          <Select
            options={subCategoryOptions}
            value={subCategoryOptions.find(
              (option) => option.value === product.subCategory
            )}
            onChange={handleSubCategoryChange}
            placeholder='Select a sub-category'
            isDisabled={!subCategoryOptions.length}
            styles={{
              singleValue: (base, { data }) => ({
                ...base,
                color: isOriginalValue("subCategory", data.value)
                  ? "#2c6449"
                  : "black",
              }),
            }}
          />
        </div>

        <div className='col-md-3'>
          <label>Description</label>
          <input
            type='text'
            className='form-control'
            style={{
              color: isOriginalValue("description", product.description)
                ? "#2c6449"
                : "black",
            }}
            value={
              typeof product.description === "object"
                ? product.description[currentLang] || ""
                : product.description || ""
            }
          />
        </div>
      </div>

      {/* Second Row */}
      <div className='row mt-4'>
        <div className='col-md-3'>
          <label>Main Location</label>
          <input
            type='text'
            className='form-control'
            style={{
              color: isOriginalValue("mainLocation", product.mainLocation)
                ? "#2c6449"
                : "black",
            }}
            value={product.mainLocation || ""}
            onChange={(e) => handleChange("mainLocation", e.target.value)}
          />
        </div>
        <div className='col-md-3'>
          <label>Sizes</label>
          <CreatableSelect
            isMulti
            options={predefinedSizes}
            value={product.sizes}
            onChange={(selectedOptions) =>
              handleChange("sizes", selectedOptions || [])
            }
            placeholder='Select or add sizes'
            styles={{
              multiValueLabel: (base, { data }) => ({
                ...base,
                color: isOriginalValue("sizes", data.value)
                  ? "#2c6449"
                  : "black",
              }),
            }}
          />
        </div>
        <div className='col-md-3'>
          <label>Colors</label>
          <CreatableSelect
            isMulti
            options={predefinedColors}
            value={product.colors}
            onChange={(selectedOptions) =>
              handleChange("colors", selectedOptions || [])
            }
            placeholder='Select or add colors'
            styles={{
              multiValueLabel: (base, { data }) => ({
                ...base,
                color: isOriginalValue("colors", data.value)
                  ? "#2c6449"
                  : "black",
              }),
            }}
          />
        </div>
      </div>

      {/* Third Row for Images */}
      <div className='row mt-4'>
        <div className='col-md-6'>
          <label>Main Image</label>
          <input
            type='file'
            className='form-control'
            onChange={(e) => handleImageUpload("mainImageUrl", e.target.files)}
          />
          {product.mainImageUrl && (
            <div className='mt-3 position-relative'>
              <img
                src={product.mainImageUrl}
                alt='Product Main'
                className='img-thumbnail'
                style={{ maxWidth: "300px", maxHeight: "300px" }}
              />
              <button
                type='button'
                className='btn btn-danger btn-sm position-absolute top-0 end-0'
                onClick={() => handleRemoveImage("mainImageUrl")}
              >
                ✕
              </button>
            </div>
          )}
        </div>
        <div className='col-md-6'>
          <label>Additional Images</label>
          <input
            type='file'
            multiple
            className='form-control'
            onChange={(e) =>
              handleImageUpload(
                "additionalImageUrls",
                Array.from(e.target.files)
              )
            }
          />
          {product.additionalImageUrls?.length > 0 && (
            <div className='mt-3 d-flex flex-wrap gap-2'>
              {product.additionalImageUrls.map((img, index) => (
                <div key={index} className='position-relative'>
                  <img
                    src={img}
                    alt={`Additional ${index}`}
                    className='img-thumbnail'
                    style={{ maxWidth: "100px", maxHeight: "100px" }}
                  />
                  <button
                    type='button'
                    className='btn btn-danger btn-sm position-absolute top-0 end-0'
                    onClick={() =>
                      handleRemoveImage("additionalImageUrls", index)
                    }
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className='mt-4'>
        <h4>Price Ranges and Locations</h4>
        {product.priceRanges?.map((range, index) => (
          <div key={index} className='row border p-3 mb-3'>
            {/* Left Column: Price Range */}
            <div className='col-md-6'>
              <div className='row mb-2'>
                <div className='col-4'>
                  <label>Min Qty</label>
                  <CreatableSelect
                    options={quantityOptions}
                    value={range.minQty}
                    onChange={(selectedOption) =>
                      handlePriceRangeChange(index, "minQty", selectedOption)
                    }
                    placeholder='Select Min Qty'
                    styles={{
                      singleValue: (base, { data }) => ({
                        ...base,
                        color: isOriginalValue("minQty", data?.value)
                          ? "#2c6449"
                          : "black", // Use isOriginalValue
                      }),
                      control: (base) => ({
                        ...base,
                        borderColor: "#2c6449",
                      }),
                      option: (base, { isFocused }) => ({
                        ...base,
                        backgroundColor: isFocused ? "#2c6449" : "white",
                        color: isFocused ? "white" : "#2c6449",
                      }),
                    }}
                  />
                </div>
                <div className='col-4'>
                  <label>Max Qty</label>
                  <CreatableSelect
                    options={quantityOptions}
                    value={range.maxQty}
                    onChange={(selectedOption) =>
                      handlePriceRangeChange(index, "maxQty", selectedOption)
                    }
                    placeholder='Select Max Qty'
                    styles={{
                      singleValue: (base, { data }) => ({
                        ...base,
                        color: isOriginalValue("maxQty", data?.value)
                          ? "#2c6449"
                          : "black",
                      }),
                      control: (base) => ({
                        ...base,
                        borderColor: "#2c6449",
                      }),
                      option: (base, { isFocused }) => ({
                        ...base,
                        backgroundColor: isFocused ? "#2c6449" : "white",
                        color: isFocused ? "white" : "#2c6449",
                      }),
                    }}
                  />
                </div>
                <div className='col-4'>
                  <label>Price</label>
                  <CreatableSelect
                    options={predefinedPrices}
                    value={
                      range.price === "Unlimited"
                        ? { value: "Unlimited", label: "Unlimited" }
                        : { value: range.price, label: String(range.price) }
                    }
                    onChange={(selectedOption) => {
                      const value = selectedOption.value;
                      if (value === "Unlimited") {
                        handlePriceRangeChange(index, "price", "Unlimited");
                      } else {
                        const parsed = parseFloat(value);
                        handlePriceRangeChange(
                          index,
                          "price",
                          isNaN(parsed) ? 0 : parsed
                        );
                      }
                    }}
                    onCreateOption={(inputValue) => {
                      if (!isValidNumberInput(inputValue)) {
                        showError(
                          "Please enter a valid number (no letters or symbols)."
                        );

                        return;
                      }

                      const numericValue = parseFloat(inputValue);
                      if (numericValue >= 0.01 && numericValue <= 100000) {
                        const newOption = {
                          value: numericValue,
                          label: inputValue,
                        };
                        handlePriceRangeChange(index, "price", numericValue);
                        predefinedPrices.push(newOption); // Optional
                      } else {
                        showError(
                          "Please enter a number between 1 and 100000."
                        );
                      }
                    }}
                    placeholder='Enter or select price'
                    isClearable
                    styles={{
                      singleValue: (base, { data }) => ({
                        ...base,
                        color: isOriginalValue("price", data?.value)
                          ? "#2c6449"
                          : "black",
                      }),
                      control: (base) => ({
                        ...base,
                        borderColor: "#2c6449",
                      }),
                      option: (base, { isFocused }) => ({
                        ...base,
                        backgroundColor: isFocused ? "#2c6449" : "white",
                        color: isFocused ? "white" : "#2c6449",
                      }),
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Right Column: Locations */}
            <div className='col-md-6'>
              <h5>Deliver Locations</h5>
              {range.locations.map((loc, locIndex) => (
                <div key={locIndex} className='row mb-2'>
                  <div className='col-6'>
                    <CreatableSelect
                      options={predefinedLocations}
                      value={range.locations[locIndex]} // This should be an object { value, label }
                      onChange={(selectedOption) =>
                        handleLocationChange(
                          index,
                          locIndex,
                          "value",
                          selectedOption
                        )
                      }
                      placeholder='Select or add location'
                      styles={{
                        singleValue: (base, { data }) => ({
                          ...base,
                          color: isOriginalValue(
                            "locations",
                            range.locations[locIndex],
                            index,
                            locIndex
                          )
                            ? "#2c6449"
                            : "black",
                        }),
                        control: (base) => ({
                          ...base,
                          borderColor: "#2c6449",
                        }),
                        option: (base, { isFocused }) => ({
                          ...base,
                          backgroundColor: isFocused ? "#2c6449" : "white",
                          color: isFocused ? "white" : "#2c6449",
                        }),
                      }}
                    />
                  </div>
                  <div className='col-4'>
                    <CreatableSelect
                      options={predefinedPrices}
                      value={
                        loc.locationPrice === "Unlimited"
                          ? { value: "Unlimited", label: "Unlimited" }
                          : loc.locationPrice !== undefined
                          ? {
                              value: loc.locationPrice,
                              label: String(loc.locationPrice),
                            }
                          : null
                      }
                      onChange={(selectedOption) => {
                        const value = selectedOption?.value;
                        if (value === "Unlimited") {
                          handleLocationChange(
                            index,
                            locIndex,
                            "locationPrice",
                            "Unlimited"
                          );
                        } else {
                          const parsed = parseFloat(value);
                          handleLocationChange(
                            index,
                            locIndex,
                            "locationPrice",
                            isNaN(parsed) ? 0 : parsed
                          );
                        }
                      }}
                      onCreateOption={(inputValue) => {
                        if (!/^[0-9]*\.?[0-9]+$/.test(inputValue)) {
                          showError(
                            "Please enter a valid number (no letters or symbols)."
                          );
                          return;
                        }

                        const numericValue = parseFloat(inputValue);
                        if (numericValue < 0.01 || numericValue > 100000) {
                          showError(
                            "Please enter a number between 0 and 100000."
                          );
                          return;
                        }

                        // Add manually created price
                        const newOption = {
                          value: numericValue,
                          label: inputValue,
                        };

                        handleLocationChange(
                          index,
                          locIndex,
                          "locationPrice",
                          numericValue
                        );
                        predefinedPrices.push(newOption); // Optional reuse
                      }}
                      isClearable
                      placeholder='Enter or select price'
                      styles={{
                        singleValue: (base, { data }) => ({
                          ...base,
                          color: isOriginalValue(
                            "locations",
                            loc,
                            index,
                            locIndex
                          )
                            ? "#2c6449"
                            : "black",
                        }),
                        control: (base) => ({
                          ...base,
                          borderColor: "#2c6449",
                        }),
                        option: (base, { isFocused }) => ({
                          ...base,
                          backgroundColor: isFocused ? "#2c6449" : "white",
                          color: isFocused ? "white" : "#2c6449",
                        }),
                      }}
                    />
                  </div>
                  <div className='col-2'>
                    <button
                      className='btn btn-danger btn-sm'
                      onClick={() => handleRemoveLocation(index, locIndex)}
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
              <button
                type='button'
                onClick={() => handleAddLocation(index)}
                className='btn btn-secondary btn-sm'
              >
                Add Location
              </button>
            </div>
            <div className='col-12 mt-3'>
              <button
                className='btn btn-danger btn-sm'
                onClick={() => handleRemovePriceRange(index)}
              >
                Remove Price Range
              </button>
            </div>
          </div>
        ))}
        <button className='btn btn-success' onClick={handleAddPriceRange}>
          Add Price Range
        </button>
      </div>

      {/* Save and Cancel Buttons */}
      <div className='form-group mt-4'>
        <button
          className='btn'
          style={{
            backgroundColor: "#2c6449",
            color: "white",
            borderColor: "#2c6449",
          }}
          onClick={isUploading ? null : handleSave}
          disabled={isUploading}
        >
          {isUploading ? "Uploading..." : "Save Changes"}
        </button>
        <button
          className='btn btn-secondary ms-2'
          onClick={() => navigate("/admin-dashboard")}
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

export default AdminEditProducts;
