import React from 'react';

const StatCard = ({ title, value, icon: Icon, color = '#f97316', subtitle }) => {
  return (
    <div className="stat-card" style={{ '--stat-color': color }}>
      <div className="stat-info">
        <span className="stat-title">{title}</span>
        <span className="stat-value">{value ?? 0}</span>
        {subtitle && <span className="stat-subtitle">{subtitle}</span>}
      </div>
      {Icon && (
        <div className="stat-icon-wrapper" style={{ color }}>
          <Icon size={24} />
        </div>
      )}
    </div>
  );
};

export default StatCard;
