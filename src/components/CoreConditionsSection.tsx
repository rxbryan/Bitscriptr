import React, { useState } from 'react';
import ConditionCard from './ConditionCard';
import { CoreConditionType, CoreConditionConfig } from '../types';
import CoreConditionConfigurator from './configurators/CoreConditionConfigurator';
import { generateCoreConditionPolicyString, updatePolicyValidation } from '../utils';

interface CoreConditionsSectionProps {
  onAddPolicy: (policy: CoreConditionConfig) => void;
}

const coreConditions = [
  { type: CoreConditionType.SingleSig, name: 'Single Signature', description: 'Funds can be spent with a single public key.' },
  { type: CoreConditionType.MultiSig, name: 'Multisignature', description: 'Requires M signatures out of N keys.' },
  { type: CoreConditionType.Threshold, name: 'Threshold', description: 'Requires M of N different conditions or keys.' },
  { type: CoreConditionType.AbsoluteTimelock, name: 'Absolute Timelock', description: 'Funds can only be spent after a specific time (timestamp or block height).' },
  { type: CoreConditionType.RelativeTimelock, name: 'Relative Timelock', description: 'Funds can only be spent after a certain number of blocks have passed since the UTXO was confirmed.' },
  { type: CoreConditionType.Hashlock, name: 'Hashlock', description: 'Funds can only be spent if the preimage of a hash is revealed.' },
];

const CoreConditionsSection: React.FC<CoreConditionsSectionProps> = ({ onAddPolicy }) => {
  const [selectedCondition, setSelectedCondition] = useState<CoreConditionType | null>(null);
  const [currentConfig, setCurrentConfig] = useState<CoreConditionConfig | null>(null);


  const handleSelectCondition = (type: CoreConditionType | null) => {
    // Toggle selection
    const newlySelectedType = type === selectedCondition ? null : type;
    setSelectedCondition(newlySelectedType);
    setCurrentConfig(null); // Reset config
  };

   const handleConfigChange = (config: CoreConditionConfig) => {
    setCurrentConfig(config);
  };

   const handleAddPolicyFromConfig = (config: CoreConditionConfig) => {
     // Generate the policy string from the config
     const policyString = generateCoreConditionPolicyString(config);

     // Create the policy object with the generated string (if successful)
     const policyToAdd = {
         ...config,
         policyString: policyString,
     };

     // Validate the generated policy string
     const validatedPolicy = updatePolicyValidation(policyToAdd);

     // Add the validated policy to the main list
     onAddPolicy(validatedPolicy as CoreConditionConfig);

     // Reset the form/selection after adding
     setSelectedCondition(null);
     setCurrentConfig(null);
  };


  // Helper to render the appropriate configurator component JSX
  const renderConfiguratorComponent = (type: CoreConditionType) => {
      // Pass the currentConfig state and the add policy callback
      return (
          <CoreConditionConfigurator
               conditionType={type} // Pass the type to the configurator
               initialConfig={currentConfig}
               onConfigChange={handleConfigChange}
               onAddPolicy={handleAddPolicyFromConfig}
           />
      );
  };


  return (
    <section className="mb-8">
      {/* Added text-gray-900 */}
      <h2 className="text-xl font-bold mb-4 text-gray-900">2. Compose Policy with Core Conditions</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"> {/* Keep the grid container */}
        {coreConditions.map((condition) => (
            // For each condition, render a container that either holds the collapsed card
            // or the expanded card and its configurator, spanning columns.
           <React.Fragment key={condition.type}>
               {selectedCondition === condition.type ? (
                    // If this condition is selected, render the expanded content spanning columns
                    <div className="md:col-span-2 lg:col-span-3"> {/* Spans full width */}
                         <ConditionCard
                              type={condition.type}
                              name={condition.name}
                              description={condition.description}
                              isSelected={true} // This card is selected
                              onSelect={handleSelectCondition}
                              configuratorContent={renderConfiguratorComponent(condition.type)} // Pass the configurator
                          />
                    </div>
               ) : (
                   // If this condition is NOT selected, render just the card in its normal grid cell
                    <ConditionCard
                        type={condition.type}
                        name={condition.name}
                        description={condition.description}
                        isSelected={false} // This card is not selected
                        onSelect={handleSelectCondition}
                        configuratorContent={undefined} // No configurator here
                    />
               )}
           </React.Fragment>
        ))}
      </div>
    </section>
  );
};

export default CoreConditionsSection;