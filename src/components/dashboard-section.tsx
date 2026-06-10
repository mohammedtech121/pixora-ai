'use client';

import { motion } from 'framer-motion';
import { ImageIcon, Zap, FolderOpen, TrendingUp, Clock, Wand2, BarChart3 } from 'lucide-react';
import { useAppStore } from '@/store/use-app-store';

export function DashboardSection() {
  const credits = useAppStore((s) => s.credits);
  const generatedImages = useAppStore((s) => s.generatedImages);
  const promptHistory = useAppStore((s) => s.promptHistory);

  const stats = [
    {
      label: 'Images Generated',
      value: generatedImages.length,
      icon: <ImageIcon className="w-5 h-5" />,
      gradient: 'from-violet-500 to-purple-600',
      change: '+12%',
    },
    {
      label: 'Credits Remaining',
      value: credits,
      icon: <Zap className="w-5 h-5" />,
      gradient: 'from-amber-400 to-orange-500',
      change: '50 total',
    },
    {
      label: 'Collections',
      value: 3,
      icon: <FolderOpen className="w-5 h-5" />,
      gradient: 'from-emerald-400 to-teal-500',
      change: '2 shared',
    },
    {
      label: 'Total Prompts',
      value: promptHistory.length,
      icon: <BarChart3 className="w-5 h-5" />,
      gradient: 'from-cyan-500 to-blue-500',
      change: 'This week',
    },
  ];

  const quickActions = [
    { label: 'Generate Image', icon: <Wand2 className="w-4 h-4" />, href: '#generate' },
    { label: 'View Gallery', icon: <ImageIcon className="w-4 h-4" />, href: '#gallery' },
    { label: 'Prompt History', icon: <Clock className="w-4 h-4" />, href: '#history' },
    { label: 'Analytics', icon: <TrendingUp className="w-4 h-4" />, href: '#' },
  ];

  // Simple usage chart data
  const chartBars = [
    { day: 'Mon', height: 30 },
    { day: 'Tue', height: 55 },
    { day: 'Wed', height: 40 },
    { day: 'Thu', height: 70 },
    { day: 'Fri', height: 85 },
    { day: 'Sat', height: 45 },
    { day: 'Sun', height: 60 },
  ];

  return (
    <section id="dashboard" className="relative py-20 z-10">
      <div className="container mx-auto px-4 md:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-5xl font-bold mb-4">
            <span className="bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent">
              Dashboard
            </span>
          </h2>
          <p className="text-gray-400 max-w-xl mx-auto">
            Track your creative progress and manage your account
          </p>
        </motion.div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              className="glass-card p-5"
            >
              <div className="flex items-start justify-between mb-3">
                <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${stat.gradient} flex items-center justify-center text-white opacity-80`}>
                  {stat.icon}
                </div>
                <span className="text-xs text-emerald-400 font-medium">{stat.change}</span>
              </div>
              <div className="text-2xl font-bold text-white">{stat.value}</div>
              <div className="text-xs text-gray-500 mt-0.5">{stat.label}</div>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Usage chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="glass-card p-6 md:col-span-2"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-sm font-medium text-gray-300">Weekly Usage</h3>
              <span className="text-xs text-gray-500">Last 7 days</span>
            </div>
            <div className="flex items-end justify-between gap-2 h-40">
              {chartBars.map((bar) => (
                <div key={bar.day} className="flex-1 flex flex-col items-center gap-2">
                  <div className="w-full rounded-t-lg bg-gradient-to-t from-violet-500/40 to-violet-500/10 relative overflow-hidden"
                    style={{ height: `${bar.height}%` }}
                  >
                    <div className="absolute inset-0 animate-shimmer" />
                  </div>
                  <span className="text-[10px] text-gray-500">{bar.day}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Quick actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="glass-card p-6"
          >
            <h3 className="text-sm font-medium text-gray-300 mb-4">Quick Actions</h3>
            <div className="space-y-2">
              {quickActions.map((action) => (
                <a
                  key={action.label}
                  href={action.href}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.06] hover:border-white/[0.1] transition-all group"
                >
                  <span className="text-violet-400 group-hover:text-violet-300 transition-colors">{action.icon}</span>
                  <span className="text-sm text-gray-400 group-hover:text-gray-300 transition-colors">{action.label}</span>
                </a>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
