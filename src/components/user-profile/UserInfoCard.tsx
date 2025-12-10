"use client";
import React, { useState, useEffect } from "react";
import { useModal } from "../../hooks/useModal";
import { Modal } from "../ui/modal";
import Button from "../ui/button/Button";
import Input from "../form/input/InputField";
import Label from "../form/Label";
import { useSession } from "next-auth/react";

interface UserProfileData {
  // For Admin
  name?: string;
  username?: string;
  // For User
  firstName?: string;
  lastName?: string;
  title?: string;
  identity?: string;
  // Common
  email?: string;
  phone?: string;
}

export default function UserInfoCard() {
  const { isOpen, openModal, closeModal } = useModal();
  const { data: session, update: updateSession } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error">("success");
  const [profileData, setProfileData] = useState<UserProfileData>({});
  const [formData, setFormData] = useState<UserProfileData>({});

  const isAdmin = session?.user?.userType === "ADMIN";

  // Fetch profile data on mount
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch("/api/account/profile");
        if (response.ok) {
          const data = await response.json();
          setProfileData(data.user || {});
          setFormData(data.user || {});
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
      }
    };
    
    if (session?.user) {
      fetchProfile();
    }
  }, [session?.user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSave = async () => {
    setIsLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/account/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage("บันทึกข้อมูลสำเร็จ!");
        setMessageType("success");
        setProfileData(data.user);
        // Update session to reflect changes
        await updateSession();
        
        setTimeout(() => {
          closeModal();
          setMessage("");
        }, 1500);
      } else {
        setMessage(data.error || "เกิดข้อผิดพลาดในการบันทึกข้อมูล");
        setMessageType("error");
      }
    } catch {
      setMessage("เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์");
      setMessageType("error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCloseModal = () => {
    closeModal();
    setMessage("");
    setFormData(profileData);
  };

  return (
    <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90 lg:mb-6">
            ข้อมูลส่วนตัว
          </h4>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-7 2xl:gap-x-32">
            {isAdmin ? (
              <>
                <div>
                  <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                    ชื่อผู้ใช้
                  </p>
                  <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                    {profileData.username || "ไม่ระบุ"}
                  </p>
                </div>

                <div>
                  <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                    ชื่อ-นามสกุล
                  </p>
                  <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                    {profileData.name || "ไม่ระบุ"}
                  </p>
                </div>
              </>
            ) : (
              <>
                <div>
                  <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                    รหัสพนักงาน
                  </p>
                  <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                    {profileData.identity || "ไม่ระบุ"}
                  </p>
                </div>

                <div>
                  <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                    คำนำหน้า
                  </p>
                  <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                    {profileData.title || "ไม่ระบุ"}
                  </p>
                </div>

                <div>
                  <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                    ชื่อ
                  </p>
                  <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                    {profileData.firstName || "ไม่ระบุ"}
                  </p>  
                </div>

                <div>
                  <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                    นามสกุล
                  </p>
                  <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                    {profileData.lastName || "ไม่ระบุ"}
                  </p>
                </div>
              </>
            )}

            <div>
              <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                ที่อยู่อีเมล
              </p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                {profileData.email || "ไม่ระบุ"}
              </p>
            </div>

            {!isAdmin && (
              <div>
                <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                  เบอร์โทรศัพท์
                </p>
                <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                  {profileData.phone || "ไม่ระบุ"}
                </p>
              </div>
            )}
          </div>
        </div>

        <button
          onClick={openModal}
          className="flex w-full items-center justify-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-200 lg:inline-flex lg:w-auto"
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
          แก้ไข
        </button>
      </div>

      <Modal isOpen={isOpen} onClose={handleCloseModal} className="max-w-[700px] m-4">
        <div className="no-scrollbar relative w-full max-w-[700px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-11">
          <div className="px-2 pr-14">
            <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
              แก้ไขข้อมูลส่วนตัว
            </h4>
            <p className="mb-6 text-sm text-gray-500 dark:text-gray-400 lg:mb-7">
              อัปเดตข้อมูลของคุณเพื่อให้โปรไฟล์ของคุณทันสมัยอยู่เสมอ
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

          <form className="flex flex-col">
            <div className="custom-scrollbar max-h-[450px] overflow-y-auto px-2 pb-3">
              <div className="mt-2">
                <h5 className="mb-5 text-lg font-medium text-gray-800 dark:text-white/90 lg:mb-6">
                  ข้อมูลส่วนตัว
                </h5>

                <div className="grid grid-cols-1 gap-x-6 gap-y-5 lg:grid-cols-2">
                  {isAdmin ? (
                    <>
                      <div className="col-span-2 lg:col-span-1">
                        <Label>ชื่อผู้ใช้</Label>
                        <Input 
                          type="text" 
                          value={formData.username || ""} 
                          disabled
                          className="bg-gray-100 dark:bg-gray-800 cursor-not-allowed"
                        />
                        <p className="mt-1 text-xs text-gray-500">ไม่สามารถเปลี่ยนแปลงได้</p>
                      </div>

                      <div className="col-span-2 lg:col-span-1">
                        <Label>ชื่อ-นามสกุล</Label>
                        <Input 
                          type="text" 
                          name="name"
                          value={formData.name || ""} 
                          onChange={handleInputChange}
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="col-span-2 lg:col-span-1">
                        <Label>รหัสพนักงาน</Label>
                        <Input 
                          type="text" 
                          value={formData.identity || ""} 
                          disabled
                          className="bg-gray-100 dark:bg-gray-800 cursor-not-allowed"
                        />
                        <p className="mt-1 text-xs text-gray-500">ไม่สามารถเปลี่ยนแปลงได้</p>
                      </div>

                      <div className="col-span-2 lg:col-span-1">
                        <Label>คำนำหน้า</Label>
                        <Input 
                          type="text" 
                          name="title"
                          value={formData.title || ""} 
                          onChange={handleInputChange}
                          placeholder="เช่น นาย, นาง, นางสาว"
                        />
                      </div>

                      <div className="col-span-2 lg:col-span-1">
                        <Label>ชื่อ</Label>
                        <Input 
                          type="text" 
                          name="firstName"
                          value={formData.firstName || ""} 
                          onChange={handleInputChange}
                        />
                      </div>

                      <div className="col-span-2 lg:col-span-1">
                        <Label>นามสกุล</Label>
                        <Input 
                          type="text" 
                          name="lastName"
                          value={formData.lastName || ""} 
                          onChange={handleInputChange}
                        />
                      </div>
                    </>
                  )}

                  <div className="col-span-2 lg:col-span-1">
                    <Label>อีเมล</Label>
                    <Input 
                      type="email" 
                      name="email"
                      value={formData.email || ""} 
                      onChange={handleInputChange}
                    />
                  </div>

                  {!isAdmin && (
                    <div className="col-span-2 lg:col-span-1">
                      <Label>เบอร์โทรศัพท์</Label>
                      <Input 
                        type="tel" 
                        name="phone"
                        value={formData.phone || ""} 
                        onChange={handleInputChange}
                        placeholder="เช่น 081-234-5678"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 px-2 mt-6 lg:justify-end">
              <Button size="sm" variant="outline" onClick={handleCloseModal} disabled={isLoading}>
                ยกเลิก
              </Button>
              <Button size="sm" onClick={handleSave} disabled={isLoading}>
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
                  "ยืนยันการแก้ไข"
                )}
              </Button>
            </div>
          </form>
        </div>
      </Modal>
    </div>
  );
}
