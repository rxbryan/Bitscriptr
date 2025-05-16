// src/components/configurators/EscrowConfigurator.tsx

import React, { useState, useEffect } from 'react';
import { SimpleEscrowConfig } from '../../types'; // Only import types from types.ts
import { generateUniqueId as utilGenerateUniqueId } from '../../utils'; // Correct import path for generateUniqueId

interface EscrowConfiguratorProps {
  initialConfig?: SimpleEscrowConfig;
  onConfigChange: (config: SimpleEscrowConfig) => void;
  onAddPolicy: (config: SimpleEscrowConfig) => void;
}

const EscrowConfigurator: React.FC<EscrowConfiguratorProps> = ({
  initialConfig,
  onConfigChange,
  onAddPolicy,
}) => {
  const [config, setConfig] = useState<SimpleEscrowConfig>(
    initialConfig || {
       // Use utilGenerateUniqueId from utils
      id: utilGenerateUniqueId('escrow'),
      name: 'Simple Escrow',
      type: 'simple-escrow',
      partyAKey: '',
      partyBKey: '',
      arbiterKey: '',
      timeout: 1000, // Example timeout blocks
    }
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setConfig({ ...config, [name]: name === 'timeout' ? parseInt(value, 10) || 0 : value });
  };

  const handleAdd = () => {
    // Add basic validation
    if (!config.partyAKey || !config.partyBKey || !config.arbiterKey || config.timeout <= 0) {
      alert('Please provide Party A Key, Party B Key, Arbiter Key, and a valid Timeout (>0).');
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
      <h3 className="text-lg font-semibold mb-2 text-gray-700">Simple Escrow Configuration</h3>
      <div className="grid grid-cols-1 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Party A Key</label>
          <input
            type="text"
            name="partyAKey"
            value={config.partyAKey}
            onChange={handleChange}
            placeholder="Party A Public Key"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm text-gray-600 placeholder-gray-500" // Added text/placeholder classes
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Party B Key</label>
          <input
            type="text"
            name="partyBKey"
            value={config.partyBKey}
            onChange={handleChange}
            placeholder="Party B Public Key"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm text-gray-600 placeholder-gray-500" // Added text/placeholder classes
          />
        </div>
         <div>
          <label className="block text-sm font-medium text-gray-700">Arbiter Key</label>
          <input
            type="text"
            name="arbiterKey"
            value={config.arbiterKey}
            onChange={handleChange}
            placeholder="Arbiter Public Key"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm text-gray-600 placeholder-gray-500" // Added text/placeholder classes
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Timeout (e.g., Blocks)</label>
          <input
            type="number"
            name="timeout"
            value={config.timeout}
            onChange={handleChange}
            min="1"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm text-gray-600 placeholder-gray-500" // Added text/placeholder classes
          />
        </div>
      </div>
      <div className="mt-6">
        <button
          onClick={handleAdd}
          className="w-full inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Add Simple Escrow Policy
        </button>
      </div>
    </div>
  );
};

export default EscrowConfigurator;