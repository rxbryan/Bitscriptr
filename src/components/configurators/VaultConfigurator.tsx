// src/components/configurators/VaultConfigurator.tsx
// This file was previously MultisigTimeoutConfigurator.tsx

import React, { useState, useEffect } from 'react';
// Updated import to use the new VaultConfig (DelayType import removed)
import { VaultConfig } from '../../types'; // Only import types from types.ts
import { generateUniqueId as utilGenerateUniqueId } from '../../utils'; // Correct import path for generateUniqueId
// import { PlusCircle, MinusCircle } from 'lucide-react'; // Not used for N input anymore

// Updated interface name
interface VaultConfiguratorProps {
  initialConfig?: VaultConfig;
  onConfigChange: (config: VaultConfig) => void;
  onAddPolicy: (config: VaultConfig) => void;
}

// Updated component name
const VaultConfigurator: React.FC<VaultConfiguratorProps> = ({
  initialConfig,
  onConfigChange,
  onAddPolicy,
}) => {
  // Updated state type and default values/names - Removed delayType
  const [config, setConfig] = useState<VaultConfig>(
    initialConfig || {
      // Use utilGenerateUniqueId from utils
      id: utilGenerateUniqueId('vault'), // Keep 'vault' as the ID prefix
      name: 'Vault (Delay + Cancel)', // Use the new name
      type: 'vault', // Use the new type enum value
      m: 2,
      n: 3,
      keys: ['', '', ''],
      delay: 500, // Example default delay
      cancelKey: '', // Renamed from timeoutKey
    }
  );

  // Effect to ensure keys array has the correct length based on N
  useEffect(() => {
    if (config.keys.length !== config.n) {
      const newKeys = [...config.keys];
      if (newKeys.length < config.n) {
         // Add empty keys if N increases
         while (newKeys.length < config.n) {
            newKeys.push('');
         }
      } else {
         // Trim keys if N decreases, also adjust M if needed
         newKeys.length = config.n;
         if (config.m > config.n) {
             // Cast to VaultConfig
             setConfig(prev => ({ ...prev as VaultConfig, keys: newKeys, m: config.n }));
             return; // Avoid setting state twice
         }
      }
      // Cast to VaultConfig
      setConfig(prev => ({ ...prev as VaultConfig, keys: newKeys }));
    }
  }, [config.n, config.keys.length, config.m]); // Added config.keys.length and config.m to dependencies


  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => { // Changed back to only HTMLInputElement as select is removed
    const { name, value } = e.target;
    // Updated to handle delay (was timeout), removed delayType
    if (name === 'n' || name === 'm' || name === 'delay') {
        const intValue = parseInt(value, 10);
         if (name === 'n') {
             // When N changes, update N state first, the useEffect will handle keys array length
             setConfig({ ...config, [name]: intValue || 0 });
         } else {
             // For M or delay, just update the state
              setConfig({ ...config, [name]: intValue || 0 });
         }
    }
    else {
        // For other string inputs (keys, cancelKey)
        setConfig({ ...config, [name]: value });
    }
  };

  const handleKeyChange = (index: number, value: string) => {
    const newKeys = [...config.keys];
    newKeys[index] = value;
    setConfig({ ...config, keys: newKeys });
  };

  const handleAdd = () => {
    // Updated validation and messages - Removed delayType check
    if (config.n < 1 || config.m < 1 || config.m > config.n || config.delay <= 0 || !config.cancelKey) {
      alert('Please fill in all required fields and ensure N >= 1, M >= 1, M <= N, Delay > 0, and Cancel Key is provided for the Vault.');
      return;
    }
     if (config.keys.some(key => !key)) {
        alert('Please provide all public keys for the Vault.');
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
      {/* Updated subheading text and added text-gray-700 */}
      <h3 className="text-lg font-semibold mb-2 text-gray-700">Vault (Delay + Cancel) Configuration</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">M (Required Signatures)</label>
          <input
            type="number"
            name="m"
            value={config.m}
            onChange={handleChange}
            min="1"
            max={config.n} // Max M is N
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm text-gray-600 placeholder-gray-500" // Added text/placeholder classes
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">N (Total Keys)</label>
          <input
            type="number"
            name="n"
            value={config.n}
            onChange={handleChange}
            min="1"
             className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm text-gray-600 placeholder-gray-500" // Added text/placeholder classes
          />
        </div>
      </div>

       <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700">Keys (Provide {config.n} public keys)</label>
          {/* Render inputs based on the current keys array length */}
          {config.keys.map((key, index) => (
              <input
                  key={index} // Use index as key, acceptable since items are added/removed from end
                  type="text"
                  value={key}
                  onChange={(e) => handleKeyChange(index, e.target.value)}
                  placeholder={`Public Key ${index + 1}`}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm mb-2 text-gray-600 placeholder-gray-500" // Added text/placeholder classes
              />
          ))}
           {config.n === 0 && <p className="text-sm text-gray-500">Set N to add key inputs.</p>}
       </div>

       {/* Delay Input - Type selection removed */}
       <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700">Delay (Enter blocks or timestamp)</label> {/* Updated label text */}
          <input
            type="number"
            name="delay" // Renamed from timeout
            value={config.delay}
            onChange={handleChange}
            min="1"
            placeholder="e.g., 500 (blocks) or 1678886400 (timestamp)" // Updated placeholder
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm text-gray-600 placeholder-gray-500" // Added text/placeholder classes
          />
       </div>


        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700">Cancel Key</label> {/* Renamed from Timeout Key */}
          <input
            type="text"
            name="cancelKey" // Renamed from timeoutKey
            value={config.cancelKey}
            onChange={handleChange}
            placeholder="Public Key for Cancel Path" // Updated placeholder
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm text-gray-600 placeholder-gray-500" // Added text/placeholder classes
          />
       </div>


      <div className="mt-6">
        <button
          onClick={handleAdd}
          className="w-full inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Add Vault Policy
        </button>
      </div>
    </div>
  );
};

// Updated export name
export default VaultConfigurator;