import OrbitingCircles from "@/components/magicui/orbiting-circles";
import { Activity, CheckCircle, FileText, Shield } from "lucide-react";

const Icons = {
  shield: ({ className, ...props }: { className?: string }) => (
    <div
      className={`p-2 rounded-full bg-blue-100 dark:bg-blue-900 ${className}`}
    >
      <Shield className="w-6 h-6 text-blue-600 dark:text-blue-400" {...props} />
    </div>
  ),
  document: ({ className, ...props }: { className?: string }) => (
    <div
      className={`p-2 rounded-full bg-green-100 dark:bg-green-900 ${className}`}
    >
      <FileText
        className="w-6 h-6 text-green-600 dark:text-green-400"
        {...props}
      />
    </div>
  ),
  check: ({ className, ...props }: { className?: string }) => (
    <div
      className={`p-2 rounded-full bg-emerald-100 dark:bg-emerald-900 ${className}`}
    >
      <CheckCircle
        className="w-6 h-6 text-emerald-600 dark:text-emerald-400"
        {...props}
      />
    </div>
  ),
  activity: ({ className, ...props }: { className?: string }) => (
    <div
      className={`p-2 rounded-full bg-orange-100 dark:bg-orange-900 ${className}`}
    >
      <Activity
        className="w-6 h-6 text-orange-600 dark:text-orange-400"
        {...props}
      />
    </div>
  ),
};

export function OrbitingCirclesComponent() {
  return (
    <div className="relative flex h-[500px] w-full max-w-[32rem] items-center justify-center overflow-hidden rounded-lg">
      <span className="pointer-events-none whitespace-pre-wrap bg-gradient-to-b from-black to-gray-500/80 bg-clip-text text-center text-6xl md:text-8xl font-semibold leading-none text-transparent dark:from-white dark:to-slate-900/10">
        Verify AI
      </span>

      {/* Inner Circles */}
      <OrbitingCircles
        className="border-none bg-transparent"
        duration={20}
        delay={20}
        radius={80}
      >
        <Icons.document />
      </OrbitingCircles>
      <OrbitingCircles
        className="border-none bg-transparent"
        duration={20}
        delay={10}
        radius={80}
      >
        <Icons.check />
      </OrbitingCircles>

      {/* Outer Circles (reverse) */}
      <OrbitingCircles
        className="border-none bg-transparent"
        reverse
        radius={190}
        duration={20}
      >
        <Icons.shield />
      </OrbitingCircles>
      <OrbitingCircles
        className="border-none bg-transparent"
        reverse
        radius={190}
        duration={20}
        delay={20}
      >
        <Icons.activity />
      </OrbitingCircles>
    </div>
  );
}
