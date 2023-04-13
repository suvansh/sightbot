import React from 'react';

interface FloatingBannerProps {
  message: string;
}

const FloatingBanner: React.FC<FloatingBannerProps> = ({ message }) => {
  return <div className="floating-banner">{message}</div>;
};

export default FloatingBanner;
