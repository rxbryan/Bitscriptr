// src/components/configurators/MultisigTimeoutConfigurator.tsx

import React, { useState, useEffect } from 'react';
import { MultisigTimeoutConfig } from '../../types'; // Only import types from types.ts
import { generateUniqueId as utilGenerateUniqueId } from '../../utils'; // Correct import path for generateUniqueId
// import { PlusCircle, MinusCircle } from 'lucide-react'; // Not used for N input anymore

interface MultisigTimeoutConfiguratorProps {
  initialConfig?: MultisigTimeoutConfig;
  onConfigChange: (config: MultisigTimeoutConfig) => void;
  onAddPolicy: (config: MultisigTimeoutConfig) => void;
}

const MultisigTimeoutConfigurator: React.FC<MultisigTimeoutConfiguratorProps> = ({
  initialConfig,
  onConfigChange,
  onAddPolicy,
}) => {
  const [config, setConfig] = useState<MultisigTimeoutConfig>(
    initialConfig || {
      // Use utilGenerateUniqueId from utils
      id: utilGenerateUniqueId('multisig-timeout'),
      name: 'Multisig with Timeout',
      type: 'multisig-timeout',
      m: 2,
      n: 3,
      keys: ['', '', ''],
      timeout: 500, // Example block height
      timeoutKey: '',
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
             setConfig(prev => ({ ...prev, keys: newKeys, m: config.n }));
             return; // Avoid setting state twice
         }
      }
      setConfig(prev => ({ ...prev, keys: newKeys }));
    }
  }, [config.n, config.keys.length, config.m]); // Added config.keys.length and config.m to dependencies


  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === 'n' || name === 'm' || name === 'timeout') {
        const intValue = parseInt(value, 10);
         if (name === 'n') {
             // When N changes, update N state first, the useEffect will handle keys array length
             setConfig({ ...config, [name]: intValue || 0 });
         } else {
             // For M or timeout, just update the state
              setConfig({ ...config, [name]: intValue || 0 });
         }
    } else {
        // For other string inputs
        setConfig({ ...config, [name]: value });
    }
  };

  const handleKeyChange = (index: number, value: string) => {
    const newKeys = [...config.keys];
    newKeys[index] = value;
    setConfig({ ...config, keys: newKeys });
  };

  const handleAdd = () => {
    // Add basic validation before adding
    if (config.n < 1 || config.m < 1 || config.m > config.n || config.timeout <= 0 || !config.timeoutKey) {
      alert('Please fill in all required fields and ensure N >= 1, M >= 1, M <= N, Timeout > 0, Timeout Key is provided.');
      return;
    }
     if (config.keys.some(key => !key)) {
        alert('Please provide all public keys.');
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
      <h3 className="text-lg font-semibold mb-2 text-gray-700">Multisig with Timeout Configuration</h3>
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

       <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700">Timeout (e.g., Block Height)</label>
          <input
            type="number"
            name="timeout"
            value={config.timeout}
            onChange={handleChange}
            min="1"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm text-gray-600 placeholder-gray-500" // Added text/placeholder classes
          />
       </div>

        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700">Timeout Key</label>
          <input
            type="text"
            name="timeoutKey"
            value={config.timeoutKey}
            onChange={handleChange}
            placeholder="Public Key for Timeout Path"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm text-gray-600 placeholder-gray-500" // Added text/placeholder classes
          />
       </div>


      <div className="mt-6">
        <button
          onClick={handleAdd}
          className="w-full inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Add Multisig Timeout Policy
        </button>
      </div>
    </div>
  );
};

export default MultisigTimeoutConfigurator;
