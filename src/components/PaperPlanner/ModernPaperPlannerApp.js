import React, { useState, useEffect } from 'react';
import ModernInputArea from './ModernInputArea';
import ModernNavigation from './ModernNavigation';
import ModernChatInterface from './ModernChatInterface';
import EnhancedInputArea from './EnhancedInputArea';
import ConfirmDialog from './ConfirmDialog';
import sectionContent from '../sectionContent.json';
import './PaperPlanner.css';

/**
 * Modern Paper Planner Application Component with enhanced layout option
 * Provides both the original layout and a new 1/3-2/3 split layout
 */
const ModernPaperPlannerApp = ({ usePaperPlannerHook }) => {
  const [darkMode, setDarkMode] = useState(false);
  const [enhancedLayout, setEnhancedLayout] = useState(() => 
    localStorage.getItem('enhancedLayout') === 'true');
  const [researchApproach, setResearchApproach] = useState(() => 
    localStorage.getItem('researchApproach') || '');
  const [showApproachSelector, setShowApproachSelector] = useState(() => 
    !localStorage.getItem('researchApproach'));
  const [expandedApproach, setExpandedApproach] = useState({
    'hypothesis': false,
    'exploratory': false,
    'needs': false
  });
  
  // Effect to save layout preference to localStorage
  useEffect(() => {
    localStorage.setItem('enhancedLayout', enhancedLayout);
  }, [enhancedLayout]);
  
  // Effect to save research approach to localStorage
  useEffect(() => {
    if (researchApproach) {
      localStorage.setItem('researchApproach', researchApproach);
    }
  }, [researchApproach]);
  
  const {
    currentSection,
    currentIndex,
    userInputs,
    chatMessages,
    currentMessage,
    loading,
    showConfirmDialog,
    setCurrentMessage,
    setShowConfirmDialog,
    handleSectionChange,
    handleInputChange,
    handleCheckboxChange,
    handleSendMessage,
    handleFirstVersionFinished,
    resetProject,
    goToNextSection,
    goToPreviousSection
  } = usePaperPlannerHook;

  // Get current section object
  const currentSectionObj = sectionContent.sections.find(s => s.id === currentSection);
  
  // Toggle dark mode
  const toggleTheme = () => {
    setDarkMode(!darkMode);
  };
  
  // Toggle layout mode
  const toggleLayout = () => {
    setEnhancedLayout(!enhancedLayout);
  };
  
  // Toggle expansion of approach descriptions
  const toggleExpand = (approach) => {
    setExpandedApproach({
      ...expandedApproach,
      [approach]: !expandedApproach[approach]
    });
  };

  // Handle research approach selection
  const handleApproachChange = (approach) => {
    setResearchApproach(approach);
  };

  // Continue from research approach selection to main planner
  const continueToPlanner = () => {
    setShowApproachSelector(false);
  };

  // Reset project with research approach
  const handleResetProject = () => {
    resetProject();
    setShowApproachSelector(true);
    setResearchApproach('');
    localStorage.removeItem('researchApproach');
  };

  // Check if a section has content
  const hasSectionContent = (sectionId) => {
    if (sectionId === 'philosophy') {
      return userInputs.philosophy && userInputs.philosophy.length > 0;
    }
    return userInputs[sectionId] && userInputs[sectionId].trim() !== '';
  };

  // Check if a section is locked (previous sections not completed)
  const isSectionLocked = (sectionIndex) => {
    // First section is never locked
    if (sectionIndex === 0) return false;
    
    // Check if all previous sections have content
    for (let i = 0; i < sectionIndex; i++) {
      const prevSectionId = sectionContent.sections[i].id;
      if (!hasSectionContent(prevSectionId)) {
        return true;
      }
    }
    
    return false;
  };
  
  // Function to export project
  const exportProject = () => {
    const exportContent = `# ${researchApproach === 'hypothesis' ? 'Hypothesis-Driven' : 
                             researchApproach === 'exploratory' ? 'Exploratory' : 
                             researchApproach === 'needs' ? 'Needs-Driven' : 
                             'Scientific'} Research Project Plan

## Research Approach
${researchApproach === 'hypothesis' ? 'Hypothesis-Driven Research: Testing specific predictions derived from theory.' : 
  researchApproach === 'exploratory' ? 'Exploratory Research: Discovering patterns and generating new hypotheses.' : 
  researchApproach === 'needs' ? 'Needs-Driven Research: Developing solutions to specific problems.' : 
  'Not specified'}

## 1. Research Question
${userInputs.question || "Not completed yet"}

## 2. ${researchApproach === 'hypothesis' ? 'Hypotheses' : 
       researchApproach === 'exploratory' ? 'Exploration Areas' : 
       researchApproach === 'needs' ? 'Need Statement' : 
       'Hypothesis or Research Focus'}
${userInputs.hypothesis || "Not completed yet"}

## 3. Research Philosophy
${userInputs.philosophy.map(id => `- ${sectionContent.philosophyOptions.find(o => o.id === id).label}`).join('\n') || "Not selected yet"}

## 4. ${researchApproach === 'hypothesis' ? 'Experimental Design' : 
       researchApproach === 'exploratory' ? 'Data Collection Approach' : 
       researchApproach === 'needs' ? 'Solution Approach' : 
       'Experimental Design'}
${userInputs.experiment || "Not completed yet"}

## 5. Data Analysis Plan
${userInputs.analysis || "Not completed yet"}

## 6. Process, Skills & Timeline
${userInputs.process || "Not completed yet"}

## 7. ${researchApproach === 'hypothesis' ? 'Abstract' : 
       researchApproach === 'exploratory' ? 'Potential Outcomes' : 
       researchApproach === 'needs' ? 'Expected Impact' : 
       'Abstract or Summary'}
${userInputs.abstract || "Not completed yet"}
`;

    // Create a blob with the content
    const blob = new Blob([exportContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    
    // Create a link and trigger download
    const a = document.createElement('a');
    a.href = url;
    a.download = `${researchApproach || 'scientific'}-research-plan.md`;
    document.body.appendChild(a);
    a.click();
    
    // Clean up
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'} transition-colors duration-300`}>
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header with app logo and toggles */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center">
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold mr-3">
              SP
            </div>
            <div>
              <h1 className="text-2xl font-bold">Scientific Paper Planner</h1>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Design a research project step-by-step
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Layout toggle */}
            <button
              onClick={toggleLayout}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-all ${
                enhancedLayout 
                  ? 'bg-indigo-100 text-indigo-700'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              {enhancedLayout ? 'Enhanced Layout' : 'Classic Layout'}
            </button>
            
            {/* Dark mode toggle */}
            <button 
              onClick={toggleTheme}
              className={`p-2 rounded-full ${darkMode ? 'bg-gray-800 text-yellow-400' : 'bg-gray-200 text-gray-700'}`}
              aria-label="Toggle dark mode"
            >
              {darkMode ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                </svg>
              )}
            </button>
          </div>
        </div>
        
        {/* Research Approach Selector (Step 0) */}
        {showApproachSelector ? (
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium mr-2">
                1
              </div>
              Select Research Approach
            </h2>
            
            <div className="bg-white rounded-xl shadow-md p-6">
              {/* Introduction with explanation of approaches */}
              <div className="mb-6 p-5 bg-blue-50 border-l-4 border-blue-500 rounded-md shadow-sm text-gray-700">
                <div className="font-semibold text-lg mb-2">RESEARCH APPROACHES</div>
                <div className="instruction-text text-base">
                  <p>Scientific research generally follows one of three fundamental approaches, each with distinct goals and methods:</p>
                  
                  <p><strong>1. Hypothesis-Driven Research</strong> starts with specific, testable predictions derived from existing theories or observations. This approach aims to confirm, refute, or refine these predictions through controlled experiments or targeted data analysis.</p>
                  
                  <p><strong>2. Exploratory Research</strong> investigates phenomena without predetermined hypotheses, seeking to discover patterns, generate new questions, and develop hypotheses for future testing. This approach is valuable when studying new domains or when existing theories are insufficient.</p>
                  
                  <p><strong>3. Needs-Driven Research</strong> begins with a specific problem or need, focusing on finding practical solutions rather than testing theoretical constructs. This approach often integrates methods from various disciplines to address real-world challenges.</p>
                  
                  <p>Each approach has its strengths and is suitable for different research contexts. Your selection will shape how you frame your questions, design your methods, and analyze your results.</p>
                </div>
              </div>

              {/* Approach selection cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                {/* Hypothesis-Driven Card */}
                <div 
                  className={`bg-white rounded-xl shadow-sm p-6 border-2 transition-all hover:shadow-md cursor-pointer ${
                    researchApproach === 'hypothesis' ? 'border-indigo-500' : 'border-gray-100'
                  }`}
                  onClick={() => handleApproachChange('hypothesis')}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center mr-2 ${
                        researchApproach === 'hypothesis' ? 'bg-indigo-500 text-white' : 'bg-gray-200'
                      }`}>
                        {researchApproach === 'hypothesis' && (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                      <h3 className="font-semibold text-lg">Hypothesis-Driven</h3>
                    </div>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleExpand('hypothesis');
                      }} 
                      className="text-gray-500 hover:text-gray-700"
                    >
                      {expandedApproach.hypothesis ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M5 10a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1z" clipRule="evenodd" />
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                        </svg>
                      )}
                    </button>
                  </div>
                  <div className="text-sm text-gray-600">
                    Testing specific predictions derived from theory.
                  </div>
                  {expandedApproach.hypothesis && (
                    <div className="mt-4 text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">
                      <p className="font-medium mb-2">Best when:</p>
                      <ul className="list-disc pl-5 space-y-1">
                        <li>You have a clear theoretical framework</li>
                        <li>Your concepts can be precisely measured</li>
                        <li>You aim to establish causal relationships</li>
                        <li>You want to test competing explanations</li>
                      </ul>
                      <p className="font-medium mt-3 mb-2">Example:</p>
                      <p>Testing whether dopamine release in the nucleus accumbens increases more for unexpected rewards than expected ones.</p>
                    </div>
                  )}
                </div>

                {/* Exploratory Card */}
                <div 
                  className={`bg-white rounded-xl shadow-sm p-6 border-2 transition-all hover:shadow-md cursor-pointer ${
                    researchApproach === 'exploratory' ? 'border-indigo-500' : 'border-gray-100'
                  }`}
                  onClick={() => handleApproachChange('exploratory')}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center mr-2 ${
                        researchApproach === 'exploratory' ? 'bg-indigo-500 text-white' : 'bg-gray-200'
                      }`}>
                        {researchApproach === 'exploratory' && (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                      <h3 className="font-semibold text-lg">Exploratory</h3>
                    </div>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleExpand('exploratory');
                      }} 
                      className="text-gray-500 hover:text-gray-700"
                    >
                      {expandedApproach.exploratory ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M5 10a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1z" clipRule="evenodd" />
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                        </svg>
                      )}
                    </button>
                  </div>
                  <div className="text-sm text-gray-600">
                    Discovering patterns and generating new hypotheses.
                  </div>
                  {expandedApproach.exploratory && (
                    <div className="mt-4 text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">
                      <p className="font-medium mb-2">Best when:</p>
                      <ul className="list-disc pl-5 space-y-1">
                        <li>You're investigating a novel phenomenon</li>
                        <li>Existing theories are insufficient</li>
                        <li>You're searching for unexpected patterns</li>
                        <li>You want to generate new research directions</li>
                      </ul>
                      <p className="font-medium mt-3 mb-2">Example:</p>
                      <p>Using high-dimensional neural recordings during natural behavior to identify previously unknown activity patterns.</p>
                    </div>
                  )}
                </div>

                {/* Needs-Driven Card */}
                <div 
                  className={`bg-white rounded-xl shadow-sm p-6 border-2 transition-all hover:shadow-md cursor-pointer ${
                    researchApproach === 'needs' ? 'border-indigo-500' : 'border-gray-100'
                  }`}
                  onClick={() => handleApproachChange('needs')}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center mr-2 ${
                        researchApproach === 'needs' ? 'bg-indigo-500 text-white' : 'bg-gray-200'
                      }`}>
                        {researchApproach === 'needs' && (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                      <h3 className="font-semibold text-lg">Needs-Driven</h3>
                    </div>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleExpand('needs');
                      }} 
                      className="text-gray-500 hover:text-gray-700"
                    >
                      {expandedApproach.needs ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M5 10a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1z" clipRule="evenodd" />
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                        </svg>
                      )}
                    </button>
                  </div>
                  <div className="text-sm text-gray-600">
                    Developing solutions to specific problems.
                  </div>
                  {expandedApproach.needs && (
                    <div className="mt-4 text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">
                      <p className="font-medium mb-2">Best when:</p>
                      <ul className="list-disc pl-5 space-y-1">
                        <li>You're addressing a specific practical problem</li>
                        <li>Your goal is developing interventions or tools</li>
                        <li>Stakeholder needs drive the research questions</li>
                        <li>You prioritize application over theory development</li>
                      </ul>
                      <p className="font-medium mt-3 mb-2">Example:</p>
                      <p>Developing a brain-computer interface for patients with locked-in syndrome to enable communication.</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Continue button */}
              <div className="flex justify-end">
                <button
                  disabled={!researchApproach}
                  className={`px-6 py-3 rounded-lg font-medium transition-all duration-300 ${
                    researchApproach
                      ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md hover:shadow-lg transform hover:-translate-y-1'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
                  onClick={continueToPlanner}
                >
                  <span className="flex items-center">
                    Continue to Research Planning
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                  </span>
                </button>
              </div>
            </div>
          </div>
        ) : enhancedLayout ? (
          /* ENHANCED LAYOUT - 1/3 - 2/3 Split */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - 1/3 width for user input sections */}
            <div className="lg:col-span-1 space-y-4">
              {sectionContent.sections.map((section, index) => {
                const isCompleted = hasSectionContent(section.id);
                const isCurrentSection = section.id === currentSection;
                const isLocked = isSectionLocked(index);
                
                return (
                  <div key={section.id} className="relative">
                    {/* Section Card */}
                    <div 
                      className={`w-full rounded-lg shadow-sm overflow-hidden transition-all ${
                        isLocked 
                          ? 'opacity-70 bg-gray-50 cursor-not-allowed' 
                          : 'bg-white cursor-pointer hover:shadow-md'
                      } ${
                        isCompleted && !isCurrentSection 
                          ? 'border-2 border-green-500' 
                          : isCurrentSection 
                            ? 'border-2 border-indigo-500' 
                            : 'border border-gray-200'
                      }`}
                      onClick={() => !isLocked && handleSectionChange(section.id)}
                    >
                      {/* Work On This Banner */}
                      {isCurrentSection && (
                        <div className="bg-indigo-50 px-3 py-2 border-b border-indigo-100">
                          <div className="flex items-center">
                            <div className="bg-indigo-500 text-white text-xs font-medium px-2 py-1 rounded">
                              WORK ON THIS NOW
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {/* Section Header */}
                      <div className="px-4 py-3 flex justify-between items-center">
                        <h3 className={`font-medium ${isLocked ? 'text-gray-400' : 'text-gray-800'}`}>
                          {section.title}
                        </h3>
                        {isCompleted && !isCurrentSection && (
                          <div className="bg-green-50 text-green-600 text-xs font-medium px-2 py-1 rounded-full border border-green-200">
                            ✓
                          </div>
                        )}
                      </div>
                      
                      {/* Section content preview (simplified for enhanced layout) */}
                      {!isLocked && (
                        <div className={`px-4 pb-3 ${isCurrentSection ? 'block' : 'hidden lg:block'}`}>
                          {section.id === 'philosophy' ? (
                            <div className="text-sm text-gray-500">
                              {userInputs.philosophy && userInputs.philosophy.length > 0 ? (
                                <div className="line-clamp-2">
                                  {userInputs.philosophy.map(id => 
                                    sectionContent.philosophyOptions.find(o => o.id === id)?.label.split('.')[0]
                                  ).join(', ')}
                                </div>
                              ) : (
                                <span className="italic">Select research philosophy options</span>
                              )}
                            </div>
                          ) : (
                            <div className="text-sm text-gray-500 line-clamp-2">
                              {userInputs[section.id] || <span className="italic">Not completed yet</span>}
                            </div>
                          )}
                        </div>
                      )}
                      
                      {/* Locked indicator */}
                      {isLocked && (
                        <div className="px-4 py-3 text-center">
                          <div className="text-gray-400 text-sm">
                            Complete previous section to unlock
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* Connecting arrow between sections */}
                    {index < sectionContent.sections.length - 1 && (
                      <div className="h-4 w-full flex justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-300" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Right Column - 2/3 width for instructions and AI */}
            <div className="lg:col-span-2 space-y-6">
              {!currentSection ? (
                <div className="bg-white rounded-lg shadow p-8 text-center">
                  <div className="text-xl font-semibold text-gray-700 mb-4">Select a section to begin working</div>
                  <p className="text-gray-500 mb-4">Click on an unlocked section from the left panel to start working on it.</p>
                </div>
              ) : (
                <>
                  {/* Instructions Panel */}
                  <div className="bg-blue-50 rounded-lg p-6 border-l-4 border-blue-500">
                    <h3 className="text-lg font-semibold text-blue-800 mb-2">
                      CURRENT STEP: {currentSectionObj.title.toUpperCase()}
                    </h3>
                    <div className="prose prose-blue max-w-none">
                      <div className="text-blue-700 text-base">
                        {currentSectionObj.instructions.description.split('\n\n').map((paragraph, i) => (
                          <p key={i} className="mb-3">{paragraph}</p>
                        ))}
                      </div>
                      {currentSectionObj.instructions.workStep.content && (
                        <div className="bg-white rounded-lg p-4 border border-blue-200 mt-3">
                          <h4 className="font-medium text-blue-800 mb-1">{currentSectionObj.instructions.workStep.title}</h4>
                          <div className="text-blue-600 text-sm">
                            {currentSectionObj.instructions.workStep.content.split('\n\n').map((paragraph, i) => (
                              <p key={i} className="mb-2">{paragraph}</p>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Current Section Input Area */}
                  <div className="bg-white rounded-lg shadow overflow-hidden">
                    <div className="p-6">
                      <EnhancedInputArea
                        section={currentSectionObj}
                        userInputs={userInputs}
                        philosophyOptions={sectionContent.philosophyOptions}
                        handleInputChange={handleInputChange}
                        handleCheckboxChange={handleCheckboxChange}
                        handleFirstVersionFinished={handleFirstVersionFinished}
                        loading={loading}
                        researchApproach={researchApproach}
                      />
                    </div>
                  </div>
                </>
              )}
              
              {/* AI Chat Panel */}
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="bg-indigo-600 text-white px-4 py-3">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-indigo-600 font-bold mr-3">
                      AI
                    </div>
                    <h3 className="font-medium">AI Research Assistant</h3>
                  </div>
                </div>
                <div className="p-6">
                  <ModernChatInterface
                    currentSection={currentSection}
                    chatMessages={chatMessages}
                    currentMessage={currentMessage}
                    setCurrentMessage={setCurrentMessage}
                    handleSendMessage={handleSendMessage}
                    loading={loading}
                    researchApproach={researchApproach}
                    enhancedLayout={true}
                  />
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* ORIGINAL LAYOUT */
          <>
            {/* Navigation shown after research approach selection */}
            <ModernNavigation 
              sections={sectionContent.sections}
              currentSection={currentSection}
              currentIndex={currentIndex}
              userInputs={userInputs}
              handleSectionChange={handleSectionChange}
              setShowConfirmDialog={setShowConfirmDialog}
              exportProject={exportProject}
              goToNextSection={goToNextSection}
              goToPreviousSection={goToPreviousSection}
              researchApproach={researchApproach}
            />
            
            {/* Content Section */}
            <div className="mb-8">
              <h2 className={`text-xl font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                <div className="flex items-center">
                  <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium mr-2">
                    {currentIndex + 1}
                  </div>
                  {currentSectionObj.title}
                  
                  {/* Research approach indicator */}
                  <span className="ml-3 px-3 py-1 text-xs rounded-full bg-indigo-100 text-indigo-800">
                    {researchApproach === 'hypothesis' ? 'Hypothesis-Driven' : 
                     researchApproach === 'exploratory' ? 'Exploratory' : 
                     researchApproach === 'needs' ? 'Needs-Driven' : ''}
                  </span>
                </div>
              </h2>
              
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                {/* Input Area - Takes 3/5 of the space on large screens */}
                <div className="lg:col-span-3">
                  <ModernInputArea 
                    section={currentSectionObj}
                    userInputs={userInputs}
                    philosophyOptions={sectionContent.philosophyOptions}
                    handleInputChange={handleInputChange}
                    handleCheckboxChange={handleCheckboxChange}
                    handleFirstVersionFinished={handleFirstVersionFinished}
                    loading={loading}
                    researchApproach={researchApproach}
                  />
                </div>
                
                {/* Chat Interface - Takes 2/5 of the space on large screens */}
                <div className="lg:col-span-2">
                  <ModernChatInterface
                    currentSection={currentSection}
                    chatMessages={chatMessages}
                    currentMessage={currentMessage}
                    setCurrentMessage={setCurrentMessage}
                    handleSendMessage={handleSendMessage}
                    loading={loading}
                    researchApproach={researchApproach}
                    enhancedLayout={false}
                  />
                </div>
              </div>
            </div>
          </>
        )}
        
        {/* Footer */}
        <div className={`text-center ${darkMode ? 'text-gray-400' : 'text-gray-500'} text-sm mt-12 border-t ${darkMode ? 'border-gray-800' : 'border-gray-200'} pt-6`}>
          <p>Scientific Paper Planner • Designed for Researchers • {new Date().getFullYear()}</p>
        </div>
        
        {/* Confirmation Dialog - Update to reset research approach too */}
        <ConfirmDialog
          showConfirmDialog={showConfirmDialog}
          setShowConfirmDialog={setShowConfirmDialog}
          resetProject={handleResetProject}
        />
      </div>
    </div>
  );
};

export default ModernPaperPlannerApp;



