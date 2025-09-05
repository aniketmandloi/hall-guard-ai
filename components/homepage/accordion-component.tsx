"use client";
import { Shield } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { motion } from "motion/react";

const faqs = [
  {
    question: "How accurate is the hallucination detection?",
    answer:
      "Our multi-AI consensus algorithm achieves 95%+ accuracy by cross-validating content against multiple AI models and trusted knowledge sources, providing confidence scores and source citations for full transparency.",
  },
  {
    question: "Which compliance frameworks are supported?",
    answer:
      "Hall Guard AI supports SOX, GDPR, HIPAA, and other major regulatory frameworks with rule-based pattern matching, automated violation flagging, and comprehensive audit trails for regulatory submissions.",
  },
  {
    question: "Can I integrate with existing document workflows?",
    answer:
      "Yes, our API-first architecture enables seamless integration with existing systems through webhooks, REST APIs, and future integrations with Slack, Microsoft 365, and Google Workspace.",
  },
  {
    question: "What file formats are supported for analysis?",
    answer:
      "Currently we support PDF, Microsoft Word (.docx), and plain text files up to 100MB. OCR for scanned documents and additional formats are planned for future releases.",
  },
  {
    question: "How long does document analysis take?",
    answer:
      "Most documents are analyzed within 60 seconds, with larger files taking up to 2 minutes. You'll see real-time progress updates with estimated completion times throughout the process.",
  },
  {
    question: "Is my document data secure and compliant?",
    answer:
      "Absolutely. We use AES-256 encryption at rest, TLS 1.3 in transit, and configurable retention policies. Analysis results are stored by default, but document storage is optional and fully configurable.",
  },
];

export default function AccordionComponent() {
  return (
    <section className="py-24 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16">
          {/* Pill badge */}
          <div className="mx-auto w-fit rounded-full border border-blue-200 dark:border-blue-900 bg-blue-50 dark:bg-blue-900/30 px-4 py-1 mb-6">
            <div className="flex items-center gap-2 text-sm font-medium text-blue-900 dark:text-blue-200">
              <Shield className="h-4 w-4" />
              <span>FAQ</span>
            </div>
          </div>

          <h2 className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 via-blue-800 to-gray-900 dark:from-white dark:via-blue-300 dark:to-white pb-2">
            Frequently Asked Questions
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mt-4 max-w-2xl mx-auto">
            Everything you need to know about Hall Guard AI's enterprise
            hallucination detection platform. Can&apos;t find the answer
            you&apos;re looking for? Contact our sales team.
          </p>
        </div>

        {/* Accordion */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
        >
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, index) => (
              <AccordionItem
                key={index}
                value={`item-${index + 1}`}
                className="border border-gray-200 dark:border-gray-800 rounded-lg mb-4 px-2"
              >
                <AccordionTrigger className="hover:no-underline py-4 px-2">
                  <span className="font-medium text-left text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                    {faq.question}
                  </span>
                </AccordionTrigger>
                <AccordionContent className="px-2 pb-4">
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                  >
                    <p className="text-gray-600 dark:text-gray-300 px-4 pb-4">
                      {faq.answer}
                    </p>
                  </motion.div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>
      </div>
    </section>
  );
}
