
import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';

interface Company {
  id: string;
  name: string;
  mission?: string;
  tone_of_voice?: string;
  primary_color_1: string;
  primary_color_2: string;
  logo_path?: string;
  other_info?: any;
}

interface CompanyContextType {
  selectedCompany: Company | null;
  companies: Company[];
  loading: boolean;
  selectCompany: (company: Company) => void;
  refreshCompanies: () => Promise<void>;
}

const CompanyContext = createContext<CompanyContextType | undefined>(undefined);

export const useCompany = () => {
  const context = useContext(CompanyContext);
  if (context === undefined) {
    throw new Error('useCompany must be used within a CompanyProvider');
  }
  return context;
};

export const CompanyProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchCompanies = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setCompanies(data || []);
      
      // Auto-select first company if none selected
      if (!selectedCompany && data && data.length > 0) {
        setSelectedCompany(data[0]);
      }
    } catch (error) {
      console.error('Error fetching companies:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchCompanies();
    } else {
      setCompanies([]);
      setSelectedCompany(null);
    }
  }, [user]);

  const selectCompany = (company: Company) => {
    setSelectedCompany(company);
  };

  const refreshCompanies = async () => {
    await fetchCompanies();
  };

  const value = {
    selectedCompany,
    companies,
    loading,
    selectCompany,
    refreshCompanies,
  };

  return <CompanyContext.Provider value={value}>{children}</CompanyContext.Provider>;
};
