"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";
import { auth, db } from "@/firebase/config";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { toast } from "sonner";

import { useTranslation } from "react-i18next";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { Phone, Lock } from "lucide-react";

export default function AuthPage() {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const isRtl = i18n.dir() === "rtl";

  const [countryCode, setCountryCode] = useState("+966");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [stage, setStage] = useState("phone"); // "phone" | "otp" | "register"
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [userId, setUserId] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState("buyer");

  const fullPhoneNumber = `${countryCode}${phone}`;

  const setupRecaptcha = () => {
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(
        auth,
        "recaptcha-container",
        { size: "invisible", callback: () => {} }
      );
    }
  };

  const handleSendOtp = async () => {
    if (!termsAccepted) {
      toast.error(t("login.errors.mustAcceptTerms"));
      return;
    }
    if (!phone || phone.length < 7) {
      toast.error(t("login.errors.invalidPhone"));
      return;
    }
    setLoading(true);
    setupRecaptcha();
    try {
      const confirmationResult = await signInWithPhoneNumber(
        auth,
        fullPhoneNumber,
        window.recaptchaVerifier
      );
      window.confirmationResult = confirmationResult;
      toast.success(t("login.messages.otpSent"));
      setStage("otp");
    } catch (err) {
      console.error(err);
      toast.error(t("login.errors.otpSendFailed"));
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otp.length < 6) {
      toast.error(t("login.errors.invalidOtp"));
      return;
    }
    setLoading(true);
    try {
      const result = await window.confirmationResult.confirm(otp);
      const user = result.user;
      setUserId(user.uid);
      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (userDoc.exists()) {
        const data = userDoc.data();
        toast.success(t("login.messages.welcomeBack"));
        router.push(data.role === "supplier" ? "/supplier-dashboard" : "/");
      } else {
        setStage("register");
      }
    } catch (err) {
      console.error(err);
      toast.error(t("login.errors.otpVerifyFailed"));
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!name.trim()) {
      toast.error(t("login.errors.nameRequired"));
      return;
    }
    try {
      await setDoc(doc(db, "users", userId), {
        uid: userId,
        name,
        phone: fullPhoneNumber,
        role,
        createdAt: new Date(),
      });
      toast.success(t("login.messages.accountCreated"));
      router.push(role === "supplier" ? "/supplier-dashboard" : "/");
    } catch (err) {
      console.error(err);
      toast.error(t("login.errors.saveUserFailed"));
    }
  };

  return (
    <div className='lg:grid lg:grid-cols-2 min-h-screen'>
      {/* Left Column: Form */}
      <div
        className='bg-gray-50 px-4 sm:px-6 lg:px-8'
        dir={isRtl ? "rtl" : "ltr"}
      >
        <div className='flex items-center justify-center min-h-screen'>
          <div className='w-full max-w-md space-y-8'>
            {/* Heading */}
            <div className='text-center mt-4'>
              <h2 className='text-xl sm:text-2xl font-extrabold text-gray-900'>
                {t(`login.title.${stage}`)}
              </h2>
              <p className='mt-2 text-sm text-gray-600'>
                {t(`login.desc.${stage}`)}
              </p>
            </div>

            <Card className='bg-white shadow-lg rounded-lg overflow-hidden'>
              <CardContent className='px-6 py-8 space-y-6'>
                {stage === "phone" && (
                  <>
                    <div className='relative flex gap-2'>
                      <select
                        value={countryCode}
                        onChange={(e) => setCountryCode(e.target.value)}
                        className='border rounded-md bg-white px-3 py-2 text-sm w-32'
                      >
                        <option value='+966'>
                          {t("login.phoneCodes.sa")} (+966)
                        </option>
                        <option value='+971'>
                          {t("login.phoneCodes.ae")} (+971)
                        </option>
                        <option value='+973'>
                          {t("login.phoneCodes.bh")} (+973)
                        </option>
                        <option value='+965'>
                          {t("login.phoneCodes.kw")} (+965)
                        </option>
                        <option value='+968'>
                          {t("login.phoneCodes.om")} (+968)
                        </option>
                        <option value='+974'>
                          {t("login.phoneCodes.qa")} (+974)
                        </option>
                        <option value='+63'>
                          {t("login.phoneCodes.ph")} (+63)
                        </option>
                      </select>
                      <div className='relative flex-1'>
                        <Input
                          dir={isRtl ? "rtl" : "ltr"}
                          type='tel'
                          placeholder={t("login.placeholders.phone")}
                          value={phone}
                          onChange={(e) =>
                            setPhone(e.target.value.replace(/\D/g, ""))
                          }
                          className='pr-10'
                        />
                        <div className='absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none'>
                          <Phone className='h-5 w-5 text-gray-400' />
                        </div>
                      </div>
                    </div>

                    <label className='flex items-center space-x-2 text-sm'>
                      <input
                        type='checkbox'
                        checked={termsAccepted}
                        onChange={(e) => setTermsAccepted(e.target.checked)}
                        className='h-4 w-4 text-black border-gray-300 rounded'
                      />
                      <span>
                        {t("login.labels.acceptTerms")}{" "}
                        <a
                          href='/terms'
                          target='_blank'
                          className='text-primary font-medium hover:underline'
                        >
                          {t("login.links.terms")}
                        </a>{" "}
                        {t("login.labels.and")}{" "}
                        <a
                          href='/privacy'
                          target='_blank'
                          className='text-primary font-medium hover:underline'
                        >
                          {t("login.links.privacy")}
                        </a>
                      </span>
                    </label>

                    <Button
                      onClick={handleSendOtp}
                      disabled={loading || !termsAccepted}
                      className='w-full py-3 px-4 text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-900 disabled:opacity-50'
                    >
                      {loading
                        ? t("login.buttons.sending")
                        : t("login.buttons.sendOtp")}
                    </Button>
                  </>
                )}

                {stage === "otp" && (
                  <>
                    <div className='flex justify-center'>
                      <InputOTP maxLength={6} value={otp} onChange={setOtp}>
                        <InputOTPGroup className='flex justify-center space-x-2'>
                          {Array.from({ length: 6 }).map((_, i) => (
                            <InputOTPSlot
                              key={i}
                              index={i}
                              className='w-10 h-10 text-center border rounded-md'
                            />
                          ))}
                        </InputOTPGroup>
                      </InputOTP>
                    </div>

                    <Button
                      onClick={handleVerifyOtp}
                      disabled={loading}
                      className='w-full py-3 px-4 text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-900'
                    >
                      {loading
                        ? t("login.buttons.verifying")
                        : t("login.buttons.verifyOtp")}
                    </Button>
                  </>
                )}

                {stage === "register" && (
                  <>
                    <div className='relative'>
                      <Input
                        dir={isRtl ? "rtl" : "ltr"}
                        placeholder={t("login.placeholders.fullName")}
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className='pr-10'
                      />
                      <div className='absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none'>
                        <Lock className='h-5 w-5 text-gray-400' />
                      </div>
                    </div>

                    <div className='flex gap-2'>
                      <Button
                        variant={role === "buyer" ? "default" : "outline"}
                        onClick={() => setRole("buyer")}
                        className='flex-1'
                      >
                        {t("login.roles.buyer")}
                      </Button>
                      <Button
                        variant={role === "supplier" ? "default" : "outline"}
                        onClick={() => setRole("supplier")}
                        className='flex-1'
                      >
                        {t("login.roles.supplier")}
                      </Button>
                    </div>

                    <Button
                      onClick={handleRegister}
                      disabled={loading}
                      className='w-full py-3 px-4 text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-900'
                    >
                      {loading
                        ? t("login.buttons.saving")
                        : t("login.buttons.createAccount")}
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Right Column: Branding */}
      <div className='hidden lg:flex bg-gradient-to-br from-[#2c6449] to-green-400 text-white flex-col items-center justify-center p-10'>
        <img src='/logo.svg' alt='Marsos Logo' className='w-28 mb-4' />
        <h1 className='text-4xl font-bold mb-4'>{t("login.welcome.title")}</h1>
        <p className='text-lg max-w-sm text-center opacity-80'>
          {t("login.welcome.subtitle")}
        </p>
      </div>

      <div id='recaptcha-container' className='hidden' />
    </div>
  );
}
