"use client";

import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface AuthCardProps extends React.HTMLAttributes<HTMLDivElement> {
  headerTitle: string;
  headerSubtitle: string;
  footer?: React.ReactNode;
  children: React.ReactNode;
}

export function AuthCard({
  headerTitle,
  headerSubtitle,
  footer,
  children,
  className,
  ...props
}: AuthCardProps) {
  return (
    <Card className={cn("w-[380px] shadow-lg", className)} {...props}>
      <CardHeader className="space-y-1 text-center">
        <h2 className="text-2xl font-semibold tracking-tight">{headerTitle}</h2>
        <p className="text-sm text-muted-foreground">{headerSubtitle}</p>
      </CardHeader>
      <CardContent>{children}</CardContent>
      {footer && <CardFooter>{footer}</CardFooter>}
    </Card>
  );
}
