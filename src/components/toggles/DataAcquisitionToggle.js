// FILE: src/components/toggles/DataAcquisitionToggle.js
import React from 'react';
import IntegratedToggle from './IntegratedToggle';

const DataAcquisitionToggle = ({ activeMethod, setActiveMethod }) => {
  // Define the options for the data acquisition toggle
  const methodOptions = [
    { id: 'experiment', label: 'New Experiment' },
    { id: 'existingdata', label: 'Existing Data' },
    { id: 'theorysimulation', label: 'Theory/Simulation' }
  ];

  // Use the IntegratedToggle component for a more compact display
  return (
    <IntegratedToggle
      title="Data Acquisition"
      options={methodOptions}
      activeOption={activeMethod}
      onChange={setActiveMethod}
      className="mb-1"
    />
  );
};

export default DataAcquisitionToggle;
