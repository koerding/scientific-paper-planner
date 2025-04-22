// FILE: src/components/sections/SectionPreview.js
import React from 'react';
import { getPreviewText } from '../../utils/sectionUtils';

const SectionPreview = ({ textValue }) => {
  return (
    <div className="text-sm text-gray-500 overflow-hidden whitespace-nowrap overflow-ellipsis">
      {getPreviewText(textValue)}
    </div>
  );
};

export default SectionPreview;
