
// Updated App.tsx  
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation, useNavigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { CompanyProvider } from "@/contexts/CompanyContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import Footer from "@/components/Footer";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import BrandSetup from "./pages/BrandSetup";
import ContentGenerator from "./pages/ContentGenerator";
import CampaignPreview from "./pages/CampaignPreview";
import PostManager from "./pages/PostManager";
import MediaStudio from "./pages/MediaStudio";
import Settings from "./pages/Settings";
import MyPlan from "./pages/MyPlan";
import Features from "./pages/Features";
import Pricing from "./pages/Pricing";
import Contact from "./pages/Contact";
import Partner from "./pages/Partner";
import NotFound from "./pages/NotFound";
import GenerationSuccess from './pages/GenerationSuccess';
import ChatButton from "./components/ChatButton";
import PaymentSuccess from "./pages/PaymentSuccess";
import PartnershipAgreementEditor from "./pages/PartnershipAgreementEditor";

import CookiesPage from "@/pages/termeni/Cookies";
import TermeniPage from "@/pages/termeni/Termeni";
import PoliticaPage from "@/pages/termeni/Politica";
import DataProcessingAgreementPage from "@/pages/termeni/Acord"; 
import ScrollManager from '@/components/layout/ScrollManager';

import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";


const queryClient = new QueryClient();

// Utility functions for redirect handling
const storeRedirectPath = (path: string, search?: string) => {
  const fullPath = path + (search || '');
  sessionStorage.setItem('postLoginRedirectPath', fullPath);
  console.log(`Stored redirect path: ${fullPath}`);
};

const getStoredRedirectPath = (): string | null => {
  return sessionStorage.getItem('postLoginRedirectPath');
};

const clearStoredRedirectPath = () => {
  sessionStorage.removeItem('postLoginRedirectPath');
};


// Enhanced AuthCallback component
const AuthCallback = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) {
      const redirectPath = getStoredRedirectPath();
      
      if (redirectPath) {
        clearStoredRedirectPath();
        console.log(`AuthCallback: Login successful. Redirecting to stored path: ${redirectPath}`);
        navigate(redirectPath, { replace: true });
      } else {
        console.log(`AuthCallback: Login successful. No stored path, redirecting to home.`);
        navigate('/', { replace: true });
      }
    }
  }, [user, loading, navigate]);

  return (
    <div className="flex justify-center items-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-therapy-blue mx-auto mb-4"></div>
        <p>Se finalizează autentificarea...</p>
      </div>
    </div>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <ThemeProvider>
        <AuthProvider>
          <CompanyProvider>
            <BrowserRouter>
            <ScrollManager />
            <div className="flex flex-col min-h-screen">
              <Routes>
                {/* Public routes - accessible without authentication */}
                <Route path="/" element={<Index />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/auth/callback" element={<AuthCallback />} />

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
                      <ContentGenerator />
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
                  path="/media-studio"
                  element={
                      <MediaStudio />
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
      </ThemeProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;