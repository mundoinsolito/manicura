import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';

interface Props {
  children: React.ReactNode;
  requiredRole?: 'admin' | 'super_admin';
}

export function ProtectedRoute({ children, requiredRole = 'admin' }: Props) {
  const { isAdmin, isSuperAdmin, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (requiredRole === 'super_admin' && !isSuperAdmin) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole === 'admin' && !isAdmin && !isSuperAdmin) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
