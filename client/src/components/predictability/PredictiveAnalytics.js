import React, { useState } from 'react';

const PredictiveAnalytics = ({ revenuePredictions, engagementAnalytics, conversionAnalytics, onGeneratePrediction }) => {
  const [isGenerating, setIsGenerating] = useState(false);

  // Get the most recent prediction
  const latestPrediction = revenuePredictions.length > 0 
    ? revenuePredictions.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0]
    : null;

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
  };

  // Handle generate prediction
  const handleGeneratePrediction = async () => {
    setIsGenerating(true);
    try {
      await onGeneratePrediction();
    } catch (err) {
      console.error('Error generating prediction:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="predictive-analytics-tab">
      <div className="dashboard-grid">
        {latestPrediction ? (
          <>
            <div className="card stats-card">
              <div className="stats-label">Projected Revenue</div>
              <div className="stats-value">{formatCurrency(latestPrediction.predicted_amount)}</div>
              <div className="stats-label">
                {formatDate(latestPrediction.prediction_date)}
              </div>
            </div>
            <div className="card stats-card">
              <div className="stats-label">Confidence Interval</div>
              <div className="stats-value">
                {formatCurrency(latestPrediction.confidence_low)} - {formatCurrency(latestPrediction.confidence_high)}
              </div>
              <div className="stats-label">90% Confidence</div>
            </div>
            <div className="card stats-card">
              <div className="stats-label">Projected Deals</div>
              <div className="stats-value">{latestPrediction.factors.pipelineDeals || 0}</div>
              <div className="stats-label">In Pipeline</div>
            </div>
            <div className="card stats-card">
              <div className="stats-label">Last Updated</div>
              <div className="stats-value">
                {new Date(latestPrediction.created_at).toLocaleDateString()}
              </div>
              <div className="stats-actions">
                <button 
                  className="btn-primary btn-sm"
                  onClick={handleGeneratePrediction}
                  disabled={isGenerating}
                >
                  {isGenerating ? 'Generating...' : 'Update Prediction'}
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="card stats-card full-width">
            <div className="stats-label">No Revenue Predictions Available</div>
            <div className="stats-actions">
              <button 
                className="btn-primary"
                onClick={handleGeneratePrediction}
                disabled={isGenerating}
              >
                {isGenerating ? 'Generating...' : 'Generate First Prediction'}
              </button>
            </div>
          </div>
        )}
      </div>
      
      {latestPrediction && (
        <div className="card">
          <div className="card-header">
            <div className="card-title">Revenue Projection</div>
          </div>
          <div className="card-body">
            <div className="chart-container">
              <div className="placeholder-chart">
                <p>Chart showing historical and projected revenue would appear here</p>
                <p>Using Chart.js to visualize monthly projections</p>
              </div>
            </div>
            
            <div className="prediction-factors">
              <h4>Prediction Factors</h4>
              <div className="factors-grid">
                <div className="factor-item">
                  <div className="factor-label">Historical Average Deal</div>
                  <div className="factor-value">{formatCurrency(latestPrediction.factors.historicalAverage || 0)}</div>
                </div>
                <div className="factor-item">
                  <div className="factor-label">Pipeline Value</div>
                  <div className="factor-value">{formatCurrency(latestPrediction.factors.pipelineValue || 0)}</div>
                </div>
                <div className="factor-item">
                  <div className="factor-label">Pipeline Deals</div>
                  <div className="factor-value">{latestPrediction.factors.pipelineDeals || 0}</div>
                </div>
                <div className="factor-item">
                  <div className="factor-label">Historical Deals Analyzed</div>
                  <div className="factor-value">{latestPrediction.factors.historicalDeals || 0}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {conversionAnalytics && (
        <div className="card">
          <div className="card-header">
            <div className="card-title">Conversion Analytics by Source</div>
          </div>
          <div className="card-body">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Source</th>
                  <th>Total Leads</th>
                  <th>Won Deals</th>
                  <th>Conversion Rate</th>
                  <th>Total Revenue</th>
                </tr>
              </thead>
              <tbody>
                {conversionAnalytics.conversionRates.map((rate, index) => (
                  <tr key={index}>
                    <td>{rate.source}</td>
                    <td>{rate.total_leads}</td>
                    <td>{rate.won_deals}</td>
                    <td>{rate.conversion_rate}%</td>
                    <td>{formatCurrency(rate.total_revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      <div className="card">
        <div className="card-header">
          <div className="card-title">How Predictive Analytics Works</div>
        </div>
        <div className="card-body">
          <p>Our AI uses these key factors to generate predictions:</p>
          <ul className="feature-list">
            <li><strong>Historical Performance:</strong> Past sales data and average deal values</li>
            <li><strong>Pipeline Analysis:</strong> Current deals and their stages with probability weighting</li>
            <li><strong>Conversion Rates:</strong> Source-specific conversion patterns</li>
            <li><strong>Lead Quality:</strong> Current lead scores and volume</li>
            <li><strong>Seasonal Patterns:</strong> Year-over-year trends when sufficient data exists</li>
          </ul>
          <p>Predictions are updated on demand and include confidence intervals to account for uncertainty.</p>
        </div>
      </div>
    </div>
  );
};

export default PredictiveAnalytics;
