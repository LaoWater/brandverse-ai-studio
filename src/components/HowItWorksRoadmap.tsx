// src/components/HowItWorksRoadmap.tsx
import { useRef } from 'react';
import { motion, useScroll, useTransform, useInView, easeOut } from 'framer-motion';
import { ArrowRight, UploadCloud, Sparkles, Brain, Bot, Users, CalendarClock, Target, Share2, TrendingUp, Zap } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const iconMap = {
  UploadCloud, Sparkles, Brain, Bot, Users, CalendarClock, Target, Share2, TrendingUp, Zap,
};
type IconName = keyof typeof iconMap;

const getIcon = (iconName: IconName) => {
  return iconMap[iconName] || Zap;
};

const steps = [ // Ensure icon names are valid IconName types
  {
    stepNumber: 1,
    icon: "UploadCloud" as IconName,
    title: "Create & Define Your Voice",
    description: "Securely link your social media accounts. Tell our AI about your brand's unique personality, mission, target audience, and style.",
    details: [
      "Integrate with platforms like X, Instagram, LinkedIn, Facebook, TikTok.",
      "Define brand tone: witty, formal, inspirational, etc.",
      "Specify content pillars and 'no-go' topics.",
    ],
    bgColor: "bg-sky-500/10",
    borderColor: "border-sky-500",
    textColor: "text-sky-300",
    iconColor: "text-sky-400",
  },
  {
    stepNumber: 2,
    icon: "Sparkles" as IconName,
    title: "AI Crafts & You Refine",
    description: "Our intelligent system analyzes your input and generates a diverse range of tailored content suggestions. From witty tweets to engaging Instagram captions and insightful LinkedIn posts, all adapted for each platform.",
    details: [
      "Content adaptation for various formats (text, image, video ideas).",
      "Review, edit, and approve AI-generated drafts with an intuitive editor.",
      "Manage, Edit, Own generated posts with full Copyrights.",
    ],
    bgColor: "bg-purple-500/10",
    borderColor: "border-purple-500",
    textColor: "text-purple-300",
    iconColor: "text-purple-400",
  },
  {
    stepNumber: 3,
    icon: "TrendingUp" as IconName,
    title: "Schedule, Amplify & Optimize",
    description: "Automate your posting schedule across all connected platforms. Our AI continuously monitors performance, providing insights to optimize your strategy and maximize engagement, reach, and impact.",
    details: [
      "Smart scheduling for peak engagement times.",
      "Cross-platform campaign coordination.",
      "Performance analytics and actionable optimization tips.",
    ],
    bgColor: "bg-emerald-500/10",
    borderColor: "border-emerald-500",
    textColor: "text-emerald-300",
    iconColor: "text-emerald-400",
  },
  {
    stepNumber: 4,
    icon: "Brain" as IconName,
    title: "Grow Together",
    description: "The more you collaborate with our AI, the more it learns. It studies post history, analyzes performance, and continually adapts to better synchronize with your company's evolving presence and audience preferences, creating a virtuous cycle of improvement.",
    details: [
      "AI dynamically refines its understanding based on your interactions and content performance.",
      "Personalized evolution: the system grows more attuned to your brand and audience over time.",
      "Receive smarter, more relevant suggestions as the AI's knowledge deepens.",
    ],
    bgColor: "bg-sky-500/10",
    borderColor: "border-sky-500",
    textColor: "text-sky-300",
    iconColor: "text-sky-400",
  },
];

interface RoadmapStepProps {
  step: typeof steps[0];
  index: number;
  totalSteps: number;
  scrollYProgress: any;
}

const RoadmapStep: React.FC<RoadmapStepProps> = ({ step, index, totalSteps, scrollYProgress }) => {
  const IconComponent = getIcon(step.icon);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: false, amount: 0.3 });

  const stepStart = index / totalSteps;
  const stepEnd = (index + 1) / totalSteps;

  const nodeScale = useTransform(
    scrollYProgress,
    [stepStart - 0.08, stepStart, stepEnd - 0.05, stepEnd + 0.03],
    [1, 1.5, 1.5, 1]
  );
  const nodeOpacity = useTransform(
    scrollYProgress,
    [stepStart - 0.04, stepStart, stepEnd - 0.025, stepEnd + 0.015],
    [0.5, 1, 1, 0.5]
  );

  const cardVariants = {
    hidden: { opacity: 0, x: index % 2 === 0 ? -100 : 100, scale: 0.95 },
    visible: {
      opacity: 1,
      x: 0,
      scale: 1,
      transition: { duration: 0.6, ease: easeOut }
    },
  };

  return (
    <div ref={ref} className="relative flex items-start my-12 md:my-16">
      <motion.div
        style={{ scale: nodeScale, opacity: nodeOpacity }}
        className={`absolute left-1/2 -translate-x-1/2 z-10 w-8 h-8 md:w-10 md:h-10 rounded-full border-2 ${step.borderColor} bg-gradient-to-br ${step.bgColor.replace('/10', '/60')} dark:${step.bgColor.replace('/10', '/50')} flex items-center justify-center shadow-md dark:shadow-lg`}
      >
        <IconComponent className={`w-4 h-4 md:w-5 md:h-5 ${step.iconColor}`} />
      </motion.div>

      <motion.div
        variants={cardVariants}
        initial="hidden"
        animate={isInView ? "visible" : "hidden"}
        // theme('spacing.24') is 6rem. This is the space each card container yields to the center.
        // This creates a 5rem visual gap between card content and the timeline dot's edge.
        // The Card component inside will occupy (TotalWidth/2 - 6rem - internal_padding).
        // This will be ~75% of the space on its side if parent is max-w-3xl.
        className={`w-full md:w-[calc(55%-theme(spacing.24))] md:px-10 ${
          index % 2 === 0 ? 'md:mr-auto' : 'md:ml-auto'
        }`}
      >
        <Card className={`overflow-hidden shadow-lg dark:shadow-2xl bg-card/60 dark:${step.bgColor} ${step.borderColor} border dark:backdrop-blur-md backdrop-blur-sm dark:bg-opacity-80`}>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-full bg-gradient-to-br ${step.bgColor.replace('/10', '/50')} dark:${step.bgColor.replace('/10', '/30')} ${step.borderColor} border-2 shadow-sm`}>
                <IconComponent className={`w-6 h-6 ${step.iconColor}`} />
              </div>
              <div>
                <CardDescription className={`${step.textColor} font-semibold`}>
                  Step {step.stepNumber}
                </CardDescription>
                <CardTitle className={`text-2xl font-bold text-foreground dark:${step.textColor.replace('-300', '-100')}`}>{step.title}</CardTitle>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-foreground/90 dark:text-gray-300 leading-relaxed font-medium">{step.description}</p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground dark:text-gray-400 text-sm">
              {step.details.map((detail, i) => (
                <li key={i}>{detail}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export function HowItWorksRoadmap() {
  const roadmapRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: roadmapRef,
    offset: ["start center", "end center"],
  });

  const lineHeight = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);
  const lineOpacity = useTransform(scrollYProgress, [0, 0.05, 0.95, 1], [0, 1, 1, 0]);

  // Background image animations
  const backgroundOpacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0.1, 0.3, 0.3, 0.1]);
  const backgroundY = useTransform(scrollYProgress, [0, 1], ["-20%", "20%"]);
  const backgroundScale = useTransform(scrollYProgress, [0, 0.5, 1], [1.1, 1, 1.1]);

  return (
    <section id="how-it-works" className="py-24 relative bg-background overflow-hidden">
      {/* Background Image with Parallax and Progressive Opacity */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          style={{
            opacity: backgroundOpacity,
            y: backgroundY,
            scale: backgroundScale,
          }}
          className="absolute inset-0 w-full h-full"
        >
          <div
            className="w-full h-full bg-contain bg-center bg-no-repeat dark:[filter:blur(0.5px)_brightness(0.4)_contrast(1.2)] [filter:blur(1px)_brightness(1.2)_contrast(0.8)_opacity(0.08)]"
            style={{
              backgroundImage: "url('/quantum_chip.png')",
            }}
          />
        </motion.div>

        {/* Gradient Mask Overlay - Theme Aware - Much Lighter in Light Mode */}
        <div className="absolute inset-0 z-10 bg-gradient-to-b from-background via-transparent to-background dark:from-black/95 dark:via-black/10 dark:to-black/95" />

        {/* Additional color overlay for theme consistency - Very Subtle in Light Mode */}
        <div
          className="absolute inset-0 z-20 opacity-10 dark:opacity-40"
          style={{
            background: `
              radial-gradient(circle at top left, rgba(14,165,233,0.1) 0%, transparent 40%),
              radial-gradient(circle at bottom right, rgba(16,185,129,0.1) 0%, transparent 40%),
              radial-gradient(circle at top right, rgba(168,85,247,0.1) 0%, transparent 40%),
              radial-gradient(circle at bottom left, rgba(14,165,233,0.1) 0%, transparent 40%)
            `,
          }}
        />
      </div>

      <div className="container mx-auto px-4 relative z-30">
        <div className="text-center mb-16 md:mb-24">
          <motion.h2
            className="text-4xl md:text-5xl font-bold text-foreground dark:text-white dark:drop-shadow-lg"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            How It Works
          </motion.h2>
          <motion.p
            className="text-xl text-foreground/80 dark:text-gray-300 mt-4 max-w-3xl mx-auto leading-relaxed dark:drop-shadow-md"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
          >
            Four simple steps to transform your content creation workflow, amplify your brand's voice, and continuously refine your strategy in a virtuous cycle of growth.
          </motion.p>
        </div>

        <div ref={roadmapRef} className="relative max-w-5xl mx-auto"> {/* Using max-w-5xl for wider layout */}
          <motion.div
            // Updated gradient to end with purple - More visible in light mode
            className="absolute top-0 left-1/2 -translate-x-1/2 w-1 bg-gradient-to-b from-sky-400/80 via-purple-400/80 to-emerald-400/80 dark:from-sky-500 dark:via-purple-500 dark:to-emerald-500 rounded-full shadow-md dark:shadow-lg"
            style={{ height: lineHeight, opacity: lineOpacity }}
            aria-hidden="true"
          />

          <div className="space-y-8 md:space-y-0">
            {steps.map((step, index) => (
              <RoadmapStep
                key={step.stepNumber}
                step={step}
                index={index}
                totalSteps={steps.length}
                scrollYProgress={scrollYProgress}
              />
            ))}
          </div>
        </div>

        <motion.div
          className="text-center mt-16 md:mt-24"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          viewport={{ once: true }}
        >
          <p className="text-xl text-foreground/80 dark:text-gray-300 mb-8 dark:drop-shadow-md">Ready to experience the Future of Content Creation?</p>
          <Button
            asChild
            size="lg"
            className="bg-accent hover:bg-accent/90 text-black px-8 py-4 text-lg font-semibold shadow-xl dark:shadow-2xl hover:shadow-accent/20 transition-all duration-300 hover:scale-105"
          >
            <a href="/brand-setup">
              Start Your Journey <ArrowRight className="ml-2 w-5 h-5" />
            </a>
          </Button>
        </motion.div>
      </div>
    </section>
  );
}