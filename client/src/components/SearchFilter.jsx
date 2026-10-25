import React from 'react';
import { Search } from 'lucide-react';

const SearchFilter = ({
  value = '',
  onChange,
  placeholder = 'Search...',
  filters = [],
  onFilterChange,
}) => {
  return (
    <div className="search-filter-bar">
      <div className="search-box">
        <Search size={18} />
        <input
          type="text"
          className="search-input"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>

      {filters.map((filter) => (
        <select
          key={filter.key}
          className="filter-select"
          value={filter.value || ''}
          onChange={(e) => onFilterChange(filter.key, e.target.value)}
        >
          <option value="">{filter.label}</option>
          {filter.options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      ))}
    </div>
  );
};

export default SearchFilter;
