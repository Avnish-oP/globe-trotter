'use client';

import React, { useState } from 'react';
import { Plus, Plane } from 'lucide-react';

interface FloatingActionButtonProps {
  onClick?: () => void;
  className?: string;
}

const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({ 
  onClick,
  className = ''
}) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div className={`fixed bottom-6 right-6 z-50 ${className}`}>
      <button
        onClick={onClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="group relative bg-gradient-to-r from-purple-500 to-violet-600 hover:from-purple-600 hover:to-violet-700 text-white rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 active:scale-95"
      >
        {/* Main Button */}
        <div className="flex items-center space-x-3 px-6 py-4">
          <div className="relative">
            <Plus 
              className={`h-6 w-6 transition-all duration-300 ${
                isHovered ? 'rotate-90 opacity-0' : 'rotate-0 opacity-100'
              }`}
            />
            <Plane 
              className={`h-6 w-6 absolute inset-0 transition-all duration-300 ${
                isHovered ? 'rotate-0 opacity-100' : '-rotate-90 opacity-0'
              }`}
            />
          </div>
          <span className="font-semibold text-lg whitespace-nowrap">Plan a Trip</span>
        </div>

        {/* Glow Effect */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-400 to-violet-500 opacity-0 group-hover:opacity-20 transition-opacity duration-300 blur-xl"></div>
        
        {/* Ripple Effect */}
        <div className="absolute inset-0 rounded-full bg-white opacity-0 group-active:opacity-20 transition-opacity duration-150"></div>
      </button>

      {/* Pulse Animation */}
      <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-500 to-violet-600 opacity-20 animate-ping"></div>
    </div>
  );
};

export default FloatingActionButton;
