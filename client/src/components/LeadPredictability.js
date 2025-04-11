import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../styles/LeadPredictability.css';

// Import components
import LeadScoring from './predictability/LeadScoring';
import PredictiveAnalytics from './predictability/PredictiveAnalytics';
import ConstraintAnalysis from './predictability/ConstraintAnalysis';

const LeadPredictability = () => {
  const [activeTab, setActiveTab] = useState('lead-scoring');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // State for lead scoring
  const [leads, setLeads] = useState([]);
  
  // State for predictive analytics
  const [revenuePredictions, setRevenuePredictions] = useState([]);
  
  // State for constraint analysis
  const [constraints, setConstraints] = useState([]);
  
  // State for analytics
  const [engagementAnalytics, setEngagementAnalytics] = useState(null);
  const [conversionAnalytics, setConversionAnalytics] = useState(null);

  // Fetch lead scores
  const fetchLeadScores = async () => {
    try {
      const res = await axios.get('/api/lead-predictability/scores');
      setLeads(res.data);
    } catch (err) {
      console.error('Error fetching lead scores:', err);
      setError('Failed to load lead scores');
    }
  };

  // Fetch revenue predictions
  const fetchRevenuePredictions = async () => {
    try {
      const res = await axios.get('/api/lead-predictability/predictions/revenue');
      setRevenuePredictions(res.data);
    } catch (err) {
      console.error('Error fetching revenue predictions:', err);
      setError('Failed to load revenue predictions');
    }
  };

  // Fetch sales constraints
  const fetchSalesConstraints = async () => {
    try {
      const res = await axios.get('/api/lead-predictability/constraints');
      setConstraints(res.data);
    } catch (err) {
      console.error('Error fetching sales constraints:', err);
      setError('Failed to load sales constraints');
    }
  };

  // Fetch engagement analytics
  const fetchEngagementAnalytics = async () => {
    try {
      const res = await axios.get('/api/lead-predictability/analytics/engagement');
      setEngagementAnalytics(res.data);
    } catch (err) {
      console.error('Error fetching engagement analytics:', err);
      setError('Failed to load engagement analytics');
    }
  };

  // Fetch conversion analytics
  const fetchConversionAnalytics = async () => {
    try {
      const res = await axios.get('/api/lead-predictability/analytics/conversion');
      setConversionAnalytics(res.data);
    } catch (err) {
      console.error('Error fetching conversion analytics:', err);
      setError('Failed to load conversion analytics');
    }
  };

  // Calculate lead score
  const calculateLeadScore = async (leadId) => {
    try {
      const res = await axios.post(`/api/lead-predictability/scores/${leadId}`);
      
      // Update lead in state
      setLeads(prevLeads => 
        prevLeads.map(lead => 
          lead.id === leadId ? res.data.lead : lead
        )
      );
      
      return res.data;
    } catch (err) {
      console.error('Error calculating lead score:', err);
      setError('Failed to calculate lead score');
    }
  };

  // Generate revenue prediction
  const generateRevenuePrediction = async () => {
    try {
      const res = await axios.post('/api/lead-predictability/predictions/revenue');
      
      // Add new prediction to state
      setRevenuePredictions(prevPredictions => [...prevPredictions, res.data]);
      
      return res.data;
    } catch (err) {
      console.error('Error generating revenue prediction:', err);
      setError('Failed to generate revenue prediction');
    }
  };

  // Add sales constraint
  const addSalesConstraint = async (constraintData) => {
    try {
      const res = await axios.post('/api/lead-predictability/constraints', constraintData);
      
      // Add new constraint to state
      setConstraints(prevConstraints => [...prevConstraints, res.data]);
      
      return res.data;
    } catch (err) {
      console.error('Error adding sales constraint:', err);
      setError('Failed to add sales constraint');
    }
  };

  // Update sales constraint
  const updateSalesConstraint = async (constraintId, updateData) => {
    try {
      const res = await axios.put(`/api/lead-predictability/constraints/${constraintId}`, updateData);
      
      // Update constraint in state
      setConstraints(prevConstraints => 
        prevConstraints.map(constraint => 
          constraint.id === constraintId ? res.data : constraint
        )
      );
      
      return res.data;
    } catch (err) {
      console.error('Error updating sales constraint:', err);
      setError('Failed to update sales constraint');
    }
  };

  // Load all data on component mount
  useEffect(() => {
    const loadAllData = async () => {
      setLoading(true);
      try {
        await Promise.all([
          fetchLeadScores(),
          fetchRevenuePredictions(),
          fetchSalesConstraints(),
          fetchEngagementAnalytics(),
          fetchConversionAnalytics()
        ]);
        setLoading(false);
      } catch (err) {
        console.error('Error loading data:', err);
        setError('Failed to load data');
        setLoading(false);
      }
    };
    
    loadAllData();
  }, []);

  // Render tab content based on active tab
  const renderTabContent = () => {
    if (loading) {
      return <div className="loading">Loading...</div>;
    }
    
    if (error) {
      return <div className="error">{error}</div>;
    }
    
    switch (activeTab) {
      case 'lead-scoring':
        return (
          <LeadScoring 
            leads={leads}
            onCalculateScore={calculateLeadScore}
          />
        );
      
      case 'predictive-analytics':
        return (
          <PredictiveAnalytics 
            revenuePredictions={revenuePredictions}
            engagementAnalytics={engagementAnalytics}
            conversionAnalytics={conversionAnalytics}
            onGeneratePrediction={generateRevenuePrediction}
          />
        );
      
      case 'constraint-analysis':
        return (
          <ConstraintAnalysis 
            constraints={constraints}
            onAddConstraint={addSalesConstraint}
            onUpdateConstraint={updateSalesConstraint}
          />
        );
      
      default:
        return <div>Select a tab</div>;
    }
  };

  return (
    <div className="module-container lead-predictability-module">
      <div className="module-header">
        <h2 className="module-title">Lead Predictability</h2>
        <p className="module-description">AI-powered insights to optimize your sales pipeline and forecast outcomes</p>
      </div>
      
      <div className="module-tabs">
        <div 
          className={`tab ${activeTab === 'lead-scoring' ? 'active' : ''}`}
          onClick={() => setActiveTab('lead-scoring')}
        >
          Lead Scoring
        </div>
        <div 
          className={`tab ${activeTab === 'predictive-analytics' ? 'active' : ''}`}
          onClick={() => setActiveTab('predictive-analytics')}
        >
          Predictive Analytics
        </div>
        <div 
          className={`tab ${activeTab === 'constraint-analysis' ? 'active' : ''}`}
          onClick={() => setActiveTab('constraint-analysis')}
        >
          Constraint Analysis
        </div>
      </div>
      
      <div className="tab-content">
        {renderTabContent()}
      </div>
    </div>
  );
};

export default LeadPredictability;
