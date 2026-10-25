import React from 'react';

const Badge = ({ label, variant = 'default', children, className = '' }) => {
  const content = label || children;
  const badgeClass = `badge badge-${variant} ${className}`.trim();

  return <span className={badgeClass}>{content}</span>;
};

export default Badge;
