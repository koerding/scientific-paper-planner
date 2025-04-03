import React from 'react';

/**
 * Simplified header with inline styles to avoid CSS conflicts
 */
const SimpleHeader = ({
  resetProject,
  exportProject
}) => {
  const headerStyle = {
    padding: '1rem 0',
    marginBottom: '2rem',
    borderBottom: '1px solid #e5e7eb',
    width: '100%'
  };
  
  const containerStyle = {
    maxWidth: '1280px',
    marginLeft: 'auto',
    marginRight: 'auto',
    paddingLeft: '1rem',
    paddingRight: '1rem'
  };
  
  const flexContainerStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  };
  
  const logoContainerStyle = {
    display: 'flex',
    alignItems: 'center'
  };
  
  const logoStyle = {
    background: 'linear-gradient(to right, #4f46e5, #9333ea)',
    width: '2.5rem',
    height: '2.5rem',
    borderRadius: '0.5rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    fontWeight: 'bold',
    marginRight: '0.75rem'
  };
  
  const titleStyle = {
    fontSize: '1.5rem',
    fontWeight: 'bold'
  };
  
  const subtitleStyle = {
    fontSize: '0.875rem',
    color: '#4b5563'
  };
  
  const buttonContainerStyle = {
    display: 'flex',
    gap: '0.5rem'
  };
  
  const newButtonStyle = {
    display: 'flex',
    alignItems: 'center',
    padding: '0.5rem 1rem',
    border: '1px solid #ef4444',
    color: '#dc2626',
    borderRadius: '0.25rem',
    cursor: 'pointer'
  };
  
  const exportButtonStyle = {
    display: 'flex',
    alignItems: 'center',
    padding: '0.5rem 1rem',
    border: '1px solid #10b981',
    color: '#059669',
    borderRadius: '0.25rem',
    cursor: 'pointer'
  };
  
  const iconStyle = {
    width: '1.25rem',
    height: '1.25rem',
    marginRight: '0.25rem'
  };

  return (
    <header style={headerStyle}>
      <div style={containerStyle}>
        <div style={flexContainerStyle}>
          {/* App title and logo */}
          <div style={logoContainerStyle}>
            <div style={logoStyle}>SP</div>
            <div>
              <h1 style={titleStyle}>Scientific Paper Planner</h1>
              <p style={subtitleStyle}>
                Design a hypothesis-based neuroscience project step-by-step
              </p>
            </div>
          </div>
          
          {/* Action buttons */}
          <div style={buttonContainerStyle}>
            <button
              onClick={resetProject}
              style={newButtonStyle}
              title="Start a new project"
            >
              <svg xmlns="http://www.w3.org/2000/svg" style={iconStyle} viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              New
            </button>
            
            <button
              onClick={exportProject}
              style={exportButtonStyle}
              title="Export your project as a markdown file"
            >
              <svg xmlns="http://www.w3.org/2000/svg" style={iconStyle} viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
              Export
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default SimpleHeader;
