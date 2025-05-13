// components/admin/AdminSidebar.jsx
import React from "react";
import Icon from "feather-icons-react";

const navSections = [
  {
    label: "Dashboard",
    icon: "home",
    page: "dashboard",
  },
  {
    label: "Users",
    icon: "users",
    children: [
      { label: "Suppliers", page: "suppliers", icon: "briefcase" },
      { label: "Buyers", page: "buyers", icon: "user-check" },
      { label: "Admins", page: "admins", icon: "shield" },
    ],
  },
  {
    label: "Products",
    icon: "box",
    children: [
      { label: "Product List", page: "products", icon: "archive" },
      { label: "Library", page: "product-library", icon: "book-open" },
    ],
  },
  {
    label: "Messages",
    icon: "message-square",
    page: "messages",
  },
  {
    label: "Orders",
    icon: "shopping-bag",
    children: [
      { label: "Orders", page: "orders", icon: "list" },
      { label: "Abandoned", page: "abandoned-carts", icon: "alert-circle" },
      { label: "Transactions", page: "transactions", icon: "credit-card" }, // ✅ NEW
    ],
  },
  {
    label: "Analytics",
    icon: "bar-chart-2",
    children: [
      { label: "Overview", page: "analytics-overview", icon: "activity" },
      { label: "Live", page: "live-analytics", icon: "wifi" },
      { label: "Reports", page: "analytics-reports", icon: "file-text" },
    ],
  },
  {
    label: "Marketing",
    icon: "search",
    children: [
      { label: "SEO", page: "seo-enhancements", icon: "globe" },
      { label: "Promo", page: "promo-code", icon: "gift" },
      { label: "Coupon", page: "coupon-code", icon: "tag" },
    ],
  },
  {
    label: "Settings",
    icon: "settings",
    page: "settings",
  },
];

export default function AdminSidebar({ selectedPage, onTabClick }) {
  return (
    <aside className='w-full lg:w-60 border-r bg-white h-full'>
      <div className='px-4 py-3 border-b font-bold text-lg text-[#2c6449]'>
        Admin Panel
      </div>
      <ul className='flex flex-col text-sm'>
        {navSections.map((section, index) => {
          if (section.children) {
            return (
              <li key={index} className='border-t'>
                <div className='flex items-center gap-2 p-3 font-semibold text-gray-600'>
                  <Icon icon={section.icon} size={16} />
                  {section.label}
                </div>
                <ul>
                  {section.children.map((item, i) => (
                    <li
                      key={i}
                      className={`pl-10 py-2 hover:bg-gray-100 cursor-pointer ${
                        selectedPage === item.page
                          ? "text-[#2c6449] font-semibold"
                          : ""
                      }`}
                      onClick={() => onTabClick(item.page)}
                    >
                      <Icon
                        icon={item.icon}
                        size={14}
                        className='mr-2 inline-block'
                      />
                      {item.label}
                    </li>
                  ))}
                </ul>
              </li>
            );
          }
          return (
            <li
              key={index}
              className={`flex items-center gap-2 px-4 py-3 border-t hover:bg-gray-100 cursor-pointer ${
                selectedPage === section.page
                  ? "text-[#2c6449] font-semibold"
                  : ""
              }`}
              onClick={() => onTabClick(section.page)}
            >
              <Icon icon={section.icon} size={16} />
              {section.label}
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
