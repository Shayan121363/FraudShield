import React from 'react';

export default function FilterBar({ searchQuery, setSearchQuery, riskFilter, setRiskFilter }) {
  const levels = [
    { key: 'all', label: 'All' },
    { key: 'flagged', label: 'Flagged' },
    { key: 'high', label: 'High Risk' },
    { key: 'medium', label: 'Med Risk' },
    { key: 'low', label: 'Low Risk' },
  ];

  return (
    <div className="filter-bar">
      <div className="filter-search">
        <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8" />
          <path d="M21 21l-4.35-4.35" />
        </svg>
        <input
          type="text"
          className="search-input"
          placeholder="Filter ID..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        {searchQuery && (
          <button className="search-clear" onClick={() => setSearchQuery('')}>×</button>
        )}
      </div>

      <div className="filter-pills">
        {levels.map((lvl) => (
          <button
            key={lvl.key}
            className={`filter-pill ${riskFilter === lvl.key ? 'filter-pill--active' : ''}`}
            onClick={() => setRiskFilter(lvl.key)}
          >
            {lvl.label}
          </button>
        ))}
      </div>
    </div>
  );
}
