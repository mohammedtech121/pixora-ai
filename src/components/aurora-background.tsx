'use client';

import { motion } from 'framer-motion';

export function AuroraBackground() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {/* Aurora blobs */}
      <div className="aurora-blob-1 absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full bg-gradient-to-br from-violet-600/30 via-purple-500/20 to-fuchsia-500/30 blur-[120px]" />
      <div className="aurora-blob-2 absolute top-1/4 -right-20 w-[500px] h-[500px] rounded-full bg-gradient-to-br from-cyan-500/20 via-blue-500/20 to-purple-600/25 blur-[100px]" />
      <div className="aurora-blob-3 absolute bottom-1/4 left-1/4 w-[400px] h-[400px] rounded-full bg-gradient-to-br from-fuchsia-500/20 via-pink-500/15 to-violet-600/20 blur-[80px]" />
      <div className="aurora-blob-4 absolute -bottom-20 right-1/3 w-[550px] h-[550px] rounded-full bg-gradient-to-br from-emerald-500/10 via-cyan-500/15 to-blue-600/20 blur-[100px]" />

      {/* Mesh gradient overlay */}
      <div className="animate-mesh-gradient absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full opacity-[0.03]"
        style={{
          background: 'conic-gradient(from 0deg, #8b5cf6, #06b6d4, #d946ef, #10b981, #f59e0b, #8b5cf6)',
        }}
      />

      {/* Subtle noise texture */}
      <motion.div
        className="absolute inset-0 opacity-[0.015]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          backgroundSize: '128px 128px',
        }}
      />
    </div>
  );
}
