// src/components/sections/HeaderCard.js
// MODIFIED: Updated descriptive text as requested by user.
import React from 'react';

const HeaderCard = () => {
  return (
    <div className="bg-white rounded-md border-2 border-gray-200 p-3 mb-4 shadow-sm">
      <h1 className="text-2xl font-bold text-gray-800 mb-1">Scientific Project Plan</h1>
      {/* Updated the text below */}
      <p className="text-sm text-gray-600">
        Science is Hard. Plan early, or work much harder later. <strong className="font-bold">Fill the sections one by one, Konrad promises you the project will be better and the paper published faster. It is normal for this to take hours to days.</strong>
      </p>
    </div>
  );
};

export default HeaderCard;
