
import Navigation from "@/components/Navigation";
import HeroSection from "@/components/HeroSection";
import ProcessSteps from "@/components/ProcessSteps";

const Index = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <Navigation />
      <div className="flex-grow pt-8">
        <HeroSection />
        <ProcessSteps />
      </div>
    </div>
  );
};

export default Index;
