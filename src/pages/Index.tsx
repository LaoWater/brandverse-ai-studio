
import Navigation from "@/components/Navigation";
import HeroSection from "@/components/HeroSection";
import ProcessSteps from "@/components/ProcessSteps";
import AccelerationPhilosophy from "@/components/AccelerationPhilosophy";
import { HowItWorksRoadmap } from '@/components/HowItWorksRoadmap';


const Index = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <Navigation />
      <div className="flex-grow pt-8">

        <HeroSection />
        <ProcessSteps />
        <AccelerationPhilosophy />
        <HowItWorksRoadmap />

      </div>
    </div>
  );
};

export default Index;
