
// Updated App.tsx
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { CompanyProvider } from "@/contexts/CompanyContext";
import Footer from "@/components/Footer";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
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
import PartnershipAgreementEditor from "./pages/PartnershipAgreementEditor";

import CookiesPage from "@/pages/termeni/Cookies";
import TermeniPage from "@/pages/termeni/Termeni";
import PoliticaPage from "@/pages/termeni/Politica";
import DataProcessingAgreementPage from "@/pages/termeni/Acord"; 

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
                {/* Public routes - accessible without authentication */}
                <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/partner" element={<Partner />} />
                <Route path="/features" element={<Features />} />
                <Route path="/pricing" element={<Pricing />} />
                <Route path="/contact" element={<Contact />} />

                <Route path="/politica" element={<PoliticaPage />} />
                <Route path="/cookies" element={<CookiesPage />} />
                <Route path="/termeni" element={<TermeniPage />} />
                <Route path="/acord-prelucrare-date" element={<DataProcessingAgreementPage />} />
                
                {/* Protected routes - require authentication */}
                <Route 
                  path="/brand-setup" 
                  element={
                    <ProtectedRoute>
                      <BrandSetup />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/content-generator" 
                  element={
                    <ProtectedRoute>
                      <ContentGenerator />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/campaign-preview" 
                  element={
                    <ProtectedRoute>
                      <CampaignPreview />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/post-manager" 
                  element={
                    <ProtectedRoute>
                      <PostManager />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/settings" 
                  element={
                    <ProtectedRoute>
                      <Settings />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/my-plan" 
                  element={
                    <ProtectedRoute>
                      <MyPlan />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/generation-success" 
                  element={
                    <ProtectedRoute>
                      <GenerationSuccess />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/payment-success" 
                  element={
                    <ProtectedRoute>
                      <PaymentSuccess />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/partnership-agreement" 
                  element={
                    <ProtectedRoute>
                      <PartnershipAgreementEditor />
                    </ProtectedRoute>
                  } 
                />

                {/* 404 - accessible to all */}
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