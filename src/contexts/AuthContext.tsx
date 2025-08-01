
import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, fullName: string, referralCode?: string) => Promise<{ error: any }>;
  signUpInfluencer: (email: string, password: string, fullName: string, secretCode: string, profileData?: any) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('Setting up auth state listener...');
    
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.id);
        setUser(session?.user ?? null);
        setLoading(false);
        
        // Create user profile if it doesn't exist
        if (event === 'SIGNED_IN' && session?.user) {
          setTimeout(async () => {
            try {
              const { data: existingUser } = await supabase
                .from('users')
                .select('id')
                .eq('id', session.user.id)
                .single();

              if (!existingUser) {
                console.log('Creating user profile...');
                const { error } = await supabase
                  .from('users')
                  .insert({
                    id: session.user.id,
                    email: session.user.email || '',
                    full_name: session.user.user_metadata?.full_name || session.user.email || ''
                  });
                
                if (error) {
                  console.error('Error creating user profile:', error);
                } else {
                  console.log('User profile created successfully');
                }
              }
            } catch (error) {
              console.error('Error checking/creating user:', error);
            }
          }, 0);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('Initial session check:', session?.user?.id);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    console.log('SignIn called with email:', email);
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ 
        email, 
        password 
      });
      
      console.log('SignIn response:', { data, error });
      
      if (error) {
        console.error('SignIn error:', error);
      } else {
        console.log('SignIn successful:', data.user?.id);
      }
      
      return { error };
    } catch (err) {
      console.error('SignIn exception:', err);
      return { error: err };
    }
  };

  const signUpInfluencer = async (email: string, password: string, fullName: string, secretCode: string, profileData?: any) => {
    try {
      // For now, just do regular signup - secret code validation will be handled by edge function
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            full_name: fullName,
            user_type: 'influencer',
            secret_code: secretCode,
            profile_data: profileData
          }
        }
      });

      return { error };
    } catch (err) {
      console.error('SignUpInfluencer exception:', err);
      return { error: err };
    }
  };

  const signUp = async (email: string, password: string, fullName: string, referralCode?: string) => {
    console.log('SignUp called with email:', email, 'fullName:', fullName);
    
    try {
      const redirectUrl = `${window.location.origin}/`;
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            full_name: fullName,
            referred_by: referralCode || null
          }
        }
      });
      
      console.log('SignUp response:', { data, error });
      
      if (error) {
        console.error('SignUp error:', error);
      } else {
        console.log('SignUp successful:', data.user?.id);
      }
      
      return { error };
    } catch (err) {
      console.error('SignUp exception:', err);
      return { error: err };
    }
  };

  const signOut = async () => {
    console.log('SignOut called');
    try {
      await supabase.auth.signOut();
      console.log('SignOut successful');
    } catch (err) {
      console.error('SignOut error:', err);
    }
  };

  const value = {
    user,
    loading,
    signIn,
    signUp,
    signUpInfluencer,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
