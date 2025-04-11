import React from 'react';

const TrainingModulesList = ({ modules, userProgress, onUpdateProgress }) => {
  // Helper function to get progress for a module
  const getModuleProgress = (moduleId) => {
    const progressRecord = userProgress.find(p => p.module_id === moduleId);
    return progressRecord ? progressRecord.progress : 0;
  };

  // Helper function to check if a module is completed
  const isModuleCompleted = (moduleId) => {
    const progressRecord = userProgress.find(p => p.module_id === moduleId);
    return progressRecord ? progressRecord.completed : false;
  };

  // Group modules by difficulty
  const groupedModules = modules.reduce((acc, module) => {
    if (!acc[module.difficulty]) {
      acc[module.difficulty] = [];
    }
    acc[module.difficulty].push(module);
    return acc;
  }, {});

  // Sort difficulties in order: beginner, intermediate, advanced
  const difficultyOrder = ['beginner', 'intermediate', 'advanced'];

  return (
    <div className="training-tab">
      {difficultyOrder.map(difficulty => (
        groupedModules[difficulty] && (
          <div key={difficulty} className="difficulty-section">
            <h3 className="difficulty-title">{difficulty.charAt(0).toUpperCase() + difficulty.slice(1)} Modules</h3>
            
            <div className="card">
              <div className="card-body">
                {groupedModules[difficulty].map(module => (
                  <div key={module.id} className="training-module">
                    <div className="module-info">
                      <div className="module-title">{module.title}</div>
                      <div className="module-description">{module.description}</div>
                      <div className="module-meta">
                        <span className="module-duration">{module.duration} minutes</span>
                      </div>
                    </div>
                    <div className="module-progress">
                      <div className="progress-bar">
                        <div 
                          className="progress-fill" 
                          style={{width: `${getModuleProgress(module.id)}%`}}
                        ></div>
                      </div>
                      <div className="progress-text">{getModuleProgress(module.id)}%</div>
                    </div>
                    <div className="module-actions">
                      {isModuleCompleted(module.id) ? (
                        <button className="btn-secondary">Review</button>
                      ) : (
                        <button 
                          className="btn-primary"
                          onClick={() => {
                            // For demo purposes, increment progress by 25% on each click
                            const currentProgress = getModuleProgress(module.id);
                            const newProgress = Math.min(100, currentProgress + 25);
                            onUpdateProgress(module.id, newProgress);
                          }}
                        >
                          {getModuleProgress(module.id) > 0 ? 'Continue' : 'Start'}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )
      ))}
      
      {modules.length === 0 && (
        <div className="card">
          <div className="card-body">
            <p>No training modules available yet. Check back soon for new content.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default TrainingModulesList;
