'use client';

import { motion } from 'framer-motion';
import { Sparkles, Github, Twitter, Linkedin, Mail, ArrowRight } from 'lucide-react';
import { useState } from 'react';
import { toast } from '@/hooks/use-toast';

const footerLinks = {
  Product: ['Features', 'Pricing', 'Integrations', 'Changelog'],
  Resources: ['Documentation', 'Tutorials', 'Blog', 'Community', 'Templates'],
  Company: ['About', 'Careers', 'Press', 'Contact', 'Partners'],
  Legal: ['Privacy', 'Terms', 'Security', 'Cookies'],
};

const socialLinks = [
  { icon: <Twitter className="w-4 h-4" />, href: '#', label: 'Twitter' },
  { icon: <Github className="w-4 h-4" />, href: '#', label: 'GitHub' },
  { icon: <Linkedin className="w-4 h-4" />, href: '#', label: 'LinkedIn' },
];

export function Footer() {
  const [email, setEmail] = useState('');

  const handleNewsletter = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    toast({ title: 'Subscribed!', description: 'You\'ve been added to our newsletter.' });
    setEmail('');
  };

  return (
    <footer className="relative z-10 mt-auto">
      {/* Gradient border top */}
      <div className="h-[1px] bg-gradient-to-r from-transparent via-violet-500/30 to-transparent" />

      <div className="container mx-auto px-4 md:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12">
          {/* Logo & description */}
          <div className="md:col-span-4">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-violet-400" />
              <span className="text-lg font-bold bg-gradient-to-r from-violet-400 via-purple-400 to-fuchsia-400 bg-clip-text text-transparent">
                Pixora.ai
              </span>
            </div>
            <p className="text-sm text-gray-500 mb-6 max-w-xs">
              Transform your ideas into stunning visuals with state-of-the-art AI. Create, explore, and inspire.
            </p>

            {/* Newsletter */}
            <form onSubmit={handleNewsletter} className="flex gap-2">
              <div className="relative flex-1">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="w-full bg-white/[0.03] border border-white/[0.06] rounded-lg pl-10 pr-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-violet-500/50 transition-all"
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2.5 rounded-lg bg-violet-500/20 border border-violet-500/30 text-violet-300 hover:bg-violet-500/30 transition-all text-sm font-medium"
              >
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>

          {/* Links */}
          <div className="md:col-span-6 grid grid-cols-2 sm:grid-cols-4 gap-8">
            {Object.entries(footerLinks).map(([category, links]) => (
              <div key={category}>
                <h4 className="text-sm font-semibold text-gray-300 mb-3">{category}</h4>
                <ul className="space-y-2">
                  {links.map((link) => (
                    <li key={link}>
                      <a href="#" className="text-sm text-gray-500 hover:text-gray-300 transition-colors">
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Social */}
          <div className="md:col-span-2">
            <h4 className="text-sm font-semibold text-gray-300 mb-3">Follow Us</h4>
            <div className="flex items-center gap-2">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  className="p-2.5 rounded-lg bg-white/[0.03] border border-white/[0.06] text-gray-500 hover:text-white hover:bg-white/[0.06] hover:border-white/[0.12] transition-all"
                  aria-label={social.label}
                >
                  {social.icon}
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-6 border-t border-white/[0.04] flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-gray-600">
            © {new Date().getFullYear()} Pixora.ai. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <span className="text-xs text-gray-600">Built with</span>
            <span className="text-xs text-violet-400">♥</span>
            <span className="text-xs text-gray-600">and AI</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
