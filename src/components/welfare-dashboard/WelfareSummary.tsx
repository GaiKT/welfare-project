"use client";
import { useState } from "react";
import { MoreDotIcon } from "@/icons";
import { Dropdown } from "../ui/dropdown/Dropdown";
import { DropdownItem } from "../ui/dropdown/DropdownItem";

interface WelfareData {
  welfareId: string;
  welfareName: string;
  budget: number;
  claimCount: number;
  totalAmount: number;
}

interface WelfareSummaryProps {
  data: WelfareData[];
}

export default function WelfareSummary({ data }: WelfareSummaryProps) {
  const [isOpen, setIsOpen] = useState(false);

  function toggleDropdown() {
    setIsOpen(!isOpen);
  }

  function closeDropdown() {
    setIsOpen(false);
  }

  const formatCurrency = (value: number) => {
    if (value >= 1000000) {
      return `฿${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `฿${(value / 1000).toFixed(0)}K`;
    }
    return `฿${value.toLocaleString()}`;
  };

  // Calculate totals
  const totalBudget = data.reduce((sum, item) => sum + item.budget, 0);
  const totalClaims = data.reduce((sum, item) => sum + item.claimCount, 0);
  const totalAmount = data.reduce((sum, item) => sum + item.totalAmount, 0);

  // Get colors for progress bars
  const colors = [
    "bg-brand-500",
    "bg-success-500",
    "bg-warning-500",
    "bg-error-500",
    "bg-purple-500",
    "bg-cyan-500",
  ];

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] sm:p-6">
      <div className="flex justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            สรุปตามประเภทสวัสดิการ
          </h3>
          <p className="mt-1 text-gray-500 text-theme-sm dark:text-gray-400">
            จำนวนคำขอและยอดเบิกตามประเภท
          </p>
        </div>

        <div className="relative inline-block">
          <button onClick={toggleDropdown} className="dropdown-toggle">
            <MoreDotIcon className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-300" />
          </button>
          <Dropdown
            isOpen={isOpen}
            onClose={closeDropdown}
            className="w-40 p-2"
          >
            <DropdownItem
              onItemClick={closeDropdown}
              className="flex w-full font-normal text-left text-gray-500 rounded-lg hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
            >
              ดูรายละเอียด
            </DropdownItem>
          </Dropdown>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4 my-6 p-4 rounded-xl bg-gray-50 dark:bg-gray-800">
        <div className="text-center">
          <p className="text-gray-500 text-theme-xs dark:text-gray-400">งบประมาณรวม</p>
          <p className="font-semibold text-gray-800 dark:text-white/90">{formatCurrency(totalBudget)}</p>
        </div>
        <div className="text-center border-x border-gray-200 dark:border-gray-700">
          <p className="text-gray-500 text-theme-xs dark:text-gray-400">คำขอทั้งหมด</p>
          <p className="font-semibold text-gray-800 dark:text-white/90">{totalClaims} รายการ</p>
        </div>
        <div className="text-center">
          <p className="text-gray-500 text-theme-xs dark:text-gray-400">ยอดเบิกรวม</p>
          <p className="font-semibold text-gray-800 dark:text-white/90">{formatCurrency(totalAmount)}</p>
        </div>
      </div>

      <div className="space-y-5">
        {data.length > 0 ? (
          data.map((item, index) => {
            const usagePercent = item.budget > 0 
              ? Math.min((item.totalAmount / item.budget) * 100, 100)
              : 0;
            const colorClass = colors[index % colors.length];

            return (
              <div key={item.welfareId} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${colorClass}`}></div>
                  <div>
                    <p className="font-semibold text-gray-800 text-theme-sm dark:text-white/90">
                      {item.welfareName}
                    </p>
                    <span className="block text-gray-500 text-theme-xs dark:text-gray-400">
                      {item.claimCount} คำขอ • {formatCurrency(item.totalAmount)}
                    </span>
                  </div>
                </div>

                <div className="flex w-full max-w-[140px] items-center gap-3">
                  <div className="relative block h-2 w-full max-w-[100px] rounded-sm bg-gray-200 dark:bg-gray-800">
                    <div
                      className={`absolute left-0 top-0 flex h-full items-center justify-center rounded-sm ${colorClass} text-xs font-medium text-white`}
                      style={{ width: `${usagePercent}%` }}
                    ></div>
                  </div>
                  <p className="font-medium text-gray-800 text-theme-sm dark:text-white/90">
                    {usagePercent.toFixed(0)}%
                  </p>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            ไม่มีข้อมูลสวัสดิการ
          </div>
        )}
      </div>
    </div>
  );
}
