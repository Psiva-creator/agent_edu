import React from 'react';
import './FallbackBanner.css';
import { AlertTriangle } from 'lucide-react';

const FallbackBanner = ({ source, message }) => {
  if (source !== 'fallback') return null;
  
  return (
    <div className="fallback-banner">
      <AlertTriangle className="fallback-icon" size={20} />
      <div className="fallback-content">
        <span className="fallback-title">AI Unavailable (Fallback Mode)</span>
      </div>
    </div>
  );
};

export default FallbackBanner;
