
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export const useAdmin = () => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminLevel, setAdminLevel] = useState(0);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user) {
        setIsAdmin(false);
        setAdminLevel(0);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('users')
        .select('admin_level')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error checking admin status:', error);
        setIsAdmin(false);
        setAdminLevel(0);
      } else {
        const level = data?.admin_level ?? 0;
        setAdminLevel(level);
        setIsAdmin(level > 0);
      }
      
      setLoading(false);
    };

    checkAdminStatus();
  }, [user]);

  return { isAdmin, adminLevel, loading };
};
