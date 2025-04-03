import React, { useState, useEffect } from 'react';
import VerticalPaperPlannerApp from './VerticalPaperPlannerApp'; // Using your existing component
import sectionContent from '../../data/sectionContent.json';  
import { callOpenAI } from '../../services/openaiService';
import { exportProject as exportProjectFunction } from '../../utils/exportUtils';
import '../../styles/PaperPlanner.css';

/**
 * Main entry point for the Paper Planner
 * Contains core state management and API calls
 * UPDATED: Now ensures templates are pre-loaded
 */
const PaperPlannerApp = () => {
  // State - Pre-fill with templates from sectionContent
  const initialState = {};
  sectionContent.sections.forEach(section => {
    if (section && section.id) {
      // Use placeholder as initial content
      initialState[section.id] = section.placeholder || '';
    }
  });

  // Initialize states
  const [userInputs, setUserInputs] = useState(initialState);
  const [currentSection, setCurrentSection] = useState(sectionContent.sections[0].id);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [chatMessages, setChatMessages] = useState({});
  const [currentMessage, setCurrentMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  // Initialize chat messages for each section
  useEffect(() => {
    const initialChatMessages = {};
    sectionContent.sections.forEach(section => {
      initialChatMessages[section.id] = [];
    });
    setChatMessages(initialChatMessages);
  }, []);

  // Load saved data from localStorage
  useEffect(() => {
    try {
      const savedInputs = localStorage.getItem('paperPlannerData');
      const savedChat = localStorage.getItem('paperPlannerChat');
      
      if (savedInputs) {
        const parsedInputs = JSON.parse(savedInputs);
        // Make sure we're not overwriting templates with empty values
        const mergedInputs = {...initialState};
        
        // Only use saved values if they exist and are different from templates
        Object.keys(parsedInputs).forEach(sectionId => {
          if (parsedInputs[sectionId] && parsedInputs[sectionId].trim() !== '') {
            mergedInputs[sectionId] = parsedInputs[sectionId];
          }
        });
        
        setUserInputs(mergedInputs);
      }
      
      if (savedChat) {
        setChatMessages(JSON.parse(savedChat));
      }
    } catch (error) {
      console.error('Error loading saved data:', error);
    }
  }, []);

  // Save to localStorage when data changes
  useEffect(() => {
    try {
      localStorage.setItem('paperPlannerData', JSON.stringify(userInputs));
      localStorage.setItem('paperPlannerChat', JSON.stringify(chatMessages));
    } catch (error) {
      console.error('Error saving data:', error);
    }
  }, [userInputs, chatMessages]);

  // Handler functions
  const handleSectionChange = (sectionId) => {
    setCurrentSection(sectionId);
    setCurrentIndex(sectionContent.sections.findIndex(s => s.id === sectionId));
