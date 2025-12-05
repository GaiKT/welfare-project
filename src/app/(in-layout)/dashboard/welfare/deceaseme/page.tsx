import { WelfareFormLeft , WelfareFormRight } from "@/app/(in-layout)/(user)/welfare/component/welfare-form-bank"

export default function DeceaseMePage() {
    const pageConfig = ["สำเนาบัตรประชาชนสมาชิก", "ทะเบียนบ้านสมาชิก", "ใบมรณะบัตร", "ทะเบียนบ้านผู้ถึงแก่กรรม", "ประทับตรา(ตาย)", "หน้าสมุดบัญชี"]
    return (
        <>
            
                <div className="max-w-md rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                    <h2 className="text-2xl font-bold text-gray-800 mb-1">
                        สวัสดิการสงเคราะห์เกี่ยวกับศพ
                    </h2>
                    <h2 className="text-xls font-medium text-purple-800 mb-2">
                        สมาชิก, ครอบครัวสมาชิก
                    </h2>
                    <p className="text-sm text-gray-600">
                        รับสิทธิ์ภายใน 90 วัน นับตั้งแต่วันถึงแก่กรรม
                    </p>
                </div>
                <br />
                <br />
                <form action="">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <WelfareFormLeft />
                    <WelfareFormRight params={pageConfig} />
                    {/* ปุ่มด้านล่าง */}
                    <div className="flex justify-center">
                        <button
                            type="submit"
                            className="rounded-full bg-black px-8 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-green-600"
                        >
                            ยื่นขอรับสวัสดิการ
                        </button>
                    </div>
                </div>

            </form>
        </>
    )
}