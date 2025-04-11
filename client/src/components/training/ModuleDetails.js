import React, { useState, useEffect } from 'react';

const ModuleDetails = ({ module, progress, onUpdateProgress }) => {
  const [currentSection, setCurrentSection] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [content, setContent] = useState(null);

  useEffect(() => {
    if (module && module.content) {
      try {
        // Parse the JSON content
        const parsedContent = typeof module.content === 'string' 
          ? JSON.parse(module.content) 
          : module.content;
        setContent(parsedContent);
      } catch (err) {
        console.error('Error parsing module content:', err);
      }
    }
  }, [module]);

  if (!module || !content) {
    return <div className="loading">Loading module content...</div>;
  }

  const { sections, quizzes } = content;

  const handleSectionComplete = () => {
    // Move to next section
    if (currentSection < sections.length - 1) {
      setCurrentSection(currentSection + 1);
    } else {
      // If all sections are complete, show quiz
      setCurrentSection(sections.length);
    }

    // Calculate progress based on sections completed
    const sectionProgress = Math.floor(((currentSection + 1) / (sections.length + 1)) * 100);
    onUpdateProgress(module.id, sectionProgress);
  };

  const handleQuizAnswerChange = (questionIndex, answerIndex) => {
    setQuizAnswers({
      ...quizAnswers,
      [questionIndex]: answerIndex
    });
  };

  const handleQuizSubmit = () => {
    setQuizSubmitted(true);
    
    // Calculate score
    let correctAnswers = 0;
    quizzes.forEach((quiz, index) => {
      if (quizAnswers[index] === quiz.correctAnswer) {
        correctAnswers++;
      }
    });
    
    const score = Math.floor((correctAnswers / quizzes.length) * 100);
    
    // If score is above 70%, mark module as complete
    if (score >= 70) {
      onUpdateProgress(module.id, 100);
    }
  };

  const renderSection = () => {
    if (currentSection < sections.length) {
      const section = sections[currentSection];
      return (
        <div className="module-section">
          <h3 className="section-title">{section.title}</h3>
          <div className="section-content">
            {section.content.split('\n').map((paragraph, idx) => (
              <p key={idx}>{paragraph}</p>
            ))}
          </div>
          <div className="section-actions">
            <button 
              className="btn-primary"
              onClick={handleSectionComplete}
            >
              {currentSection < sections.length - 1 ? 'Next Section' : 'Take Quiz'}
            </button>
          </div>
        </div>
      );
    } else if (quizzes && quizzes.length > 0) {
      // Render quiz
      return (
        <div className="module-quiz">
          <h3 className="quiz-title">Module Quiz</h3>
          <p className="quiz-instructions">Answer the following questions to complete this module.</p>
          
          {quizzes.map((quiz, questionIndex) => (
            <div key={questionIndex} className="quiz-question">
              <h4>{quiz.question}</h4>
              <div className="quiz-options">
                {quiz.options.map((option, optionIndex) => (
                  <div key={optionIndex} className="quiz-option">
                    <label className={`option-label ${
                      quizSubmitted 
                        ? optionIndex === quiz.correctAnswer 
                          ? 'correct' 
                          : quizAnswers[questionIndex] === optionIndex 
                            ? 'incorrect' 
                            : ''
                        : ''
                    }`}>
                      <input 
                        type="radio" 
                        name={`question-${questionIndex}`}
                        value={optionIndex}
                        checked={quizAnswers[questionIndex] === optionIndex}
                        onChange={() => handleQuizAnswerChange(questionIndex, optionIndex)}
                        disabled={quizSubmitted}
                      />
                      {option}
                    </label>
                  </div>
                ))}
              </div>
              {quizSubmitted && quizAnswers[questionIndex] !== quiz.correctAnswer && (
                <div className="quiz-feedback">
                  <p className="feedback-text">Correct answer: {quiz.options[quiz.correctAnswer]}</p>
                </div>
              )}
            </div>
          ))}
          
          <div className="quiz-actions">
            {!quizSubmitted ? (
              <button 
                className="btn-primary"
                onClick={handleQuizSubmit}
                disabled={Object.keys(quizAnswers).length !== quizzes.length}
              >
                Submit Quiz
              </button>
            ) : (
              <button 
                className="btn-secondary"
                onClick={() => window.history.back()}
              >
                Back to Modules
              </button>
            )}
          </div>
        </div>
      );
    }
  };

  return (
    <div className="module-details">
      <div className="module-header">
        <h2 className="module-title">{module.title}</h2>
        <div className="module-meta">
          <span className="module-difficulty">{module.difficulty}</span>
          <span className="module-duration">{module.duration} minutes</span>
        </div>
        <p className="module-description">{module.description}</p>
      </div>
      
      <div className="module-progress-bar">
        <div className="progress-track">
          {sections.map((_, index) => (
            <div 
              key={index}
              className={`progress-step ${index <= currentSection ? 'completed' : ''}`}
              onClick={() => index < currentSection && setCurrentSection(index)}
            >
              {index + 1}
            </div>
          ))}
          <div 
            className={`progress-step quiz ${currentSection >= sections.length ? 'completed' : ''}`}
          >
            Q
          </div>
        </div>
      </div>
      
      <div className="module-content">
        {renderSection()}
      </div>
    </div>
  );
};

export default ModuleDetails;
