// FILE: src/components/PaperPlanner/ConfirmDialog.js

import React, { useEffect } from 'react';
import useAppStore from '../../store/appStore';

/**
 * Enhanced Confirmation dialog that handles both regular resets and import confirmations
 * COMPLETELY FIXED: Absolute positioning with ultra-high z-index to cover ALL UI elements
 */
const ConfirmDialog = ({ showConfirmDialog, setShowConfirmDialog, resetProject }) => {
  // Get the import confirmation operation from the store
  const importConfirmOperation = useAppStore((state) => state._importConfirmOperation);
  
  // Determine if this is an import confirmation
  const isImportConfirm = importConfirmOperation?.active === true;
  
  // Get the message to display
  const message = isImportConfirm 
    ? (importConfirmOperation.message || "Are you sure you want to continue?")
    : "Are you sure you want to start a new project? All current progress will be lost.";
  
  // The title text
  const title = isImportConfirm ? "Confirm Import" : "Confirm New Project";
  
  // The confirm button text
  const confirmText = isImportConfirm ? "Yes, continue" : "Yes, start new";

  // Handle confirm button click
  const handleConfirm = () => {
    if (isImportConfirm) {
      // This is an import confirmation, resolve the promise
      if (typeof window._importConfirmResolve === 'function') {
        window._importConfirmResolve(true); // Resolve with true
        
        // Clear the import confirmation operation
        useAppStore.setState({
          _importConfirmOperation: {
            active: false,
            message: null
          }
        });
      }
    } else {
      // This is a regular reset confirmation
      if (typeof resetProject === 'function') {
        resetProject();
      } else {
        console.error("ConfirmDialog: resetProject prop function is missing!");
      }
    }
    
    // Close the dialog
    if (typeof setShowConfirmDialog === 'function') {
      setShowConfirmDialog(false);
    }
  };
  
  // Handle cancel button click
  const handleCancel = () => {
    if (isImportConfirm) {
      // This is an import confirmation, resolve the promise with false
      if (typeof window._importConfirmResolve === 'function') {
        window._importConfirmResolve(false); // Resolve with false
        
        // Clear the import confirmation operation
        useAppStore.setState({
          _importConfirmOperation: {
            active: false,
            message: null
          }
        });
      }
    }
    
    // Close the dialog
    if (typeof setShowConfirmDialog === 'function') {
      setShowConfirmDialog(false);
    }
  };

  // Prevent body scrolling when dialog is open
  useEffect(() => {
    if (showConfirmDialog) {
      // Save the current overflow style
      const originalStyle = document.body.style.cssText;
      // Disable scrolling on the body AND prevent interactions
      document.body.style.overflow = 'hidden';
      document.body.style.pointerEvents = 'none';
      
      return () => {
        // Restore original style when component unmounts or dialog closes
        document.body.style.cssText = originalStyle;
      };
    }
  }, [showConfirmDialog]);

  if (!showConfirmDialog) {
    return null; // Don't render if not showing
  }

  const overlayStyle = {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 99999
  };

  // Create a portal element outside of normal DOM hierarchy
  const portalEl = document.createElement('div');
  portalEl.setAttribute('class', 'modal-portal');
  portalEl.setAttribute('style', 'position:fixed; top:0; left:0; right:0; bottom:0; width:100vw; height:100vh; z-index:99999;');
  document.body.appendChild(portalEl);

  // Remove the portal element when dialog is closed
  useEffect(() => {
    return () => {
      if (portalEl && portalEl.parentNode) {
        portalEl.parentNode.removeChild(portalEl);
      }
    };
  }, []);

  // Render the dialog directly in the body
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      width: '100vw',
      height: '100vh',
      background: 'rgba(0, 0, 0, 0.75)',
      backdropFilter: 'blur(2px)',
      zIndex: 999999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      pointerEvents: 'auto' // Enable pointer events on the dialog
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '0.5rem',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        padding: '1.5rem',
        width: '90%',
        maxWidth: '28rem',
        position: 'relative',
        pointerEvents: 'auto' // Ensure pointer events work on the modal
      }}>
        <h3 className="text-xl font-bold mb-4 text-gray-800">{title}</h3>
        <p className="mb-6 text-gray-600">
          {message}
        </p>
        <div className="flex justify-end space-x-4">
          <button
            onClick={handleCancel}
            className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
