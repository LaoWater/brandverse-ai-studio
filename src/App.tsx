
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { CompanyProvider } from "@/contexts/CompanyContext";
import Footer from "@/components/Footer";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import BrandSetup from "./pages/BrandSetup";
import ContentGenerator from "./pages/ContentGenerator";
import CampaignPreview from "./pages/CampaignPreview";
import PostManager from "./pages/PostManager";
import Settings from "./pages/Settings";
import MyPlan from "./pages/MyPlan";
import Features from "./pages/Features";
import Pricing from "./pages/Pricing";
import Contact from "./pages/Contact";
import NotFound from "./pages/NotFound";
import GenerationSuccess from './pages/GenerationSuccess';
import ChatButton from "./components/ChatButton";
import PaymentSuccess from "./pages/PaymentSuccess";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <CompanyProvider>
          <BrowserRouter>
            <div className="flex flex-col min-h-screen">
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/brand-setup" element={<BrandSetup />} />
                <Route path="/content-generator" element={<ContentGenerator />} />
                <Route path="/campaign-preview" element={<CampaignPreview />} />
                <Route path="/post-manager" element={<PostManager />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/my-plan" element={<MyPlan />} />
                <Route path="/features" element={<Features />} />
                <Route path="/pricing" element={<Pricing />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/generation-success" element={<GenerationSuccess />} />
                <Route path="/payment-success" element={<PaymentSuccess />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
              <ChatButton />
              <Footer />
            </div>
          </BrowserRouter>
        </CompanyProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
