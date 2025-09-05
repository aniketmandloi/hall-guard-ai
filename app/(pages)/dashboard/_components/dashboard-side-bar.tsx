"use client";

import CustomLink from "@/components/custom-link";
import { cn } from "@/lib/utils";
import { Banknote, Folder, HomeIcon, Settings } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";

export default function DashboardSideBar() {
  const pathname = usePathname();

  return (
    <div className="w-64 border-r h-full bg-background/50 backdrop-blur-xl">
      <div className="flex h-full flex-col">
        <div className="flex h-[3.45rem] items-center border-b px-6">
          <Link
            prefetch={true}
            className="flex items-center gap-2 font-semibold transition-colors hover:text-primary"
            href="/"
          >
            <span className="bg-gradient-to-r from-gray-900 via-blue-800 to-gray-900 dark:from-white dark:via-blue-300 dark:to-white bg-clip-text text-transparent">
              Nextjs Starter Kit
            </span>
          </Link>
        </div>

        <nav className="flex-1 space-y-1 p-4">
          <Link
            prefetch={true}
            href="/dashboard"
            className={cn(
              "relative flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors",
              pathname === "/dashboard"
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {pathname === "/dashboard" && (
              <motion.div
                layoutId="activeNav"
                className="absolute inset-0 bg-primary/10 rounded-lg"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              />
            )}
            <HomeIcon className="h-4 w-4" />
            <span className="relative">Overview</span>
          </Link>

          <Link
            prefetch={true}
            href="/dashboard/projects"
            className={cn(
              "relative flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors",
              pathname === "/dashboard/projects"
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {pathname === "/dashboard/projects" && (
              <motion.div
                layoutId="activeNav"
                className="absolute inset-0 bg-primary/10 rounded-lg"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              />
            )}
            <Folder className="h-4 w-4" />
            <span className="relative">Projects</span>
          </Link>

          <Link
            prefetch={true}
            href="/dashboard/finance"
            className={cn(
              "relative flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors",
              pathname === "/dashboard/finance"
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {pathname === "/dashboard/finance" && (
              <motion.div
                layoutId="activeNav"
                className="absolute inset-0 bg-primary/10 rounded-lg"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              />
            )}
            <Banknote className="h-4 w-4" />
            <span className="relative">Finance</span>
          </Link>

          <Link
            prefetch={true}
            href="/dashboard/settings"
            className={cn(
              "relative flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors",
              pathname === "/dashboard/settings"
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {pathname === "/dashboard/settings" && (
              <motion.div
                layoutId="activeNav"
                className="absolute inset-0 bg-primary/10 rounded-lg"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              />
            )}
            <Settings className="h-4 w-4" />
            <span className="relative">Settings</span>
          </Link>
        </nav>
      </div>
    </div>
  );
}
