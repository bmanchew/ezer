import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../styles/AITrainingModule.css';

// Import components
import TrainingModulesList from './training/TrainingModulesList';
import ModuleDetails from './training/ModuleDetails';
import PerformanceMetrics from './training/PerformanceMetrics';
import AIInsights from './training/AIInsights';
import CoachingSessions from './training/CoachingSessions';

const AITrainingModule = () => {
  const [activeTab, setActiveTab] = useState('performance');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // State for performance metrics
  const [performanceData, setPerformanceData] = useState({
    callMetrics: {},
    userMetrics: [],
    teamAverages: [],
    topPerformerMetrics: []
  });
  
  // State for training modules
  const [trainingModules, setTrainingModules] = useState([]);
  const [userProgress, setUserProgress] = useState([]);
  
  // State for insights
  const [insights, setInsights] = useState([]);
  
  // State for coaching sessions
  const [coachingSessions, setCoachingSessions] = useState([]);
  const [recommendations, setRecommendations] = useState([]);

  // Fetch performance metrics
  const fetchPerformanceMetrics = async () => {
    try {
      const res = await axios.get('/api/ai-training/metrics');
      setPerformanceData(res.data);
    } catch (err) {
      console.error('Error fetching performance metrics:', err);
      setError('Failed to load performance metrics');
    }
  };

  // Fetch training modules and progress
  const fetchTrainingData = async () => {
    try {
      const [modulesRes, progressRes] = await Promise.all([
        axios.get('/api/ai-training/modules'),
        axios.get('/api/ai-training/progress')
      ]);
      
      setTrainingModules(modulesRes.data);
      setUserProgress(progressRes.data);
    } catch (err) {
      console.error('Error fetching training data:', err);
      setError('Failed to load training data');
    }
  };

  // Fetch insights
  const fetchInsights = async () => {
    try {
      const res = await axios.get('/api/ai-training/insights');
      setInsights(res.data);
    } catch (err) {
      console.error('Error fetching insights:', err);
      setError('Failed to load AI insights');
    }
  };

  // Fetch coaching sessions and recommendations
  const fetchCoachingData = async () => {
    try {
      const [sessionsRes, recommendationsRes] = await Promise.all([
        axios.get('/api/ai-training/coaching'),
        axios.get('/api/ai-training/recommendations')
      ]);
      
      setCoachingSessions(sessionsRes.data);
      setRecommendations(recommendationsRes.data);
    } catch (err) {
      console.error('Error fetching coaching data:', err);
      setError('Failed to load coaching data');
    }
  };

  // Update module progress
  const updateModuleProgress = async (moduleId, progress) => {
    try {
      const res = await axios.post(`/api/ai-training/progress/${moduleId}`, { progress });
      
      // Update local state
      setUserProgress(prevProgress => {
        const updatedProgress = [...prevProgress];
        const index = updatedProgress.findIndex(p => p.module_id === moduleId);
        
        if (index !== -1) {
          updatedProgress[index] = res.data;
        } else {
          updatedProgress.push(res.data);
        }
        
        return updatedProgress;
      });
    } catch (err) {
      console.error('Error updating module progress:', err);
      setError('Failed to update progress');
    }
  };

  // Mark insight as read
  const markInsightAsRead = async (insightId) => {
    try {
      const res = await axios.put(`/api/ai-training/insights/${insightId}/read`);
      
      // Update local state
      setInsights(prevInsights => 
        prevInsights.map(insight => 
          insight.id === insightId ? { ...insight, is_read: true } : insight
        )
      );
    } catch (err) {
      console.error('Error marking insight as read:', err);
      setError('Failed to update insight');
    }
  };

  // Schedule coaching session
  const scheduleCoachingSession = async (sessionData) => {
    try {
      const res = await axios.post('/api/ai-training/coaching', sessionData);
      
      // Update local state
      setCoachingSessions(prevSessions => [...prevSessions, res.data]);
    } catch (err) {
      console.error('Error scheduling coaching session:', err);
      setError('Failed to schedule coaching session');
    }
  };

  // Update coaching session status
  const updateCoachingSession = async (sessionId, status, notes) => {
    try {
      const res = await axios.put(`/api/ai-training/coaching/${sessionId}`, { status, notes });
      
      // Update local state
      setCoachingSessions(prevSessions => 
        prevSessions.map(session => 
          session.id === sessionId ? res.data : session
        )
      );
    } catch (err) {
      console.error('Error updating coaching session:', err);
      setError('Failed to update coaching session');
    }
  };

  // Load all data on component mount
  useEffect(() => {
    const loadAllData = async () => {
      setLoading(true);
      try {
        await Promise.all([
          fetchPerformanceMetrics(),
          fetchTrainingData(),
          fetchInsights(),
          fetchCoachingData()
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
      case 'performance':
        return (
          <PerformanceMetrics 
            performanceData={performanceData}
            insights={insights.filter(insight => insight.insight_type === 'performance')}
            onMarkInsightAsRead={markInsightAsRead}
          />
        );
      
      case 'training':
        return (
          <TrainingModulesList 
            modules={trainingModules}
            userProgress={userProgress}
            onUpdateProgress={updateModuleProgress}
          />
        );
      
      case 'module':
        return (
          <ModuleDetails 
            module={selectedModule}
            progress={userProgress.find(p => p.module_id === selectedModule?.id)}
            onUpdateProgress={updateModuleProgress}
          />
        );
      
      case 'insights':
        return (
          <AIInsights 
            insights={insights}
            onMarkAsRead={markInsightAsRead}
          />
        );
      
      case 'coaching':
        return (
          <CoachingSessions 
            sessions={coachingSessions}
            recommendations={recommendations}
            onScheduleSession={scheduleCoachingSession}
            onUpdateSession={updateCoachingSession}
          />
        );
      
      default:
        return <div>Select a tab</div>;
    }
  };

  return (
    <div className="module-container ai-training-module">
      <div className="module-header">
        <h2 className="module-title">AI Sales Training</h2>
        <p className="module-description">Personalized training and coaching to improve your sales performance</p>
      </div>
      
      <div className="module-tabs">
        <div 
          className={`tab ${activeTab === 'performance' ? 'active' : ''}`}
          onClick={() => setActiveTab('performance')}
        >
          Performance
        </div>
        <div 
          className={`tab ${activeTab === 'training' ? 'active' : ''}`}
          onClick={() => setActiveTab('training')}
        >
          Training
        </div>
        <div 
          className={`tab ${activeTab === 'insights' ? 'active' : ''}`}
          onClick={() => setActiveTab('insights')}
        >
          AI Insights
        </div>
        <div 
          className={`tab ${activeTab === 'coaching' ? 'active' : ''}`}
          onClick={() => setActiveTab('coaching')}
        >
          Coaching
        </div>
      </div>
      
      <div className="tab-content">
        {renderTabContent()}
      </div>
    </div>
  );
};

export default AITrainingModule;
