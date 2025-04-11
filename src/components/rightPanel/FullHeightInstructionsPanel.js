// Update just the tooltip CSS part of FullHeightInstructionsPanel.js

// UPDATED: Tooltip styling with significantly increased width
const tooltipCssStyles = `
/* Tooltip styling */
.tooltip-container {
  position: relative;
  display: inline-block;
  cursor: help;
  margin: 0 2px;
  vertical-align: middle;
}

.info-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background-color: #EEF2FF;
  color: #4F46E5;
  font-size: 12px;
  font-weight: bold;
  vertical-align: middle;
}

/* FIXED: Much wider tooltip to fit all text */
.tooltip {
  visibility: hidden;
  position: absolute;
  width: 650px;
  max-width: 90%;
  background-color: #1F2937;
  color: white;
  text-align: left;
  padding: 10px 14px;
  border-radius: 6px;
  z-index: 1000;
  bottom: 125%;
  left: 0;
  transform: translateX(0);
  opacity: 0;
  transition: opacity 0.3s;
  font-size: 0.875rem;
  line-height: 1.5;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

/* Show tooltip on hover */
.tooltip-container:hover .tooltip {
  visibility: visible;
  opacity: 1;
}

.tooltip-arrow {
  position: absolute;
  top: 100%;
  left: 10px;
  border-width: 5px;
  border-style: solid;
  border-color: #1F2937 transparent transparent transparent;
}

/* FIXED: Make sure tooltips within strikethrough text remain visible */
.instructions-content .line-through .tooltip-container,
.instructions-content del .tooltip-container {
  display: inline-block !important;
  opacity: 1 !important;
  text-decoration: none !important;
}

.instructions-content .line-through .tooltip-container .info-icon,
.instructions-content del .tooltip-container .info-icon {
  opacity: 0.8 !important;
  background-color: #F3F4F6 !important;
  color: #6B7280 !important;
}
`;
