"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { XCircle } from "lucide-react";
import { motion } from "framer-motion";
import PageWrapper from "@/components/wrapper/page-wrapper";

export default function Cancel() {
  return (
    <PageWrapper>
      <div className="container mx-auto px-4">
        <section className="relative flex flex-col items-center justify-center py-20">
          {/* Background gradient */}
          <div className="absolute inset-0 -z-10 h-full w-full bg-white dark:bg-black bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]">
            <div className="absolute left-0 right-0 top-0 -z-10 m-auto h-[310px] w-[310px] rounded-full bg-red-400 dark:bg-red-500 opacity-20 blur-[100px]"></div>
          </div>

          <div className="space-y-6 text-center">
            {/* Pill badge */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mx-auto w-fit rounded-full border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-900/30 px-4 py-1 mb-6"
            >
              <div className="flex items-center gap-2 text-sm font-medium text-red-900 dark:text-red-200">
                <XCircle className="h-4 w-4" />
                <span>Payment Cancelled</span>
              </div>
            </motion.div>

            {/* Main heading */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-gray-900 via-red-800 to-gray-900 dark:from-white dark:via-red-300 dark:to-white animate-gradient-x pb-2"
            >
              Payment Not Completed
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-lg md:text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto"
            >
              No worries! Your payment was cancelled and you haven't been
              charged. You can try again whenever you're ready.
            </motion.p>

            {/* Action Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex flex-col sm:flex-row gap-4 justify-center mt-8"
            >
              <Link href="/pricing">
                <Button size="lg" className="min-w-[200px]">
                  Try Again
                </Button>
              </Link>
              <Link href="/">
                <Button variant="outline" size="lg" className="min-w-[200px]">
                  Back to Home
                </Button>
              </Link>
            </motion.div>
          </div>
        </section>
      </div>
    </PageWrapper>
  );
}
