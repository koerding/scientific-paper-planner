// FILE: src/components/toggles/ResearchApproachToggle.js
import React from 'react';
import IntegratedToggle from './IntegratedToggle';

const ResearchApproachToggle = ({ activeApproach, setActiveApproach }) => {
  // Define the options for the research approach toggle
  const approachOptions = [
    { id: 'hypothesis', label: 'Hypothesis Testing' },
    { id: 'needsresearch', label: 'Needs-Based' },
    { id: 'exploratoryresearch', label: 'Exploratory' }
  ];

  // Use the IntegratedToggle component for a more compact display
  return (
    <IntegratedToggle
      title="Research Approach"
      options={approachOptions}
      activeOption={activeApproach}
      onChange={setActiveApproach}
      className="mb-1"
    />
  );
};

export default ResearchApproachToggle;
