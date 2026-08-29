import React, { useState } from 'react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export default function SimulateTxnModal({ isOpen, onClose, onScored }) {
  const [formData, setFormData] = useState({
    transaction_id: `SIM-${Math.floor(100000 + Math.random() * 900000)}`,
    amount: 250.0,
    hour: 14,
    merchant_risk_score: 0.45,
    distance_from_home_km: 12.5,
    txns_last_24h: 3,
    is_foreign: 0,
    account_age_days: 365,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const data = await res.json();
      onScored(data);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to submit transaction');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">SIMULATE MANUAL TRANSACTION</span>
          <button className="modal-close-btn" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          {error && <div className="modal-error">{error}</div>}

          <div className="form-grid">
            <div className="form-group">
              <label>Transaction ID</label>
              <input
                type="text"
                name="transaction_id"
                value={formData.transaction_id}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Amount ($)</label>
              <input
                type="number"
                step="0.01"
                name="amount"
                value={formData.amount}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Hour of Day (0-23)</label>
              <input
                type="number"
                min="0"
                max="23"
                name="hour"
                value={formData.hour}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Merchant Risk (0.0 - 1.0)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="1"
                name="merchant_risk_score"
                value={formData.merchant_risk_score}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Distance from Home (km)</label>
              <input
                type="number"
                step="0.1"
                name="distance_from_home_km"
                value={formData.distance_from_home_km}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Txns in last 24h</label>
              <input
                type="number"
                name="txns_last_24h"
                value={formData.txns_last_24h}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Is Foreign Transaction?</label>
              <select
                name="is_foreign"
                value={formData.is_foreign}
                onChange={(e) => setFormData((prev) => ({ ...prev, is_foreign: parseInt(e.target.value) }))}
              >
                <option value={0}>No (Local)</option>
                <option value={1}>Yes (Foreign)</option>
              </select>
            </div>

            <div className="form-group">
              <label>Account Age (days)</label>
              <input
                type="number"
                name="account_age_days"
                value={formData.account_age_days}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" className="action-btn" onClick={onClose}>
              CANCEL
            </button>
            <button type="submit" className="action-btn action-btn--primary" disabled={loading}>
              {loading ? 'SCORING...' : 'RUN SCORE & PREDICT'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
