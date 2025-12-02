"use client";
import React, { useState, useRef, useCallback, useEffect } from "react";
import { useModal } from "../../hooks/useModal";
import { Modal } from "../ui/modal";
import Button from "../ui/button/Button";
import Image from "next/image";
import { useSession } from "next-auth/react";

interface ProfileData {
  image?: string | null;
  signatureUrl?: string | null;
}

export default function UserMetaCard() {
  const { isOpen, openModal, closeModal } = useModal();
  const { data: session, update: updateSession } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error">("success");
  const [profileData, setProfileData] = useState<ProfileData>({});
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [previewSignature, setPreviewSignature] = useState<string | null>(null);
  const [profileFile, setProfileFile] = useState<File | null>(null);
  const [signatureFile, setSignatureFile] = useState<File | null>(null);
  
  const profileInputRef = useRef<HTMLInputElement>(null);
  const signatureInputRef = useRef<HTMLInputElement>(null);

  // Fetch profile data on mount
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch("/api/account/profile");
        if (response.ok) {
          const data = await response.json();
          setProfileData({
            image: data.user?.image,
            signatureUrl: data.user?.signatureUrl,
          });
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
      }
    };
    
    if (session?.user) {
      fetchProfile();
    }
  }, [session?.user]);

  const handleImageSelect = useCallback((
    e: React.ChangeEvent<HTMLInputElement>,
    type: "profile" | "signature"
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      setMessage("ไฟล์ต้องเป็นรูปภาพ (JPEG, PNG, GIF, WebP)");
      setMessageType("error");
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setMessage("ขนาดไฟล์ต้องไม่เกิน 5MB");
      setMessageType("error");
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = (event) => {
      if (type === "profile") {
        setPreviewImage(event.target?.result as string);
        setProfileFile(file);
      } else {
        setPreviewSignature(event.target?.result as string);
        setSignatureFile(file);
      }
    };
    reader.readAsDataURL(file);
    setMessage("");
  }, []);

  const uploadImage = async (file: File, type: "profile" | "signature") => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("type", type);

    const response = await fetch("/api/account/upload-image", {
      method: "POST",
      body: formData,
    });

    return response;
  };

  const handleSave = async () => {
    setIsLoading(true);
    setMessage("");

    try {
      let hasChanges = false;

      // Upload profile image if changed
      if (profileFile) {
        const response = await uploadImage(profileFile, "profile");
        const data = await response.json();
        
        if (!response.ok) {
          setMessage(data.error || "เกิดข้อผิดพลาดในการอัพโหลดรูปโปรไฟล์");
          setMessageType("error");
          setIsLoading(false);
          return;
        }
        
        setProfileData(prev => ({ ...prev, image: data.fileUrl }));
        hasChanges = true;
      }

      // Upload signature if changed
      if (signatureFile) {
        const response = await uploadImage(signatureFile, "signature");
        const data = await response.json();
        
        if (!response.ok) {
          setMessage(data.error || "เกิดข้อผิดพลาดในการอัพโหลดลายเซ็น");
          setMessageType("error");
          setIsLoading(false);
          return;
        }
        
        setProfileData(prev => ({ ...prev, signatureUrl: data.fileUrl }));
        hasChanges = true;
      }

      if (hasChanges) {
        setMessage("บันทึกข้อมูลสำเร็จ!");
        setMessageType("success");
        // Update session to reflect changes
        await updateSession();
        
        setTimeout(() => {
          closeModal();
          setMessage("");
          setPreviewImage(null);
          setPreviewSignature(null);
          setProfileFile(null);
          setSignatureFile(null);
        }, 1500);
      } else {
        closeModal();
      }
    } catch (error) {
      console.error("Error saving:", error);
      setMessage("เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์");
      setMessageType("error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveImage = async (type: "profile" | "signature") => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/account/upload-image?type=${type}`, {
        method: "DELETE",
      });

      if (response.ok) {
        if (type === "profile") {
          setProfileData(prev => ({ ...prev, image: null }));
          setPreviewImage(null);
          setProfileFile(null);
        } else {
          setProfileData(prev => ({ ...prev, signatureUrl: null }));
          setPreviewSignature(null);
          setSignatureFile(null);
        }
        setMessage("ลบรูปภาพสำเร็จ!");
        setMessageType("success");
        setTimeout(() => setMessage(""), 2000);
      }
    } catch {
      setMessage("เกิดข้อผิดพลาดในการลบรูปภาพ");
      setMessageType("error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCloseModal = () => {
    closeModal();
    setMessage("");
    setPreviewImage(null);
    setPreviewSignature(null);
    setProfileFile(null);
    setSignatureFile(null);
  };

  const displayImage = previewImage || profileData.image || "/images/user/owner.jpg";
  const displaySignature = previewSignature || profileData.signatureUrl;

  return (
    <>
      <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-col items-center w-full gap-6 xl:flex-row">
            <div className="w-20 h-20 overflow-hidden border border-gray-200 rounded-full dark:border-gray-800">
              <Image
                width={80}
                height={80}
                src={profileData.image || "/images/user/owner.jpg"}
                alt="user"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="order-3 xl:order-2">
              <h4 className="mb-2 text-lg font-semibold text-center text-gray-800 dark:text-white/90 xl:text-left">
                { session?.user?.name || "ไม่ระบุ" }
              </h4>
              <div className="flex flex-col items-center gap-1 text-center xl:flex-row xl:gap-3 xl:text-left">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  { session?.user?.email || "ไม่ระบุ" }
                </p>
                <div className="hidden h-3.5 w-px bg-gray-300 dark:bg-gray-700 xl:block"></div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  { session?.user?.userType || "ไม่ระบุ" }
                </p>
              </div>
            </div>
          </div>
          <button
            onClick={openModal}
            className="flex w-full items-center justify-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200 lg:inline-flex lg:w-auto"
          >
            <svg
              className="fill-current"
              width="18"
              height="18"
              viewBox="0 0 18 18"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M15.0911 2.78206C14.2125 1.90338 12.7878 1.90338 11.9092 2.78206L4.57524 10.116C4.26682 10.4244 4.0547 10.8158 3.96468 11.2426L3.31231 14.3352C3.25997 14.5833 3.33653 14.841 3.51583 15.0203C3.69512 15.1996 3.95286 15.2761 4.20096 15.2238L7.29355 14.5714C7.72031 14.4814 8.11172 14.2693 8.42013 13.9609L15.7541 6.62695C16.6327 5.74827 16.6327 4.32365 15.7541 3.44497L15.0911 2.78206ZM12.9698 3.84272C13.2627 3.54982 13.7376 3.54982 14.0305 3.84272L14.6934 4.50563C14.9863 4.79852 14.9863 5.2734 14.6934 5.56629L14.044 6.21573L12.3204 4.49215L12.9698 3.84272ZM11.2597 5.55281L5.6359 11.1766C5.53309 11.2794 5.46238 11.4099 5.43238 11.5522L5.01758 13.5185L6.98394 13.1037C7.1262 13.0737 7.25666 13.003 7.35947 12.9002L12.9833 7.27639L11.2597 5.55281Z"
                fill=""
              />
            </svg>
            แก้ไขรูปภาพ
          </button>
        </div>
      </div>

      <Modal isOpen={isOpen} onClose={handleCloseModal} className="max-w-[700px] m-4">
        <div className="no-scrollbar relative w-full max-w-[700px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-11">
          <div className="px-2 pr-14">
            <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
              แก้ไขรูปภาพโปรไฟล์
            </h4>
            <p className="mb-6 text-sm text-gray-500 dark:text-gray-400 lg:mb-7">
              อัพโหลดรูปโปรไฟล์และลายเซ็นของคุณ
            </p>
          </div>

          {message && (
            <div className={`mb-6 mx-2 p-4 rounded-lg ${
              messageType === "success"
                ? "bg-green-50 text-green-700 border border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800"
                : "bg-red-50 text-red-700 border border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800"
            }`}>
              {message}
            </div>
          )}

          <div className="space-y-8 px-2">
            {/* Profile Image Upload */}
            <div>
              <h5 className="mb-4 text-lg font-medium text-gray-800 dark:text-white/90">
                รูปโปรไฟล์
              </h5>
              <div className="flex flex-col items-center gap-4 sm:flex-row">
                <div className="relative w-24 h-24 overflow-hidden border-2 border-gray-200 rounded-full dark:border-gray-700">
                  <Image
                    width={96}
                    height={96}
                    src={displayImage}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <input
                    ref={profileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageSelect(e, "profile")}
                    className="hidden"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => profileInputRef.current?.click()}
                    disabled={isLoading}
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    เลือกรูปภาพ
                  </Button>
                  {(profileData.image || previewImage) && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleRemoveImage("profile")}
                      disabled={isLoading}
                      className="text-red-600 border-red-300 hover:bg-red-50"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      ลบรูปภาพ
                    </Button>
                  )}
                </div>
              </div>
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                รองรับไฟล์ JPEG, PNG, GIF, WebP ขนาดไม่เกิน 5MB
              </p>
            </div>

            {/* Signature Upload - Only for Admin */}
            {session?.user?.userType === "ADMIN" && (
              <div>
                <h5 className="mb-4 text-lg font-medium text-gray-800 dark:text-white/90">
                  ลายเซ็น
                </h5>
                <div className="flex flex-col gap-4">
                  <div className="relative w-full h-32 overflow-hidden border-2 border-dashed border-gray-300 rounded-lg dark:border-gray-700 bg-gray-50 dark:bg-gray-800 flex items-center justify-center">
                    {displaySignature ? (
                      <Image
                        width={300}
                        height={120}
                        src={displaySignature}
                        alt="Signature"
                        className="max-h-full object-contain"
                      />
                    ) : (
                      <div className="text-center text-gray-400">
                        <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                        <p className="text-sm">ยังไม่มีลายเซ็น</p>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <input
                      ref={signatureInputRef}
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageSelect(e, "signature")}
                      className="hidden"
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => signatureInputRef.current?.click()}
                      disabled={isLoading}
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                      </svg>
                      อัพโหลดลายเซ็น
                    </Button>
                    {(profileData.signatureUrl || previewSignature) && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRemoveImage("signature")}
                        disabled={isLoading}
                        className="text-red-600 border-red-300 hover:bg-red-50"
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        ลบลายเซ็น
                      </Button>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    ใช้สำหรับลงนามในเอกสารอนุมัติ - รองรับไฟล์ JPEG, PNG ขนาดไม่เกิน 5MB
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 px-2 mt-8 lg:justify-end">
            <Button size="sm" variant="outline" onClick={handleCloseModal} disabled={isLoading}>
              ยกเลิก
            </Button>
            <Button 
              size="sm" 
              onClick={handleSave}
              disabled={isLoading || (!profileFile && !signatureFile)}
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  กำลังบันทึก...
                </div>
              ) : (
                "บันทึกการเปลี่ยนแปลง"
              )}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
