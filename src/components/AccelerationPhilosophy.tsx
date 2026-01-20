// src/components/AccelerationPhilosophy.tsx
import { motion } from 'framer-motion';
import { Zap, Brain, Users, Sparkles, ArrowRight, Lightbulb, Wand2 } from 'lucide-react';

const AccelerationPhilosophy = () => {
  const accelerationPoints = [
    {
      icon: Zap,
      aiHandles: "Repetitive content creation",
      youControl: "Strategic direction & brand voice",
      color: "from-sky-500 to-cyan-400"
    },
    {
      icon: Brain,
      aiHandles: "Multi-platform optimization",
      youControl: "Core messaging & values",
      color: "from-purple-500 to-violet-400"
    },
    {
      icon: Lightbulb,
      aiHandles: "SEO analysis & suggestions",
      youControl: "Creative vision & authenticity",
      color: "from-emerald-500 to-teal-400"
    }
  ];

  return (
    <section className="py-16 sm:py-24 relative overflow-hidden">
      {/* Subtle background elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 right-1/4 w-64 h-64 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-1/4 w-48 h-48 bg-accent/10 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Section Header */}
        <motion.div
          className="text-center mb-12 sm:mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
            <Sparkles className="w-4 h-4 text-accent" />
            <span className="text-sm text-gray-300">Our Philosophy</span>
          </div>

          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-6">
            AI That <span className="text-cosmic font-serif">Amplifies</span>, Not Replaces
          </h2>

          <p className="text-base sm:text-lg md:text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
            The output quality of AI depends on the knowledge and skill of the one using it.
            We don't replace marketers, creators, or editors — we <span className="text-accent font-semibold">accelerate</span> their expertise.
          </p>
        </motion.div>

        {/* Main Visual: Two Columns showing AI + Human synergy */}
        <div className="max-w-5xl mx-auto">
          {/* The Synergy Cards */}
          <motion.div
            className="grid md:grid-cols-3 gap-6 mb-12"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
          >
            {accelerationPoints.map((point, index) => (
              <div
                key={index}
                className="cosmic-card group hover:scale-105 transition-all duration-300 overflow-hidden"
              >
                {/* Gradient accent top */}
                <div className={`h-1 w-full bg-gradient-to-r ${point.color}`} />

                <div className="p-6 space-y-4">
                  {/* Icon */}
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${point.color} flex items-center justify-center`}>
                    <point.icon className="w-6 h-6 text-white" />
                  </div>

                  {/* AI Handles */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs text-gray-400 uppercase tracking-wide">
                      <Wand2 className="w-3 h-3" />
                      <span>AI Accelerates</span>
                    </div>
                    <p className="text-white font-medium">{point.aiHandles}</p>
                  </div>

                  {/* Divider with arrow */}
                  <div className="flex items-center gap-2 py-1">
                    <div className="flex-1 h-px bg-gray-700" />
                    <ArrowRight className="w-4 h-4 text-accent" />
                    <div className="flex-1 h-px bg-gray-700" />
                  </div>

                  {/* You Control */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs text-accent uppercase tracking-wide">
                      <Users className="w-3 h-3" />
                      <span>You Lead</span>
                    </div>
                    <p className="text-white font-medium">{point.youControl}</p>
                  </div>
                </div>
              </div>
            ))}
          </motion.div>

          {/* The Core Message Banner */}
          <motion.div
            className="relative"
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            viewport={{ once: true }}
          >
            {/* Glow effect behind */}
            <div className="absolute -inset-1 bg-gradient-to-r from-primary/30 via-accent/30 to-primary/30 rounded-2xl blur-xl opacity-50" />

            <div className="relative cosmic-card p-8 sm:p-10 text-center">
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8">
                {/* Left side - AI */}
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center">
                    <Wand2 className="w-7 h-7 text-white" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm text-gray-400">AI handles</p>
                    <p className="text-white font-semibold">The Busywork</p>
                  </div>
                </div>

                {/* Plus sign */}
                <div className="text-3xl text-accent font-bold">+</div>

                {/* Right side - You */}
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-accent to-accent/70 flex items-center justify-center">
                    <Brain className="w-7 h-7 text-white" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm text-gray-400">You bring</p>
                    <p className="text-white font-semibold">The Expertise</p>
                  </div>
                </div>

                {/* Equals sign */}
                <div className="text-3xl text-white font-bold">=</div>

                {/* Result */}
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary via-accent to-primary flex items-center justify-center animate-pulse">
                    <Sparkles className="w-7 h-7 text-white" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm text-gray-400">Together</p>
                    <p className="text-cosmic font-serif font-bold text-lg">Unstoppable</p>
                  </div>
                </div>
              </div>

              <p className="mt-8 text-gray-300 max-w-2xl mx-auto">
                A skilled marketer with AI tools creates 10x the output. A Founder or Marketer with domain expertise
                crafts content that truly resonates. <span className="text-white font-medium">We accelerate what you already know how to do.</span>
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default AccelerationPhilosophy;
