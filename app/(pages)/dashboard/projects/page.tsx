"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  CalendarDays,
  Clock,
  GitPullRequest,
  MessageSquare,
  Star,
  Users,
} from "lucide-react";
import { motion } from "framer-motion";

export default function ProjectsPage() {
  // Helper function for consistent date formatting
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB"); // This will consistently use DD/MM/YYYY format
  };

  const projects = [
    {
      name: "E-Commerce Platform",
      description:
        "Building a modern e-commerce platform with Next.js and Stripe integration",
      progress: 75,
      status: "In Progress",
      priority: "High",
      team: [
        { name: "Sarah Chen", image: "/avatars/sarah.jpg", initials: "SC" },
        { name: "Mike Ross", image: "/avatars/mike.jpg", initials: "MR" },
        { name: "Alex Kim", image: "/avatars/alex.jpg", initials: "AK" },
      ],
      metrics: {
        commits: 156,
        pullRequests: 24,
        comments: 89,
      },
      dueDate: "2025-02-15",
    },
    {
      name: "Mobile App Redesign",
      description:
        "Redesigning the mobile app UI/UX for better user engagement",
      progress: 40,
      status: "In Progress",
      priority: "Medium",
      team: [
        { name: "John Doe", image: "/avatars/john.jpg", initials: "JD" },
        { name: "Emma Wilson", image: "/avatars/emma.jpg", initials: "EW" },
      ],
      metrics: {
        commits: 83,
        pullRequests: 12,
        comments: 45,
      },
      dueDate: "2025-03-01",
    },
    {
      name: "Analytics Dashboard",
      description:
        "Creating a real-time analytics dashboard with data visualization",
      progress: 90,
      status: "Review",
      priority: "High",
      team: [
        { name: "Lisa Park", image: "/avatars/lisa.jpg", initials: "LP" },
        { name: "Tom Brown", image: "/avatars/tom.jpg", initials: "TB" },
      ],
      metrics: {
        commits: 214,
        pullRequests: 18,
        comments: 67,
      },
      dueDate: "2025-02-01",
    },
  ];

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
            Projects
          </h1>
          <p className="text-muted-foreground">
            Manage and track your team projects
          </p>
        </motion.div>

        {/* Project Metrics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="grid gap-4 md:grid-cols-2 lg:grid-cols-4"
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Projects
              </CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">12</div>
              <p className="text-xs text-muted-foreground">4 active projects</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Team Members
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">28</div>
              <p className="text-xs text-muted-foreground">+4 this month</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Hours</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">1,248</div>
              <p className="text-xs text-muted-foreground">
                +180 from last month
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Completion Rate
              </CardTitle>
              <GitPullRequest className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">89%</div>
              <p className="text-xs text-muted-foreground">
                +2% from last month
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Project List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card className="bg-background/50 backdrop-blur-xl">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Active Projects</CardTitle>
                  <CardDescription>
                    Recent projects your team is working on
                  </CardDescription>
                </div>
                <Button>New Project</Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {projects.map((project, i) => (
                  <div key={i} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="font-semibold">{project.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {project.description}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Badge
                          variant={
                            project.priority === "High"
                              ? "destructive"
                              : "secondary"
                          }
                        >
                          {project.priority}
                        </Badge>
                        <Badge variant="outline">{project.status}</Badge>
                      </div>
                    </div>

                    <div className="space-y-4">
                      {/* Progress */}
                      <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span>Progress</span>
                          <span>{project.progress}%</span>
                        </div>
                        <Progress value={project.progress} className="h-2" />
                      </div>

                      {/* Team & Metrics */}
                      <div className="flex items-center justify-between">
                        <div className="flex -space-x-2">
                          {project.team.map((member, j) => (
                            <Avatar
                              key={j}
                              className="border-2 border-background"
                            >
                              <AvatarImage
                                src={member.image}
                                alt={member.name}
                              />
                              <AvatarFallback>{member.initials}</AvatarFallback>
                            </Avatar>
                          ))}
                        </div>
                        <div className="flex gap-4 text-muted-foreground text-sm">
                          <div className="flex items-center gap-1">
                            <GitPullRequest className="h-4 w-4" />
                            <span>{project.metrics.pullRequests}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <MessageSquare className="h-4 w-4" />
                            <span>{project.metrics.comments}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <CalendarDays className="h-4 w-4" />
                            <span>{formatDate(project.dueDate)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
