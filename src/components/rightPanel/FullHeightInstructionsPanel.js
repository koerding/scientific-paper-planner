import React, { useEffect } from 'react';
import ReactMarkdown from 'react-markdown';

/**
 * Simplified instructions panel that directly renders content from the JSON structure
 */
const FullHeightInstructionsPanel = ({ currentSection }) => {
  useEffect(() => {
    // Debug logging to help diagnose instruction content issues
    if (currentSection) {
      console.log("[PANEL] Current section data:", currentSection);
      console.log("[PANEL] Instructions text:", currentSection?.instructions?.text);
      console.log("[PANEL] Feedback text:", currentSection?.instructions?.feedback);
    }
  }, [currentSection]);

  // Create a title that includes the section name
  const sectionTitle = currentSection?.title || "Instructions";
  const panelTitle = `${sectionTitle} Instructions & Feedback`;

  // Safely access instruction and feedback text
  const instructionsText = currentSection?.instructions?.text || '';
  const feedbackText = currentSection?.instructions?.feedback || '';

  return (
    <div
      className="bg-blue-50 h-full overflow-y-auto section-instruction-panel"
      style={{
        position: 'fixed',
        top: 0,
        right: 0,
        width: '50%',
        paddingTop: '120px', // Adjusted for header height
        paddingBottom: '2rem',
        zIndex: 10, // Ensure it's below header buttons if they overlap
      }}
    >
      <div className="px-6 py-4 relative">
        {!currentSection ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-blue-600 text-xl">Select a section to view instructions</p>
          </div>
        ) : (
          <>
            <h3 className="text-3xl font-semibold text-blue-800 mb-4">
              {panelTitle}
            </h3>

            {/* Instructions panel */}
            <div className="border-4 border-blue-600 rounded-lg bg-white p-5 mb-6">
              <div className="text-xl leading-relaxed">
                <ReactMarkdown
                  components={{
                    // Make strong elements (bold) into section titles
                    strong: ({ node, ...props }) => (
                      <div className="text-2xl font-bold text-blue-800 mb-2">
                        <strong {...props} />
                      </div>
                    ),
                    // Regular paragraphs with proper spacing
                    p: ({ node, ...props }) => <div className="mb-5" {...props} />,
                    // List items with proper spacing
                    li: ({ node, ...props }) => <li className="mb-3" {...props} />
                  }}
                >
                  {instructionsText}
                </ReactMarkdown>
              </div>
            </div>

            {/* Feedback section if it exists */}
            {feedbackText && feedbackText.length > 5 && (
              <div className="mt-6 pt-4 border-t border-blue-300">
                <h4 className="text-2xl font-semibold text-blue-700 mb-3">Feedback</h4>
                <div className="border-4 border-blue-500 rounded-lg bg-white p-5">
                  <div className="text-xl leading-relaxed">
                    <ReactMarkdown>
                      {feedbackText}
                    </ReactMarkdown>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default FullHeightInstructionsPanel;
