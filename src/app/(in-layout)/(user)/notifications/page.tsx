"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { PageLoading, Loading } from "@/components/ui/loading";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  relatedClaimId: string | null;
  createdAt: string;
  claim?: {
    id: string;
    requestedAmount: number;
    approvedAmount: number | null;
    status: string;
    welfareSubType: {
      name: string;
      welfareType: {
        name: string;
      };
    };
  } | null;
}

// Notification type configurations
const notificationTypeConfig: Record<string, { 
  icon: string; 
  color: string; 
  bgColor: string;
  label: string;
}> = {
  CLAIM_SUBMITTED: {
    icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
    color: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-100 dark:bg-blue-900/30",
    label: "ยื่นคำร้อง",
  },
  CLAIM_APPROVED: {
    icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
    color: "text-green-600 dark:text-green-400",
    bgColor: "bg-green-100 dark:bg-green-900/30",
    label: "อนุมัติ",
  },
  CLAIM_REJECTED: {
    icon: "M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z",
    color: "text-red-600 dark:text-red-400",
    bgColor: "bg-red-100 dark:bg-red-900/30",
    label: "ไม่อนุมัติ",
  },
  CLAIM_COMMENT: {
    icon: "M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z",
    color: "text-amber-600 dark:text-amber-400",
    bgColor: "bg-amber-100 dark:bg-amber-900/30",
    label: "ความคิดเห็น",
  },
  CLAIM_COMPLETED: {
    icon: "M5 13l4 4L19 7",
    color: "text-emerald-600 dark:text-emerald-400",
    bgColor: "bg-emerald-100 dark:bg-emerald-900/30",
    label: "เสร็จสิ้น",
  },
  SYSTEM: {
    icon: "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
    color: "text-gray-600 dark:text-gray-400",
    bgColor: "bg-gray-100 dark:bg-gray-800",
    label: "ระบบ",
  },
};

const filterTabs = [
  { key: "ALL", label: "ทั้งหมด" },
  { key: "UNREAD", label: "ยังไม่อ่าน" },
  { key: "CLAIM_APPROVED", label: "อนุมัติ" },
  { key: "CLAIM_REJECTED", label: "ไม่อนุมัติ" },
  { key: "CLAIM_COMMENT", label: "ความคิดเห็น" },
];

export default function NotificationsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("ALL");
  const [unreadCount, setUnreadCount] = useState(0);
  const [markingAll, setMarkingAll] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/signin");
    }
  }, [status, router]);

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filter === "UNREAD") {
        params.append("unreadOnly", "true");
      }
      params.append("limit", "100");

      const response = await fetch(`/api/notifications?${params.toString()}`);
      const result = await response.json();

      if (result.success && result.data) {
        let notifs = result.data.notifications || [];
        
        // Filter by type if not ALL or UNREAD
        if (filter !== "ALL" && filter !== "UNREAD") {
          notifs = notifs.filter((n: Notification) => n.type === filter);
        }
        
        setNotifications(notifs);
        setUnreadCount(result.data.unreadCount || 0);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    if (session?.user) {
      fetchNotifications();
    }
  }, [session, fetchNotifications]);

  const markAsRead = async (notificationId: string) => {
    try {
      await fetch(`/api/notifications/${notificationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isRead: true }),
      });
      
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      setMarkingAll(true);
      await fetch("/api/notifications/mark-all-read", {
        method: "POST",
      });
      
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error("Error marking all as read:", error);
    } finally {
      setMarkingAll(false);
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) {
      return "เมื่อสักครู่";
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} นาทีที่แล้ว`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours} ชั่วโมงที่แล้ว`;
    } else if (diffInSeconds < 604800) {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days} วันที่แล้ว`;
    } else {
      return date.toLocaleDateString("th-TH", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    }
  };

  const getConfig = (type: string) => {
    return notificationTypeConfig[type] || notificationTypeConfig.SYSTEM;
  };

  const getNotificationLink = (notification: Notification) => {
    if (notification.relatedClaimId) {
      return `/claims/${notification.relatedClaimId}`;
    }
    return null;
  };

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.isRead) {
      await markAsRead(notification.id);
    }
    
    const link = getNotificationLink(notification);
    if (link) {
      router.push(link);
    }
  };

  if (status === "loading" || (loading && notifications.length === 0)) {
    return <PageLoading text="กำลังโหลดการแจ้งเตือน..." />;
  }

  // Group notifications by date
  const groupedNotifications = notifications.reduce((groups, notification) => {
    const date = new Date(notification.createdAt);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    let key: string;
    if (date.toDateString() === today.toDateString()) {
      key = "วันนี้";
    } else if (date.toDateString() === yesterday.toDateString()) {
      key = "เมื่อวาน";
    } else {
      key = date.toLocaleDateString("th-TH", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    }

    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(notification);
    return groups;
  }, {} as Record<string, Notification[]>);

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
            การแจ้งเตือน
          </h1>
          <p className="mt-1 text-gray-500 dark:text-gray-400">
            ติดตามความเคลื่อนไหวของคำร้องสวัสดิการ
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            disabled={markingAll}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-brand-600 bg-brand-50 rounded-lg hover:bg-brand-100 transition-colors dark:bg-brand-500/10 dark:text-brand-400 dark:hover:bg-brand-500/20 disabled:opacity-50"
          >
            {markingAll ? (
              <>
                <Loading size="sm" variant="spinner" />
                กำลังดำเนินการ...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                อ่านทั้งหมด ({unreadCount})
              </>
            )}
          </button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 dark:bg-brand-500/10">
              <svg className="w-5 h-5 text-brand-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800 dark:text-white">{notifications.length}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">ทั้งหมด</p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 dark:bg-amber-500/10">
              <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800 dark:text-white">{unreadCount}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">ยังไม่อ่าน</p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-50 dark:bg-green-500/10">
              <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800 dark:text-white">
                {notifications.filter(n => n.type === "CLAIM_APPROVED" || n.type === "CLAIM_COMPLETED").length}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">อนุมัติ</p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 dark:bg-red-500/10">
              <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800 dark:text-white">
                {notifications.filter(n => n.type === "CLAIM_REJECTED").length}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">ไม่อนุมัติ</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs & Notifications List */}
      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/5">
        <div className="border-b border-gray-200 dark:border-gray-800">
          <div className="flex overflow-x-auto no-scrollbar">
            {filterTabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                className={`flex items-center gap-2 px-5 py-3.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                  filter === tab.key
                    ? "border-brand-500 text-brand-600 dark:text-brand-400"
                    : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                }`}
              >
                {tab.label}
                {tab.key === "UNREAD" && unreadCount > 0 && (
                  <span className="inline-flex items-center justify-center h-5 min-w-[20px] px-1.5 text-xs font-bold text-white bg-brand-500 rounded-full">
                    {unreadCount}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Notifications List */}
        <div className="p-4">
          {loading ? (
            <div className="flex justify-center py-12">
              <Loading size="md" variant="spinner" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-16">
              <div className="mx-auto w-20 h-20 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
                <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-1">
                ไม่มีการแจ้งเตือน
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                {filter !== "ALL" ? "ไม่มีการแจ้งเตือนในหมวดหมู่นี้" : "คุณยังไม่มีการแจ้งเตือนใดๆ"}
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedNotifications).map(([date, dateNotifications]) => (
                <div key={date}>
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3 px-1">
                    {date}
                  </h3>
                  <div className="space-y-2">
                    {dateNotifications.map((notification) => {
                      const config = getConfig(notification.type);
                      const hasLink = notification.relatedClaimId !== null;
                      
                      return (
                        <div
                          key={notification.id}
                          onClick={() => handleNotificationClick(notification)}
                          className={`group relative rounded-xl border p-4 transition-all ${
                            hasLink ? "cursor-pointer" : ""
                          } ${
                            !notification.isRead
                              ? "bg-brand-50/50 border-brand-200 dark:bg-brand-500/5 dark:border-brand-500/20"
                              : "bg-gray-50/50 border-gray-200 hover:bg-white hover:shadow-sm dark:bg-gray-800/30 dark:border-gray-700 dark:hover:bg-gray-800/50"
                          }`}
                        >
                          {/* Unread indicator */}
                          {!notification.isRead && (
                            <div className="absolute top-4 right-4">
                              <span className="flex h-2.5 w-2.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-brand-500"></span>
                              </span>
                            </div>
                          )}

                          <div className="flex gap-4">
                            {/* Icon */}
                            <div className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center ${config.bgColor}`}>
                              <svg className={`w-6 h-6 ${config.color}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={config.icon} />
                              </svg>
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <h4 className={`text-base font-semibold ${!notification.isRead ? "text-gray-900 dark:text-white" : "text-gray-700 dark:text-gray-200"}`}>
                                    {notification.title}
                                  </h4>
                                  <span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full mt-1 ${config.bgColor} ${config.color}`}>
                                    {config.label}
                                  </span>
                                </div>
                              </div>

                              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                                {notification.message}
                              </p>

                              {/* Claim info */}
                              {notification.claim && (
                                <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
                                  <span className="inline-flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
                                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    {notification.claim.welfareSubType.welfareType.name}
                                  </span>
                                  <span className="inline-flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
                                    <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    {notification.claim.requestedAmount.toLocaleString()} บาท
                                    {notification.claim.approvedAmount && notification.claim.approvedAmount !== notification.claim.requestedAmount && (
                                      <span className="text-emerald-600 dark:text-emerald-400">
                                        → {notification.claim.approvedAmount.toLocaleString()} บาท
                                      </span>
                                    )}
                                  </span>
                                </div>
                              )}

                              {/* Time */}
                              <div className="mt-3 flex items-center justify-between">
                                <span className="text-xs text-gray-400 dark:text-gray-500">
                                  {formatTimeAgo(notification.createdAt)}
                                </span>
                                {hasLink && (
                                  <span className="inline-flex items-center gap-1 text-xs font-medium text-brand-600 dark:text-brand-400 opacity-0 group-hover:opacity-100 transition-opacity">
                                    ดูรายละเอียด
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
