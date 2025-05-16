// src/components/configurators/CoreConditionConfigurator.tsx

import React, { useState, useEffect } from 'react';
import {
    CoreConditionConfig, CoreConditionType, SingleSigConfig, MultiSigConfig,
    ThresholdConfig, AbsoluteTimelockConfig, RelativeTimelockConfig,
    HashlockConfig, HashingAlgorithm // Import HashingAlgorithm enum
} from '../../types'; // Import specific config types
import { generateUniqueId as utilGenerateUniqueId } from '../../utils'; // Correct import path for generateUniqueId
// import { PlusCircle, MinusCircle } from 'lucide-react'; // Not used for N input anymore


interface CoreConditionConfiguratorProps {
  conditionType: CoreConditionType;
  initialConfig?: CoreConditionConfig;
  onConfigChange: (config: CoreConditionConfig) => void;
  onAddPolicy: (config: CoreConditionConfig) => void;
}

const CoreConditionConfigurator: React.FC<CoreConditionConfiguratorProps> = ({
  conditionType,
  initialConfig,
  onConfigChange,
  onAddPolicy,
}) => {
  // Initialize state based on the conditionType
  const [config, setConfig] = useState<CoreConditionConfig>(() => {
    if (initialConfig) return initialConfig;

    const baseConfig = {
        // Use utilGenerateUniqueId from utils
        id: utilGenerateUniqueId(conditionType),
        name: conditionType.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()), // Basic name formatting
        type: conditionType,
    };

    switch (conditionType) {
      case CoreConditionType.SingleSig:
        return { ...baseConfig, key: '' } as SingleSigConfig;
      case CoreConditionType.MultiSig:
        // Start with a default N=2, M=1 and 2 empty keys
        return { ...baseConfig, m: 1, n: 2, keys: ['', ''] } as MultiSigConfig;
      case CoreConditionType.Threshold:
        // Start with a default N=2, M=1 and 2 empty items
        return { ...baseConfig, m: 1, n: 2, items: ['', ''] } as ThresholdConfig;
      case CoreConditionType.AbsoluteTimelock:
        return { ...baseConfig, timelock: 0 } as AbsoluteTimelockConfig;
      case CoreConditionType.RelativeTimelock:
        return { ...baseConfig, timelock: 0 } as RelativeTimelockConfig;
      case CoreConditionType.Hashlock:
         // Add default algorithm
        return { ...baseConfig, algorithm: HashingAlgorithm.SHA256, hash: '' } as HashlockConfig;
      default:
         // Should not happen if conditionType is from the enum
         throw new Error(`Unknown core condition type: ${conditionType}`);
    }
  });

   // Effect to update keys/items array length based on N for MultiSig/Threshold
   useEffect(() => {
       if (config.type === CoreConditionType.MultiSig || config.type === CoreConditionType.Threshold) {
           const currentItems = (config as MultiSigConfig | ThresholdConfig).type === CoreConditionType.MultiSig ? (config as MultiSigConfig).keys : (config as ThresholdConfig).items;
           const n = (config as MultiSigConfig | ThresholdConfig).n;
           const m = (config as MultiSigConfig | ThresholdConfig).m;


           if (currentItems.length !== n) {
               const newItems = [...currentItems];
               if (newItems.length < n) {
                   // Add empty items if N increases
                   while (newItems.length < n) {
                       newItems.push('');
                   }
               } else {
                   // Trim items if N decreases, also adjust M if needed
                   newItems.length = n;
                   if (m > n) {
                        if (config.type === CoreConditionType.MultiSig) {
                            setConfig(prev => ({ ...prev as MultiSigConfig, keys: newItems as string[], m: n }));
                        } else {
                            setConfig(prev => ({ ...prev as ThresholdConfig, items: newItems as string[], m: n }));
                        }
                        return; // Avoid setting state twice
                   }
               }

               if (config.type === CoreConditionType.MultiSig) {
                   setConfig(prev => ({ ...prev as MultiSigConfig, keys: newItems as string[] }));
               } else {
                   setConfig(prev => ({ ...prev as ThresholdConfig, items: newItems as string[] }));
               }
           }
           // Also ensure M does not exceed N when N changes
           if (m > n) {
                 if (config.type === CoreConditionType.MultiSig) {
                    setConfig(prev => ({ ...prev as MultiSigConfig, m: n }));
                } else {
                    setConfig(prev => ({ ...prev as ThresholdConfig, m: n }));
                }
           }


       }
   }, [config.type, (config as any).n, (config as any).keys, (config as any).items, (config as any).m]); // Added dependencies


  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => { // Allow HTMLSelectElement
    const { name, value } = e.target;
     if (name === 'm' || name === 'n' || name === 'timelock') {
        const intValue = parseInt(value, 10);
        // For N, update N state. Effect handles array length.
        // For M or timelock, just update state.
        setConfig({ ...config, [name]: intValue || 0 });
     }
     else if (name === 'algorithm') {
         setConfig({ ...config as HashlockConfig, [name]: value as HashingAlgorithm }); // Cast value to HashingAlgorithm
     }
     else {
         // For other string inputs (key, hash)
         setConfig({ ...config, [name]: value });
     }
  };

  const handleArrayItemChange = (index: number, value: string) => {
    if (config.type === CoreConditionType.MultiSig) {
      const newKeys = [...(config as MultiSigConfig).keys];
      newKeys[index] = value;
      setConfig({ ...config as MultiSigConfig, keys: newKeys });
    } else if (config.type === CoreConditionType.Threshold) {
      const newItems = [...(config as ThresholdConfig).items];
      newItems[index] = value;
      setConfig({ ...config as ThresholdConfig, items: newItems });
    }
  };

    // Removed add/remove array item buttons as N input drives the array length now


  const handleAdd = () => {
    // Add basic validation based on type
    let isValid = false;
    let validationMessage = '';

    switch (config.type) {
      case CoreConditionType.SingleSig:
        isValid = !!(config as SingleSigConfig).key;
        validationMessage = 'Public Key is required.';
        break;
      case CoreConditionType.MultiSig:
        const msConfig = config as MultiSigConfig;
        isValid = msConfig.n >= 1 && msConfig.m >= 1 && msConfig.m <= msConfig.n && msConfig.keys.length === msConfig.n && msConfig.keys.every(key => !!key);
        validationMessage = 'M, N, and all Keys are required. Ensure 1 <= M <= N.';
        break;
      case CoreConditionType.Threshold:
         const threshConfig = config as ThresholdConfig;
         isValid = threshConfig.n >= 1 && threshConfig.m >= 1 && threshConfig.m <= threshConfig.n && threshConfig.items.length === threshConfig.n && threshConfig.items.every(item => !!item);
         validationMessage = 'M, N, and all Items are required. Ensure 1 <= M <= N.';
         break;
      case CoreConditionType.AbsoluteTimelock:
      case CoreConditionType.RelativeTimelock:
        isValid = (config as AbsoluteTimelockConfig | RelativeTimelockConfig).timelock > 0;
        validationMessage = 'Timelock must be greater than 0.';
        break;
      case CoreConditionType.Hashlock:
         const hlConfig = config as HashlockConfig;
         const isHex = /^[0-9a-fA-F]+$/.test(hlConfig.hash);
         // Validate hex length based on algorithm, allow 'H' as a special case
         if (hlConfig.hash.toUpperCase() === 'H') {
             isValid = true; // 'H' is always valid
         } else {
             switch(hlConfig.algorithm) {
                 case HashingAlgorithm.SHA256:
                 case HashingAlgorithm.HASH256:
                     isValid = isHex && hlConfig.hash.length === 64;
                     validationMessage = 'Hash must be 64-character hex or "H".';
                     break;
                 case HashingAlgorithm.RIPEMD160:
                 case HashingAlgorithm.HASH160:
                     isValid = isHex && hlConfig.hash.length === 40;
                     validationMessage = 'Hash must be 40-character hex or "H".';
                     break;
                 default:
                    isValid = false;
                    validationMessage = 'Unknown hashing algorithm selected.';
                    break;
             }
         }

        if (!hlConfig.hash) {
             isValid = false;
             validationMessage = 'Hash is required.';
        }
        break;
      default:
        isValid = false;
        validationMessage = 'Unknown condition type.';
        break;
    }

    if (!isValid) {
        alert(`Please fill in all required fields correctly for ${config.name}. ${validationMessage}`);
        return;
    }

    onAddPolicy(config);
  };

   // Notify parent of config changes whenever config state updates
   useEffect(() => {
    onConfigChange(config);
  }, [config, onConfigChange]);


  // Render form fields based on condition type
  const renderConfigFields = () => {
    switch (config.type) {
      case CoreConditionType.SingleSig:
        const ssConfig = config as SingleSigConfig;
        return (
          <div>
            <label className="block text-sm font-medium text-gray-700">Public Key</label>
            <input
              type="text"
              name="key"
              value={ssConfig.key}
              onChange={handleChange}
              placeholder="Public Key"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm text-gray-600 placeholder-gray-500"
            />
          </div>
        );
      case CoreConditionType.MultiSig:
        const msConfig = config as MultiSigConfig;
        return (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">M (Required Signatures)</label>
                <input
                  type="number"
                  name="m"
                  value={msConfig.m}
                  onChange={handleChange}
                  min="1"
                  max={msConfig.n} // Max M is N
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm text-gray-600 placeholder-gray-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">N (Total Keys)</label>
                 {/* N input drives the keys array length */}
                 <input
                    type="number"
                    name="n"
                    value={msConfig.n}
                    onChange={handleChange}
                    min="1"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm text-gray-600 placeholder-gray-500"
                 />
              </div>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Keys (Provide {msConfig.n} public keys)</label>
                {msConfig.keys.map((key, index) => (
                    <div key={index} className="flex items-center mb-2">
                        <input
                            type="text"
                            value={key}
                            onChange={(e) => handleArrayItemChange(index, e.target.value)}
                            placeholder={`Public Key ${index + 1}`}
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm text-gray-600 placeholder-gray-500"
                        />
                    </div>
                ))}
                {msConfig.n === 0 && <p className="text-sm text-gray-500">Set N to add key inputs.</p>}
            </div>
          </>
        );
      case CoreConditionType.Threshold:
          const threshConfig = config as ThresholdConfig;
          return (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">M (Required Items)</label>
                  <input
                    type="number"
                    name="m"
                    value={threshConfig.m}
                    onChange={handleChange}
                    min="1"
                    max={threshConfig.n} // Max M is N
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm text-gray-600 placeholder-gray-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">N (Total Items)</label>
                   {/* N input drives the items array length */}
                   <input
                        type="number"
                        name="n"
                        value={threshConfig.n}
                        onChange={handleChange}
                        min="1"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm text-gray-600 placeholder-gray-500"
                    />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Items (Provide {threshConfig.n} keys, hashes, or policy fragments)</label>
                {threshConfig.items.map((item, index) => (
                    <div key={index} className="flex items-center mb-2">
                        <input
                            type="text"
                            value={item}
                            onChange={(e) => handleArrayItemChange(index, e.target.value)}
                            placeholder={`Item ${index + 1}`}
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm text-gray-600 placeholder-gray-500"
                        />
                    </div>
                ))}
                 {threshConfig.n === 0 && <p className="text-sm text-gray-500">Set N to add item inputs.</p>}
            </div>
            </>
          );
      case CoreConditionType.AbsoluteTimelock:
      case CoreConditionType.RelativeTimelock:
        const tlConfig = config as AbsoluteTimelockConfig | RelativeTimelockConfig;
        return (
          <div>
            <label className="block text-sm font-medium text-gray-700">{config.type === CoreConditionType.AbsoluteTimelock ? 'Absolute Timelock (Timestamp or Block Height)' : 'Relative Timelock (Blocks)'}</label>
            <input
              type="number"
              name="timelock"
              value={tlConfig.timelock}
              onChange={handleChange}
              min="1"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm text-gray-600 placeholder-gray-500"
            />
          </div>
        );
      case CoreConditionType.Hashlock:
        const hlConfig = config as HashlockConfig;
        // Determine placeholder based on selected algorithm
        const hashPlaceholder = hlConfig.algorithm === HashingAlgorithm.SHA256 || hlConfig.algorithm === HashingAlgorithm.HASH256
           ? '64-character HEX or "H"'
           : '40-character HEX or "H"';

        return (
          <>
            <div className="mb-4">
                 <label className="block text-sm font-medium text-gray-700">Hashing Algorithm</label>
                 <select
                     name="algorithm"
                     value={hlConfig.algorithm}
                     onChange={handleChange}
                     className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm text-gray-600" // Added text-gray-600
                 >
                     {Object.values(HashingAlgorithm).map(alg => (
                         <option key={alg} value={alg}>{alg}</option>
                     ))}
                 </select>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700">Hash Value</label>
                <input
                  type="text"
                  name="hash"
                  value={hlConfig.hash}
                  onChange={handleChange}
                  placeholder={hashPlaceholder}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm text-gray-600 placeholder-gray-500" // Added text/placeholder classes
                />
            </div>
          </>
        );
      default:
        return <p>Select a core condition to configure.</p>;
    }
  };

  return (
    // Removed border, padding, margin bottom from this root div
    <div className="rounded-md bg-gray-50 p-4"> {/* Added padding back here */}
      <h3 className="text-lg font-semibold mb-2 text-gray-600">{config.name} Configuration</h3>
      {renderConfigFields()}
      <div className="mt-6">
        <button
          onClick={handleAdd}
           // Check validity based on config type before enabling
          disabled={
              (config.type === CoreConditionType.SingleSig && !(config as SingleSigConfig).key) ||
              (config.type === CoreConditionType.MultiSig && ((config as MultiSigConfig).n < 1 || (config as MultiSigConfig).m < 1 || (config as MultiSigConfig).m > (config as MultiSigConfig).n || (config as MultiSigConfig).keys.some(key => !key))) ||
               (config.type === CoreConditionType.Threshold && ((config as ThresholdConfig).n < 1 || (config as ThresholdConfig).m < 1 || (config as ThresholdConfig).m > (config as ThresholdConfig).n || (config as ThresholdConfig).items.some(item => !item))) ||
              ((config.type === CoreConditionType.AbsoluteTimelock || config.type === CoreConditionType.RelativeTimelock) && (config as AbsoluteTimelockConfig | RelativeTimelockConfig).timelock <= 0) ||
              (config.type === CoreConditionType.Hashlock && (
                  !(config as HashlockConfig).hash || // Hash is empty
                  ((config as HashlockConfig).hash.toUpperCase() !== 'H' && // Not 'H'
                   !/^[0-9a-fA-F]+$/.test((config as HashlockConfig).hash) // Not hex
                  ) ||
                   ((config as HashlockConfig).hash.toUpperCase() !== 'H' && // Not 'H'
                    ((((config as HashlockConfig).algorithm === HashingAlgorithm.SHA256 || (config as HashlockConfig).algorithm === HashingAlgorithm.HASH256) && (config as HashlockConfig).hash.length !== 64) || // Wrong length for SHA/HASH256
                     (((config as HashlockConfig).algorithm === HashingAlgorithm.RIPEMD160 || (config as HashlockConfig).algorithm === HashingAlgorithm.HASH160) && (config as HashlockConfig).hash.length !== 40) // Wrong length for RIPEMD/HASH160
                    )
                   )
              ))
          }
          className={`w-full inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white ${
             ((config.type === CoreConditionType.SingleSig && !(config as SingleSigConfig).key) ||
              (config.type === CoreConditionType.MultiSig && ((config as MultiSigConfig).n < 1 || (config as MultiSigConfig).m < 1 || (config as MultiSigConfig).m > (config as MultiSigConfig).n || (config as MultiSigConfig).keys.some(key => !key))) ||
               (config.type === CoreConditionType.Threshold && ((config as ThresholdConfig).n < 1 || (config as ThresholdConfig).m < 1 || (config as ThresholdConfig).m > (config as ThresholdConfig).n || (config as ThresholdConfig).items.some(item => !item))) ||
              ((config.type === CoreConditionType.AbsoluteTimelock || config.type === CoreConditionType.RelativeTimelock) && (config as AbsoluteTimelockConfig | RelativeTimelockConfig).timelock <= 0) ||
              (config.type === CoreConditionType.Hashlock && (
                  !(config as HashlockConfig).hash || // Hash is empty
                   ((config as HashlockConfig).hash.toUpperCase() !== 'H' && // Not 'H'
                   !/^[0-9a-fA-F]+$/.test((config as HashlockConfig).hash) // Not hex
                  ) ||
                   ((config as HashlockConfig).hash.toUpperCase() !== 'H' && // Not 'H'
                    ((((config as HashlockConfig).algorithm === HashingAlgorithm.SHA256 || (config as HashlockConfig).algorithm === HashingAlgorithm.HASH256) && (config as HashlockConfig).hash.length !== 64) || // Wrong length for SHA/HASH256
                     (((config as HashlockConfig).algorithm === HashingAlgorithm.RIPEMD160 || (config as HashlockConfig).algorithm === HashingAlgorithm.HASH160) && (config as HashlockConfig).hash.length !== 40) // Wrong length for RIPEMD/HASH160
                    )
                   )
              ))
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
            )}
            `}
        >
          Add {config.name} Policy
        </button>
      </div>
    </div>
  );
};


export default CoreConditionConfigurator;