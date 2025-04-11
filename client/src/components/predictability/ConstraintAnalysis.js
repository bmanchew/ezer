import React, { useState } from 'react';

const ConstraintAnalysis = ({ constraints, onAddConstraint, onUpdateConstraint }) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    issue: '',
    impact: 'medium',
    status: 'active',
    recommendation: ''
  });
  const [selectedConstraint, setSelectedConstraint] = useState(null);
  const [resolutionData, setResolutionData] = useState({
    status: 'resolved',
    resolution: ''
  });

  // Group constraints by status
  const activeConstraints = constraints.filter(c => c.status === 'active');
  const monitoringConstraints = constraints.filter(c => c.status === 'monitoring');
  const resolvedConstraints = constraints.filter(c => c.status === 'resolved');

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  // Handle resolution input changes
  const handleResolutionChange = (e) => {
    const { name, value } = e.target;
    setResolutionData({
      ...resolutionData,
      [name]: value
    });
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    onAddConstraint(formData);
    setFormData({
      issue: '',
      impact: 'medium',
      status: 'active',
      recommendation: ''
    });
    setShowAddForm(false);
  };

  // Handle constraint resolution
  const handleResolve = (e) => {
    e.preventDefault();
    if (selectedConstraint) {
      onUpdateConstraint(selectedConstraint.id, resolutionData);
      setSelectedConstraint(null);
      setResolutionData({
        status: 'resolved',
        resolution: ''
      });
    }
  };

  // Get impact badge class
  const getImpactClass = (impact) => {
    switch (impact) {
      case 'high':
        return 'high';
      case 'medium':
        return 'medium';
      case 'low':
        return 'low';
      default:
        return '';
    }
  };

  // Get status badge class
  const getStatusClass = (status) => {
    switch (status) {
      case 'active':
        return 'active';
      case 'monitoring':
        return 'monitoring';
      case 'resolved':
        return 'resolved';
      default:
        return '';
    }
  };

  return (
    <div className="constraint-analysis-tab">
      <div className="card">
        <div className="card-header">
          <div className="card-title">Active Constraints</div>
          <button 
            className="btn-primary"
            onClick={() => setShowAddForm(true)}
          >
            Add Constraint
          </button>
        </div>
        <div className="card-body">
          {activeConstraints.length > 0 ? (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Issue</th>
                  <th>Impact</th>
                  <th>Status</th>
                  <th>Recommendation</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {activeConstraints.map(constraint => (
                  <tr key={constraint.id}>
                    <td>{constraint.issue}</td>
                    <td>
                      <span className={`impact-badge ${getImpactClass(constraint.impact)}`}>
                        {constraint.impact}
                      </span>
                    </td>
                    <td>
                      <span className={`status-badge ${getStatusClass(constraint.status)}`}>
                        {constraint.status}
                      </span>
                    </td>
                    <td>{constraint.recommendation}</td>
                    <td>
                      <button 
                        className="btn-primary btn-sm"
                        onClick={() => {
                          setSelectedConstraint(constraint);
                          setResolutionData({
                            status: 'resolved',
                            resolution: ''
                          });
                        }}
                      >
                        Resolve
                      </button>
                      <button 
                        className="btn-secondary btn-sm"
                        onClick={() => onUpdateConstraint(constraint.id, { status: 'monitoring' })}
                      >
                        Monitor
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p>No active constraints. Your sales process is running smoothly!</p>
          )}
        </div>
      </div>
      
      {showAddForm && (
        <div className="card">
          <div className="card-header">
            <div className="card-title">Add New Constraint</div>
          </div>
          <div className="card-body">
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Issue</label>
                <input
                  type="text"
                  name="issue"
                  value={formData.issue}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Impact</label>
                <select
                  name="impact"
                  value={formData.impact}
                  onChange={handleInputChange}
                  required
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
              <div className="form-group">
                <label>Status</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  required
                >
                  <option value="active">Active</option>
                  <option value="monitoring">Monitoring</option>
                </select>
              </div>
              <div className="form-group">
                <label>Recommendation</label>
                <textarea
                  name="recommendation"
                  value={formData.recommendation}
                  onChange={handleInputChange}
                  rows="3"
                />
              </div>
              <div className="form-actions">
                <button 
                  type="button" 
                  className="btn-secondary"
                  onClick={() => setShowAddForm(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">Add Constraint</button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {selectedConstraint && (
        <div className="card">
          <div className="card-header">
            <div className="card-title">Resolve Constraint: {selectedConstraint.issue}</div>
          </div>
          <div className="card-body">
            <form onSubmit={handleResolve}>
              <div className="form-group">
                <label>Resolution</label>
                <textarea
                  name="resolution"
                  value={resolutionData.resolution}
                  onChange={handleResolutionChange}
                  rows="3"
                  required
                  placeholder="Describe how this constraint was resolved..."
                />
              </div>
              <div className="form-actions">
                <button 
                  type="button" 
                  className="btn-secondary"
                  onClick={() => setSelectedConstraint(null)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">Mark as Resolved</button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {monitoringConstraints.length > 0 && (
        <div className="card">
          <div className="card-header">
            <div className="card-title">Constraints Under Monitoring</div>
          </div>
          <div className="card-body">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Issue</th>
                  <th>Impact</th>
                  <th>Status</th>
                  <th>Recommendation</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {monitoringConstraints.map(constraint => (
                  <tr key={constraint.id}>
                    <td>{constraint.issue}</td>
                    <td>
                      <span className={`impact-badge ${getImpactClass(constraint.impact)}`}>
                        {constraint.impact}
                      </span>
                    </td>
                    <td>
                      <span className={`status-badge ${getStatusClass(constraint.status)}`}>
                        {constraint.status}
                      </span>
                    </td>
                    <td>{constraint.recommendation}</td>
                    <td>
                      <button 
                        className="btn-primary btn-sm"
                        onClick={() => {
                          setSelectedConstraint(constraint);
                          setResolutionData({
                            status: 'resolved',
                            resolution: ''
                          });
                        }}
                      >
                        Resolve
                      </button>
                      <button 
                        className="btn-secondary btn-sm"
                        onClick={() => onUpdateConstraint(constraint.id, { status: 'active' })}
                      >
                        Mark Active
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      {resolvedConstraints.length > 0 && (
        <div className="card">
          <div className="card-header">
            <div className="card-title">Resolved Constraints</div>
          </div>
          <div className="card-body">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Issue</th>
                  <th>Impact</th>
                  <th>Status</th>
                  <th>Resolution</th>
                </tr>
              </thead>
              <tbody>
                {resolvedConstraints.map(constraint => (
                  <tr key={constraint.id}>
                    <td>{constraint.issue}</td>
                    <td>
                      <span className={`impact-badge ${getImpactClass(constraint.impact)}`}>
                        {constraint.impact}
                      </span>
                    </td>
                    <td>
                      <span className={`status-badge ${getStatusClass(constraint.status)}`}>
                        {constraint.status}
                      </span>
                    </td>
                    <td>{constraint.resolution}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      <div className="card">
        <div className="card-header">
          <div className="card-title">How Constraint Analysis Works</div>
        </div>
        <div className="card-body">
          <p>Our AI continuously monitors your sales process to identify bottlenecks:</p>
          <ul className="feature-list">
            <li><strong>Real-time Monitoring:</strong> Tracks metrics across your sales funnel</li>
            <li><strong>Anomaly Detection:</strong> Identifies unusual patterns or drops in performance</li>
            <li><strong>Root Cause Analysis:</strong> Determines likely causes of constraints</li>
            <li><strong>Recommendation Engine:</strong> Suggests specific actions to resolve issues</li>
          </ul>
          <p>The system learns from successful resolutions to improve future recommendations.</p>
        </div>
      </div>
    </div>
  );
};

export default ConstraintAnalysis;
