'use client';

import { motion } from 'framer-motion';
import { Check, Zap, Crown, Building2, ArrowRight } from 'lucide-react';

const plans = [
  {
    name: 'Free',
    icon: <Zap className="w-5 h-5" />,
    price: '$0',
    period: 'forever',
    credits: '10 credits/month',
    description: 'Perfect for trying out AI image generation',
    features: [
      '10 image generations/month',
      'Standard quality',
      '4 styles available',
      '1024×1024 max resolution',
      'Community gallery access',
    ],
    cta: 'Get Started',
    popular: false,
    gradient: 'from-gray-400 to-gray-500',
    borderColor: 'border-white/[0.06]',
  },
  {
    name: 'Pro',
    icon: <Crown className="w-5 h-5" />,
    price: '$19',
    period: '/month',
    credits: '200 credits/month',
    description: 'For creators who need more power',
    features: [
      '200 image generations/month',
      'High quality output',
      'All 8 styles available',
      'All resolutions available',
      'Priority generation queue',
      'Negative prompts',
      'Prompt enhancement AI',
      'Private gallery',
    ],
    cta: 'Start Pro Trial',
    popular: true,
    gradient: 'from-violet-500 via-purple-500 to-fuchsia-500',
    borderColor: 'border-violet-500/40',
  },
  {
    name: 'Enterprise',
    icon: <Building2 className="w-5 h-5" />,
    price: '$99',
    period: '/month',
    credits: 'Unlimited credits',
    description: 'For teams and businesses at scale',
    features: [
      'Unlimited generations',
      'Maximum quality output',
      'All styles + custom styles',
      'All resolutions + custom',
      'API access',
      'Team collaboration',
      'Priority support',
      'Custom model fine-tuning',
      'White-label options',
    ],
    cta: 'Contact Sales',
    popular: false,
    gradient: 'from-cyan-500 via-blue-500 to-purple-600',
    borderColor: 'border-white/[0.06]',
  },
];

export function PricingSection() {
  return (
    <section id="pricing" className="relative py-20 z-10">
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
              Simple Pricing
            </span>
          </h2>
          <p className="text-gray-400 max-w-xl mx-auto">
            Start for free and scale as you grow. No hidden fees.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              whileHover={{ y: -5 }}
              className={`relative glass-card p-6 flex flex-col ${plan.popular ? 'border-violet-500/40 shadow-[0_0_30px_rgba(139,92,246,0.15)]' : ''}`}
            >
              {/* Popular badge */}
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white text-xs font-bold">
                  MOST POPULAR
                </div>
              )}

              {/* Plan header */}
              <div className="mb-6">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${plan.gradient} flex items-center justify-center text-white mb-3 opacity-70`}>
                  {plan.icon}
                </div>
                <h3 className="text-xl font-bold text-white mb-1">{plan.name}</h3>
                <p className="text-xs text-gray-500">{plan.description}</p>
              </div>

              {/* Price */}
              <div className="mb-6">
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-white">{plan.price}</span>
                  <span className="text-sm text-gray-500">{plan.period}</span>
                </div>
                <div className="flex items-center gap-1.5 mt-1">
                  <Zap className="w-3 h-3 text-amber-400" />
                  <span className="text-xs text-gray-400">{plan.credits}</span>
                </div>
              </div>

              {/* Features */}
              <ul className="space-y-2.5 mb-8 flex-1">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-400">{feature}</span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <button
                className={`w-full py-3 rounded-xl font-medium text-sm flex items-center justify-center gap-2 transition-all duration-300 ${
                  plan.popular
                    ? 'btn-generate text-white hover:scale-[1.02]'
                    : 'bg-white/[0.04] border border-white/[0.08] text-gray-300 hover:bg-white/[0.08] hover:border-white/[0.15]'
                }`}
              >
                {plan.cta}
                <ArrowRight className="w-4 h-4" />
              </button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
