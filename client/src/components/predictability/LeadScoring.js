import React, { useState } from 'react';

const LeadScoring = ({ leads, onCalculateScore }) => {
  const [selectedLead, setSelectedLead] = useState(null);
  const [scoreDetails, setScoreDetails] = useState(null);
  const [isCalculating, setIsCalculating] = useState(false);

  // Group leads by score category
  const hotLeads = leads.filter(lead => lead.ai_score >= 80);
  const warmLeads = leads.filter(lead => lead.ai_score >= 50 && lead.ai_score < 80);
  const coldLeads = leads.filter(lead => lead.ai_score < 50);

  // Handle calculate score
  const handleCalculateScore = async (leadId) => {
    setIsCalculating(true);
    try {
      const result = await onCalculateScore(leadId);
      setScoreDetails(result);
      setSelectedLead(result.lead);
    } catch (err) {
      console.error('Error calculating score:', err);
    } finally {
      setIsCalculating(false);
    }
  };

  return (
    <div className="lead-scoring-tab">
      <div className="dashboard-grid">
        <div className="card stats-card">
          <div className="stats-label">Hot Leads (80-100)</div>
          <div className="stats-value" style={{ color: '#ff4d4f' }}>{hotLeads.length}</div>
          <div className="stats-label">Leads</div>
        </div>
        <div className="card stats-card">
          <div className="stats-label">Warm Leads (50-79)</div>
          <div className="stats-value" style={{ color: '#faad14' }}>{warmLeads.length}</div>
          <div className="stats-label">Leads</div>
        </div>
        <div className="card stats-card">
          <div className="stats-label">Cold Leads (0-49)</div>
          <div className="stats-value" style={{ color: '#1890ff' }}>{coldLeads.length}</div>
          <div className="stats-label">Leads</div>
        </div>
      </div>
      
      <div className="card">
        <div className="card-header">
          <div className="card-title">Leads with AI Scores</div>
        </div>
        <div className="card-body">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Company</th>
                <th>Source</th>
                <th>AI Score</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {leads.map(lead => (
                <tr key={lead.id} className={selectedLead?.id === lead.id ? 'selected' : ''}>
                  <td>{lead.first_name} {lead.last_name}</td>
                  <td>{lead.company}</td>
                  <td>{lead.source}</td>
                  <td>
                    <div className="score-pill" style={{ 
                      backgroundColor: lead.ai_score >= 80 ? '#ff4d4f' : lead.ai_score >= 50 ? '#faad14' : '#1890ff',
                      color: 'white'
                    }}>
                      {lead.ai_score || 0}
                    </div>
                  </td>
                  <td>{lead.status}</td>
                  <td>
                    <button 
                      className="btn-primary btn-sm"
                      onClick={() => handleCalculateScore(lead.id)}
                      disabled={isCalculating}
                    >
                      {isCalculating && selectedLead?.id === lead.id ? 'Calculating...' : 'Calculate Score'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      {scoreDetails && (
        <div className="card">
          <div className="card-header">
            <div className="card-title">Score Details for {selectedLead.first_name} {selectedLead.last_name}</div>
          </div>
          <div className="card-body">
            <div className="score-details">
              <div className="score-summary">
                <div className="score-circle" style={{ 
                  backgroundColor: selectedLead.ai_score >= 80 ? '#ff4d4f' : selectedLead.ai_score >= 50 ? '#faad14' : '#1890ff',
                }}>
                  <span className="score-value">{selectedLead.ai_score}</span>
                </div>
                <div className="score-category">
                  {selectedLead.ai_score >= 80 ? 'Hot Lead' : selectedLead.ai_score >= 50 ? 'Warm Lead' : 'Cold Lead'}
                </div>
              </div>
              
              <div className="score-factors">
                <h4>Score Factors</h4>
                <div className="factor-item">
                  <div className="factor-label">Source Quality</div>
                  <div className="factor-bar">
                    <div className="factor-fill" style={{ width: `${(scoreDetails.factors.source / 25) * 100}%` }}></div>
                  </div>
                  <div className="factor-value">{scoreDetails.factors.source} / 25</div>
                </div>
                <div className="factor-item">
                  <div className="factor-label">Engagement Level</div>
                  <div className="factor-bar">
                    <div className="factor-fill" style={{ width: `${(scoreDetails.factors.engagement / 25) * 100}%` }}></div>
                  </div>
                  <div className="factor-value">{scoreDetails.factors.engagement} / 25</div>
                </div>
                <div className="factor-item">
                  <div className="factor-label">Recency of Activity</div>
                  <div className="factor-bar">
                    <div className="factor-fill" style={{ width: `${(scoreDetails.factors.recency / 25) * 100}%` }}></div>
                  </div>
                  <div className="factor-value">{scoreDetails.factors.recency} / 25</div>
                </div>
                <div className="factor-item">
                  <div className="factor-label">Profile Completeness</div>
                  <div className="factor-bar">
                    <div className="factor-fill" style={{ width: `${(scoreDetails.factors.completeness / 25) * 100}%` }}></div>
                  </div>
                  <div className="factor-value">{scoreDetails.factors.completeness} / 25</div>
                </div>
              </div>
            </div>
            
            <div className="score-recommendations">
              <h4>Recommendations</h4>
              <ul className="recommendations-list">
                {scoreDetails.factors.engagement < 15 && (
                  <li>Increase engagement with this lead through more frequent touchpoints</li>
                )}
                {scoreDetails.factors.recency < 15 && (
                  <li>This lead hasn't been contacted recently. Schedule a follow-up soon.</li>
                )}
                {scoreDetails.factors.completeness < 15 && (
                  <li>Complete the lead's profile to improve scoring accuracy</li>
                )}
                {selectedLead.ai_score < 50 && (
                  <li>This lead may need nurturing before it's ready for sales engagement</li>
                )}
                {selectedLead.ai_score >= 80 && (
                  <li>This is a hot lead! Prioritize immediate follow-up.</li>
                )}
              </ul>
            </div>
          </div>
        </div>
      )}
      
      <div className="card">
        <div className="card-header">
          <div className="card-title">How AI Lead Scoring Works</div>
        </div>
        <div className="card-body">
          <p>Our AI analyzes multiple factors to score leads from 0-100:</p>
          <ul className="feature-list">
            <li><strong>Source Quality (25%):</strong> Referrals and website leads typically score higher than cold outreach</li>
            <li><strong>Engagement Level (25%):</strong> More interactions with your content and communications increase score</li>
            <li><strong>Recency of Activity (25%):</strong> Recent engagement is weighted more heavily than older activity</li>
            <li><strong>Profile Completeness (25%):</strong> More complete lead information improves score accuracy</li>
          </ul>
          <p>Leads are categorized as Hot (80-100), Warm (50-79), or Cold (0-49) to help prioritize outreach.</p>
        </div>
      </div>
    </div>
  );
};

export default LeadScoring;
