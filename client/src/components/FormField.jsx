import React from 'react';

const FormField = ({ label, error, required = false, children, className = '' }) => {
  return (
    <div className={`form-group ${className}`.trim()}>
      {label && (
        <label className="form-label">
          {label}
          {required && <span className="required">*</span>}
        </label>
      )}
      {children}
      {error && <span className="form-error">{error}</span>}
    </div>
  );
};

export default FormField;
