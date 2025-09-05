"use client";

import ModeToggle from "@/components/mode-toggle";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import {
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { UserProfile } from "@/components/user-profile";
import config from "@/config";
import { HamburgerMenuIcon } from "@radix-ui/react-icons";
import { Banknote, Folder, HomeIcon, Settings } from "lucide-react";
import Link from "next/link";
import { ReactNode } from "react";

export default function DashboardTopNav({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col">
      <header className="flex h-14 lg:h-[55px] items-center gap-4 border-b bg-background/50 backdrop-blur-xl px-4 sticky top-0 z-50">
        <Dialog>
          <SheetTrigger className="min-[1024px]:hidden p-2 transition hover:bg-accent rounded-md">
            <HamburgerMenuIcon className="h-5 w-5" />
            <span className="sr-only">Menu</span>
          </SheetTrigger>
          <SheetContent
            side="left"
            className="w-64 p-0 bg-background/95 backdrop-blur-xl"
          >
            <SheetHeader className="border-b h-[3.45rem] px-6 flex items-center">
              <Link href="/">
                <SheetTitle className="bg-gradient-to-r from-gray-900 via-blue-800 to-gray-900 dark:from-white dark:via-blue-300 dark:to-white bg-clip-text text-transparent">
                  Nextjs Starter Kit
                </SheetTitle>
              </Link>
            </SheetHeader>
            <div className="flex flex-col space-y-3 p-4">
              <DialogClose asChild>
                <Link href="/dashboard">
                  <Button
                    variant="ghost"
                    className="w-full justify-start gap-2"
                  >
                    <HomeIcon className="h-4 w-4" />
                    Home
                  </Button>
                </Link>
              </DialogClose>
              <DialogClose asChild>
                <Link href="/dashboard/projects">
                  <Button
                    variant="ghost"
                    className="w-full justify-start gap-2"
                  >
                    <Folder className="h-4 w-4" />
                    Projects
                  </Button>
                </Link>
              </DialogClose>
              <DialogClose asChild>
                <Link href="/dashboard/finance">
                  <Button
                    variant="ghost"
                    className="w-full justify-start gap-2"
                  >
                    <Banknote className="h-4 w-4" />
                    Finance
                  </Button>
                </Link>
              </DialogClose>
              <Separator className="my-2" />
              <DialogClose asChild>
                <Link href="/dashboard/settings">
                  <Button
                    variant="ghost"
                    className="w-full justify-start gap-2"
                  >
                    <Settings className="h-4 w-4" />
                    Settings
                  </Button>
                </Link>
              </DialogClose>
            </div>
          </SheetContent>
        </Dialog>
        <div className="flex justify-center items-center gap-2 ml-auto">
          {config?.auth?.enabled && <UserProfile />}
          <ModeToggle />
        </div>
      </header>
      {children}
    </div>
  );
}
