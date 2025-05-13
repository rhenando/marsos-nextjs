// components/header/Header.jsx
"use client";

import React from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";

import { useDispatch, useSelector } from "react-redux";
import useAuth from "@/hooks/useAuth";
import { logout } from "@/store/authSlice";

import LanguageSelector from "@/components/header/LanguageSelector";

import { Button } from "../ui/button";
import { Sheet, SheetTrigger, SheetContent, SheetTitle } from "../ui/sheet";
import { DialogTitle } from "@radix-ui/react-dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { Popover, PopoverTrigger, PopoverContent } from "../ui/popover";

import {
  Menu,
  User,
  MessageSquare,
  ShoppingCart,
  MapPin,
  Send,
  LogOut as LogOutIcon,
  Home,
} from "react-feather";

// Dynamically import the search so it never SSRs
const ProductSearch = dynamic(
  () => import("@/components/header/ProductSearch"),
  { ssr: false }
);

const Header = ({ setShowRFQModal }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const router = useRouter();
  const pathname = usePathname();

  // Pull auth state from Redux
  const { loading, user } = useAuth();
  const currentUser = user;
  const userRole = user?.role;
  const userData = user; // if you've stored extra profile info on auth.user

  // Pull cart count from Redux
  const cartItemCount = useSelector((state) => state.cart.count);

  const handleLogout = async () => {
    try {
      await dispatch(logout()).unwrap();
      // full reload, clears out any stale Recaptcha or client state:
      window.location.href = "/user-login";
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <header className='z-50 w-full bg-white shadow'>
        <div className='p-4 text-center text-sm text-muted-foreground'>
          {t("header.loading")}
        </div>
      </header>
    );
  }

  const displayName =
    userData?.displayName || userData?.email || t("header.signin");

  return (
    <header className='z-50 w-full bg-white/90 backdrop-blur-md shadow-sm'>
      <div className='flex items-center justify-between px-4 md:px-6 py-3'>
        {/* Logo */}
        <Link href='/' className='flex items-center gap-2'>
          <img
            src='/logo.svg'
            alt='Company Logo'
            className='h-20 object-contain'
          />
        </Link>

        {/* Center: Search */}
        <div className='hidden md:flex flex-1 mx-6 relative'>
          <ProductSearch />
        </div>

        {/* Desktop Actions */}
        <div className='hidden md:flex items-center gap-4 text-[#2c6449]'>
          {/* User Dropdown */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant='ghost' className='flex items-center gap-2'>
                <User size={18} />
                <span className='text-sm hidden lg:inline'>{displayName}</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent
              align='end'
              className='w-40 text-sm z-[9999]'
              sideOffset={8}
              forceMount
            >
              {currentUser ? (
                <>
                  <Button
                    variant='ghost'
                    className='w-full justify-start'
                    onClick={() => {
                      if (userRole === "buyer") router.push("/buyer-dashboard");
                      else if (userRole === "supplier")
                        router.push("/supplier-dashboard");
                      else if (userRole === "admin")
                        router.push("/admin-dashboard");
                    }}
                  >
                    {t("header.dashboard")}
                  </Button>
                  <Button
                    variant='ghost'
                    className='w-full justify-start'
                    onClick={handleLogout}
                  >
                    {t("header.logout")}
                  </Button>
                </>
              ) : (
                <Button
                  variant='ghost'
                  className='w-full justify-start'
                  onClick={() => router.push("/user-login")}
                >
                  {t("header.signin")}
                </Button>
              )}
            </PopoverContent>
          </Popover>

          {/* Messages */}
          <Link href='/buyer-messages'>
            <Button variant='ghost' className='flex items-center gap-2'>
              <MessageSquare size={18} />
              <span className='text-sm hidden lg:inline'>
                {t("header.messages")}
              </span>
            </Button>
          </Link>

          {/* Cart */}
          {userRole !== "admin" && userRole !== "supplier" && (
            <Link href='/cart' className='relative'>
              <Button variant='ghost' className='flex items-center gap-2'>
                <ShoppingCart size={18} />
                <span className='text-sm hidden lg:inline'>
                  {t("header.cart")}
                </span>
              </Button>
              {cartItemCount > 0 && (
                <span className='absolute -top-1 -right-1 bg-[#2c6449] text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center'>
                  {cartItemCount}
                </span>
              )}
            </Link>
          )}

          {/* RFQ */}
          <Button
            variant='outline'
            size='sm'
            className='flex items-center gap-2 text-[#2c6449] border-[#2c6449]'
            onClick={() => setShowRFQModal(true)}
          >
            <Send size={16} />
            <span className='text-sm hidden lg:inline'>
              {t("header.request_rfq")}
            </span>
          </Button>

          {/* Location */}
          <Link href='/'>
            <Button variant='ghost' className='flex items-center gap-2'>
              <MapPin size={18} />
              <span className='text-sm hidden lg:inline'>
                {t("header.location")}
              </span>
            </Button>
          </Link>

          <LanguageSelector />
        </div>

        {/* Mobile Menu */}
        <div className='flex md:hidden'>
          <Sheet>
            <LanguageSelector />
            <SheetTrigger asChild>
              <Button size='icon' variant='ghost' className='rounded-full'>
                <Menu size={20} />
              </Button>
            </SheetTrigger>
            <SheetContent side='left' className='w-64'>
              <SheetTitle className='sr-only'>Menu</SheetTitle>
              <DialogTitle>
                <VisuallyHidden>Menu</VisuallyHidden>
              </DialogTitle>
              <div className='flex flex-col gap-4 mt-4 text-[#2c6449]'>
                <Link href='/'>
                  <Button variant='ghost' className='w-full justify-start'>
                    <Home size={16} className='mr-2' />
                    {t("header.home")}
                  </Button>
                </Link>

                {/* replicate desktop actions */}
                <Link href='/buyer-messages'>
                  <Button variant='ghost' className='w-full justify-start'>
                    <MessageSquare size={16} className='mr-2' />
                    {t("header.messages")}
                  </Button>
                </Link>
                {userRole !== "admin" && userRole !== "supplier" && (
                  <Link href='/cart'>
                    <Button
                      variant='ghost'
                      className='w-full justify-start relative'
                    >
                      <ShoppingCart size={16} className='mr-2' />
                      {t("header.cart")}
                      {cartItemCount > 0 && (
                        <span className='absolute top-1 right-4 bg-[#2c6449] text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center'>
                          {cartItemCount}
                        </span>
                      )}
                    </Button>
                  </Link>
                )}
                <Button
                  variant='outline'
                  size='sm'
                  className='w-full justify-start flex items-center gap-2 text-[#2c6449] border-[#2c6449]'
                  onClick={() => setShowRFQModal(true)}
                >
                  <Send size={16} />
                  {t("header.request_rfq")}
                </Button>
                <Link href='/basket'>
                  <Button
                    variant='ghost'
                    className='w-full justify-start flex items-center gap-2'
                  >
                    <MapPin size={16} className='mr-2' />
                    {t("header.location")}
                  </Button>
                </Link>
                <LanguageSelector />

                {/* existing user/dashboard logic */}
                {currentUser ? (
                  <>
                    <Button
                      variant='ghost'
                      className='w-full justify-start'
                      onClick={() => {
                        if (userRole === "buyer")
                          router.push("/buyer-dashboard");
                        else if (userRole === "supplier")
                          router.push("/supplier-dashboard");
                        else if (userRole === "admin")
                          router.push("/admin-dashboard");
                      }}
                    >
                      {t("header.dashboard")}
                    </Button>
                    <Button
                      variant='ghost'
                      className='w-full justify-start'
                      onClick={handleLogout}
                    >
                      <LogOutIcon size={16} className='mr-2' />
                      {t("header.logout")}
                    </Button>
                  </>
                ) : (
                  <Button
                    variant='ghost'
                    className='w-full justify-start'
                    onClick={() => router.push("/user-login")}
                  >
                    <User size={16} className='mr-2' />
                    {t("header.signin")}
                  </Button>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Navigation Links */}
      <div className='hidden lg:block w-full bg-white px-6 py-2 text-base text-[#2c6449] border-t border-b border-gray-200'>
        <div className='flex justify-between items-center flex-wrap gap-y-2'>
          {/* Left Links */}
          <div className='flex flex-wrap items-center gap-x-6'>
            <Link
              href='/categories'
              className='font-semibold hover:text-[#1b4533] transition-all'
            >
              {t("header.all_categories")}
            </Link>
            <Link
              href='/products'
              className='hover:text-[#1b4533] transition-all'
            >
              {t("header.featured")}
            </Link>
            <Link
              href='/products'
              className='hover:text-[#1b4533] transition-all'
            >
              {t("header.trending")}
            </Link>
          </div>

          {/* Right Links */}
          <div className='flex flex-wrap items-center gap-x-6'>
            <Link href='/' className='hover:text-[#1b4533] transition-all'>
              {t("header.secured_trading")}
            </Link>
            <Link
              href='/help-center'
              className='hover:text-[#1b4533] transition-all'
            >
              {t("header.help_center")}
            </Link>
            <Link
              href='/become-supplier'
              className='hover:text-[#1b4533] transition-all'
            >
              {t("header.become_supplier")}
            </Link>
          </div>
        </div>
      </div>

      {/* Mobile Search */}
      <div className='block md:hidden px-4 mt-2'>
        <ProductSearch />
      </div>
    </header>
  );
};

export default Header;
