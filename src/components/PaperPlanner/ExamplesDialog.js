// FILE: src/components/PaperPlanner/ExamplesDialog.js
import React, { useState, useEffect } from 'react';
import { loadExamples } from '../../utils/ExampleUtils.js';
// REMOVED: import { initializeSectionStates } from '../../services/sectionStateService'; // <-- Removed import

/**
 * Dialog for loading example projects
 * UPDATED: Removed call to initializeSectionStates as the store's load action handles it.
 */
const ExamplesDialog = ({ showExamplesDialog, setShowExamplesDialog, loadProject }) => {
  const [examples, setExamples] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedExample, setSelectedExample] = useState(null);

  // Load available examples when dialog opens
  useEffect(() => {
    if (showExamplesDialog) {
      setLoading(true);
      setError(null);
      setSelectedExample(null); // Reset selection when dialog opens

      loadExamples()
        .then(exampleData => {
          setExamples(exampleData || []);
          setLoading(false);
        })
        .catch(err => {
          console.error('Error loading examples:', err);
          setError('Failed to load examples. Please try again.');
          setLoading(false);
        });
    }
  }, [showExamplesDialog]);

  // Handle example selection
  const handleSelectExample = (example) => {
    setSelectedExample(example.id);
  };

  // Handle loading the selected example
  const handleLoadExample = () => {
    if (!selectedExample) return;

    const example = examples.find(ex => ex?.id === selectedExample);
    if (example && example.data) {
      // REMOVED: initializeSectionStates(false); // State setup now handled by loadProject (store action)

      // Tag the data as coming from an example (optional, but might be useful)
      if (example.data) {
          example.data.source = "example"; // Add a source flag
          if (!example.data.version) {
            example.data.version = "example";
          } else if (!example.data.version.includes("example")) {
            example.data.version += "-example";
          }
      }

      loadProject(example.data); // This function now calls the store's loadProjectData action
      setShowExamplesDialog(false);
    } else {
        console.error("Selected example data not found:", selectedExample);
        setError("Could not load the selected example.");
    }
  };

  if (!showExamplesDialog) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl max-w-3xl mx-auto w-full">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-800">Example Projects</h2>
          <button
            onClick={() => setShowExamplesDialog(false)}
            className="text-gray-500 hover:text-gray-700 focus:outline-none"
            aria-label="Close"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-10">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <span className="ml-3 text-lg text-gray-600">Loading examples...</span>
          </div>
        ) : error ? (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            <p>{error}</p>
          </div>
        ) : (
          <>
            <div className="mb-6">
              <p className="text-gray-600 mb-2">
                Select an example project to load. This will replace your current work.
              </p>
            </div>

            <div className="max-h-96 overflow-y-auto mb-6 border rounded-md">
              {examples.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No examples available.</p>
              ) : (
                <div className="divide-y divide-gray-200">
                  {examples.map(example => (
                    <div
                      key={example.id}
                      className={`p-4 cursor-pointer transition-colors ${
                        selectedExample === example.id
                          ? 'bg-blue-100'
                          : 'hover:bg-gray-50'
                      }`}
                      onClick={() => handleSelectExample(example)}
                    >
                      <h3 className="font-medium text-lg text-gray-800">{example.name}</h3>
                      <p className="text-gray-600 mt-1 text-sm">{example.description}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setShowExamplesDialog(false)}
                className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                onClick={handleLoadExample}
                disabled={!selectedExample}
                className={`px-4 py-2 rounded transition-colors ${
                  !selectedExample
                    ? 'bg-blue-300 text-white cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                Load Example
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ExamplesDialog;
