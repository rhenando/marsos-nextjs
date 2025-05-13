import React, { useState, useEffect } from "react";
import { Form, Button, Container } from "react-bootstrap";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../../firebase/config";
import CreatableSelect from "react-select/creatable";

import Notification from "../global/Notification";
import EditSupplier from "../admin/EditSupplier";
import LoadingSpinner from "../global/LoadingSpinner";
import { useTranslation } from "react-i18next";

const Suppliers = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [suppliersPerPage] = useState(8);
  const [showForm, setShowForm] = useState(false);
  const [editingSupplierId, setEditingSupplierId] = useState(null);

  const [isLoading, setIsLoading] = useState(false); // Loading state

  const { t } = useTranslation();

  // Form State
  const [name, setName] = useState("");
  const [countryCode, setCountryCode] = useState({
    label: "+966",
    value: "+966",
  });
  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [companyLogo, setCompanyLogo] = useState(null);
  const [crNumber, setCrNumber] = useState("");
  const [crLicense, setCrLicense] = useState(null);
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [region, setRegion] = useState("");
  const [otherCitiesServed, setOtherCitiesServed] = useState([]);
  const [deliveryOption, setDeliveryOption] = useState("own");
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [notificationContent, setNotificationContent] = useState({
    title: "",
    message: "",
  });

  const countryCodeOptions = [
    { label: "+966 (Saudi Arabia)", value: "+966" },
    { label: "+971 (UAE)", value: "+971" },
    { label: "+973 (Bahrain)", value: "+973" },
    { label: "+974 (Qatar)", value: "+974" },
    { label: "+965 (Kuwait)", value: "+965" },
    { label: "+968 (Oman)", value: "+968" },
  ];

  const saudiCities = [
    "Riyadh",
    "Jeddah",
    "Mecca",
    "Medina",
    "Dammam",
    "Khobar",
    "Taif",
    "Tabuk",
    "Qatif",
    "Abha",
    "Khamis Mushait",
    "Al Khafji",
    "Hafar Al-Batin",
    "Al Qunfudhah",
    "Yanbu",
    "Najran",
    "Jizan",
    "Al Hasa",
    "Hail",
    "Al Baha",
    "Al Jubail",
  ];

  const saudiCityOptions = saudiCities.map((city) => ({
    label: city,
    value: city,
  }));

  const fetchSuppliers = async () => {
    try {
      const q = query(collection(db, "users"), where("role", "==", "supplier"));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const suppliersData = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setSuppliers(suppliersData);
      } else {
        console.log("No suppliers found.");
      }
    } catch (error) {
      console.error("Error fetching suppliers:", error);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const handleEditClick = (supplierId) => {
    setEditingSupplierId(supplierId);
  };

  const handleEditClose = () => {
    setEditingSupplierId(null);
  };

  const handleEditUpdated = () => {
    fetchSuppliers(); // Refresh supplier list after edit
  };

  // Pagination logic
  const indexOfLastSupplier = currentPage * suppliersPerPage;
  const indexOfFirstSupplier = indexOfLastSupplier - suppliersPerPage;
  const currentSuppliers = suppliers.slice(
    indexOfFirstSupplier,
    indexOfLastSupplier
  );

  const totalPages = Math.ceil(suppliers.length / suppliersPerPage);

  const handleDelete = async (supplierId) => {
    if (!window.confirm("Are you sure you want to delete this supplier?"))
      return;

    try {
      const response = await fetch(
        // `http://localhost:8080/api/delete-supplier/${supplierId}`,
        `https://marsos.com.sa/api1/api/delete-supplier/${supplierId}`,
        { method: "DELETE" }
      );

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || "Failed to delete supplier");
      }

      setSuppliers(suppliers.filter((supplier) => supplier.id !== supplierId));
      setNotificationContent({
        title: "Deleted",
        message: "Supplier deleted successfully!",
      });
      setIsNotificationOpen(true);
    } catch (error) {
      console.error("Error deleting supplier:", error);
      setNotificationContent({
        title: "Error",
        message: "Failed to delete supplier. Please try again.",
      });
      setIsNotificationOpen(true);
    }
  };

  // const handleSubmit = async (e) => {
  //   e.preventDefault();

  //   const otherCities = otherCitiesServed.map((option) => option.value);
  //   const fullPhoneNumber = `${countryCode.value}${phoneNumber}`;

  //   const formData = new FormData();
  //   formData.append("name", name);
  //   formData.append("phone", fullPhoneNumber);
  //   formData.append("email", email);
  //   formData.append("companyName", companyName);
  //   formData.append("companyLogo", companyLogo);
  //   formData.append("crLicense", crLicense);
  //   formData.append("crNumber", crNumber);
  //   formData.append("address", address);
  //   formData.append("city", city);
  //   formData.append("region", region);
  //   formData.append("otherCitiesServed", JSON.stringify(otherCities));
  //   formData.append("deliveryOption", deliveryOption);

  //   try {
  //     const response = await fetch(
  //       "https://marsos.com.sa/api/create-supplier",
  //       {
  //         method: "POST",
  //         body: formData,
  //       }
  //     );

  //     const result = await response.json();

  //     if (response.ok) {
  //       console.log("Supplier created successfully:", result);

  //       // Construct the new supplier object manually
  //       const newSupplier = {
  //         id: result.id,
  //         name,
  //         phone: fullPhoneNumber,
  //         email,
  //         companyName,
  //         address,
  //         city,
  //         region,
  //         otherCitiesServed: otherCities,
  //         deliveryOption,
  //       };

  //       setSuppliers([...suppliers, newSupplier]);
  //       setShowForm(false);
  //       setNotificationContent({
  //         title: "Success",
  //         message: "Supplier added successfully!",
  //       });
  //       setIsNotificationOpen(true);
  //     } else {
  //       console.error("Error creating supplier:", result.message);
  //     }
  //   } catch (error) {
  //     console.error("Error:", error);
  //   } finally {
  //     setIsLoading(false); // Stop loading
  //     console.log("Form submission ended");
  //   }
  // };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Start loading
    setIsLoading(true);

    const otherCities = otherCitiesServed.map((option) => option.value);
    const fullPhoneNumber = `${countryCode.value}${phoneNumber}`;

    const formData = new FormData();
    formData.append("name", name);
    formData.append("phone", fullPhoneNumber);
    formData.append("email", email);
    formData.append("companyName", companyName);
    formData.append("companyLogo", companyLogo);
    formData.append("crLicense", crLicense);
    formData.append("crNumber", crNumber);
    formData.append("address", address);
    formData.append("city", city);
    formData.append("region", region);
    formData.append("otherCitiesServed", JSON.stringify(otherCities));
    formData.append("deliveryOption", deliveryOption);

    try {
      const response = await fetch(
        "https://marsos.com.sa/api1/api/create-supplier",
        {
          method: "POST",
          body: formData,
        }
      );

      const result = await response.json();

      if (response.ok) {
        console.log("Supplier created successfully:", result);

        // Construct the new supplier object manually
        const newSupplier = {
          id: result.id,
          name,
          phone: fullPhoneNumber,
          email,
          companyName,
          address,
          city,
          region,
          otherCitiesServed: otherCities,
          deliveryOption,
        };

        setSuppliers([...suppliers, newSupplier]);
        setShowForm(false);
        setNotificationContent({
          title: "Success",
          message: "Supplier added successfully!",
        });
        setIsNotificationOpen(true);
      } else {
        console.error("Error creating supplier:", result.message);
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      // Ensure spinner stays visible for at least 500ms
      setTimeout(() => {
        setIsLoading(false);
        console.log("Form submission ended");
      }, 500);
    }
  };

  return (
    <Container className='py-3'>
      {isLoading && <LoadingSpinner />}

      <div className='mb-4'>
        <h4 className='text-success fw-bold'>
          {t("admin_supplier.suppliers")}
        </h4>
        <p className='text-muted small'>
          {t("admin_supplier.manage_suppliers")}
        </p>
      </div>

      <div className='d-flex justify-content-between align-items-center mb-3'>
        <Button
          variant='success'
          size='sm'
          onClick={() => setShowForm(!showForm)}
        >
          {showForm
            ? t("admin_supplier.cancel")
            : t("admin_supplier.add_suppliers")}
        </Button>
      </div>

      {showForm && (
        <Form
          onSubmit={handleSubmit}
          className='p-4 border rounded shadow-sm bg-white'
          style={{ width: "100%", maxWidth: "400px", margin: "0 auto" }}
        >
          {/* Name */}
          <Form.Group controlId='formName' className='mb-3'>
            <Form.Control
              type='text'
              placeholder='Name'
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </Form.Group>

          {/* Country Code and Phone Number */}
          <Form.Group controlId='formPhoneNumber' className='mb-3'>
            <div className='d-flex align-items-center'>
              {/* Country Code Dropdown */}
              <div style={{ width: "100px", marginRight: "10px" }}>
                <CreatableSelect
                  options={countryCodeOptions}
                  value={countryCode}
                  onChange={(selectedOption) => setCountryCode(selectedOption)}
                  styles={{
                    control: (provided) => ({
                      ...provided,
                      minHeight: "38px",
                      fontSize: "14px",
                    }),
                    menu: (provided) => ({
                      ...provided,
                      fontSize: "14px",
                    }),
                  }}
                />
              </div>

              {/* Phone Number Input */}
              <Form.Control
                type='text'
                placeholder='Phone Number'
                value={phoneNumber}
                onChange={(e) =>
                  setPhoneNumber(e.target.value.replace(/\D/g, ""))
                } // Remove non-numeric characters
                maxLength={9}
                style={{ flex: 1, maxWidth: "250px" }}
                required
              />
            </div>
          </Form.Group>

          {/* Email */}
          <Form.Group controlId='formEmail' className='mb-3'>
            <Form.Control
              type='email'
              placeholder='Email'
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </Form.Group>

          {/* Company Name */}
          <Form.Group controlId='formCompanyName' className='mb-3'>
            <Form.Control
              type='text'
              placeholder='Company Name'
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              required
            />
          </Form.Group>

          {/* Company Logo */}
          <Form.Group controlId='formCompanyLogo' className='mb-3'>
            <div
              className='mb-1'
              style={{
                fontSize: "0.9rem",
                fontWeight: "bold",
                color: "#2d6a4f",
              }}
            >
              Upload your company logo (e.g., PNG or JPEG)
            </div>
            <Form.Control
              type='file'
              onChange={(e) => setCompanyLogo(e.target.files[0])}
              accept='image/*'
            />
          </Form.Group>

          {/* CR Number */}
          <Form.Group controlId='formCrNumber' className='mb-3'>
            <Form.Control
              type='text'
              placeholder='CR Number'
              value={crNumber}
              onChange={(e) => setCrNumber(e.target.value)}
              required
            />
          </Form.Group>

          {/* CR License */}
          <Form.Group controlId='formCrLicense' className='mb-3'>
            <div
              className='mb-1'
              style={{
                fontSize: "0.9rem",
                fontWeight: "bold",
                color: "#2d6a4f",
              }}
            >
              Upload CR document (e.g., PDF or JPEG)
            </div>
            <Form.Control
              type='file'
              onChange={(e) => setCrLicense(e.target.files[0])}
              accept='image/*,.pdf'
            />
          </Form.Group>

          {/* Manual Address Input */}
          <Form.Group controlId='formAddress' className='mb-3'>
            <Form.Control
              type='text'
              placeholder='Full Address'
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              required
            />
          </Form.Group>

          <Form.Group controlId='formCity' className='mb-3'>
            <Form.Control
              type='text'
              placeholder='City'
              value={city}
              onChange={(e) => setCity(e.target.value)}
              required
            />
          </Form.Group>

          <Form.Group controlId='formRegion' className='mb-3'>
            <Form.Control
              type='text'
              placeholder='Region'
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              required
            />
          </Form.Group>

          {/* Other Cities Served */}
          <Form.Group controlId='formOtherCitiesServed' className='mb-3'>
            <CreatableSelect
              isMulti
              options={saudiCityOptions}
              value={otherCitiesServed}
              onChange={(selectedOptions) =>
                setOtherCitiesServed(selectedOptions || [])
              }
              placeholder='Other Cities Served'
            />
          </Form.Group>

          {/* Delivery Option */}
          <Form.Group controlId='formDeliveryOption' className='mb-3'>
            <div>
              <Form.Check
                type='radio'
                label='Own Delivery'
                name='deliveryOption'
                value='own'
                checked={deliveryOption === "own"}
                onChange={(e) => setDeliveryOption(e.target.value)}
              />
              <Form.Check
                type='radio'
                label='Outside Delivery'
                name='deliveryOption'
                value='outside'
                checked={deliveryOption === "outside"}
                onChange={(e) => setDeliveryOption(e.target.value)}
              />
            </div>
          </Form.Group>

          {/* Submit Button */}
          <Button
            variant='success'
            type='submit'
            className='w-100'
            disabled={isLoading}
          >
            {console.log("isLoading:", isLoading)}
            {isLoading ? (
              <>
                <LoadingSpinner />
                &nbsp;Saving...
              </>
            ) : (
              "Save Supplier"
            )}
          </Button>
        </Form>
      )}

      <Notification
        isOpen={isNotificationOpen}
        onClose={() => setIsNotificationOpen(false)}
        title={notificationContent.title}
        message={notificationContent.message}
        duration={3000}
      />

      {suppliers.length > 0 ? (
        <>
          <table className='table table-striped table-hover mt-4'>
            <thead>
              <tr>
                <th>{t("admin_supplier.name")}</th>
                <th>{t("admin_supplier.phone")}</th>
                <th>{t("admin_supplier.email")}</th>
                <th>{t("admin_supplier.company_name")}</th>
                <th>{t("admin_supplier.actions")}</th>
              </tr>
            </thead>
            <tbody>
              {currentSuppliers.map((supplier) => (
                <tr key={supplier.id}>
                  <td>{supplier.name}</td>
                  <td>{supplier.phone}</td>
                  <td>{supplier.email || "N/A"}</td>
                  <td>{supplier.companyName || "N/A"}</td>
                  <td>
                    <button
                      className='btn btn-outline-secondary btn-sm me-2'
                      onClick={() => handleEditClick(supplier.id)}
                    >
                      {t("admin_supplier.edit")}
                    </button>
                    <button
                      className='btn btn-danger btn-sm'
                      onClick={() => handleDelete(supplier.id)}
                    >
                      {t("admin_supplier.remove")}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Edit Supplier Modal */}
          {editingSupplierId && (
            <EditSupplier
              supplierId={editingSupplierId}
              onClose={handleEditClose}
              onUpdated={handleEditUpdated}
            />
          )}
          <div className='d-flex justify-content-between align-items-center'>
            <button
              className='btn btn-secondary btn-sm'
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            >
              {t("admin_supplier.previous")}
            </button>
            <p className='mb-0'>
              {t("admin_supplier.page")} {currentPage} {t("admin_supplier.of")}{" "}
              {totalPages}
            </p>
            <button
              className='btn btn-secondary btn-sm'
              onClick={() =>
                setCurrentPage((prev) => Math.min(prev + 1, totalPages))
              }
              disabled={currentPage === totalPages}
            >
              {t("admin_supplier.next")}
            </button>
          </div>
        </>
      ) : (
        <p className='text-center mt-4'>No suppliers found.</p>
      )}
    </Container>
  );
};

export default Suppliers;
