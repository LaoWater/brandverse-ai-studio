
import { Card, CardContent } from "@/components/ui/card";
import { Settings, Image, Calendar } from "lucide-react";

const ProcessSteps = () => {
  const steps = [
    {
      icon: Settings,
      title: "Define Your Product",
      description: "Tell us about your startup, your unique value proposition, and who your ideal customers are. Our AI learns your story.",
      color: "from-primary to-primary/70"
    },
    {
      icon: Image,
      title: "Create & Optimize",
      description: "Generate platform-optimized content and get SEO insights for Google, TikTok, YouTube, Reddit, and more.",
      color: "from-accent to-accent/70"
    },
    {
      icon: Calendar,
      title: "Launch & Grow",
      description: "Distribute your message everywhere that matters. Track visibility and iterate based on real engagement data.",
      color: "from-primary to-accent"
    }
  ];

  return (
    <section className="py-8 sm:py-12 relative">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-3 gap-4 sm:gap-8 max-w-6xl mx-auto">
          {steps.map((step, index) => (
            <Card key={index} className="cosmic-card group hover:scale-105 transition-all duration-300">
              <CardContent className="p-4 sm:p-8 text-center">
                <div className={`w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gradient-to-r ${step.color} flex items-center justify-center mx-auto mb-4 sm:mb-6 group-hover:scale-110 transition-transform duration-300`}>
                  <step.icon className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                </div>

                <div className="text-xl sm:text-2xl font-bold text-white mb-2">
                  {String(index + 1).padStart(2, '0')}
                </div>

                <h3 className="text-lg sm:text-xl font-semibold text-white mb-3 sm:mb-4">
                  {step.title}
                </h3>

                <p className="text-gray-300 leading-relaxed text-sm sm:text-base">
                  {step.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ProcessSteps;
