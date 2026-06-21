import React from 'react';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'rect' | 'circle';
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  variant = 'rect'
}) => {
  const baseStyles = 'bg-[#1e1e1e] animate-pulse';
  
  const variants = {
    text: 'h-4 w-full rounded',
    rect: 'h-48 w-full rounded',
    circle: 'h-12 w-12 rounded-full'
  };

  return <div className={`${baseStyles} ${variants[variant]} ${className}`} />;
};

export default Skeleton;
