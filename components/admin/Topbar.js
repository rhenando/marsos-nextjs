import React from "react";
import { Menu } from "react-feather";

const Topbar = ({ toggleSidebar }) => {
  return (
    <div className='flex items-center justify-between px-4 py-3 shadow-sm bg-white border-b'>
      <div className='flex items-center gap-3'>
        <button className='md:hidden' onClick={toggleSidebar}>
          <Menu size={20} />
        </button>
        <h1 className='text-lg font-bold text-[#2c6449]'>Admin Dashboard</h1>
      </div>
      <div className='text-sm text-gray-600'>Welcome, Admin</div>
    </div>
  );
};

export default Topbar;
