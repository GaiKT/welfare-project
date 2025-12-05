"use client";

import { useState } from "react";
import { Landmark, Receipt, CircleUserRound, PhoneCall, CloudUpload  } from "lucide-react";

interface Bank {
  value: string;
  label: string;
  icon: string;
}

// ธนาคารทั้งหมดพร้อมไอคอน
export const BANK_LIST : Bank [] = [
  { value: "uob", label: "ธนาคารยูโอบี (UOB)", icon: "/images/icons/bank/UOB.png" },
  { value: "baac", label: "ธนาคารเพื่อการเกษตรและสหกรณ์การเกษตร (BAAC)", icon: "/images/icons/bank/BAAC.png" },
  { value: "bay", label: "ธนาคารกรุงศรีอยุธยา (BAY)", icon: "/images/icons/bank/BAY.png" },
  { value: "bbl", label: "ธนาคารกรุงเทพ (BBL)", icon: "/images/icons/bank/BBL.png" },
  { value: "cimb", label: "ธนาคารซีไอเอ็มบีไทย (CIMB)", icon: "/images/icons/bank/CIMB.png" },
  { value: "citi", label: "ธนาคารซิตี้แบงก์ (CITI)", icon: "/images/icons/bank/CITI.png" },
  { value: "ghb", label: "ธนาคารอาคารสงเคราะห์ (GHB)", icon: "/images/icons/bank/GHB.png" },
  { value: "gsb", label: "ธนาคารออมสิน (GSB)", icon: "/images/icons/bank/GSB.png" },
  { value: "hsbc", label: "ธนาคารเอชเอสบีซี (HSBC)", icon: "/images/icons/bank/HSBC.png" },
  { value: "ibank", label: "ธนาคารอิสลามแห่งประเทศไทย (IBANK)", icon: "/images/icons/bank/IBANK.png" },
  { value: "icbc", label: "ธนาคารไอซีบีซี (ICBC)", icon: "/images/icons/bank/ICBC.png" },
  { value: "kbank", label: "ธนาคารกสิกรไทย (KBANK)", icon: "/images/icons/bank/KBANK.png" },
  { value: "kkp", label: "ธนาคารเกียรตินาคินภัทร (KKP)", icon: "/images/icons/bank/KKP.png" },
  { value: "ktb", label: "ธนาคารกรุงไทย (KTB)", icon: "/images/icons/bank/KTB.png" },
  { value: "lhb", label: "ธนาคารแลนด์แอนด์เฮาส์ (LHB)", icon: "/images/icons/bank/LHB.png" },
  { value: "scb", label: "ธนาคารไทยพาณิชย์ (SCB)", icon: "/images/icons/bank/SCB.png" },
  { value: "tcrb", label: "ธนาคารไทยเครดิต (TCRB)", icon: "/images/icons/bank/TCRB.png" },
  { value: "tisco", label: "ธนาคารทิสโก้ (TISCO)", icon: "/images/icons/bank/TISCO.png" },
  { value: "ttb", label: "ธนาคารทหารไทยธนชาต (TTB)", icon: "/images/icons/bank/TTB.png" },
];

export function WelfareFormLeft() {
  const [open, setOpen] = useState(false);
  const [selectedBank, setSelectedBank] = useState<string>("");
  const activeBank = BANK_LIST.find((b) => b.value === selectedBank) ?? null;

  const handleSelect = (value: string) => {
    setSelectedBank(value);
    setOpen(false);
  };

   return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="mb-5 text-xl font-semibold text-gray-900">
        กรอกข้อมูลยื่นขอสวัสดิการฯ
      </h2>

      <div className="space-y-4 text-sm">
        {/* ================== Dropdown ธนาคาร ================== */}
        <div>
          <label className="mb-1 flex items-center gap-1 font-medium text-gray-700">
            <Landmark className="h-4 w-4" />
            ธนาคาร
          </label>

          {/* ช่องหลัก */}
          <button
            type="button"
            onClick={() => setOpen(!open)}
            className="flex w-full items-center justify-between rounded-xl border border-gray-300 bg-gray-50 px-3 py-2 text-left shadow-sm hover:bg-gray-100"
          >
            <div className="flex items-center gap-2">
              {activeBank ? (
                <>
                  <img
                    src={activeBank.icon}
                    alt={activeBank.label}
                    className="h-6 w-6 rounded-full"
                  />
                  <span>{activeBank.label}</span>
                </>
              ) : (
                <span className="text-gray-400">กรุณาเลือก</span>
              )}
            </div>
            <span className="text-gray-400">▼</span>
          </button>

          {/* รายการ dropdown */}
          {open && (
            <div className="mt-1 max-h-60 w-full overflow-y-auto rounded-xl border border-gray-200 bg-white shadow-lg">
              {BANK_LIST.map((bank) => (
                <button
                  key={bank.value}
                  onClick={() => handleSelect(bank.value)}
                  className="flex w-full items-center gap-3 px-3 py-2 hover:bg-gray-100"
                >
                  <img
                    src={bank.icon}
                    alt={bank.label}
                    className="h-6 w-6 rounded-full"
                  />
                  <span>{bank.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ================== เลขบัญชี ================== */}
        <div>
          <label className="mb-1 flex items-center gap-1 font-medium text-gray-700">
            <Receipt className="h-4 w-4" />
            เลขบัญชี
          </label>
          <input
            type="text"
            className="w-full rounded-xl border border-gray-300 bg-gray-50 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
            placeholder="กรุณาระบุ"
          />
        </div>

        {/* ================== ชื่อเจ้าของบัญชี ================== */}
        <div>
          <label className="mb-1 flex items-center gap-1 font-medium text-gray-700">
            <CircleUserRound className="h-4 w-4" />
            ชื่อเจ้าของบัญชี
          </label>
          <input
            type="text"
            className="w-full rounded-xl border border-gray-300 bg-gray-50 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
            placeholder="กรุณาระบุ เช่น สมชาย ใจดี"
          />
        </div>

        {/* ================== เบอร์โทร ================== */}
        <div>
          <label className="mb-1 flex items-center gap-1 font-medium text-gray-700">
            <PhoneCall className="h-4 w-4" />
            หมายเลขโทรศัพท์
          </label>
          <input
            type="tel"
            className="w-full rounded-xl border border-gray-300 bg-gray-50 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
            placeholder="กรุณาระบุ"
          />
        </div>
      </div>
    </div>
  );
}



export function WelfareFormRight ({ params }:{ params : string[]}) {

  const Data = params;

  return (
    <>
    {/* การ์ดขวา : เอกสารหลักฐาน */}
                    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                        <h2 className="mb-5 text-xl font-semibold text-gray-900">
                            แบบเอกสารหลักฐาน
                        </h2>

                        <div className="space-y-4 text-sm">
                            {Data.map((data , index : number) => (
                                <div key={index} className="space-y-1">
                                    <p className="font-medium text-gray-700">{data}</p>

                                    <div className="flex gap-2">

                                        {/* ช่องแสดงชื่อไฟล์ */}
                                        <div className="flex h-10 flex-1 items-center gap-2 rounded-xl border border-gray-300 bg-gray-50 px-3 text-xs text-gray-500">
                                            <span className="text-lg"></span><CloudUpload />
                                            <span>แนบไฟล์</span>
                                        </div>

                                        {/* ปุ่ม Upload ตัวจริง */}
                                        <label className="relative flex h-10 cursor-pointer items-center rounded-xl border border-gray-300 bg-white px-4 text-xs font-medium text-gray-700 shadow-sm hover:bg-gray-50">
                                            Upload
                                            <input type="file" className="absolute inset-0 cursor-pointer opacity-0" />
                                        </label>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
    </>
  )
}

