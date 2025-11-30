import {WelfareFormLeft, WelfareFormRight} from "../component/welfare-form-bank";

export default function BabyPage () {
    const pageConfig = [ "สำเนาบัตรประชาชนสมาชิก","ทะเบียนสมรส","สำเนาบัตรประชาชนคู่สมรส","สูติบัตร","หน้าสมุดบัญชี"]
    return (
        <>
        <form action="">
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <WelfareFormLeft />
                <WelfareFormRight params={pageConfig} />
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
        
        </form>
        </>
    )
}

