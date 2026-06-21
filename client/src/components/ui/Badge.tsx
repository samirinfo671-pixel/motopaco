import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'primary',
  className = ''
}) => {
  const baseStyles = 'inline-block px-2.5 py-0.5 text-[9px] font-mono font-bold tracking-widest uppercase rounded';
  
  const variants = {
    primary: 'bg-[#E63012]/10 text-[#E63012] border border-[#E63012]/20',
    secondary: 'bg-[#E5E7EB] text-[#4B5563]',
    success: 'bg-[#22C55E]/10 text-[#22C55E] border border-[#22C55E]/20',
    warning: 'bg-[#F59E0B]/10 text-[#F59E0B] border border-[#F59E0B]/20',
    danger: 'bg-red-500/10 text-red-400 border border-red-500/20'
  };

  return (
    <span className={`${baseStyles} ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
};

export default Badge;
