import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
  requireRole?: string;
  requireAnyRole?: string[];
  requirePermission?: string;
  requireAllPermissions?: string[];
  fallback?: React.ReactNode;
}

export const ProtectedRoute = ({ 
  children, 
  requireAdmin = false,
  requireRole,
  requireAnyRole,
  requirePermission,
  requireAllPermissions,
  fallback
}: ProtectedRouteProps) => {
  const { user, isAdmin, loading, hasRole, hasPermission, hasAnyRole } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (requireAdmin && !isAdmin) {
    return fallback ? <>{fallback}</> : <Navigate to="/" replace />;
  }

  if (requireRole && !hasRole(requireRole)) {
    return fallback ? <>{fallback}</> : <Navigate to="/" replace />;
  }

  if (requireAnyRole && !hasAnyRole(requireAnyRole)) {
    return fallback ? <>{fallback}</> : <Navigate to="/" replace />;
  }

  if (requirePermission && !hasPermission(requirePermission)) {
    return fallback ? <>{fallback}</> : <Navigate to="/" replace />;
  }

  if (requireAllPermissions && !requireAllPermissions.every(p => hasPermission(p))) {
    return fallback ? <>{fallback}</> : <Navigate to="/" replace />;
  }

  return <>{children}</>;
};
