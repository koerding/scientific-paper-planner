// FILE: src/services/progressionStateService.js

/**
 * Service to manage the progression state of sections based on feedback scores
 * Controls which sections are visible/unlocked as the user progresses
 */

// Constants
const MINIMUM_SCORE_TO_UNLOCK = 6;
const LOCAL_STORAGE_KEY = 'section_progression_state';
const PRO_MODE_KEY = 'pro_mode_enabled';

// Initial progression state structure
const initialProgressionState = {
  // Basic state
  unlocked: {
    question: true, // Question is always unlocked by default
    approach_toggle: false,
    hypothesis: false,
    needsresearch: false,
    exploratoryresearch: false,
    audience: false,
    relatedpapers: false,
    data_toggle: false,
    experiment: false,
    existingdata: false,
    theorysimulation: false,
    analysis: false,
    process: false,
    abstract: false
  },
  // Score history
  scores: {},
  // Timestamps of when each section was unlocked
  unlockTimestamps: {
    question: Date.now()
  }
};

/**
 * Load the progression state from localStorage
 * @returns {Object} The current progression state
 */
export const getProgressionState = () => {
  try {
    const storedState = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (storedState) {
      return JSON.parse(storedState);
    }
  } catch (error) {
    console.error('Error loading progression state:', error);
  }
  
  // Return initial state if nothing stored
  return JSON.parse(JSON.stringify(initialProgressionState));
};

/**
 * Get Pro Mode enabled state
 * @returns {boolean} Whether Pro Mode is enabled
 */
export const isProModeEnabled = () => {
  try {
    return localStorage.getItem(PRO_MODE_KEY) === 'true';
  } catch (error) {
    console.error('Error checking Pro Mode state:', error);
    return false;
  }
};

/**
 * Set Pro Mode enabled state
 * @param {boolean} enabled - Whether Pro Mode should be enabled
 */
export const setProModeEnabled = (enabled) => {
  try {
    localStorage.setItem(PRO_MODE_KEY, enabled ? 'true' : 'false');
    
    // Dispatch event so components can react
    window.dispatchEvent(new CustomEvent('proModeChanged', { 
      detail: { enabled }
    }));
    
    console.log(`Pro Mode ${enabled ? 'enabled' : 'disabled'}`);
    return true;
  } catch (error) {
    console.error('Error setting Pro Mode state:', error);
    return false;
  }
};

/**
 * Toggle Pro Mode state
 * @returns {boolean} The new Pro Mode state
 */
export const toggleProMode = () => {
  const currentState = isProModeEnabled();
  setProModeEnabled(!currentState);
  return !currentState;
};

/**
 * Save progression state to localStorage
 * @param {Object} state - The progression state to save
 */
const saveProgressionState = (state) => {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(state));
    return true;
  } catch (error) {
    console.error('Error saving progression state:', error);
    return false;
  }
};

/**
 * Update a section's score and unlock subsequent sections if score is high enough
 * @param {string} sectionId - The ID of the section
 * @param {number} score - The score (1-10)
 * @returns {Object} Updated progression state
 */
export const updateSectionScore = (sectionId, score) => {
  const state = getProgressionState();
  const now = Date.now();
  
  // Update score
  if (!state.scores) state.scores = {};
  state.scores[sectionId] = score;
  
  // If score is high enough, unlock next content
  if (score >= MINIMUM_SCORE_TO_UNLOCK) {
    // Unlock based on section progression logic
    switch (sectionId) {
      case 'question':
        // Unlock approach toggle and approach sections
        state.unlocked.approach_toggle = true;
        state.unlocked.hypothesis = true;
        state.unlocked.needsresearch = true;
        state.unlocked.exploratoryresearch = true;
        state.unlocked.audience = true;
        
        // Record unlock timestamps
        if (!state.unlockTimestamps) state.unlockTimestamps = {};
        state.unlockTimestamps.approach_toggle = now;
        state.unlockTimestamps.hypothesis = now;
        state.unlockTimestamps.needsresearch = now;
        state.unlockTimestamps.exploratoryresearch = now;
        state.unlockTimestamps.audience = now;
        break;
        
      case 'hypothesis':
      case 'needsresearch':
      case 'exploratoryresearch':
        // Any of the approach sections will unlock related papers
        state.unlocked.relatedpapers = true;
        if (!state.unlockTimestamps) state.unlockTimestamps = {};
        state.unlockTimestamps.relatedpapers = now;
        break;
        
      case 'audience':
        // Audience also unlocks related papers
        state.unlocked.relatedpapers = true;
        if (!state.unlockTimestamps) state.unlockTimestamps = {};
        state.unlockTimestamps.relatedpapers = now;
        break;
        
      case 'relatedpapers':
        // Related papers unlocks data toggle and methods
        state.unlocked.data_toggle = true;
        state.unlocked.experiment = true;
        state.unlocked.existingdata = true;
        state.unlocked.theorysimulation = true;
        
        if (!state.unlockTimestamps) state.unlockTimestamps = {};
        state.unlockTimestamps.data_toggle = now;
        state.unlockTimestamps.experiment = now;
        state.unlockTimestamps.existingdata = now;
        state.unlockTimestamps.theorysimulation = now;
        break;
        
      case 'experiment':
      case 'existingdata':
      case 'theorysimulation':
        // Any data method unlocks analysis
        state.unlocked.analysis = true;
        if (!state.unlockTimestamps) state.unlockTimestamps = {};
        state.unlockTimestamps.analysis = now;
        break;
        
      case 'analysis':
        // Analysis unlocks process
        state.unlocked.process = true;
        if (!state.unlockTimestamps) state.unlockTimestamps = {};
        state.unlockTimestamps.process = now;
        break;
        
      case 'process':
        // Process unlocks abstract
        state.unlocked.abstract = true;
        if (!state.unlockTimestamps) state.unlockTimestamps = {};
        state.unlockTimestamps.abstract = now;
        break;
    }
  }
  
  // Save updated state
  saveProgressionState(state);
  
  // Dispatch event so components can react
  window.dispatchEvent(new CustomEvent('progressionStateChanged', { 
    detail: { 
      sectionId,
      score,
      state,
      unlocked: getUnlockedSections(state)
    }
  }));
  
  return state;
};

/**
 * Check if a section is unlocked
 * @param {string} sectionId - The section ID
 * @param {Object} state - Optional progression state (will load from storage if not provided)
 * @returns {boolean} Whether the section is unlocked
 */
export const isSectionUnlocked = (sectionId, state = null) => {
  // Pro Mode overrides section locking
  if (isProModeEnabled()) {
    return true;
  }
  
  const progressionState = state || getProgressionState();
  return progressionState.unlocked && progressionState.unlocked[sectionId] === true;
};

/**
 * Check if a toggle is unlocked
 * @param {string} toggleType - Either 'approach_toggle' or 'data_toggle'
 * @returns {boolean} Whether the toggle is unlocked
 */
export const isToggleUnlocked = (toggleType) => {
  // Pro Mode overrides toggle locking
  if (isProModeEnabled()) {
    return true;
  }
  
  const progressionState = getProgressionState();
  return progressionState.unlocked && progressionState.unlocked[toggleType] === true;
};

/**
 * Get all currently unlocked section IDs
 * @param {Object} state - Optional progression state (will load from storage if not provided)
 * @returns {Array<string>} Array of unlocked section IDs
 */
export const getUnlockedSections = (state = null) => {
  // Pro Mode means all sections are unlocked
  if (isProModeEnabled()) {
    return [
      'question',
      'hypothesis', 'needsresearch', 'exploratoryresearch',
      'audience', 'relatedpapers',
      'experiment', 'existingdata', 'theorysimulation',
      'analysis', 'process', 'abstract'
    ];
  }
  
  const progressionState = state || getProgressionState();
  if (!progressionState.unlocked) return ['question'];
  
  return Object.entries(progressionState.unlocked)
    .filter(([id, isUnlocked]) => isUnlocked && !id.includes('_toggle'))
    .map(([id]) => id);
};

/**
 * Reset progression state
 * @returns {Object} Initial progression state
 */
export const resetProgressionState = () => {
  const freshState = JSON.parse(JSON.stringify(initialProgressionState));
  saveProgressionState(freshState);
  
  // Dispatch event
  window.dispatchEvent(new CustomEvent('progressionStateReset'));
  
  return freshState;
};

// Listen for global reset events
if (typeof window !== 'undefined') {
  window.addEventListener('projectStateReset', () => {
    console.log('[progressionStateService] Detected global reset, resetting progression state');
    resetProgressionState();
  });
}
