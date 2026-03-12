import React from 'react';
import { usePermissions } from '../hooks/usePermissions';
 
const ConditionalButton = ({ 
  screenCode, 
  children, 
  fallback = null, 
  ...props 
}) => {
  const { hasAccess } = usePermissions();
 
  if (!hasAccess(screenCode)) {
    return fallback;
  }
 
  return <button {...props}>{children}</button>;
};
 
// Uso ejemplo:
// <ConditionalButton 
//   screenCode="clientes_create"
//   onClick={handleCreate}
//   className="btn btn-primary"
// >
//   Nuevo Cliente
// </ConditionalButton>

export default ConditionalButton;
