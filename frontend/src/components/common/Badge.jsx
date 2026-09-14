import React from 'react';

export default function Badge({ children, variant = 'owner' }) {
  const safeVariant = typeof variant === 'string' ? variant.toLowerCase() : 'owner';
  const variantClass = safeVariant === 'owner' ? 'badge-owner' : 'badge-member';
  return (
    <span className={`badge ${variantClass}`}>
      {children}
    </span>
  );
}
