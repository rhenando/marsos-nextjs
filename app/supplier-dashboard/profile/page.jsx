"use client";

import { useEffect, useState } from "react";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import {
  getStorage,
  ref,
  uploadBytesResumable,
  getDownloadURL,
} from "firebase/storage";
import { db } from "@/firebase/config";
import { useSelector } from "react-redux";
import { toast } from "sonner";

import { useTranslation } from "react-i18next";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";

export default function ManageProfiles() {
  const { t, i18n } = useTranslation();
  const { user: currentUser, loading: authLoading } = useSelector(
    (s) => s.auth
  );
  const [formData, setFormData] = useState({
    nameEn: "",
    nameAr: "",
    addressEn: "",
    addressAr: "",
    companyDescriptionEn: "",
    companyDescriptionAr: "",
    crNumber: "",
    vatNumber: "",
    email: "",
    role: "",
    logoUrl: "",
    crDocUrl: "",
    vatDocUrl: "",
    brochureUrls: [],
    bankDetails: [],
  });
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!currentUser) return;
    (async () => {
      const snap = await getDoc(doc(db, "users", currentUser.uid));
      if (snap.exists()) {
        const d = snap.data();
        setFormData({
          nameEn: d.nameEn || d.name || "",
          nameAr: d.nameAr || "",
          addressEn: d.addressEn || d.address || "",
          addressAr: d.addressAr || "",
          companyDescriptionEn:
            d.companyDescriptionEn || d.companyDescription || "",
          companyDescriptionAr: d.companyDescriptionAr || "",
          crNumber: d.crNumber || "",
          vatNumber: d.vatNumber || "",
          email: d.email || "",
          role: d.role || "",
          logoUrl: d.logoUrl || "",
          crDocUrl: d.crDocUrl || "",
          vatDocUrl: d.vatDocUrl || "",
          brochureUrls:
            d.brochureUrls || (d.brochureUrl ? [d.brochureUrl] : []),
          bankDetails: d.bankDetails || [],
        });
      }
      setLoading(false);
    })();
  }, [currentUser]);

  const handleChange = (e) => {
    setFormData((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const uploadFile = async (file, pathKey) => {
    if (!file || !currentUser?.uid) return;
    setUploading(true);
    const storage = getStorage();
    const fileRef = ref(
      storage,
      `profiles/${currentUser.uid}/${pathKey}/${file.name}`
    );
    const task = uploadBytesResumable(fileRef, file);
    task.on(
      "state_changed",
      null,
      () => {
        toast.error(t(`profile.uploadFailed`, { key: pathKey }));
        setUploading(false);
      },
      async () => {
        const url = await getDownloadURL(task.snapshot.ref);
        setFormData((f) => ({ ...f, [pathKey]: url }));
        toast.success(t(`profile.uploaded`, { key: pathKey }));
        setUploading(false);
      }
    );
  };

  const handleSave = async () => {
    if (!currentUser) return;
    try {
      await updateDoc(doc(db, "users", currentUser.uid), {
        nameEn: formData.nameEn,
        nameAr: formData.nameAr,
        addressEn: formData.addressEn,
        addressAr: formData.addressAr,
        companyDescriptionEn: formData.companyDescriptionEn,
        companyDescriptionAr: formData.companyDescriptionAr,
        crNumber: formData.crNumber,
        vatNumber: formData.vatNumber,
        logoUrl: formData.logoUrl,
        crDocUrl: formData.crDocUrl,
        vatDocUrl: formData.vatDocUrl,
        brochureUrls: formData.brochureUrls,
        bankDetails: formData.bankDetails,
      });
      toast.success(t("profile.updated"));
      setIsEditing(false);
    } catch {
      toast.error(t("profile.updateFailed"));
    }
  };

  if (authLoading || loading) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        {t("common.loading")}…
      </div>
    );
  }
  if (currentUser?.role !== "supplier") {
    return <div className='p-6'>{t("common.notAuthorized")}</div>;
  }

  return (
    <Card className='max-w-4xl mx-auto my-8 p-4'>
      <CardHeader>
        <CardTitle>{t("profile.manageTitle")}</CardTitle>
      </CardHeader>
      <CardContent className='space-y-6'>
        {/* Name */}
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          <div>
            <Label>{t("profile.nameEn")}</Label>
            <Input
              name='nameEn'
              value={formData.nameEn}
              onChange={handleChange}
              disabled={!isEditing}
            />
          </div>
          <div className='text-right'>
            <Label>{t("profile.nameAr")}</Label>
            <Input
              name='nameAr'
              value={formData.nameAr}
              onChange={handleChange}
              disabled={!isEditing}
              dir='rtl'
            />
          </div>
        </div>

        {/* Address */}
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          <div>
            <Label>{t("profile.addressEn")}</Label>
            <Input
              name='addressEn'
              value={formData.addressEn}
              onChange={handleChange}
              disabled={!isEditing}
            />
          </div>
          <div className='text-right'>
            <Label>{t("profile.addressAr")}</Label>
            <Input
              name='addressAr'
              value={formData.addressAr}
              onChange={handleChange}
              disabled={!isEditing}
              dir='rtl'
            />
          </div>
        </div>

        {/* Company Description */}
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          <div>
            <Label>{t("profile.descEn")}</Label>
            <Textarea
              name='companyDescriptionEn'
              value={formData.companyDescriptionEn}
              onChange={handleChange}
              disabled={!isEditing}
              rows={4}
            />
          </div>
          <div className='text-right'>
            <Label>{t("profile.descAr")}</Label>
            <Textarea
              name='companyDescriptionAr'
              value={formData.companyDescriptionAr}
              onChange={handleChange}
              disabled={!isEditing}
              rows={4}
              dir='rtl'
            />
          </div>
        </div>

        {/* CR & VAT */}
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          <div>
            <Label>{t("profile.crNumber")}</Label>
            <Input
              name='crNumber'
              value={formData.crNumber}
              onChange={handleChange}
              disabled={!isEditing}
            />
          </div>
          <div>
            <Label>{t("profile.vatNumber")}</Label>
            <Input
              name='vatNumber'
              value={formData.vatNumber}
              onChange={handleChange}
              disabled={!isEditing}
            />
          </div>
        </div>

        {/* Logo & Docs */}
        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
          <div>
            <Label>{t("profile.logo")}</Label>
            {formData.logoUrl && (
              <img
                src={formData.logoUrl}
                alt={t("profile.logoAlt")}
                className='w-24 h-24 md:w-32 md:h-32 object-contain mb-2'
              />
            )}
            <Input
              type='file'
              accept='image/*'
              onChange={(e) => uploadFile(e.target.files[0], "logoUrl")}
              disabled={!isEditing || uploading}
            />
          </div>
          <div>
            <Label>{t("profile.documents")}</Label>
            {/* CR Doc */}
            <div className='mb-4'>
              <Label>{t("profile.crDoc")}</Label>
              {formData.crDocUrl && (
                <a
                  href={formData.crDocUrl}
                  target='_blank'
                  rel='noopener'
                  className='block text-sm text-blue-600 underline mb-1'
                >
                  {t("profile.viewExisting", { key: t("profile.crDoc") })}
                </a>
              )}
              <Input
                type='file'
                accept='.pdf,.jpg,.jpeg'
                onChange={(e) => uploadFile(e.target.files[0], "crDocUrl")}
                disabled={!isEditing || uploading}
              />
            </div>
            {/* VAT Doc */}
            <div>
              <Label>{t("profile.vatDoc")}</Label>
              {formData.vatDocUrl && (
                <a
                  href={formData.vatDocUrl}
                  target='_blank'
                  rel='noopener'
                  className='block text-sm text-blue-600 underline mb-1'
                >
                  {t("profile.viewExisting", { key: t("profile.vatDoc") })}
                </a>
              )}
              <Input
                type='file'
                accept='.pdf,.jpg,.jpeg'
                onChange={(e) => uploadFile(e.target.files[0], "vatDocUrl")}
                disabled={!isEditing || uploading}
              />
            </div>
          </div>
        </div>

        {/* Brochures */}
        <div>
          <Label>{t("profile.brochures")}</Label>
          {formData.brochureUrls.map((url, idx) => (
            <div key={idx} className='mb-4'>
              {url && (
                <a
                  href={url}
                  target='_blank'
                  rel='noopener'
                  className='block text-sm text-blue-600 underline mb-1'
                >
                  {t("profile.viewBrochure", { number: idx + 1 })}
                </a>
              )}
              <Input
                type='file'
                accept='.pdf,.jpg,.jpeg'
                onChange={(e) =>
                  uploadFile(e.target.files[0], "brochureUrls")[idx]
                }
                disabled={!isEditing || uploading}
              />
            </div>
          ))}
          <Button
            variant='outline'
            onClick={() =>
              setFormData((f) => ({
                ...f,
                brochureUrls: [...f.brochureUrls, ""],
              }))
            }
            disabled={!isEditing}
          >
            + {t("profile.addBrochure")}
          </Button>
        </div>

        {/* Actions */}
        <div className='flex flex-col sm:flex-row gap-4'>
          {isEditing ? (
            <>
              <Button
                onClick={handleSave}
                disabled={uploading}
                className='flex-1'
              >
                {t("profile.save")}
              </Button>
              <Button
                variant='outline'
                onClick={() => setIsEditing(false)}
                className='flex-1'
              >
                {t("profile.cancel")}
              </Button>
            </>
          ) : (
            <Button onClick={() => setIsEditing(true)} className='w-full'>
              {t("profile.edit")}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
