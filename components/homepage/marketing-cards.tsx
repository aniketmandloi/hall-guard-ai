"use client";
import { motion } from "motion/react";
import Link from "next/link";
import {
  Activity,
  ArrowUpRight,
  CheckCircle,
  FileCheck,
  FileText,
  Shield,
  Users,
} from "lucide-react";

const FeaturesData = [
  {
    id: 1,
    name: "Document Analysis",
    description:
      "Multi-format upload and intelligent processing of PDF, Word, and text documents with smart chunking.",
    icon: FileText,
    url: "/dashboard/documents",
    color: "from-[#3B82F6] to-[#1D4ED8]",
  },
  {
    id: 2,
    name: "AI Verification",
    description:
      "Cross-validation using multiple AI models and trusted knowledge bases with confidence scoring.",
    icon: CheckCircle,
    url: "/dashboard/analysis",
    color: "from-[#10B981] to-[#059669]",
  },
  {
    id: 3,
    name: "Compliance Detection",
    description:
      "Rule-based pattern matching for SOX, GDPR, HIPAA frameworks with automated violation flagging.",
    icon: Shield,
    url: "/dashboard/compliance",
    color: "from-[#DC2626] to-[#B91C1C]",
  },
  {
    id: 4,
    name: "Real-time Progress",
    description:
      "Live analysis tracking with confidence scores and estimated completion times.",
    icon: Activity,
    url: "/dashboard/progress",
    color: "from-[#F59E0B] to-[#D97706]",
  },
  {
    id: 5,
    name: "Role-based Workflow",
    description:
      "Structured analyst → compliance → manager approval flow with automated routing and notifications.",
    icon: Users,
    url: "/dashboard/workflow",
    color: "from-[#8B5CF6] to-[#7C3AED]",
  },
  {
    id: 6,
    name: "Audit Trail",
    description:
      "Complete compliance reporting and documentation with timestamped logs for regulatory submissions.",
    icon: FileCheck,
    url: "/dashboard/audit",
    color: "from-[#6B7280] to-[#4B5563]",
  },
];

export default function HallGuardFeatures() {
  return (
    <section className="py-24 px-4">
      {/* Section Header */}
      <div className="text-center mb-16">
        <h2 className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 via-blue-800 to-gray-900 dark:from-white dark:via-blue-300 dark:to-white pb-2">
          Enterprise-Grade AI Verification Features
        </h2>
        <p className="text-gray-600 dark:text-gray-300 mt-4 max-w-2xl mx-auto">
          Comprehensive hallucination detection with role-based workflow
          management, compliance monitoring, and detailed audit trails for
          enterprise security.
        </p>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
        {FeaturesData.map((feature, index) => (
          <motion.div
            key={feature.id}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            viewport={{ once: true }}
          >
            <div className="group relative overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 h-full transition-all duration-300 hover:shadow-lg hover:scale-[1.02]">
              {/* Gradient Background */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-5 transition-opacity duration-300">
                <div
                  className={`h-full w-full bg-gradient-to-br ${feature.color}`}
                ></div>
              </div>

              <div className="relative z-10">
                {/* Icon and Link */}
                <div className="flex items-center justify-between mb-4">
                  <div className="relative w-10 h-10 flex items-center justify-center">
                    <feature.icon className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                  </div>
                  <Link
                    href={feature.url}
                    className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                  >
                    <ArrowUpRight className="h-5 w-5" />
                  </Link>
                </div>

                {/* Content */}
                <Link href={feature.url} className="block">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      {feature.name}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300 text-sm">
                      {feature.description}
                    </p>
                  </div>
                </Link>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
