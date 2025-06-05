
import { Card, CardContent } from "@/components/ui/card";
import { Settings, Image, Calendar } from "lucide-react";

const ProcessSteps = () => {
  const steps = [
    {
      icon: Settings,
      title: "Set Up Your Brand",
      description: "Upload your logo, define your brand voice, and select your target platforms. Our AI learns your unique style.",
      color: "from-primary to-primary/70"
    },
    {
      icon: Image,
      title: "Generate Content",
      description: "Enter a topic and watch our AI create platform-specific content with captions, visuals, and hashtags.",
      color: "from-accent to-accent/70"
    },
    {
      icon: Calendar,
      title: "Schedule & Publish",
      description: "Review your content calendar, make edits, and schedule posts across all your connected platforms.",
      color: "from-primary to-accent"
    }
  ];

  return (
    <section className="py-24 relative">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            How It <span className="text-cosmic font-serif">Works</span>
          </h2>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Three simple steps to transform your content creation workflow
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {steps.map((step, index) => (
            <Card key={index} className="cosmic-card group hover:scale-105 transition-all duration-300">
              <CardContent className="p-8 text-center">
                <div className={`w-16 h-16 rounded-full bg-gradient-to-r ${step.color} flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300`}>
                  <step.icon className="w-8 h-8 text-white" />
                </div>
                
                <div className="text-2xl font-bold text-white mb-2">
                  {String(index + 1).padStart(2, '0')}
                </div>
                
                <h3 className="text-xl font-semibold text-white mb-4">
                  {step.title}
                </h3>
                
                <p className="text-gray-300 leading-relaxed">
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
