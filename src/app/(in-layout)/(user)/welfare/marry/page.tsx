import { Landmark , File , Receipt , CircleUserRound , PhoneCall , CloudUpload } from 'lucide-react';

export default function MarryPage() {
    return (
        <>
        <div className="max-w-md rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <h2 className="text-2xl font-bold text-gray-800 mb-2"> 
                สวัสดิการมงคลสมรส
            </h2>
            <p className="text-sm text-gray-600">
                รับสิทธิ์ภายใน 30 วัน นับตั้งแต่วันจดทะเบียน
            </p>
        </div>
        <br />
        <br />
                <div className="max-w-5xl mx-auto space-y-6 mt-5">
                {/* การ์ดซ้าย–ขวา */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                    {/* การ์ดซ้าย : ข้อมูลบัญชี */}
                    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                        <h2 className="mb-5 text-xl font-semibold text-gray-900">
                            กรอกข้อมูลยื่นขอสวัสดิการฯ
                        </h2>

                        <div className="space-y-4 text-sm">
                            {/* ธนาคาร */}
                            <div>
                                <label className="mb-1 font-medium text-gray-700 flex items-center gap-1"><Landmark />
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

                                        <option>ธนาคารกรุงเทพ (BBL)</option>
                                        <option>ธนาคารกสิกรไทย (KBank)</option>
                                        <option>ธนาคารกรุงไทย (KTB)</option>
                                        <option>ธนาคารไทยพาณิชย์ (SCB)</option>
                                        <option>ธนาคารกรุงศรีอยุธยา (BAY)</option>

                                        <option>ธนาคารทหารไทยธนชาต (TTB)</option>
                                        <option>ธนาคารออมสิน (GSB)</option>
                                        <option>ธนาคารเพื่อการเกษตรและสหกรณ์การเกษตร (BAAC)</option>
                                        <option>ธนาคารอาคารสงเคราะห์ (GHB)</option>

                                        <option>ธนาคารซีไอเอ็มบีไทย (CIMB)</option>
                                        <option>ธนาคารยูโอบี (UOB)</option>
                                        <option>ธนาคารสแตนดาร์ดชาร์เตอร์ด (SCBT)</option>
                                        <option>ธนาคารซิตี้แบงก์ ประเทศไทย (Citibank Thailand)</option>
                                        <option>ธนาคารไอซีบีซี (ICBC Thai)</option>
                                        <option>ธนาคารทิสโก้ (TISCO)</option>
                                        <option>ธนาคารเกียรตินาคินภัทร (KKP)</option>
                                    </select>

                                    <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-gray-400">
                                        ▼
                                    </span>
                                </div>
                            </div>

                            {/* เลขบัญชี */}
                            <div>
                                <label className="mb-1 font-medium text-gray-700 flex items-center gap-1"><Receipt />
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
                                <label className="mb-1 font-medium text-gray-700 flex items-center gap-1"><CircleUserRound />
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
                                <label className="mb-1 font-medium text-gray-700 flex items-center gap-1"><PhoneCall />
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

                    {/* การ์ดขวา : เอกสารหลักฐาน */}
                    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                        <h2 className="mb-5 text-xl font-semibold text-gray-900">
                            แบบเอกสารหลักฐาน
                        </h2>

                        <div className="space-y-4 text-sm">
                            {[
                                "สำเนาบัตรประชาชนสมาชิก",
                                "ทะเบียนสมรส",
                                "สำเนาบัตรประชาชนคู่สมรส",
                                "หน้าสมุดบัญชี",
                            ].map((label) => (
                                <div key={label} className="space-y-1">
                                    <p className="font-medium text-gray-700">{label}</p>

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

                </div>

                {/* ปุ่มด้านล่าง */}
                <div className="flex justify-center">
                    <button
                        type="submit"
                        className="rounded-full bg-black px-8 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-gray-900"
                    >
                        ยื่นขอรับสวัสดิการ
                    </button>
                </div>
            </div>
        </>
    )
}