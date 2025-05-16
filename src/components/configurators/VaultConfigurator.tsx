// src/components/configurators/VaultConfigurator.tsx

import React, { useState, useEffect } from 'react';
import { VaultConfig } from '../../types'; // Only import types from types.ts
import { generateUniqueId as utilGenerateUniqueId } from '../../utils'; // Correct import path for generateUniqueId

interface VaultConfiguratorProps {
  initialConfig?: VaultConfig;
  onConfigChange: (config: VaultConfig) => void;
  onAddPolicy: (config: VaultConfig) => void;
}

const VaultConfigurator: React.FC<VaultConfiguratorProps> = ({
  initialConfig,
  onConfigChange,
  onAddPolicy,
}) => {
  const [config, setConfig] = useState<VaultConfig>(
    initialConfig || {
       // Use utilGenerateUniqueId from utils
      id: utilGenerateUniqueId('vault'),
      name: 'Vault (Delay + Cancel)',
      type: 'vault',
      destKey: '',
      delayBlocks: 1000, // Example delay
      cancelKey: '',
    }
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setConfig({ ...config, [name]: name === 'delayBlocks' ? parseInt(value, 10) || 0 : value });
  };

  const handleAdd = () => {
    // Add basic validation
    if (!config.destKey || config.delayBlocks <= 0 || !config.cancelKey) {
      alert('Please provide Destination Key, a valid Delay (blocks), and Cancel Key.');
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
      <h3 className="text-lg font-semibold mb-2 text-gray-700">Vault Configuration</h3>
      <div className="grid grid-cols-1 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Destination Key</label>
          <input
            type="text"
            name="destKey"
            value={config.destKey}
            onChange={handleChange}
            placeholder="Public Key for Destination UTXO"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm text-gray-600 placeholder-gray-500" // Added text/placeholder classes
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Delay (Blocks)</label>
          <input
            type="number"
            name="delayBlocks"
            value={config.delayBlocks}
            onChange={handleChange}
             min="1"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm text-gray-600 placeholder-gray-500" // Added text/placeholder classes
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Cancel Key</label>
          <input
            type="text"
            name="cancelKey"
            value={config.cancelKey}
            onChange={handleChange}
            placeholder="Public Key to Cancel Withdrawal"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm text-gray-600 placeholder-gray-500" // Added text/placeholder classes
          />
        </div>
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

export default VaultConfigurator;