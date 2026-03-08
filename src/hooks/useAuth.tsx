import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User, Session } from '@supabase/supabase-js';

interface AuthContextType {
  isAdmin: boolean;
  isSuperAdmin: boolean;
  user: User | null;
  session: Session | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<'super_admin' | 'admin' | false>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  const checkRoles = async (userId: string) => {
    const [adminRes, superRes] = await Promise.all([
      supabase.rpc('has_role', { _user_id: userId, _role: 'admin' } as any),
      supabase.rpc('has_role', { _user_id: userId, _role: 'super_admin' } as any),
    ]);
    return {
      isAdmin: adminRes.data === true,
      isSuperAdmin: superRes.data === true,
    };
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        setTimeout(async () => {
          const roles = await checkRoles(session.user.id);
          setIsAdmin(roles.isAdmin);
          setIsSuperAdmin(roles.isSuperAdmin);
          setLoading(false);
        }, 0);
      } else {
        setIsAdmin(false);
        setIsSuperAdmin(false);
        setLoading(false);
      }
    });

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        const roles = await checkRoles(session.user.id);
        setIsAdmin(roles.isAdmin);
        setIsSuperAdmin(roles.isSuperAdmin);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string): Promise<'super_admin' | 'admin' | false> => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error || !data.user) return false;

    const roles = await checkRoles(data.user.id);
    if (roles.isSuperAdmin) return 'super_admin';
    if (roles.isAdmin) return 'admin';

    // Not admin, check if user just registered (has tenant metadata)
    const meta = data.user.user_metadata;
    if (meta?.slug && meta?.business_name) {
      try {
        await (supabase.rpc as any)('register_tenant', {
          _slug: meta.slug,
          _business_name: meta.business_name,
        });
        return 'admin';
      } catch {
        // Registration failed
      }
    }

    await supabase.auth.signOut();
    return false;
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setIsAdmin(false);
    setIsSuperAdmin(false);
    setUser(null);
    setSession(null);
  };

  return (
    <AuthContext.Provider value={{ isAdmin, isSuperAdmin, user, session, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
