
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
    if (!user) {
      console.log('No user, clearing companies');
      setCompanies([]);
      setSelectedCompany(null);
      localStorage.removeItem('selectedCompanyId');
      return;
    }
    
    setLoading(true);
    try {
      console.log('Fetching companies for user:', user.id);
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching companies:', error);
        throw error;
      }

      console.log('Fetched companies:', data);
      setCompanies(data || []);
      
      // Try to restore previously selected company from localStorage
      const storedCompanyId = localStorage.getItem('selectedCompanyId');
      let companyToSelect = null;
      
      if (storedCompanyId && data && data.length > 0) {
        // Validate stored company still exists and belongs to user
        companyToSelect = data.find(c => c.id === storedCompanyId);
        if (companyToSelect) {
          console.log('Restored previously selected company:', companyToSelect);
        }
      }
      
      // Fallback to first company if no valid stored selection
      if (!companyToSelect && data && data.length > 0) {
        companyToSelect = data[0];
        console.log('Auto-selecting first company:', companyToSelect);
      }
      
      if (companyToSelect) {
        setSelectedCompany(companyToSelect);
        localStorage.setItem('selectedCompanyId', companyToSelect.id);
      }
    } catch (error) {
      console.error('Error fetching companies:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      console.log('User changed, fetching companies for:', user.id);
      fetchCompanies();
    } else {
      console.log('User logged out, clearing companies');
      setCompanies([]);
      setSelectedCompany(null);
    }
  }, [user]);

  const selectCompany = (company: Company) => {
    console.log('Selecting company:', company);
    setSelectedCompany(company);
    localStorage.setItem('selectedCompanyId', company.id);
  };

  const refreshCompanies = async () => {
    console.log('Refreshing companies...');
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
