"use client";
import React, { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { useSidebar } from "../context/SidebarContext";
import { UserType } from "@/types/auth";
import {
  BoxCubeIcon,
  CalenderIcon,
  ChevronDownIcon,
  GridIcon,
  HorizontaLDots,
  ListIcon,
  PieChartIcon,
  UserCircleIcon,
} from "../icons/index";

type NavItem = {
  name: string;
  icon: React.ReactNode;
  path?: string;
  subItems?: { name: string; path: string; pro?: boolean; new?: boolean; roles?: UserType[] }[];
  roles?: UserType[]; // Roles that can access this item
};

const navItems: NavItem[] = [
  {
    icon: <GridIcon />,
    name: "ภาพรวม",
    subItems: [{ name: "Dashboard", path: "/dashboard", pro: false }],
    roles: [UserType.ADMIN, UserType.USER], // Both can access
  },
  {
    icon: <UserCircleIcon />,
    name: "สวัสดิการ",
    subItems: [
      { name: "รายการสวัสดิการ", path: "/dashboard/welfare", pro: false, roles: [UserType.ADMIN, UserType.USER] },
      { name: "ยื่นคำร้อง", path: "/dashboard/welfare/submit", pro: false, roles: [UserType.USER] },
    ],
    roles: [UserType.ADMIN, UserType.USER], // Both can access
  },
  {
    icon: <ListIcon />,
    name: "คำร้องของฉัน",
    subItems: [
      { name: "รายการคำร้อง", path: "/dashboard/claims", pro: false, roles: [UserType.USER] },
      { name: "ประวัติคำร้อง", path: "/dashboard/claims", pro: false, roles: [UserType.USER] },
    ],
    roles: [UserType.USER],
  },
  {
    icon: <ListIcon />,
    name: "อนุมัติคำร้อง",
    subItems: [
      { name: "รอตรวจสอบ (Admin)", path: "/admin/claims", pro: false, roles: [UserType.ADMIN] },
      { name: "รออนุมัติสุดท้าย (Manager)", path: "/admin/claims", pro: false, roles: [UserType.ADMIN] },
    ],
    roles: [UserType.ADMIN],
  },
  {
    icon: <BoxCubeIcon />,
    name: "การจัดการสวัสดิการ",
    subItems: [
      { name: "เพิ่มสวัสดิการ", path: "/admin/welfare", pro: false, roles: [UserType.ADMIN] }, // Admin only
      { name: "แก้ไขสวัสดิการ", path: "/admin/welfare/create", pro: false, roles: [UserType.ADMIN] }, // Admin only
    ],
    roles: [UserType.ADMIN], // Admin only
  },
  {
    icon: <UserCircleIcon />,
    name: "การจัดการผู้ใช้",
    subItems: [
      { name: "ผู้ใช้ทั้งหมด", path: "/admin/users", pro: false, roles: [UserType.ADMIN] }, // Admin only
      { name: "จัดการผู้ดูแลระบบ", path: "/admin/admins", pro: false, roles: [UserType.ADMIN] }, // Admin only
    ],
    roles: [UserType.ADMIN], // Admin only
  },
  {
    icon: <CalenderIcon />,
    name: "ปฏิทิน",
    path: "/calendar",
    roles: [UserType.ADMIN, UserType.USER], // Both can access
  },
];

const othersItems: NavItem[] = [
  {
    icon: <PieChartIcon />,
    name: "รายงาน",
    subItems: [
      { name: "รายงานสวัสดิการ", path: "/admin/reports/welfare", pro: false, roles: [UserType.ADMIN] },
      { name: "รายงานคำร้องขอรับสวัสดิการ", path: "/admin/reports/claims", pro: false, roles: [UserType.ADMIN] },
    ],
    roles: [UserType.ADMIN], // Admin only
  },
  {
    icon: <BoxCubeIcon />,
    name: "การตั้งค่าระบบ",
    subItems: [
      { name: "ตั้งค่าทั่วไป", path: "/admin/settings", pro: false, roles: [UserType.ADMIN] },
      { name: "ตรวจสอบ Activity Log", path: "/admin/audit-logs", pro: false, roles: [UserType.ADMIN] },
    ],
    roles: [UserType.ADMIN], // Admin only
  },
];

const AppSidebar: React.FC = () => {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useSidebar();
  const pathname = usePathname();
  const { data: session } = useSession();

  // Function to check if user has access to a nav item
  const hasAccess = (item: NavItem): boolean => {
    if (!item.roles || !session?.user?.userType) return true;
    return item.roles.includes(session.user.userType);
  };

  // Function to filter submenu items based on user role
  const filterSubItems = (subItems: NavItem['subItems']) => {
    if (!subItems) return undefined;
    return subItems.filter(subItem => {
      if (!subItem.roles || !session?.user?.userType) return true;
      return subItem.roles.includes(session.user.userType);
    });
  };

  const renderMenuItems = (
    navItems: NavItem[],
    menuType: "main" | "others"
  ) => (
    <ul className="flex flex-col gap-4">
      {navItems.filter(hasAccess).map((nav, index) => {
        const filteredSubItems = filterSubItems(nav.subItems);
        
        // Don't render if no subitems are accessible
        if (nav.subItems && (!filteredSubItems || filteredSubItems.length === 0)) {
          return null;
        }

        return (
        <li key={nav.name}>
          {nav.subItems ? (
            <button
              onClick={() => handleSubmenuToggle(index, menuType)}
              className={`menu-item group  ${
                openSubmenu?.type === menuType && openSubmenu?.index === index
                  ? "menu-item-active"
                  : "menu-item-inactive"
              } cursor-pointer ${
                !isExpanded && !isHovered
                  ? "lg:justify-center"
                  : "lg:justify-start"
              }`}
            >
              <span
                className={` ${
                  openSubmenu?.type === menuType && openSubmenu?.index === index
                    ? "menu-item-icon-active"
                    : "menu-item-icon-inactive"
                }`}
              >
                {nav.icon}
              </span>
              {(isExpanded || isHovered || isMobileOpen) && (
                <span className={`menu-item-text`}>{nav.name}</span>
              )}
              {(isExpanded || isHovered || isMobileOpen) && (
                <ChevronDownIcon
                  className={`ml-auto w-5 h-5 transition-transform duration-200  ${
                    openSubmenu?.type === menuType &&
                    openSubmenu?.index === index
                      ? "rotate-180 text-brand-500"
                      : ""
                  }`}
                />
              )}
            </button>
          ) : (
            nav.path && (
              <Link
                href={nav.path}
                className={`menu-item group ${
                  isActive(nav.path) ? "menu-item-active" : "menu-item-inactive"
                }`}
              >
                <span
                  className={`${
                    isActive(nav.path)
                      ? "menu-item-icon-active"
                      : "menu-item-icon-inactive"
                  }`}
                >
                  {nav.icon}
                </span>
                {(isExpanded || isHovered || isMobileOpen) && (
                  <span className={`menu-item-text`}>{nav.name}</span>
                )}
              </Link>
            )
          )}
          {nav.subItems && (isExpanded || isHovered || isMobileOpen) && (
            <div
              ref={(el) => {
                subMenuRefs.current[`${menuType}-${index}`] = el;
              }}
              className="overflow-hidden transition-all duration-300"
              style={{
                height:
                  openSubmenu?.type === menuType && openSubmenu?.index === index
                    ? `${subMenuHeight[`${menuType}-${index}`]}px`
                    : "0px",
              }}
            >
              <ul className="mt-2 space-y-1 ml-9">
                {filteredSubItems?.map((subItem) => (
                  <li key={subItem.name}>
                    <Link
                      href={subItem.path}
                      className={`menu-dropdown-item ${
                        isActive(subItem.path)
                          ? "menu-dropdown-item-active"
                          : "menu-dropdown-item-inactive"
                      }`}
                    >
                      {subItem.name}
                      <span className="flex items-center gap-1 ml-auto">
                        {subItem.new && (
                          <span
                            className={`ml-auto ${
                              isActive(subItem.path)
                                ? "menu-dropdown-badge-active"
                                : "menu-dropdown-badge-inactive"
                            } menu-dropdown-badge `}
                          >
                            new
                          </span>
                        )}
                        {subItem.pro && (
                          <span
                            className={`ml-auto ${
                              isActive(subItem.path)
                                ? "menu-dropdown-badge-active"
                                : "menu-dropdown-badge-inactive"
                            } menu-dropdown-badge `}
                          >
                            pro
                          </span>
                        )}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </li>
        );
      }).filter(Boolean)}
    </ul>
  );

  const [openSubmenu, setOpenSubmenu] = useState<{
    type: "main" | "others";
    index: number;
  } | null>(null);
  const [subMenuHeight, setSubMenuHeight] = useState<Record<string, number>>(
    {}
  );
  const subMenuRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // const isActive = (path: string) => path === pathname;
   const isActive = useCallback((path: string) => path === pathname, [pathname]);

  useEffect(() => {
    // Check if the current path matches any submenu item
    let submenuMatched = false;
    ["main", "others"].forEach((menuType) => {
      const items = menuType === "main" ? navItems : othersItems;
      items.forEach((nav, index) => {
        if (nav.subItems) {
          nav.subItems.forEach((subItem) => {
            if (isActive(subItem.path)) {
              setOpenSubmenu({
                type: menuType as "main" | "others",
                index,
              });
              submenuMatched = true;
            }
          });
        }
      });
    });

    // If no submenu item matches, close the open submenu
    if (!submenuMatched) {
      setOpenSubmenu(null);
    }
  }, [pathname,isActive]);

  useEffect(() => {
    // Set the height of the submenu items when the submenu is opened
    if (openSubmenu !== null) {
      const key = `${openSubmenu.type}-${openSubmenu.index}`;
      if (subMenuRefs.current[key]) {
        setSubMenuHeight((prevHeights) => ({
          ...prevHeights,
          [key]: subMenuRefs.current[key]?.scrollHeight || 0,
        }));
      }
    }
  }, [openSubmenu]);

  const handleSubmenuToggle = (index: number, menuType: "main" | "others") => {
    setOpenSubmenu((prevOpenSubmenu) => {
      if (
        prevOpenSubmenu &&
        prevOpenSubmenu.type === menuType &&
        prevOpenSubmenu.index === index
      ) {
        return null;
      }
      return { type: menuType, index };
    });
  };

  return (
    <aside
      className={`fixed mt-16 flex flex-col lg:mt-0 top-0 px-5 left-0 bg-white dark:bg-gray-900 dark:border-gray-800 text-gray-900 h-screen transition-all duration-300 ease-in-out z-50 border-r border-gray-200 
        ${
          isExpanded || isMobileOpen
            ? "w-[290px]"
            : isHovered
            ? "w-[290px]"
            : "w-[90px]"
        }
        ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0`}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className={`py-8 flex  ${
          !isExpanded && !isHovered ? "lg:justify-center" : "justify-start"
        }`}
      >
        <Link href="/">
          {isExpanded || isHovered || isMobileOpen ? (
          <div className="flex items-center gap-2 ps-7">
            <Image
              width={50}
              height={50}
              src="/images/logo/welfareLogo.png"
              alt="Logo"
            />            
            <div className="flex flex-col justify-center font-bold text-lg">
              <span className="text-gray-800 dark:text-white/90">Welfare</span>
              <span className="text-gray-500 dark:text-gray-400 text-sm -mt-1">Management System</span>
            </div>
          </div>
          ) : (
            <Image
              src="/images/logo/logo-icon.svg"
              alt="Logo"
              width={32}
              height={32}
            />
          )}
        </Link>
      </div>
      <div className="flex flex-col overflow-y-auto duration-300 ease-linear no-scrollbar">
        <nav className="mb-6">
          <div className="flex flex-col gap-4">
            <div>
              <h2
                className={`mb-4 text-xs uppercase flex leading-[20px] text-gray-400 ${
                  !isExpanded && !isHovered
                    ? "lg:justify-center"
                    : "justify-start"
                }`}
              >
                {isExpanded || isHovered || isMobileOpen ? (
                  "Menu"
                ) : (
                  <HorizontaLDots />
                )}
              </h2>
              {renderMenuItems(navItems, "main")}
            </div>

            <div className="">
              <h2
                className={`mb-4 text-xs uppercase flex leading-[20px] text-gray-400 ${
                  !isExpanded && !isHovered
                    ? "lg:justify-center"
                    : "justify-start"
                }`}
              >
                {isExpanded || isHovered || isMobileOpen ? (
                  "Others"
                ) : (
                  <HorizontaLDots />
                )}
              </h2>
              {renderMenuItems(othersItems, "others")}
            </div>
          </div>
        </nav>
      </div>
    </aside>
  );
};

export default AppSidebar;
