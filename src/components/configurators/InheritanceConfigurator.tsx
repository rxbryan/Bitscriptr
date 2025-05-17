// src/components/configurators/InheritanceConfigurator.tsx

import React, { useState, useEffect } from 'react';
import { InheritanceConfig } from '../../types'; // Only import types from types.ts
import { generateUniqueId as utilGenerateUniqueId } from '../../utils'; // Correct import path for generateUniqueId
import { PlusCircle, MinusCircle } from 'lucide-react';

interface InheritanceConfiguratorProps {
  initialConfig?: InheritanceConfig;
  onConfigChange: (config: InheritanceConfig) => void;
  onAddPolicy: (config: InheritanceConfig) => void;
}

const InheritanceConfigurator: React.FC<InheritanceConfiguratorProps> = ({
  initialConfig,
  onConfigChange,
  onAddPolicy,
}) => {
  const [config, setConfig] = useState<InheritanceConfig>(
    initialConfig || {
       // Use utilGenerateUniqueId from utils
      id: utilGenerateUniqueId('inheritance'),
      name: 'Inheritance Scheme',
      type: 'inheritance',
      ownerKey: '',
      heirsKeys: ['', ''], // Start with 2 heir key inputs
      heirsThreshold: 1,
      timelock1: 525960, // Example: ~1 year in blocks (assuming 144 blocks/day * 365 days)
      thirdPartyKey: '',
      timelock2: 592580, // Example: ~1 year 3 months
    }
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
     setConfig({ ...config, [name]: name === 'heirsThreshold' || name === 'timelock1' || name === 'timelock2' ? parseInt(value, 10) || 0 : value });
  };

   const handleHeirKeyChange = (index: number, value: string) => {
    const newKeys = [...config.heirsKeys];
    newKeys[index] = value;
    setConfig({ ...config, heirsKeys: newKeys });
   };

   const addHeirKeyInput = () => {
       setConfig(prev => ({ ...prev, heirsKeys: [...prev.heirsKeys, ''] }));
   };

   const removeHeirKeyInput = (index: number) => {
       if (config.heirsKeys.length > 1) {
           const newKeys = config.heirsKeys.filter((_, i) => i !== index);
           setConfig(prev => ({ ...prev, heirsKeys: newKeys, heirsThreshold: Math.min(prev.heirsThreshold, newKeys.length) }));
       } else {
           alert('You must have at least one heir key.');
       }
   };


  const handleAdd = () => {
    // Add basic validation
    if (!config.ownerKey || config.heirsKeys.some(key => !key) || config.heirsThreshold < 1 || config.heirsThreshold > config.heirsKeys.length || config.timelock1 <= 0 || !config.thirdPartyKey || config.timelock2 <= 0 || config.timelock2 <= config.timelock1) {
      // Updated validation message slightly
      alert('Please fill in all required fields correctly: Owner Key, all Heirs Keys, valid Heirs Threshold (>=1 and <= total heirs), Timelock 1 (>0), Third Party Key, and Timelock 2 (> Timelock 1).');
      return;
    }
    onAddPolicy(config);
  };

   // Notify parent of config changes whenever config state updates
   useEffect(() => {
    onConfigChange(config);
  }, [config, onConfigChange]);


  return (
    // Removed border, padding, margin bottom from this root div
    <div className="rounded-md bg-gray-50 p-4"> {/* Added padding back here */}
      {/* Added text-gray-700 */}
      <h3 className="text-lg font-semibold mb-2 text-gray-700">Inheritance Scheme Configuration</h3>
       <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700">Owner's Key</label>
          <input
            type="text"
            name="ownerKey"
            value={config.ownerKey}
            onChange={handleChange}
            placeholder="Owner's Public Key"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm text-gray-600 placeholder-gray-500" // Added text/placeholder classes
          />
       </div>

        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <label className="block text-sm font-medium text-gray-700">Heirs' Keys (Provide {config.heirsKeys.length} public keys)</label>
            <button type="button" onClick={addHeirKeyInput} className="text-blue-600 hover:text-blue-800">
                <PlusCircle size={20} />
            </button>
          </div>
          {config.heirsKeys.map((key, index) => (
              <div key={index} className="flex items-center mb-2">
                  <input
                      type="text"
                      value={key}
                      onChange={(e) => handleHeirKeyChange(index, e.target.value)}
                      placeholder={`Heir Public Key ${index + 1}`}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm mr-2 text-gray-600 placeholder-gray-500" // Added text/placeholder classes
                  />
                  {config.heirsKeys.length > 1 && (
                      <button type="button" onClick={() => removeHeirKeyInput(index)} className="text-red-600 hover:text-red-800">
                           <MinusCircle size={20} />
                      </button>
                  )}
              </div>
          ))}
       </div>

       <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700">Heirs Threshold (M of {config.heirsKeys.length})</label>
          <input
            type="number"
            name="heirsThreshold"
            value={config.heirsThreshold}
            onChange={handleChange}
            min="1"
            max={config.heirsKeys.length}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm text-gray-600 placeholder-gray-500" // Added text/placeholder classes
          />
       </div>

        <div className="mb-4">
          {/* Updated label text */}
          <label className="block text-sm font-medium text-gray-700">Timelock 1 (Enter blocks or timestamp for Heirs)</label>
          <input
            type="number"
            name="timelock1"
            value={config.timelock1}
            onChange={handleChange}
            min="1"
            // Updated placeholder
            placeholder="e.g., 525960 (blocks) or 1678886400 (timestamp)"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm text-gray-600 placeholder-gray-500" // Added text/placeholder classes
          />
       </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700">Third Party Key (Fallback)</label>
          <input
            type="text"
            name="thirdPartyKey"
            value={config.thirdPartyKey}
            onChange={handleChange}
            placeholder="Third Party's Public Key"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm text-gray-600 placeholder-gray-500" // Added text/placeholder classes
          />
       </div>

         <div className="mb-4">
          {/* Updated label text */}
          <label className="block text-sm font-medium text-gray-700">Timelock 2 (Enter blocks or timestamp for Third Party)</label>
          <input
            type="number"
            name="timelock2"
            value={config.timelock2}
            onChange={handleChange}
             min={config.timelock1 > 0 ? config.timelock1 + 1 : 1} // Ensure Timelock 2 is greater than Timelock 1, handle case where timelock1 is 0
            // Updated placeholder
             placeholder="e.g., 592580 (blocks) or 1700000000 (timestamp)"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm text-gray-600 placeholder-gray-500" // Added text/placeholder classes
          />
       </div>


      <div className="mt-6">
        <button
          onClick={handleAdd}
          className="w-full inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Add Inheritance Policy
        </button>
      </div>
    </div>
  );
};

export default InheritanceConfigurator;