'use client';

import { motion } from 'framer-motion';

export function AnimatedBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      {/* Floating orbs */}
      <motion.div
        animate={{
          x: [0, 100, 0],
          y: [0, -50, 0],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="absolute top-20 left-20 w-32 h-32 bg-gradient-to-br from-orange-200/30 to-orange-300/30 rounded-full blur-xl"
      />
      
      <motion.div
        animate={{
          x: [0, -80, 0],
          y: [0, 60, 0],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 5
        }}
        className="absolute top-40 right-32 w-24 h-24 bg-gradient-to-br from-rose-200/30 to-rose-300/30 rounded-full blur-xl"
      />
      
      <motion.div
        animate={{
          x: [0, 60, 0],
          y: [0, -40, 0],
        }}
        transition={{
          duration: 30,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 10
        }}
        className="absolute bottom-32 left-1/3 w-20 h-20 bg-gradient-to-br from-amber-200/30 to-amber-300/30 rounded-full blur-xl"
      />
      
      {/* Grid pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[size:50px_50px] opacity-20" />
    </div>
  );
} 