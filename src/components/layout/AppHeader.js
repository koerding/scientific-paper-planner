import React from 'react';

/**
 * Application header with absolute positioning to ensure buttons are visible
 */
const AppHeader = ({
  activeSection,
  setActiveSection,
  handleSectionChange,
  scrollToSection,
  resetProject,
  exportProject
}) => {
  return (
    <header style={{
      position: 'relative',
      width: '100%',
      padding: '1rem 0',
      marginBottom: '2rem',
      borderBottom: '1px solid #e5e7eb',
      backgroundColor: 'white',
      zIndex: 1000 // Higher than any other elements
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        maxWidth: '1280px',
        margin: '0 auto',
        padding: '0 1rem'
      }}>
        {/* App title and logo */}
        <div style={{
          display: 'flex',
          alignItems: 'center'
        }}>
          <div style={{
            background: 'linear-gradient(to right, #4f46e5, #9333ea)',
            width: '40px',
            height: '40px',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontWeight: 'bold',
            marginRight: '12px'
          }}>
            SP
          </div>
          <div>
            <h1 style={{
              fontSize: '1.5rem',
              fontWeight: 'bold',
              margin: 0
            }}>Scientific Paper Planner</h1>
            <p style={{
              fontSize: '0.875rem',
              color: '#6b7280',
              margin: 0
            }}>
              Design a hypothesis-based neuroscience project step-by-step
            </p>
          </div>
        </div>
        
        {/* Floating action buttons - positioned absolutely to ensure visibility */}
        <div style={{
          position: 'absolute',
          top: '15px',
          right: '15px',
          display: 'flex',
          gap: '8px',
          zIndex: 1001 // Even higher than header
        }}>
          <button
            onClick={resetProject}
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '0.5rem 1rem',
              border: '1px solid #ef4444',
              color: '#dc2626',
              borderRadius: '0.25rem',
              cursor: 'pointer',
              backgroundColor: 'white',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              zIndex: 1002
            }}
            title="Start a new project"
          >
            <span style={{ marginRight: '4px', fontSize: '1.2rem' }}>+</span>
            <span>New</span>
          </button>
          
          <button
            onClick={exportProject}
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '0.5rem 1rem',
              border: '1px solid #10b981',
              color: '#059669',
              borderRadius: '0.25rem',
              cursor: 'pointer',
              backgroundColor: 'white',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              zIndex: 1002
            }}
            title="Export your project as a markdown file"
          >
            <span style={{ marginRight: '4px', fontSize: '1.2rem' }}>↓</span>
            <span>Export</span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default AppHeader;
