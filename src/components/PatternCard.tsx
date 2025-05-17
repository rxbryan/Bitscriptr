import React from 'react';
import { CommonPatternType } from '../types';
import { Wallet, Hourglass, GitBranch, Briefcase } from 'lucide-react'; // Example icons

interface PatternCardProps {
  type: CommonPatternType;
  name: string;
  description: string;
  isSelected: boolean;
  onSelect: (type: CommonPatternType | null) => void; // Modified to accept null for closing
  configuratorContent?: React.ReactNode; // Prop to receive configurator JSX
}

const iconMap = {
  [CommonPatternType.MultisigTimeout]: Wallet,
  [CommonPatternType.Vault]: Hourglass,
  [CommonPatternType.Inheritance]: GitBranch,
  [CommonPatternType.SimpleEscrow]: Briefcase,
};

const PatternCard: React.FC<PatternCardProps> = ({
  type,
  name,
  description,
  isSelected,
  onSelect,
  configuratorContent,
}) => {
  const Icon = iconMap[type];

  const handleCardClick = () => {
      if (!isSelected) {
          // Only open if not already selected
          onSelect(type);
      }
      // If already selected, clicks on the main div outside the header do nothing
  };

  const handleHeaderClick = (event: React.MouseEvent) => {
      if (isSelected) {
          // Only close if already selected
          event.stopPropagation(); // Prevent click from bubbling to the outer div
          onSelect(null); // Deselect/Close
      }
      // If not selected, the click on the header will fall through to the outer div handler
  };

  return (
    <div
      className={`rounded-lg border p-4 shadow-sm transition-all duration-300 ease-in-out
        ${isSelected ? 'border-blue-500 ring-2 ring-blue-500' : 'border-gray-200 hover:border-gray-300 cursor-pointer'}
        bg-white flex flex-col`}
      onClick={handleCardClick} // Handle clicks anywhere on the card when NOT selected
    >
      {/* This div is the clickable header */}
      <div
         className={`flex items-center mb-2 ${isSelected ? 'pb-4 border-b border-gray-200 cursor-pointer' : ''}`}
         onClick={handleHeaderClick} // Handle clicks on the header when IS selected
      >
        {Icon && <Icon size={24} className={`mr-3 ${isSelected ? 'text-blue-600' : 'text-gray-500'}`} />}
        <h3 className={`text-lg font-semibold ${isSelected ? 'text-blue-600' : 'text-gray-800'}`}>{name}</h3>
      </div>
      {!isSelected && <p className="text-sm text-gray-600 flex-grow">{description}</p>} {/* Show description only when not selected */}

      {/* Render the configurator content if selected - this is NOT part of the header clickable area */}
      {isSelected && (
          <div className="mt-4 w-full">
              {configuratorContent}
          </div>
      )}
    </div>
  );
};

export default PatternCard;