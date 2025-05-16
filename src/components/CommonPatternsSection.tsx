// src/components/CommonPatternsSection.tsx

import React, { useState } from 'react';
import PatternCard from './PatternCard';
import { CommonPatternType, CommonPatternConfig, MultisigTimeoutConfig, VaultConfig, InheritanceConfig, SimpleEscrowConfig } from '../types'; // Import specific config types
import MultisigTimeoutConfigurator from './configurators/MultisigTimeoutConfigurator';
import VaultConfigurator from './configurators/VaultConfigurator';
import InheritanceConfigurator from './configurators/InheritanceConfigurator';
import EscrowConfigurator from './configurators/EscrowConfigurator';
import { generateCommonPatternPolicyString, updatePolicyValidation } from '../utils';

interface CommonPatternsSectionProps {
  onAddPolicy: (policy: CommonPatternConfig) => void;
}

const commonPatterns = [
  { type: CommonPatternType.MultisigTimeout, name: 'Multisig with Timeout', description: 'Require multiple signatures, or a single key after a delay.' },
  { type: CommonPatternType.Vault, name: 'Vault (Delay + Cancel)', description: 'Withdrawal requires a delay; a different key can cancel during the delay.' },
  { type: CommonPatternType.Inheritance, name: 'Inheritance Scheme', description: 'Owner can spend, or heirs/third-party can spend after timelocks.' },
  { type: CommonPatternType.SimpleEscrow, name: 'Simple Escrow', description: 'Requires two parties, or an arbiter after a timeout.' },
];

const CommonPatternsSection: React.FC<CommonPatternsSectionProps> = ({ onAddPolicy }) => {
  const [selectedPattern, setSelectedPattern] = useState<CommonPatternType | null>(null);
   const [currentConfig, setCurrentConfig] = useState<CommonPatternConfig | null>(null);


  const handleSelectPattern = (type: CommonPatternType) => {
    // Toggle selection - if clicking the already selected card, deselect
    const newlySelectedType = type === selectedPattern ? null : type;
    setSelectedPattern(newlySelectedType);

    // Reset config when selecting a new pattern or deselecting
    setCurrentConfig(null);
  };

  const handleConfigChange = (config: CommonPatternConfig) => {
     setCurrentConfig(config);
     // Note: We don't generate/validate here, only when 'Add Policy' is clicked
  };

  const handleAddPolicyFromConfig = (config: CommonPatternConfig) => {
     // Generate the policy string from the config
     const policyString = generateCommonPatternPolicyString(config);

     // Create the policy object with the generated string (if successful)
     const policyToAdd = {
         ...config,
         policyString: policyString,
     };

     // Validate the generated policy string
     const validatedPolicy = updatePolicyValidation(policyToAdd);

     // Add the validated policy to the main list
     onAddPolicy(validatedPolicy as CommonPatternConfig);

     // Reset the form/selection after adding
     setSelectedPattern(null);
     setCurrentConfig(null);
  };

   // Helper to render the appropriate configurator component JSX
  const renderConfiguratorComponent = (type: CommonPatternType) => {
      // Pass the currentConfig state and the add policy callback
      switch (type) {
        case CommonPatternType.MultisigTimeout:
          return <MultisigTimeoutConfigurator initialConfig={currentConfig as MultisigTimeoutConfig | undefined} onConfigChange={handleConfigChange} onAddPolicy={handleAddPolicyFromConfig} />;
        case CommonPatternType.Vault:
          return <VaultConfigurator initialConfig={currentConfig as VaultConfig | undefined} onConfigChange={handleConfigChange} onAddPolicy={handleAddPolicyFromConfig} />;
        case CommonPatternType.Inheritance:
          return <InheritanceConfigurator initialConfig={currentConfig as InheritanceConfig | undefined} onConfigChange={handleConfigChange} onAddPolicy={handleAddPolicyFromConfig} />;
        case CommonPatternType.SimpleEscrow:
          return <EscrowConfigurator initialConfig={currentConfig as SimpleEscrowConfig | undefined} onConfigChange={handleConfigChange} onAddPolicy={handleAddPolicyFromConfig} />;
        default:
          return null;
      }
  };


  return (
    <section className="mb-8">
      {/* Added text-gray-900 */}
      <h2 className="text-xl font-bold mb-4 text-gray-900">1. Choose a Common Spending Pattern</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4"> {/* Keep the grid container */}
        {commonPatterns.map((pattern) => (
          // For each pattern, render a container that either holds the collapsed card
          // or the expanded card and its configurator, spanning columns.
          <React.Fragment key={pattern.type}>
              {selectedPattern === pattern.type ? (
                  // If this pattern is selected, render the expanded content spanning columns
                  <div className="md:col-span-2"> {/* Spans 2 columns on medium screens and up */}
                      <PatternCard
                          type={pattern.type}
                          name={pattern.name}
                          description={pattern.description}
                          isSelected={true} // This card is selected
                          onSelect={handleSelectPattern}
                          configuratorContent={renderConfiguratorComponent(pattern.type)} // Pass the configurator
                      />
                  </div>
              ) : (
                  // If this pattern is NOT selected, render just the card in its normal grid cell
                   <PatternCard
                      type={pattern.type}
                      name={pattern.name}
                      description={pattern.description}
                      isSelected={false} // This card is not selected
                      onSelect={handleSelectPattern}
                      configuratorContent={undefined} // No configurator here
                  />
              )}
          </React.Fragment>
        ))}
      </div>
    </section>
  );
};

export default CommonPatternsSection;