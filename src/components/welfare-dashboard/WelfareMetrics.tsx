"use client";
import React from "react";
import Badge from "../ui/badge/Badge";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  BoxIconLine,
  GroupIcon,
} from "@/icons";

interface MetricsData {
  totalUsers: number;
  userGrowth: number;
  totalClaims: number;
  claimsGrowth: number;
}

interface WelfareMetricsProps {
  data: MetricsData;
}

export const WelfareMetrics: React.FC<WelfareMetricsProps> = ({ data }) => {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-6">
      {/* <!-- Metric Item Start - Users --> */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/5 md:p-6">
        <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl dark:bg-gray-800">
          <GroupIcon className="text-gray-800 size-6 dark:text-white/90" />
        </div>

        <div className="flex items-end justify-between mt-5">
          <div>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              พนักงาน
            </span>
            <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
              {data.totalUsers.toLocaleString()}
            </h4>
          </div>
          <Badge color={data.userGrowth >= 0 ? "success" : "error"}>
            {data.userGrowth >= 0 ? (
              <ArrowUpIcon />
            ) : (
              <ArrowDownIcon className="text-error-500" />
            )}
            {Math.abs(data.userGrowth).toFixed(2)}%
          </Badge>
        </div>
      </div>
      {/* <!-- Metric Item End --> */}

      {/* <!-- Metric Item Start - Claims --> */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/5 md:p-6">
        <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl dark:bg-gray-800">
          <BoxIconLine className="text-gray-800 dark:text-white/90" />
        </div>
        <div className="flex items-end justify-between mt-5">
          <div>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              คำขอเบิกสวัสดิการ
            </span>
            <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
              {data.totalClaims.toLocaleString()}
            </h4>
          </div>

          <Badge color={data.claimsGrowth >= 0 ? "success" : "error"}>
            {data.claimsGrowth >= 0 ? (
              <ArrowUpIcon />
            ) : (
              <ArrowDownIcon className="text-error-500" />
            )}
            {Math.abs(data.claimsGrowth).toFixed(2)}%
          </Badge>
        </div>
      </div>
      {/* <!-- Metric Item End --> */}
    </div>
  );
};
