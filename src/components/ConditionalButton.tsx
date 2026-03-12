import React from 'react';
import { usePermissions } from '../hooks/usePermissions';
import { Button } from '@/components/ui/button';

interface ConditionalButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  screenCode: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  loading?: boolean;
  onAccessDenied?: () => void;
}

const ConditionalButton: React.FC<ConditionalButtonProps> = ({ 
  screenCode, 
  children, 
  fallback = null,
  variant = 'default',
  size = 'default',
  loading = false,
  onAccessDenied,
  disabled,
  className,
  ...props 
}) => {
  const { hasAccess, loading: permissionsLoading } = usePermissions();

  // Mostrar loading mientras se cargan los permisos
  if (permissionsLoading) {
    return (
      <Button
        variant={variant}
        size={size}
        disabled
        className={className}
      >
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
        {children}
      </Button>
    );
  }

  // Verificar acceso
  const hasPermission = hasAccess(screenCode);
  
  if (!hasPermission) {
    // Ejecutar callback de acceso denegado si existe
    if (onAccessDenied) {
      onAccessDenied();
    }
    
    // Mostrar fallback o null
    return fallback as React.ReactElement;
  }

  return (
    <Button
      variant={variant}
      size={size}
      disabled={disabled || loading}
      className={className}
      {...props}
    >
      {loading && (
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
      )}
      {children}
    </Button>
  );
};

export default ConditionalButton;
