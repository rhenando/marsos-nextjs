import React from "react";
import Icon from "feather-icons-react";
import { useNavigate } from "react-router-dom";

const Settings = () => {
  const navigate = useNavigate();
  const settingsData = [
    {
      sectionTitle: "Account Settings",
      items: [
        {
          icon: "user",
          title: "Settings Coming Soon...",
          description: "We are currently updating...",
        },
        {
          icon: "bell",
          title: "Settings Coming Soon...",
          description: "We are currently updating...",
        },
      ],
    },
    {
      sectionTitle: "Basic Settings",
      items: [
        {
          icon: "file-text",
          title: "Terms and Conditions",
          description:
            "View and update the terms and policies of your platform.",
          onClick: () => navigate("/terms-and-conditions"),
        },
        {
          icon: "shield",
          title: "Privacy Policy",
          description: "Manage the privacy policy for your users and visitors.",
          onClick: () => navigate("/privacy-policy"),
        },
        {
          icon: "edit",
          title: "Settings Coming Soon...",
          description: "We are currently updating...",
        },
        {
          icon: "globe",
          title: "Settings Coming Soon...",
          description: "We are currently updating...",
        },
        {
          icon: "credit-card",
          title: "Settings Coming Soon...",
          description: "We are currently updating...",
        },
        {
          icon: "truck",
          title: "Settings Coming Soon...",
          description: "We are currently updating...",
        },
        {
          icon: "box",
          title: "Settings Coming Soon...",
          description: "We are currently updating...",
        },
        {
          icon: "link",
          title: "Settings Coming Soon...",
          description: "We are currently updating...",
        },
        {
          icon: "clock",
          title: "Settings Coming Soon...",
          description: "We are currently updating...",
        },
      ],
    },
  ];

  return (
    <div className='container'>
      {settingsData.map((section, index) => (
        <div key={index} className='mb-4'>
          <h5 className='text-success fw-bold'>{section.sectionTitle}</h5>
          <div className='row'>
            {section.items.map((item, idx) => (
              <div
                key={idx}
                className='col-md-4 mb-3'
                onClick={item.onClick} // Navigate to respective page
                style={{ cursor: "pointer" }}
              >
                <div className='card shadow-sm h-100 custom-card'>
                  <div className='card-body d-flex align-items-center'>
                    <Icon
                      icon={item.icon}
                      className='me-3 settings-icon'
                      width='24'
                      height='24'
                    />
                    <div>
                      <h6 className='card-title mb-1'>{item.title}</h6>
                      <p className='card-text text-muted'>{item.description}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default Settings;
