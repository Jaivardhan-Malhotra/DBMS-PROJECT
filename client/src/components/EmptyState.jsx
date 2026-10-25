import React from 'react';
import { Database } from 'lucide-react';

const EmptyState = ({ message = 'No records found', icon: Icon = Database, action }) => {
  return (
    <div className="empty-state">
      <div className="empty-state-icon">
        <Icon size={32} />
      </div>
      <h3 className="empty-state-title">No Data Available</h3>
      <p className="empty-state-desc">{message}</p>
      {action && <div style={{ marginTop: '1.25rem' }}>{action}</div>}
    </div>
  );
};

export default EmptyState;
