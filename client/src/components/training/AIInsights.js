import React from 'react';

const AIInsights = ({ insights, onMarkAsRead }) => {
  // Group insights by priority
  const highPriorityInsights = insights.filter(insight => insight.priority === 'high');
  const mediumPriorityInsights = insights.filter(insight => insight.priority === 'medium');
  const lowPriorityInsights = insights.filter(insight => insight.priority === 'low');
  
  // Helper function to render insight item
  const renderInsight = (insight) => (
    <li key={insight.id} className={`insight-item ${insight.is_read ? 'read' : 'unread'}`}>
      <div className="insight-header">
        <span className={`insight-priority ${insight.priority}`}>
          {insight.priority.charAt(0).toUpperCase() + insight.priority.slice(1)}
        </span>
        <span className="insight-type">{insight.insight_type}</span>
        <span className="insight-date">
          {new Date(insight.created_at).toLocaleDateString()}
        </span>
      </div>
      <div className="insight-content">
        <span className="insight-icon">
          {insight.insight_type === 'performance' ? '📊' : 
           insight.insight_type === 'training' ? '🎓' : 
           insight.insight_type === 'activity' ? '📅' : '💡'}
        </span>
        <span className="insight-text">{insight.insight_text}</span>
      </div>
      <div className="insight-actions">
        {!insight.is_read && (
          <button 
            className="btn-secondary btn-sm"
            onClick={() => onMarkAsRead(insight.id)}
          >
            Mark as Read
          </button>
        )}
      </div>
    </li>
  );

  return (
    <div className="insights-tab">
      {insights.length === 0 ? (
        <div className="card">
          <div className="card-body">
            <p>No insights available yet. Continue using the system to generate personalized AI insights.</p>
          </div>
        </div>
      ) : (
        <>
          {highPriorityInsights.length > 0 && (
            <div className="card">
              <div className="card-header">
                <div className="card-title">High Priority Insights</div>
              </div>
              <div className="card-body">
                <ul className="insights-list">
                  {highPriorityInsights.map(renderInsight)}
                </ul>
              </div>
            </div>
          )}
          
          {mediumPriorityInsights.length > 0 && (
            <div className="card">
              <div className="card-header">
                <div className="card-title">Medium Priority Insights</div>
              </div>
              <div className="card-body">
                <ul className="insights-list">
                  {mediumPriorityInsights.map(renderInsight)}
                </ul>
              </div>
            </div>
          )}
          
          {lowPriorityInsights.length > 0 && (
            <div className="card">
              <div className="card-header">
                <div className="card-title">Low Priority Insights</div>
              </div>
              <div className="card-body">
                <ul className="insights-list">
                  {lowPriorityInsights.map(renderInsight)}
                </ul>
              </div>
            </div>
          )}
        </>
      )}
      
      <div className="card">
        <div className="card-header">
          <div className="card-title">About AI Insights</div>
        </div>
        <div className="card-body">
          <p>AI Insights analyze your performance data and activities to provide personalized recommendations and observations.</p>
          <ul className="feature-list">
            <li><strong>Performance Insights:</strong> Analysis of your sales metrics compared to team averages</li>
            <li><strong>Training Insights:</strong> Recommendations for training modules based on your performance</li>
            <li><strong>Activity Insights:</strong> Observations about your call patterns, follow-up habits, and more</li>
          </ul>
          <p>Insights are updated daily based on your latest activities and performance data.</p>
        </div>
      </div>
    </div>
  );
};

export default AIInsights;
