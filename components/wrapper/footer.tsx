"use client";

import Link from "next/link";
import {
  ArrowRight,
  Github,
  Shield,
  Twitter,
  LinkedinIcon,
  Mail,
} from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";

export default function Footer() {
  const links = {
    product: [
      { name: "Document Processing", href: "/features/document-processing" },
      { name: "Hallucination Detection", href: "/features/detection" },
      { name: "Compliance Reporting", href: "/features/compliance" },
      { name: "API Access", href: "/api-docs" },
    ],
    company: [
      { name: "Security & Compliance", href: "/security" },
      { name: "Enterprise Solutions", href: "/enterprise" },
      { name: "Professional Services", href: "/services" },
      { name: "Support Portal", href: "/support" },
    ],
    compliance: [
      { name: "SOX Compliance", href: "/compliance/sox" },
      { name: "GDPR Data Protection", href: "/compliance/gdpr" },
      { name: "HIPAA Healthcare", href: "/compliance/hipaa" },
      { name: "Security Certifications", href: "/security/certifications" },
    ],
  };

  return (
    <footer className="border-t bg-white dark:bg-black">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="xl:grid xl:grid-cols-3 xl:gap-8">
          {/* Brand */}
          <div className="space-y-8">
            <Link href="/" className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-blue-600" />
              <span className="font-semibold">Hall Guard AI</span>
            </Link>
            <p className="text-sm text-gray-600 dark:text-gray-400 max-w-sm">
              Enterprise-grade AI verification platform that detects factual
              errors, logical inconsistencies, and compliance violations in
              AI-generated content. Trusted by legal, financial, and healthcare
              organizations.
            </p>
            <div className="flex space-x-4">
              <Link
                href="https://github.com/aniketmandloi/hall-guard-ai"
                target="_blank"
              >
                <Button variant="ghost" size="icon">
                  <Github className="h-5 w-5" />
                </Button>
              </Link>
              <Link
                href="https://linkedin.com/company/hall-guard-ai"
                target="_blank"
              >
                <Button variant="ghost" size="icon">
                  <LinkedinIcon className="h-5 w-5" />
                </Button>
              </Link>
              <Link href="mailto:contact@hallguardai.com">
                <Button variant="ghost" size="icon">
                  <Mail className="h-5 w-5" />
                </Button>
              </Link>
            </div>
            <div className="space-y-2">
              <p className="text-xs text-gray-500 dark:text-gray-500 font-medium">
                Enterprise Security & Compliance
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="px-2 py-1 text-xs bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 rounded-full">
                  SOX
                </span>
                <span className="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 rounded-full">
                  GDPR
                </span>
                <span className="px-2 py-1 text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-400 rounded-full">
                  HIPAA
                </span>
                <span className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300 rounded-full">
                  SOC 2
                </span>
              </div>
            </div>
          </div>

          {/* Links */}
          <div className="mt-16 grid grid-cols-1 gap-8 xl:col-span-2 xl:mt-0 lg:grid-cols-3">
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                Platform Features
              </h3>
              <ul className="mt-4 space-y-4">
                {links.product.map((item) => (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                    >
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                Enterprise
              </h3>
              <ul className="mt-4 space-y-4">
                {links.company.map((item) => (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                    >
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                Compliance & Security
              </h3>
              <ul className="mt-4 space-y-4">
                {links.compliance.map((item) => (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                    >
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
        <div className="mt-12 border-t border-gray-200 dark:border-gray-800 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              &copy; {new Date().getFullYear()} Hall Guard AI Inc. All rights
              reserved.
            </p>
            <div className="flex space-x-6">
              <Link
                href="/privacy"
                className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                Privacy Policy
              </Link>
              <Link
                href="/terms"
                className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                Terms of Service
              </Link>
              <Link
                href="/security"
                className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                Security
              </Link>
              <Link
                href="/contact"
                className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                Contact
              </Link>
            </div>
          </div>
          <div className="mt-4 text-center">
            <p className="text-xs text-gray-500 dark:text-gray-500">
              Enterprise-grade hallucination detection • SOC 2 Type II Compliant
              • AES-256 Encryption • 99.9% Uptime SLA
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
