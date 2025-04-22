// hooks/useSectionState.js
export const useSectionState = (sectionId, initialState = {}) => {
  const [isMinimized, setIsMinimized] = useState(() => getSectionMinimizedState(sectionId));
  const [isFocused, setIsFocused] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [lastEditTimestamp, setLastEditTimestamp] = useState(null);
  const [editedSinceFeedback, setEditedSinceFeedback] = useState(false);
  
  // Effect to update editedSinceFeedback
  useEffect(() => {
    if (lastEditTimestamp && initialState.lastFeedbackTime && 
        lastEditTimestamp > initialState.lastFeedbackTime) {
      setEditedSinceFeedback(true);
    } else if (!lastEditTimestamp || !initialState.lastFeedbackTime) {
      setEditedSinceFeedback(false);
    }
  }, [lastEditTimestamp, initialState.lastFeedbackTime]);
  
  // Reset logic for section state
  useEffect(() => {
    const handleProjectReset = () => {
      setLastEditTimestamp(null);
      setEditedSinceFeedback(false);
    };
    
    // Add event listeners for reset events
    window.addEventListener('projectStateReset', handleProjectReset);
    window.addEventListener('projectDataLoaded', handleProjectReset);
    window.addEventListener('documentImported', handleExpandAfterImport);
    
    return () => {
      window.removeEventListener('projectStateReset', handleProjectReset);
      window.removeEventListener('projectDataLoaded', handleProjectReset);
      window.removeEventListener('documentImported', handleExpandAfterImport);
    };
  }, [sectionId]);

  // Logic for document imports
  const handleExpandAfterImport = () => {
    setIsMinimized(false);
    setSectionMinimizedState(sectionId, false);
  };
  
  // Toggle minimized state
  const toggleMinimized = (e) => {
    if (e) e.stopPropagation();
    const newState = !isMinimized;
    setIsMinimized(newState);
    setSectionMinimizedState(sectionId, newState);
  };
  
  return {
    isMinimized, 
    setIsMinimized,
    isFocused, 
    setIsFocused,
    isHovered, 
    setIsHovered,
    lastEditTimestamp, 
    setLastEditTimestamp,
    editedSinceFeedback, 
    setEditedSinceFeedback,
    toggleMinimized
  };
};
