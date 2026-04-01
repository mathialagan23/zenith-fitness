import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface GlowCardProps {
  children: React.ReactNode;
  className?: string;
  glowColor?: "purple" | "red" | "blue" | "green" | "yellow" | "cyan";
  delay?: number;
}

const glowMap = {
  purple: "glow-purple",
  red: "glow-red",
  blue: "glow-blue",
  green: "glow-green",
  yellow: "glow-yellow",
  cyan: "glow-cyan",
};

export function GlowCard({ children, className, glowColor = "purple", delay = 0 }: GlowCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className={cn("glass-card p-6 hover:border-primary/20 transition-all duration-300", glowMap[glowColor], className)}
    >
      {children}
    </motion.div>
  );
}
