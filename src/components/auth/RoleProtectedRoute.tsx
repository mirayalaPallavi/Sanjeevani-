import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { AppRole } from '@/types/database';
import { Loader2 } from 'lucide-react';

interface RoleProtectedRouteProps {
    children: React.ReactNode;
    allowedRoles?: AppRole[];
}

export function RoleProtectedRoute({ children, allowedRoles }: RoleProtectedRouteProps) {
    const { user, role, isLoading } = useAuth();
    const location = useLocation();

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/auth" state={{ from: location }} replace />;
    }

    // If user is logged in but has no role
    if (!role) {
        // If we are already at role selection, allow it
        if (location.pathname === '/role-selection') {
            return <>{children}</>;
        }
        // Otherwise redirect to role selection
        return <Navigate to="/role-selection" replace />;
    }

    // If user HAS a role but is trying to access role selection, send them to dashboard
    if (role && location.pathname === '/role-selection') {
        return <Navigate to="/dashboard" replace />;
    }

    // If specific roles are required and user doesn't have one
    if (allowedRoles && !allowedRoles.includes(role)) {
        // Redirect to their appropriate dashboard or home
        return <Navigate to="/dashboard" replace />;
    }

    return <>{children}</>;
}
