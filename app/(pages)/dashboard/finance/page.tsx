"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Calendar,
  CreditCard,
  DollarSign,
  LineChart,
  PieChart,
  TrendingUp,
  Users,
} from "lucide-react";
import { motion } from "framer-motion";

export default function FinancePage() {
  return (
    <div className="relative min-h-screen bg-background/50 backdrop-blur-xl">
      {/* Background gradient */}
      <div className="absolute inset-0 -z-10 h-full w-full bg-white dark:bg-black bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]">
        <div className="absolute left-0 right-0 top-0 -z-10 m-auto h-[310px] w-[310px] rounded-full bg-blue-400 dark:bg-blue-500 opacity-20 blur-[100px]"></div>
      </div>

      <div className="flex flex-col gap-6 p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-gray-900 via-blue-800 to-gray-900 dark:from-white dark:via-blue-300 dark:to-white pb-2">
            Finance
          </h1>
          <p className="text-muted-foreground">
            Track your financial metrics and transactions
          </p>
        </motion.div>

        {/* Quick Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="grid gap-4 md:grid-cols-2 lg:grid-cols-4"
        >
          <Card className="bg-background/50 backdrop-blur-xl">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Monthly Revenue
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">$12,345</div>
              <div className="flex items-center gap-1 text-xs text-emerald-500">
                <TrendingUp className="h-3 w-3" />
                <span>+12.5% from last month</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-background/50 backdrop-blur-xl">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Active Subscriptions
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">843</div>
              <div className="flex items-center gap-1 text-xs text-emerald-500">
                <TrendingUp className="h-3 w-3" />
                <span>+5.2% growth</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-background/50 backdrop-blur-xl">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Avg. Transaction
              </CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">$49.99</div>
              <div className="flex items-center gap-1 text-xs text-emerald-500">
                <TrendingUp className="h-3 w-3" />
                <span>+2.1% increase</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-background/50 backdrop-blur-xl">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Annual Growth
              </CardTitle>
              <LineChart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">127%</div>
              <div className="flex items-center gap-1 text-xs text-emerald-500">
                <TrendingUp className="h-3 w-3" />
                <span>Exceeding goals</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Revenue Analysis */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="grid gap-4 md:grid-cols-2 lg:grid-cols-7"
        >
          <Card className="lg:col-span-4 bg-background/50 backdrop-blur-xl">
            <CardHeader>
              <CardTitle>Revenue Trends</CardTitle>
              <CardDescription>Monthly revenue analysis</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="pt-2 space-y-8">
                {/* Chart Container */}
                <div className="h-[240px] w-full flex items-end justify-between gap-2">
                  {[
                    { month: "Jan", value: 6500, growth: "+12%" },
                    { month: "Feb", value: 4500, growth: "-15%" },
                    { month: "Mar", value: 5000, growth: "+8%" },
                    { month: "Apr", value: 5500, growth: "+10%" },
                    { month: "May", value: 6000, growth: "+9%" },
                    { month: "Jun", value: 7500, growth: "+25%" },
                    { month: "Jul", value: 7000, growth: "-7%" },
                    { month: "Aug", value: 8500, growth: "+21%" },
                    { month: "Sep", value: 8000, growth: "-6%" },
                    { month: "Oct", value: 8500, growth: "+6%" },
                    { month: "Nov", value: 9000, growth: "+6%" },
                    { month: "Dec", value: 9500, growth: "+5%" },
                  ].map((item, index) => (
                    <div
                      key={index}
                      className="group relative flex flex-col items-center flex-1"
                    >
                      {/* Growth Label */}
                      <span
                        className={`absolute -top-6 text-xs font-medium ${
                          item.growth.startsWith("+")
                            ? "text-emerald-500"
                            : "text-red-500"
                        }`}
                      >
                        {item.growth}
                      </span>

                      {/* Bar */}
                      <div className="relative w-full">
                        <div
                          className="w-full bg-primary hover:bg-primary/80 transition-colors rounded-sm"
                          style={{
                            height: `${Math.max(
                              (item.value / 10000) * 200,
                              4
                            )}px`,
                          }}
                        />
                      </div>

                      {/* Tooltip */}
                      <div className="absolute bottom-full mb-2 hidden group-hover:block">
                        <div className="bg-background border rounded-md px-2 py-1 text-xs shadow-lg">
                          <div className="font-medium">
                            ${item.value.toLocaleString()}
                          </div>
                        </div>
                      </div>

                      {/* Month Label */}
                      <span className="mt-2 text-xs text-muted-foreground">
                        {item.month}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Legend */}
                <div className="flex items-center justify-between border-t pt-4">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-sm bg-primary" />
                      <span className="text-sm text-muted-foreground">
                        Revenue
                      </span>
                    </div>
                    <div className="text-sm text-emerald-500">+46% YoY</div>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Total: $86,500
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="lg:col-span-3 bg-background/50 backdrop-blur-xl">
            <CardHeader>
              <CardTitle>Revenue Breakdown</CardTitle>
              <CardDescription>Revenue by category</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">Premium Plans</span>
                  <span className="text-muted-foreground">$5,240</span>
                </div>
                <Progress value={65} className="h-2" />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">Add-ons</span>
                  <span className="text-muted-foreground">$2,880</span>
                </div>
                <Progress value={35} className="h-2" />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">Custom Solutions</span>
                  <span className="text-muted-foreground">$4,225</span>
                </div>
                <Progress value={50} className="h-2" />
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full gap-2">
                <PieChart className="h-4 w-4" />
                View Detailed Report
              </Button>
            </CardFooter>
          </Card>
        </motion.div>

        {/* Subscription Analytics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="grid gap-4 md:grid-cols-2 lg:grid-cols-3"
        >
          <Card className="lg:col-span-2 bg-background/50 backdrop-blur-xl">
            <Tabs defaultValue="monthly" className="w-full">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Subscription Analytics</CardTitle>
                  <CardDescription>
                    Track subscription performance
                  </CardDescription>
                </div>
                <TabsList>
                  <TabsTrigger value="monthly">Monthly</TabsTrigger>
                  <TabsTrigger value="quarterly">Quarterly</TabsTrigger>
                  <TabsTrigger value="yearly">Yearly</TabsTrigger>
                </TabsList>
              </CardHeader>
              <CardContent>
                <TabsContent value="monthly" className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="space-y-2">
                      <p className="text-sm font-medium">New Subscriptions</p>
                      <p className="text-2xl font-bold">+124</p>
                      <p className="text-xs text-muted-foreground">
                        Past 30 days
                      </p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Churn Rate</p>
                      <p className="text-2xl font-bold">2.4%</p>
                      <p className="text-xs text-muted-foreground">
                        Industry avg: 3.2%
                      </p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Renewal Rate</p>
                      <p className="text-2xl font-bold">94%</p>
                      <p className="text-xs text-muted-foreground">
                        +2% from last month
                      </p>
                    </div>
                  </div>
                </TabsContent>
                <TabsContent value="quarterly" className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="space-y-2">
                      <p className="text-sm font-medium">New Subscriptions</p>
                      <p className="text-2xl font-bold">+486</p>
                      <p className="text-xs text-muted-foreground">
                        Past quarter
                      </p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Churn Rate</p>
                      <p className="text-2xl font-bold">2.1%</p>
                      <p className="text-xs text-muted-foreground">
                        Industry avg: 3.2%
                      </p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Renewal Rate</p>
                      <p className="text-2xl font-bold">96%</p>
                      <p className="text-xs text-muted-foreground">
                        +3% from last quarter
                      </p>
                    </div>
                  </div>
                </TabsContent>
                <TabsContent value="yearly" className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="space-y-2">
                      <p className="text-sm font-medium">New Subscriptions</p>
                      <p className="text-2xl font-bold">+1,842</p>
                      <p className="text-xs text-muted-foreground">Past year</p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Churn Rate</p>
                      <p className="text-2xl font-bold">1.8%</p>
                      <p className="text-xs text-muted-foreground">
                        Industry avg: 3.2%
                      </p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Renewal Rate</p>
                      <p className="text-2xl font-bold">98%</p>
                      <p className="text-xs text-muted-foreground">
                        +5% from last year
                      </p>
                    </div>
                  </div>
                </TabsContent>
              </CardContent>
            </Tabs>
          </Card>

          <Card className="lg:col-span-1 bg-background/50 backdrop-blur-xl">
            <CardHeader>
              <CardTitle>Upcoming Payments</CardTitle>
              <CardDescription>Next 7 days</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  {
                    amount: "$299.00",
                    description: "Enterprise Plan - Yearly",
                    date: "Tomorrow",
                  },
                  {
                    amount: "$49.99",
                    description: "Team Plan - Monthly",
                    date: "Jan 27",
                  },
                  {
                    amount: "$149.00",
                    description: "Business Plan - Quarterly",
                    date: "Jan 29",
                  },
                ].map((payment, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-sm font-medium">{payment.amount}</p>
                      <p className="text-xs text-muted-foreground">
                        {payment.description}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-xs">{payment.date}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full">
                View All Payments
              </Button>
            </CardFooter>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
