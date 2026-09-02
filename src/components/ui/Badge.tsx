import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'brand' | 'success' | 'warning' | 'danger' | 'slate' | 'outline' | 'verified';
  size?: 'sm' | 'md';
  icon?: React.ReactNode;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'brand',
  size = 'md',
  icon,
  className = '',
}) => {
  const sizeStyles = {
    sm: 'text-[11px] px-2 py-0.5 gap-1 font-medium',
    md: 'text-xs px-2.5 py-1 gap-1.5 font-semibold',
  };

  const variantStyles = {
    brand: 'bg-[#176BFF]/10 text-[#176BFF] border border-[#176BFF]/20',
    verified: 'bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold',
    success: 'bg-[#B7F34A]/20 text-emerald-800 border border-[#B7F34A]/40',
    warning: 'bg-amber-50 text-amber-800 border border-amber-200',
    danger: 'bg-[#FF3D71]/10 text-[#FF3D71] border border-[#FF3D71]/20',
    slate: 'bg-slate-100 text-slate-700 border border-slate-200',
    outline: 'border border-slate-300 text-slate-600 bg-white',
  };

  return (
    <span
      className={`inline-flex items-center rounded-full whitespace-nowrap ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
    >
      {icon && <span className="flex-shrink-0">{icon}</span>}
      <span>{children}</span>
    </span>
  );
};
