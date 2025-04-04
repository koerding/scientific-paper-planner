import React from 'react';
import VerticalPaperPlannerApp from './VerticalPaperPlannerApp'; // Component being rendered
import usePaperPlanner from '../../hooks/usePaperPlanner';     // The hook managing state
import '../../styles/PaperPlanner.css';                       // Styles

/**
 * Wrapper component for the Paper Planner feature.
 * Uses the usePaperPlanner hook and passes the data down
 * to the main VerticalPaperPlannerApp component.
 * This component SHOULD NOT contain its own state logic.
 */
const PaperPlannerApp = () => {
  // Get all state and functions from the custom hook
  const plannerHookData = usePaperPlanner();

  // Pass the entire result of the hook down as a single prop
  return (
    <VerticalPaperPlannerApp
      usePaperPlannerHook={plannerHookData} // Pass all hook data/functions
    />
  );
};

export default PaperPlannerApp; // Export the component
