import React, { useState, useEffect } from "react";

import CreatableSelect from "react-select/creatable";

const EditSupplier = ({ supplierId, onClose, onUpdated }) => {
  const [supplier, setSupplier] = useState(null);
  const [companyLogo, setCompanyLogo] = useState(null);
  const [crLicense, setCrLicense] = useState(null);
  const [loading, setLoading] = useState(true);
  const [countryCode, setCountryCode] = useState({
    label: "+966",
    value: "+966",
  });
  const [mainNumber, setMainNumber] = useState("");

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

  // Fetch supplier data
  useEffect(() => {
    const fetchSupplier = async () => {
      setLoading(true);
      try {
        const response = await fetch(
          // `http://localhost:8080/api/get-supplier/${supplierId}`
          `https://marsos.com.sa/api1/api/get-supplier/${supplierId}`
        );
        if (!response.ok) {
          throw new Error("Failed to fetch supplier data");
        }
        const data = await response.json();

        setSupplier(data);

        // Extract phone data
        const phone = data.phone || "";
        const phoneMatch = phone.match(/^(\+\d+)(\d{9})$/); // Example: +966555555555
        if (phoneMatch) {
          setCountryCode({ label: phoneMatch[1], value: phoneMatch[1] });
          setMainNumber(phoneMatch[2]);
        } else {
          setCountryCode({ label: "+966", value: "+966" });
          setMainNumber(phone);
        }
      } catch (error) {
        console.error("Error fetching supplier:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSupplier();
  }, [supplierId]);

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!supplier) {
      alert("Supplier data is not loaded yet.");
      return;
    }

    const formData = new FormData();
    formData.append("name", supplier.name);
    formData.append("phone", `${countryCode.value}${mainNumber}`);
    formData.append("email", supplier.email);
    formData.append("companyName", supplier.companyName);
    formData.append("crNumber", supplier.crNumber);
    formData.append("address", supplier.address);
    formData.append("city", supplier.city);
    formData.append("region", supplier.region);
    formData.append(
      "otherCitiesServed",
      JSON.stringify(supplier.otherCitiesServed || [])
    );

    if (companyLogo) formData.append("companyLogo", companyLogo);
    if (crLicense) formData.append("crLicense", crLicense);

    console.log("FormData being sent:");
    for (let pair of formData.entries()) {
      console.log(pair[0], pair[1]);
    }

    try {
      const response = await fetch(
        // `http://localhost:8080/api/edit-supplier/${supplierId}`,
        `https://marsos.com.sa/api1/api/edit-supplier/${supplierId}`,

        {
          method: "PUT",
          body: formData,
        }
      );
      if (!response.ok) {
        throw new Error("Failed to update supplier");
      }

      onUpdated(); // Notify parent to refresh the list
      onClose(); // Close the modal
    } catch (error) {
      console.error("Error updating supplier:", error);
      alert("Failed to update supplier. Please try again.");
    }
  };

  if (loading) return <p>Loading...</p>;
  if (!supplier) return <p>Supplier data not available.</p>;

  return (
    <div
      className='modal fade show d-block'
      tabIndex='-1'
      role='dialog'
      style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}
    >
      <div className='modal-dialog modal-lg' role='document'>
        <div className='modal-content'>
          <div className='modal-header'>
            <h5 className='modal-title'>Edit Supplier</h5>
            <button
              type='button'
              className='close ms-auto'
              onClick={onClose}
              aria-label='Close'
            >
              <span aria-hidden='true'>&times;</span>
            </button>
          </div>

          <div className='modal-body'>
            <form onSubmit={handleSubmit}>
              <div className='row'>
                <div className='col-md-6 mb-3'>
                  <label htmlFor='name'>Name</label>
                  <input
                    type='text'
                    id='name'
                    className='form-control'
                    placeholder='Name'
                    value={supplier?.name || ""}
                    onChange={(e) =>
                      setSupplier({ ...supplier, name: e.target.value })
                    }
                    required
                  />
                </div>

                <div className='col-md-6 mb-3'>
                  <label htmlFor='phone'>Phone</label>
                  <div className='d-flex'>
                    <CreatableSelect
                      options={[
                        { label: "+966 (Saudi Arabia)", value: "+966" },
                        { label: "+971 (UAE)", value: "+971" },
                        { label: "+973 (Bahrain)", value: "+973" },
                        { label: "+974 (Qatar)", value: "+974" },
                        { label: "+965 (Kuwait)", value: "+965" },
                        { label: "+968 (Oman)", value: "+968" },
                      ]}
                      value={countryCode}
                      onChange={(selectedOption) =>
                        setCountryCode(selectedOption)
                      }
                      styles={{
                        control: (provided) => ({
                          ...provided,
                          minHeight: "38px",
                          fontSize: "14px",
                          width: "120px",
                        }),
                      }}
                    />
                    <input
                      type='text'
                      id='mainNumber'
                      className='form-control ms-2'
                      placeholder='Main Number'
                      value={mainNumber}
                      onChange={(e) => setMainNumber(e.target.value)}
                      maxLength={9}
                      required
                    />
                  </div>
                </div>
              </div>

              <div className='row'>
                <div className='col-md-6 mb-3'>
                  <label htmlFor='email'>Email</label>
                  <input
                    type='email'
                    id='email'
                    className='form-control'
                    placeholder='Email'
                    value={supplier.email || ""}
                    onChange={(e) =>
                      setSupplier({ ...supplier, email: e.target.value })
                    }
                  />
                </div>

                <div className='col-md-6 mb-3'>
                  <label htmlFor='companyName'>Company Name</label>
                  <input
                    type='text'
                    id='companyName'
                    className='form-control'
                    placeholder='Company Name'
                    value={supplier.companyName || ""}
                    onChange={(e) =>
                      setSupplier({ ...supplier, companyName: e.target.value })
                    }
                    required
                  />
                </div>
              </div>

              <div className='row'>
                <div className='col-md-6 mb-3'>
                  <label htmlFor='logoUrl'>Company Logo</label>
                  {supplier.logoUrl && (
                    <div className='mb-2'>
                      {/* Render logo directly as an image */}
                      <img
                        src={supplier.logoUrl}
                        alt='Company Logo'
                        style={{
                          maxWidth: "100%",
                          height: "auto",
                          border: "1px solid #ddd",
                          padding: "5px",
                        }}
                      />
                    </div>
                  )}
                  <input
                    type='file'
                    id='logoUrl'
                    className='form-control'
                    onChange={(e) => setCompanyLogo(e.target.files[0])}
                  />
                </div>

                {/* <div className='col-md-6 mb-3'>
                  <label htmlFor='logoUrl'>Company Logo</label>
                  {supplier.logoUrl && (
                    <div className='mb-2'>
                      <a
                        href={supplier.logoUrl}
                        target='_blank'
                        rel='noopener noreferrer'
                      >
                        View Current Logo
                      </a>
                    </div>
                  )}
                  <input
                    type='file'
                    id='logoUrl'
                    className='form-control'
                    onChange={(e) => setCompanyLogo(e.target.files[0])}
                  />
                </div> */}

                {/* <div className='col-md-6 mb-3'>
                  <label htmlFor='crLicenseUrl'>CR License</label>
                  {supplier.crLicenseUrl && (
                    <div className='mb-2'>
                      <a
                        href={supplier.crLicenseUrl}
                        target='_blank'
                        rel='noopener noreferrer'
                      >
                        View Current License
                      </a>
                    </div>
                  )}
                  <input
                    type='file'
                    id='crLicenseUrl'
                    className='form-control'
                    onChange={(e) => setCrLicense(e.target.files[0])}
                  />
                </div> */}

                <div className='col-md-6 mb-3'>
                  <label htmlFor='crLicenseUrl'>CR License</label>
                  {supplier.crLicenseUrl && (
                    <div className='mb-2'>
                      {/* Render CR License based on file type */}
                      {supplier.crLicenseUrl.endsWith(".pdf") ? (
                        <iframe
                          src={supplier.crLicenseUrl}
                          title='CR License'
                          style={{
                            width: "100%",
                            height: "400px",
                            border: "1px solid #ddd",
                          }}
                        />
                      ) : (
                        <img
                          src={supplier.crLicenseUrl}
                          alt='CR License'
                          style={{
                            maxWidth: "100%",
                            height: "auto",
                            border: "1px solid #ddd",
                            padding: "5px",
                          }}
                        />
                      )}
                    </div>
                  )}
                  <input
                    type='file'
                    id='crLicenseUrl'
                    className='form-control'
                    onChange={(e) => setCrLicense(e.target.files[0])}
                  />
                </div>

                <div className='col-md-6 mb-3'>
                  <label htmlFor='crNumber'>CR Number</label>
                  <input
                    type='text'
                    id='crNumber'
                    className='form-control'
                    placeholder='CR Number'
                    value={supplier.crNumber || ""} // Default value
                    onChange={
                      (e) =>
                        setSupplier({ ...supplier, crNumber: e.target.value }) // Update supplier state
                    }
                    required
                  />
                </div>

                <div className='col-md-6 mb-3'>
                  <label htmlFor='address'>Address</label>
                  <input
                    type='text'
                    id='address'
                    className='form-control'
                    placeholder='Full Address'
                    value={supplier.address || ""}
                    onChange={(e) =>
                      setSupplier({ ...supplier, address: e.target.value })
                    }
                    required
                  />
                </div>
              </div>

              <div className='row'>
                <div className='col-md-6 mb-3'>
                  <label htmlFor='city'>City</label>
                  <input
                    type='text'
                    id='city'
                    className='form-control'
                    placeholder='City'
                    value={supplier.city || ""}
                    onChange={(e) =>
                      setSupplier({ ...supplier, city: e.target.value })
                    }
                  />
                </div>

                <div className='col-md-6 mb-3'>
                  <label htmlFor='region'>Region</label>
                  <input
                    type='text'
                    id='region'
                    className='form-control'
                    placeholder='Region'
                    value={supplier.region || ""}
                    onChange={(e) =>
                      setSupplier({ ...supplier, region: e.target.value })
                    }
                  />
                </div>

                <div className='col-md-6 mb-3'>
                  <label htmlFor='otherCitiesServed'>Other Cities Served</label>
                  <CreatableSelect
                    isMulti
                    options={saudiCityOptions}
                    value={supplier.otherCitiesServed?.map((city) => ({
                      label: city,
                      value: city,
                    }))}
                    onChange={(selectedOptions) =>
                      setSupplier({
                        ...supplier,
                        otherCitiesServed: selectedOptions.map(
                          (option) => option.value
                        ),
                      })
                    }
                  />
                </div>
              </div>

              <div className='d-flex justify-content-end'>
                <button type='submit' className='btn btn-success me-2'>
                  Save Changes
                </button>
                <button
                  type='button'
                  className='btn btn-secondary'
                  onClick={onClose}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditSupplier;
