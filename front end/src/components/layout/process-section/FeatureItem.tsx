import React from 'react';

interface FeatureItemProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  alignRight?: boolean; // New prop
}

export const FeatureItem = ({ title, description, icon, alignRight = false }: FeatureItemProps) => {
  return (
    <div className={`flex flex-col mb-10 w-full 
      ${alignRight ? 'lg:items-end lg:text-right' : 'items-start text-left'} 
      items-start text-left transition-all`}
    >
      
      {/* Icon Box */}
      <div className="flex items-center justify-center w-14 h-14 rounded-xl bg-red-600/10 text-red-600 mb-4 shadow-sm border border-red-600/10">
        {icon}
      </div>

      {/* Name */}
      <h3 className="text-lg font-bold text-slate-900 uppercase tracking-tight mb-2">
        {title}
      </h3>
      
      {/* Content - Removed max-w fixed size to allow grid to handle width */}
      <p className="text-slate-500 text-sm leading-relaxed max-w-[320px]">
        {description}
      </p>
      
    </div>
  );
};