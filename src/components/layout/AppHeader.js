import React from 'react';

/**
 * Application header with simplified navigation and fixed buttons
 * Using inline styles to ensure button visibility
 */
const AppHeader = ({
  activeSection,
  setActiveSection,
  handleSectionChange,
  scrollToSection,
  resetProject,
  exportProject
}) => {
  // Using inline styles to force button visibility
  const headerStyle = {
    padding: '1rem 0',
    marginBottom: '2rem',
    borderBottom: '1px solid #e5e7eb',
    width: '100%'
  };

  const containerStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    maxWidth: '1280px',
    margin: '0 auto',
    padding: '0 1rem'
  };

  const logoContainerStyle = {
    display: 'flex',
    alignItems: 'center'
  };

  const logoStyle = {
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
  };

  const titleContainerStyle = {
    display: 'flex',
    flexDirection: 'column'
  };

  const titleStyle = {
    fontSize: '1.5rem',
    fontWeight: 'bold',
    margin: 0
  };

  const subtitleStyle = {
    fontSize: '0.875rem',
    color: '#6b7280',
    margin: 0
  };

  const buttonContainerStyle = {
    display: 'flex',
    gap: '8px'
  };

  const newButtonStyle = {
    display: 'flex',
    alignItems: 'center',
    padding: '0.5rem 1rem',
    border: '1px solid #ef4444',
    color: '#dc2626',
    borderRadius: '0.25rem',
    cursor: 'pointer',
    backgroundColor: 'white'
  };

  const exportButtonStyle = {
    display: 'flex',
    alignItems: 'center',
    padding: '0.5rem 1rem',
    border: '1px solid #10b981',
    color: '#059669',
    borderRadius: '0.25rem',
    cursor: 'pointer',
    backgroundColor: 'white'
  };

  return (
    <header style={headerStyle}>
      <div style={containerStyle}>
        {/* App title and logo */}
        <div style={logoContainerStyle}>
          <div style={logoStyle}>
            SP
          </div>
          <div style={titleContainerStyle}>
            <h1 style={titleStyle}>Scientific Paper Planner</h1>
            <p style={subtitleStyle}>
              Design a hypothesis-based neuroscience project step-by-step
            </p>
          </div>
        </div>
        
        {/* Action buttons with inline styles to ensure visibility */}
        <div style={buttonContainerStyle}>
          <button
            onClick={resetProject}
            style={newButtonStyle}
            title="Start a new project"
          >
            <span style={{ marginRight: '4px', fontSize: '1.2rem' }}>+</span>
            <span>New</span>
          </button>
          
          <button
            onClick={exportProject}
            style={exportButtonStyle}
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
