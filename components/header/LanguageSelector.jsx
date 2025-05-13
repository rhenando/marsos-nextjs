"use client";

import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";

import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Globe } from "react-feather";

const LanguageSelector = () => {
  const { i18n } = useTranslation();
  // start in Arabic
  const [selectedLanguage, setSelectedLanguage] = useState("ar");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    // if they've saved a choice, use it; otherwise force 'ar'
    const savedLang = localStorage.getItem("app-language");
    const lng = savedLang || "ar";

    i18n.changeLanguage(lng).then(() => {
      setSelectedLanguage(lng);
      localStorage.setItem("app-language", lng);
      document.documentElement.dir = lng === "ar" ? "rtl" : "ltr";
    });
  }, [i18n]);

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng).then(() => {
      setSelectedLanguage(lng);
      localStorage.setItem("app-language", lng);
      document.documentElement.dir = lng === "ar" ? "rtl" : "ltr";
      setOpen(false);
    });
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button size='icon' variant='ghost' className='rounded-full'>
          <Globe size={18} />
        </Button>
      </PopoverTrigger>

      <PopoverContent
        align='end'
        className='w-40 text-sm z-[9999]'
        sideOffset={8}
        forceMount
      >
        <Button
          variant={selectedLanguage === "ar" ? "default" : "ghost"}
          className='w-full justify-start'
          onClick={() => changeLanguage("ar")}
        >
          العربية
        </Button>
        <Button
          variant={selectedLanguage === "en" ? "default" : "ghost"}
          className='w-full justify-start'
          onClick={() => changeLanguage("en")}
        >
          English
        </Button>
      </PopoverContent>
    </Popover>
  );
};

export default LanguageSelector;
