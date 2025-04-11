import React from 'react';

const PerformanceMetrics = ({ performanceData, insights, onMarkInsightAsRead }) => {
  const { callMetrics, userMetrics, teamAverages, topPerformerMetrics } = performanceData;
  
  // Calculate pickup rate
  const pickupRate = callMetrics?.totalCalls > 0 
    ? ((callMetrics.answeredCalls / callMetrics.totalCalls) * 100).toFixed(1) 
    : 0;
  
  // Format average call duration
  const formatDuration = (seconds) => {
    if (!seconds) return '0m 0s';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}m ${remainingSeconds}s`;
  };
  
  // Find team average pickup rate
  const teamAvgPickupRate = teamAverages?.find(m => m.metric_type === 'pickup_rate')?.avgValue || 0;
  
  // Find top performer pickup rate
  const topPerformerPickupRate = topPerformerMetrics?.find(m => m.metric_type === 'pickup_rate')?.maxValue || 0;
  
  return (
    <div className="performance-tab">
      <div className="dashboard-grid">
        <div className="card stats-card">
          <div className="stats-label">Total Calls</div>
          <div className="stats-value">{callMetrics?.totalCalls || 0}</div>
        </div>
        <div className="card stats-card">
          <div className="stats-label">Answered Calls</div>
          <div className="stats-value">{callMetrics?.answeredCalls || 0}</div>
        </div>
        <div className="card stats-card">
          <div className="stats-label">Pickup Rate</div>
          <div className="stats-value">{pickupRate}%</div>
        </div>
        <div className="card stats-card">
          <div className="stats-label">Avg Call Duration</div>
          <div className="stats-value">{formatDuration(callMetrics?.avgDuration)}</div>
        </div>
      </div>
      
      <div className="card">
        <div className="card-header">
          <div className="card-title">Performance Comparison</div>
        </div>
        <div className="card-body">
          <div className="comparison-chart">
            <div className="comparison-item">
              <div className="comparison-label">Your Pickup Rate</div>
              <div className="comparison-bar">
                <div className="bar-fill your-rate" style={{width: `${pickupRate}%`}}></div>
              </div>
              <div className="comparison-value">{pickupRate}%</div>
            </div>
            <div className="comparison-item">
              <div className="comparison-label">Team Average</div>
              <div className="comparison-bar">
                <div className="bar-fill team-avg" style={{width: `${teamAvgPickupRate}%`}}></div>
              </div>
              <div className="comparison-value">{teamAvgPickupRate.toFixed(1)}%</div>
            </div>
            <div className="comparison-item">
              <div className="comparison-label">Top Performer</div>
              <div className="comparison-bar">
                <div className="bar-fill top-performer" style={{width: `${topPerformerPickupRate}%`}}></div>
              </div>
              <div className="comparison-value">{topPerformerPickupRate.toFixed(1)}%</div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="card">
        <div className="card-header">
          <div className="card-title">AI Insights</div>
        </div>
        <div className="card-body">
          {insights.length > 0 ? (
            <ul className="insights-list">
              {insights.map((insight) => (
                <li key={insight.id} className={`insight-item ${insight.is_read ? 'read' : 'unread'}`}>
                  <span className="insight-icon">💡</span>
                  <span className="insight-text">{insight.insight_text}</span>
                  {!insight.is_read && (
                    <button 
                      className="btn-secondary btn-sm"
                      onClick={() => onMarkInsightAsRead(insight.id)}
                    >
                      Mark as Read
                    </button>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p>No insights available yet. Keep using the system to generate personalized insights.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default PerformanceMetrics;
