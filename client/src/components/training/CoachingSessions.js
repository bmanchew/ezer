import React, { useState } from 'react';

const CoachingSessions = ({ sessions, recommendations, onScheduleSession, onUpdateSession }) => {
  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    scheduled_at: '',
    duration: 30
  });

  // Helper function to format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' at ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    onScheduleSession(formData);
    setFormData({
      title: '',
      description: '',
      scheduled_at: '',
      duration: 30
    });
    setShowScheduleForm(false);
  };

  // Group sessions by status
  const upcomingSessions = sessions.filter(session => session.status === 'scheduled');
  const completedSessions = sessions.filter(session => session.status === 'completed');
  const cancelledSessions = sessions.filter(session => session.status === 'cancelled');

  return (
    <div className="coaching-tab">
      <div className="card">
        <div className="card-header">
          <div className="card-title">AI Coaching Recommendations</div>
        </div>
        <div className="card-body">
          {recommendations.length > 0 ? (
            <ul className="coaching-recommendations">
              {recommendations.map((recommendation, index) => (
                <li key={index} className={`recommendation-item ${recommendation.priority}`}>
                  <span className="recommendation-icon">
                    {recommendation.type === 'coaching' ? '🎯' : 
                     recommendation.type === 'training' ? '🎓' : 
                     recommendation.type === 'practice' ? '🏋️' : '📅'}
                  </span>
                  <span className="recommendation-text">{recommendation.text}</span>
                  {recommendation.type === 'coaching' && (
                    <button 
                      className="btn-primary btn-sm"
                      onClick={() => {
                        setFormData({
                          ...formData,
                          title: `Coaching: ${recommendation.text.substring(0, 30)}...`,
                          description: recommendation.text
                        });
                        setShowScheduleForm(true);
                      }}
                    >
                      Schedule
                    </button>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p>No coaching recommendations available yet. Continue using the system to generate personalized recommendations.</p>
          )}
        </div>
      </div>
      
      <div className="card">
        <div className="card-header">
          <div className="card-title">Upcoming Coaching Sessions</div>
          <button 
            className="btn-primary"
            onClick={() => setShowScheduleForm(true)}
          >
            Schedule New Session
          </button>
        </div>
        <div className="card-body">
          {upcomingSessions.length > 0 ? (
            <div className="sessions-list">
              {upcomingSessions.map(session => (
                <div key={session.id} className="coaching-session">
                  <div className="session-info">
                    <div className="session-title">{session.title}</div>
                    <div className="session-time">
                      {formatDate(session.scheduled_at)} ({session.duration} minutes)
                    </div>
                    {session.description && (
                      <div className="session-description">{session.description}</div>
                    )}
                    {session.coach && (
                      <div className="session-coach">
                        Coach: {session.coach.first_name} {session.coach.last_name}
                      </div>
                    )}
                  </div>
                  <div className="session-actions">
                    <button 
                      className="btn-secondary"
                      onClick={() => onUpdateSession(session.id, 'cancelled')}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p>No upcoming coaching sessions. Schedule a session to get personalized coaching.</p>
          )}
        </div>
      </div>
      
      {showScheduleForm && (
        <div className="card">
          <div className="card-header">
            <div className="card-title">Schedule Coaching Session</div>
          </div>
          <div className="card-body">
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Title</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows="3"
                />
              </div>
              <div className="form-group">
                <label>Date and Time</label>
                <input
                  type="datetime-local"
                  name="scheduled_at"
                  value={formData.scheduled_at}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Duration (minutes)</label>
                <select
                  name="duration"
                  value={formData.duration}
                  onChange={handleInputChange}
                  required
                >
                  <option value="15">15 minutes</option>
                  <option value="30">30 minutes</option>
                  <option value="45">45 minutes</option>
                  <option value="60">60 minutes</option>
                </select>
              </div>
              <div className="form-actions">
                <button 
                  type="button" 
                  className="btn-secondary"
                  onClick={() => setShowScheduleForm(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">Schedule</button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {completedSessions.length > 0 && (
        <div className="card">
          <div className="card-header">
            <div className="card-title">Completed Sessions</div>
          </div>
          <div className="card-body">
            <div className="sessions-list">
              {completedSessions.map(session => (
                <div key={session.id} className="coaching-session completed">
                  <div className="session-info">
                    <div className="session-title">{session.title}</div>
                    <div className="session-time">
                      Completed on {formatDate(session.updated_at)}
                    </div>
                    {session.notes && (
                      <div className="session-notes">{session.notes}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CoachingSessions;
