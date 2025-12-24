"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  List,
  FileText,
  Mail,
  Phone,
  CreditCard,
  LogOut,
  Settings,
  Folder,
  CalendarDays
} from "lucide-react";
import Image from "next/image";

const routes = [
  {
    label: "Dashboard",
    icon: LayoutDashboard,
    href: "/dashboard",
  },
  {
    label: "Prospect Lists",
    icon: List,
    href: "/dashboard/list",
  },
  // Removed Data Request and Credit Requests
  {
    label: "Pipeline",
    icon: FileText,
    href: "/dashboard/pipeline",
  },
  {
    label: "Assets",
    icon: Folder,
    href: "/dashboard/assets",
  },
  {
    label: "Content Calendar",
    icon: CalendarDays,
    href: "/dashboard/content-calendar",
  },
  {
    label: "Settings",
    icon: Settings,
    href: "/dashboard/settings",
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleNavigation = (href: string) => {
    // Trigger a hard navigation to ensure proper data fetching
    router.push(href);
  };

  const handleLogout = async () => {
    try {
      const response = await fetch("/api/logout", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        localStorage.clear();
        sessionStorage.clear();
        window.location.replace("/");
      } else {
        const data = await response.json().catch(() => null);
        console.error("Logout failed:", data?.message || "Unknown error");
        window.location.replace("/");
      }
    } catch (error) {
      console.error("Error during logout:", error);
      window.location.replace("/");
    }
  };

  return (
    <div className="space-y-4 py-4 flex flex-col h-full bg-[#00153D] text-white w-64">
      <div className="px-4 py-2 flex-1">
        <div className="flex items-center justify-center mb-8">
          <Image
            src={require("@/public/rsm-logo.svg")}
            alt="RSM Logo"
            width={150}
            height={150}
            // style={{
            //   filter:
            //     "brightness(0) saturate(100%) invert(100%) sepia(0%) saturate(0%) hue-rotate(180deg) brightness(100%) contrast(100%)",
            // }}
          />
        </div>
        <div className="space-y-1">
          {routes.map((route) => (
            <Button
              key={route.href}
              onClick={() => handleNavigation(route.href)}
              className={cn(
                "text-base group flex p-3 w-full justify-start font-medium cursor-pointer transition rounded-lg",
                pathname === route.href
                  ? "bg-[#009CDE] text-white shadow-lg hover:bg-[#009CDE] hover:text-white"
                  : "text-gray-300 hover:text-white hover:bg-[#3F9C35] hover:rounded-lg"
              )}
              variant="ghost"
            >
              <div className="flex items-center flex-1">
                <route.icon
                  className={cn(
                    "h-5 w-5 mr-3",
                    pathname === route.href
                      ? "text-white"
                      : "text-[#888B8D] group-hover:text-white"
                  )}
                />
                {route.label}
              </div>
            </Button>
          ))}
        </div>
      </div>
      <div className="px-4 py-2 space-y-2">
        <div className="rounded-lg bg-[#0B204F]/60 border border-white/10 p-3 text-sm">
          <div className="font-medium text-white/90 mb-2">Support</div>
          <div className="space-y-1.5 text-white/85">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-white/70" />
              <a href="mailto:neeraj@nexuses.in" className="hover:underline">neeraj@nexuses.in</a>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-white/70" />
              <a href="tel:+919717689152" className="hover:underline">+91 9717689152</a>
            </div>
            <div className="flex items-center gap-2">
              <a
                href="https://wa.me/919717689152?text=Hello%20team%2C%20I%20need%20support."
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Contact support on WhatsApp"
                className="inline-flex items-center"
              >
                <Image
                  src={require("@/public/whatsapp.svg")}
                  alt="WhatsApp"
                  width={16}
                  height={16}
                  className="opacity-80"
                />
              </a>
              <a
                href="https://wa.me/919717689152?text=Hello%20team%2C%20I%20need%20support."
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline"
              >
                WhatsApp
              </a>
            </div>
          </div>
        </div>
        <Button
          onClick={handleLogout}
          variant="ghost"
          className="w-full justify-start text-gray-300 hover:text-white hover:bg-[#009CDE] rounded-lg"
        >
          <LogOut className="h-5 w-5 mr-3" />
          Logout
        </Button>
      </div>
    </div>
  );
}
