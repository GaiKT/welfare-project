"use client";

import { Landmark, Receipt, CircleUserRound, PhoneCall, CloudUpload } from "lucide-react";

// 1) Array ธนาคารทั้งหมด
const BANK_LIST = [
  "ธนาคารกรุงเทพ (BBL)",
  "ธนาคารกสิกรไทย (KBank)",
  "ธนาคารกรุงไทย (KTB)",
  "ธนาคารไทยพาณิชย์ (SCB)",
  "ธนาคารกรุงศรีอยุธยา (BAY)",
  "ธนาคารทหารไทยธนชาต (TTB)",
  "ธนาคารออมสิน (GSB)",
  "ธนาคารเพื่อการเกษตรและสหกรณ์การเกษตร (BAAC)",
  "ธนาคารอาคารสงเคราะห์ (GHB)",
  "ธนาคารซีไอเอ็มบีไทย (CIMB)",
  "ธนาคารยูโอบี (UOB)",
  "ธนาคารสแตนดาร์ดชาร์เตอร์ด (SCBT)",
  "ธนาคารซิตี้แบงก์ ประเทศไทย (Citibank Thailand)",
  "ธนาคารไอซีบีซี (ICBC Thai)",
  "ธนาคารทิสโก้ (TISCO)",
  "ธนาคารเกียรตินาคินภัทร (KKP)",
];

export function WelfareFormLeft() {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="mb-5 text-xl font-semibold text-gray-900">
        กรอกข้อมูลยื่นขอสวัสดิการฯ
      </h2>

      <div className="space-y-4 text-sm">

        {/* ธนาคาร */}
        <div>
          <label className="mb-1 flex items-center gap-1 font-medium text-gray-700">
            <Landmark className="h-4 w-4" />
            ธนาคาร
          </label>

          <div className="relative">
            <select
              className="w-full appearance-none rounded-xl border border-gray-300 bg-gray-50 px-3 py-2 pr-9 text-sm text-gray-700 shadow-sm focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              defaultValue=""
            >
              <option value="" disabled>
                กรุณาเลือก
              </option>

              {/* map ธนาคารทั้งหมด */}
              {BANK_LIST.map((bank) => (
                <option key={bank} value={bank}>
                  {bank}
                </option>
              ))}
            </select>

            <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-gray-400">
              ▼
            </span>
          </div>
        </div>

        {/* เลขบัญชี */}
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

        {/* ชื่อเจ้าของบัญชี */}
        <div>
          <label className="mb-1 flex items-center gap-1 font-medium text-gray-700">
            <CircleUserRound className="h-4 w-4" />
            ชื่อเจ้าของบัญชี
          </label>
          <input
            type="text"
            className="w-full rounded-xl border border-gray-300 bg-gray-50 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
            placeholder="กรุณาระบุ"
          />
        </div>

        {/* หมายเลขโทรศัพท์ */}
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

