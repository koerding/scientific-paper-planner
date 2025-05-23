// FILE: src/logic/progressionLogic.js
import sectionContent from '../data/sectionContent.json'; // Adjust path as needed
import { getApproachSectionIds, getDataMethodSectionIds } from '../utils/sectionOrderUtils'; // Adjust path as needed

const MINIMUM_SCORE_TO_UNLOCK = 6;

/**
 * Calculates which sections and toggles should be unlocked based on scores.
 * This logic is extracted from the previous progressionStateService.
 *
 * @param {Object} scores - Object mapping section IDs to their scores (e.g., { question: 7, hypothesis: 5 })
 * @param {Object} activeToggles - Current active toggles (e.g., { approach: 'hypothesis', dataMethod: 'experiment' })
 * @returns {{ unlockedSections: string[], unlockedToggles: string[] }} - Arrays of unlocked section and toggle IDs.
 */
export const calculateUnlockedSections = (scores = {}, activeToggles = {}) => {
  const unlockedSectionsSet = new Set(['question']); // Start with 'question'
  const unlockedTogglesSet = new Set();
  const approachIds = getApproachSectionIds();
  const dataMethodIds = getDataMethodSectionIds();

  const checkAndUnlock = (requiredSectionId, scoreThreshold, unlockTargets) => {
    if (scores[requiredSectionId] >= scoreThreshold) {
      unlockTargets.forEach(target => {
        if (target.includes('_toggle')) {
          unlockedTogglesSet.add(target);
        } else {
          unlockedSectionsSet.add(target);
        }
      });
    }
  };

  // Unlock logic based on section completion scores
  checkAndUnlock('question', MINIMUM_SCORE_TO_UNLOCK, ['approach_toggle', ...approachIds]);

  // Unlock based on the *active* approach section
  const activeApproachId = activeToggles?.approach;
  if (activeApproachId && approachIds.includes(activeApproachId)) {
     checkAndUnlock(activeApproachId, MINIMUM_SCORE_TO_UNLOCK, ['audience']);
  }

  checkAndUnlock('audience', MINIMUM_SCORE_TO_UNLOCK, ['relatedpapers']);
  checkAndUnlock('relatedpapers', MINIMUM_SCORE_TO_UNLOCK, ['data_toggle', ...dataMethodIds]);

  // Unlock based on the *active* data method section
  const activeDataMethodId = activeToggles?.dataMethod;
   if (activeDataMethodId && dataMethodIds.includes(activeDataMethodId)) {
      checkAndUnlock(activeDataMethodId, MINIMUM_SCORE_TO_UNLOCK, ['analysis']);
   }

  checkAndUnlock('analysis', MINIMUM_SCORE_TO_UNLOCK, ['process']);
  checkAndUnlock('process', MINIMUM_SCORE_TO_UNLOCK, ['abstract']);

  return {
    unlockedSections: Array.from(unlockedSectionsSet),
    unlockedToggles: Array.from(unlockedTogglesSet),
  };
};

/**
 * Determines the visibility of a specific section based on the current state.
 * @param {string} sectionId - The ID of the section to check.
 * @param {Object} state - The current Zustand store state (needs sections, activeToggles, scores, proMode).
 * @returns {boolean} - True if the section should be visible.
 */
export const isSectionVisible = (sectionId, state) => {
  if (!state || !state.sections || !state.activeToggles || !state.scores) {
    return sectionId === 'question'; // Default safe visibility
  }

  const { sections, activeToggles, scores, proMode } = state;

  // Pro mode overrides all visibility rules
  if (proMode) {
    return true;
  }

  // Check progression
  const { unlockedSections } = calculateUnlockedSections(scores, activeToggles);
  if (!unlockedSections.includes(sectionId)) {
    return false;
  }

  // Check toggles
  const sectionDef = sectionContent.sections.find(s => s.id === sectionId);
  if (sectionDef?.category === 'approach' && sectionId !== activeToggles.approach) {
      return false;
  }
  if (sectionDef?.category === 'dataMethod' && sectionId !== activeToggles.dataMethod) {
      return false;
  }

  // If progression and toggles allow, it's visible
  return true;
};

/**
 * Determines if a toggle group is unlocked.
 * @param {string} toggleKey - 'approach' or 'dataMethod'.
 * @param {Object} state - The current Zustand store state.
 * @returns {boolean} - True if the toggle group is unlocked.
 */
export const isToggleVisible = (toggleKey, state) => {
    if (!state || !state.scores || !state.activeToggles) {
        return false;
    }
     if (state.proMode) {
        return true;
    }
    const { unlockedToggles } = calculateUnlockedSections(state.scores, state.activeToggles);
    return unlockedToggles.includes(`${toggleKey}_toggle`);
};
