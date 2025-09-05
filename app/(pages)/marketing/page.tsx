"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { VideoPlayer } from "@/components/video-player";
import { motion } from "framer-motion";

function FeatureCard({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6 rounded-xl border border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 transition-all bg-background/50 backdrop-blur-xl"
    >
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-gray-600 dark:text-gray-400">{description}</p>
    </motion.div>
  );
}

function TestimonialCard({
  quote,
  author,
  role,
}: {
  quote: string;
  author: string;
  role: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6 rounded-xl border border-gray-200 dark:border-gray-800 bg-background/50 backdrop-blur-xl"
    >
      <p className="text-gray-600 dark:text-gray-400 italic mb-4">
        &quot;{quote}&quot;
      </p>
      <div>
        <p className="font-semibold">{author}</p>
        <p className="text-gray-500 dark:text-gray-500 text-sm">{role}</p>
      </div>
    </motion.div>
  );
}

export default function MarketingPage() {
  return (
    <div className="relative min-h-screen">
      {/* Background gradient */}
      <div className="absolute inset-0 -z-10 h-full w-full bg-white dark:bg-black bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]">
        <div className="absolute left-0 right-0 top-0 -z-10 m-auto h-[310px] w-[310px] rounded-full bg-blue-400 dark:bg-blue-500 opacity-20 blur-[100px]"></div>
      </div>

      <div className="flex flex-col min-h-screen items-center mt-[2.5rem] p-3 w-full">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <h1 className="scroll-m-20 max-w-[800px] text-5xl font-bold tracking-tight text-center bg-gradient-to-r from-gray-900 via-blue-800 to-gray-900 bg-clip-text text-transparent dark:from-gray-100 dark:to-gray-400">
            Your Main Heading Here
          </h1>
          <p className="mx-auto max-w-[600px] text-gray-500 md:text-lg text-center mt-4 dark:text-gray-400">
            Your subheading or main description goes here
          </p>
        </motion.div>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="flex gap-4 mt-8"
        >
          <Link href="/dashboard">
            <Button size="lg" className="font-semibold">
              Primary CTA
            </Button>
          </Link>
          <Link href="https://github.com" target="_blank">
            <Button size="lg" variant="outline" className="font-semibold">
              Secondary CTA
            </Button>
          </Link>
        </motion.div>

        {/* Video Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mb-3 mt-16 max-w-[900px] w-full rounded-xl overflow-hidden shadow-2xl"
        >
          <VideoPlayer videoSrc="your-video-url" />
        </motion.div>

        {/* Features Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex flex-col max-w-[900px] items-center mb-16 mt-16"
        >
          <h2 className="text-3xl font-bold mb-12 text-center">
            Features Section Title
          </h2>
          <div className="grid md:grid-cols-2 gap-8 w-full">
            <FeatureCard
              title="Feature 1"
              description="Description of feature 1"
            />
            <FeatureCard
              title="Feature 2"
              description="Description of feature 2"
            />
            <FeatureCard
              title="Feature 3"
              description="Description of feature 3"
            />
            <FeatureCard
              title="Feature 4"
              description="Description of feature 4"
            />
          </div>
        </motion.div>

        {/* Testimonials Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="w-full max-w-[900px] mb-16"
        >
          <h2 className="text-3xl font-bold mb-12 text-center">
            Testimonials Section
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            <TestimonialCard
              quote="Testimonial text here"
              author="Name"
              role="Role"
            />
            <TestimonialCard
              quote="Another testimonial text"
              author="Name"
              role="Role"
            />
          </div>
        </motion.div>

        {/* Final CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="w-full max-w-[900px] mb-16 bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-900 dark:to-gray-800 p-12 rounded-2xl text-center backdrop-blur-xl"
        >
          <h2 className="text-3xl font-bold mb-4">Final CTA Heading</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-[600px] mx-auto">
            Final call to action description
          </p>
          <Link href="/dashboard">
            <Button size="lg" className="font-semibold">
              Final CTA Button
            </Button>
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
