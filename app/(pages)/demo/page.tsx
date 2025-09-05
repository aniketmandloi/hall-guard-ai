"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import PageWrapper from "@/components/wrapper/page-wrapper";
import { motion } from "framer-motion";
import { ArrowRight, Code, Lightbulb, Rocket, Zap } from "lucide-react";
import Link from "next/link";

export default function DemoPage() {
  return (
    <PageWrapper>
      <div className="relative min-h-screen bg-background/50 backdrop-blur-xl">
        {/* Background gradient */}
        <div className="absolute inset-0 -z-10 h-full w-full bg-white dark:bg-black bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]">
          <div className="absolute left-0 right-0 top-0 -z-10 m-auto h-[310px] w-[310px] rounded-full bg-blue-400 dark:bg-blue-500 opacity-20 blur-[100px]"></div>
        </div>

        <div className="flex flex-col gap-6 p-6">
          {/* Header Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-gray-900 via-blue-800 to-gray-900 dark:from-white dark:via-blue-300 dark:to-white pb-2">
              Demo Features
            </h1>
            <p className="text-muted-foreground">
              Explore the capabilities of our platform
            </p>
          </motion.div>

          {/* Feature Cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="grid gap-4 md:grid-cols-2 lg:grid-cols-3"
          >
            <Card className="bg-background/50 backdrop-blur-xl">
              <CardHeader>
                <Rocket className="h-5 w-5 text-blue-500 mb-2" />
                <CardTitle>Quick Start</CardTitle>
                <CardDescription>
                  Get up and running in minutes with our streamlined setup
                  process
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full" asChild>
                  <Link href="/docs/quickstart">
                    Try Now <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-background/50 backdrop-blur-xl">
              <CardHeader>
                <Code className="h-5 w-5 text-green-500 mb-2" />
                <CardTitle>Code Examples</CardTitle>
                <CardDescription>
                  Explore real-world examples and implementation guides
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full" asChild>
                  <Link href="/docs/examples">
                    View Examples <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-background/50 backdrop-blur-xl">
              <CardHeader>
                <Lightbulb className="h-5 w-5 text-yellow-500 mb-2" />
                <CardTitle>Interactive Demo</CardTitle>
                <CardDescription>
                  Try out features in our interactive playground
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full" asChild>
                  <Link href="/playground">
                    Launch Demo <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          {/* Live Preview Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card className="bg-background/50 backdrop-blur-xl">
              <CardHeader>
                <CardTitle>Live Preview</CardTitle>
                <CardDescription>
                  See the platform in action with our live demo environment
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Add your live preview content here */}
                <div className="rounded-lg border p-4">
                  <p className="text-sm text-muted-foreground">
                    Live preview content placeholder
                  </p>
                </div>
                <Button className="w-full">Launch Full Demo</Button>
              </CardContent>
            </Card>
          </motion.div>

          {/* Getting Started Guide */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="grid gap-4 md:grid-cols-2"
          >
            <Card className="bg-background/50 backdrop-blur-xl">
              <CardHeader>
                <Zap className="h-5 w-5 text-purple-500 mb-2" />
                <CardTitle>Getting Started</CardTitle>
                <CardDescription>
                  Follow our step-by-step guide to get started
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-400">
                      1
                    </div>
                    <p className="font-medium">Sign up for an account</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-400">
                      2
                    </div>
                    <p className="font-medium">Configure your workspace</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-400">
                      3
                    </div>
                    <p className="font-medium">Start building</p>
                  </div>
                </div>
                <Button variant="outline" className="w-full" asChild>
                  <Link href="/docs">
                    View Documentation <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-background/50 backdrop-blur-xl">
              <CardHeader>
                <CardTitle>Need Help?</CardTitle>
                <CardDescription>
                  Get support from our team and community
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Button variant="outline" className="w-full" asChild>
                    <Link href="/docs">Documentation</Link>
                  </Button>
                  <Button variant="outline" className="w-full" asChild>
                    <Link href="/support">Support</Link>
                  </Button>
                  <Button variant="outline" className="w-full" asChild>
                    <Link href="https://github.com">GitHub</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </PageWrapper>
  );
}
