import {
  CommonPatternConfig,
  CoreConditionConfig,
  ComposedPolicyConfig,
  PolicyListEntry,
  CompositionType,
  OutputDescriptorType,
  HashlockConfig,
  CoreConditionType,
  VaultConfig,
  isComposedPolicy,
  isTextPolicy,
  InheritanceConfig,
  SimpleEscrowConfig,
} from './types';

import { compilePolicy } from '@bitcoinerlab/miniscript';
import { networks } from 'bitcoinjs-lib';
import BIP32Factory from 'bip32';
import ecc from '@bitcoinerlab/secp256k1';
import * as wif from "wif"

const bip32 = BIP32Factory(ecc);

// Helper to generate a unique ID
export const generateUniqueId = (prefix: string = 'policy'): string => {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

// --- Policy String Generation Functions ---

// Generate policy string from common pattern config
export const generateCommonPatternPolicyString = (
  config: CommonPatternConfig
): string | undefined => {
  try {
    switch (config.type) {
      // Vault uses after() now
      case 'vault':
        const vaultConfig = config as VaultConfig;
        const multisigKeys = vaultConfig.keys.map(key => `pk(${key})`).join(','); 
         const delayFragment = `after(${vaultConfig.delay})`;
         return `or(and(thresh(${vaultConfig.m},${multisigKeys}),${delayFragment}),pk(${vaultConfig.cancelKey}))`;
      case 'inheritance':
         const inheritanceConfig = config as InheritanceConfig;
         const heirsKeys = inheritanceConfig.heirsKeys.map(key => `pk(${key})`).join(',');
         return `or(or(pk(${inheritanceConfig.ownerKey}),and(thresh(${inheritanceConfig.heirsThreshold},${heirsKeys}),after(${inheritanceConfig.timelock1}))),and(pk(${inheritanceConfig.thirdPartyKey}),after(${inheritanceConfig.timelock2})))`;
      case 'simple-escrow':
        const escrowConfig = config as SimpleEscrowConfig;
        return `or(and(pk(${escrowConfig.partyAKey}),pk(${escrowConfig.partyBKey})),and(pk(${escrowConfig.arbiterKey}),after(${escrowConfig.timeout})))`;
      default:
        console.error("Attempted to generate policy string for unhandled common pattern type:", config);
        return undefined;
    }
  } catch (e) {
    console.error('Error generating policy string for common pattern:', e);
    return undefined;
  }
};

// Generate Policy string from core condition config
export const generateCoreConditionPolicyString = (
  config: CoreConditionConfig
): string | undefined => {
    try {
        switch(config.type) {
            case CoreConditionType.SingleSig:
                return `pk(${config.key})`;
            case CoreConditionType.MultiSig:
                 const keys = config.keys.map(key => `pk(${key})`).join(',');
                 return `thresh(${config.m},${keys})`; // Note: pure multisig n-of-n is just multi(n,keys...), but m-of-n is thresh
            case CoreConditionType.Threshold:
                const items = config.items.map(item => {
                  const ret = isValidBitcoinKey(item)
                  if (ret.isValid) 
                    return `pk(${item})`;
                  
                  return item
                });
                return `thresh(${config.m},${items.join(',')})`;
            case CoreConditionType.AbsoluteTimelock:
                return `after(${config.timelock})`;
            case CoreConditionType.RelativeTimelock:
                return `older(${config.timelock})`;
            case CoreConditionType.Hashlock:
                const hlConfig = config as HashlockConfig;
                 // Use the selected algorithm and hash from the config
                 return `${hlConfig.algorithm}(${hlConfig.hash})`;
            default:
                // Fallback for types not handled yet (should not happen if type is in CoreConditionType)
                console.error("Attempted to generate policy string for unhandled core condition type:", config);
                return undefined;
        }
    } catch (e) {
        console.error('Error generating policy string for core condition:', e);
        return undefined;
    }
};

// Composition of policy from sub-policy strings.
export const generateCompositionPolicyString = (
    composition: ComposedPolicyConfig
): string | undefined => {
    // Filter out policies that don't have a generated string yet
    const policyStrings = composition.policies.map(p => p.policyString).filter(Boolean) as string[];
    if (policyStrings.length === 0) return undefined;

    try {
        switch (composition.type) {
            case CompositionType.AND:
                // Basic validation for 2 policies already done in UI
                if (policyStrings.length !== 2) return undefined; // Should be caught by UI validation
                return `and(${policyStrings[0]},${policyStrings[1]})`;
            case CompositionType.OR:
                 // Basic validation for 2 policies already done in UI
                if (policyStrings.length !== 2) return undefined; // Should be caught by UI validation
                return `or(${policyStrings[0]},${policyStrings[1]})`;
            case CompositionType.THRESHOLD:
                 if (composition.threshold === undefined || composition.threshold < 1 || composition.threshold > policyStrings.length) return undefined;
                 // Using a simple thresh wrapper here for demonstration.
                 return `thresh(${composition.threshold},${policyStrings.join(',')})`;
            default:
                // Should not happen if composition.type is from the enum
                console.error("Attempted to generate policy string for unhandled composition type:", composition);
                return undefined;
        }
    } catch (e) {
        console.error('Error generating policy string for composition:', e);
        return undefined;
    }
};

export function extractAndReplacePkContent(inputString: string): { modifiedString: string; extractedKeysMap: Map<string, string> } {
  const extractedKeysMap = new Map<string, string>();
  let modifiedString = inputString;
  let keyCounter = 1;

  // Regular expression to find "pk(...)" and capture the content inside
  const regex = /pk\((.*?)\)/g;
  let match;

  modifiedString = inputString.replace(regex, (match, capturedContent, offset) => {
      // match: the full matched string (e.g., "pk(tprv...)")
      // capturedContent: the content inside the parentheses (e.g., "tprv...")
      // offset: the index where the match was found in the original string
      // string: the original string (inputString)

      const generatedKey = `key${keyCounter}`;
      extractedKeysMap.set(generatedKey, capturedContent); // Store original content

      keyCounter++; // Increment counter for the next match

      // Return the string to replace the match with.
      // We want to keep "pk(" and ")" and replace only the captured content.
      return `pk(${generatedKey})`;
  });


  return { modifiedString, extractedKeysMap };
}


export function replaceKeysWithValues(inputString: string, replacementMap: Map<string, string>): string {
  let outputString = inputString;

  // Get keys and sort them by length descending to handle cases like key1 and key10
  const sortedKeys = Array.from(replacementMap.keys()).sort((a, b) => b.length - a.length);

  sortedKeys.forEach(key => {
      const value = replacementMap.get(key);
      if (value !== undefined) {
           // Create a regular expression to find the specific key globally
          // Escaping special regex characters in the key might be necessary
          // if the key format were more complex than "keyN".
          const keyRegex = new RegExp(key, 'g');

          // Replace all occurrences of the key with its corresponding value
          outputString = outputString.replace(keyRegex, value);
      }
  });

  return outputString;
}

// Checks for valid keys
export function isValidBitcoinKey(keyString: string): {isValid: boolean, network: string|undefined, msg: string} {
  if (typeof keyString !== 'string') {
      return {isValid: false, network: undefined, msg: "Not a string"}; // Input must be a string
  }

  // --- Check for Hexadecimal Formats ---

  // Regex to check if the string contains only hexadecimal characters (0-9, a-f, A-F)
      const isHex = /^[0-9a-fA-F]+$/.test(keyString);

      if (isHex) {
          // Check for Compressed Public Key (66 hex chars, starts with 02 or 03)
          if (keyString.length === 66) {
              const prefix = keyString.substring(0, 2).toLowerCase();
              if (prefix === '02' || prefix === '03') {
                  // For a *full* validation, we would also check if the remaining 32 bytes
                  // represent a valid X-coordinate on the secp256k1 curve.
                  return {
                    isValid: true,
                    network: undefined,
                    msg: "compressed_public_key"
                  };
              }
          }

          if (keyString.length === 130) {
            const prefix = keyString.substring(0, 2).toLowerCase();
              if (prefix === '04') {
                  // For a *full* validation, we would also check if the remaining 32 bytes
                  // represent a valid X-coordinate on the secp256k1 curve.
                  return {
                    isValid: false,
                    network: undefined,
                    msg: `You cannot use uncompressed public keys: ${keyString} within modern P2WSH locking scripts.`
                  }; 
              }
          }
      }
      
      // Is a wif private key
      if (keyString.length === 51 || keyString.length === 52) {
          try {
              let wifKey = wif.decode(keyString)
              let network: string = ""
              if (wifKey.version == 0x80)
                network = 'mainnet'
              if (wifKey.version = 0xef)
                network = 'testnet'

              return {
                isValid: true,
                network,
                msg: "WIF"
              };
          }
          catch (e)
          {
            console.error("An error occurred:", e)
          }
           
      }

      const prefixes = ['xpub', 'xprv', 'tpub', 'tprv', 'ypub', 'yprv', 'zpub', 'zprv', 'vpub', 'vprv', 'upub', 'uprv'];
      const startsWithPrefix = prefixes.some(prefix => keyString.startsWith(prefix));

      if (startsWithPrefix) {
        const mainnetPrefix = ['xprv', 'xpub']
        const testnetPrefix = ['tprv', 'tpub']
        if (mainnetPrefix.includes(keyString.substring(0, 4))) {
          try {
            bip32.fromBase58(keyString) // Ignore the returned object
            return {
              isValid: true,
              network: 'mainnet',
              msg: "bip32"
          }
          }
          catch (e) {
            console.error("An error occurred:", e)
          }
        }
        if (testnetPrefix.includes(keyString.substring(0, 4))) {
          try {
            bip32.fromBase58(keyString, networks.testnet) // Ignore the returned object
            return {
              isValid: true,
              network: 'testnet',
              msg: "bip32"
            }
          }
          catch (e) {
            console.error("An error occurred:", e)
          }
        }
        const altXPrixPrefix = ['yprv', 'zprv', 'vprv']
        const altXPubPrefix = ['ypub', 'zpub', 'vpub']

        if (altXPrixPrefix.includes(keyString.substring(0, 4))) {
          return {
            isValid: false,
            network: '',
            msg: `Use a private key in WIF format or xprv: ${keyString}`
          }

        }
        if (altXPubPrefix.includes(keyString.substring(0, 4))) {
          return {
            isValid: false,
            network: '',
            msg: `Use a public key in WIF format or xpub: ${keyString}`
            } 
        }
  }

  // If none of the above formats match or pass available checks
  return {
    isValid: false,
    network: '',
    msg: `${keyString} is not a valid bitcoin key`
  }
}


export const validateMiniscriptPolicy = (
  policyString: string | undefined
): { isValid: boolean; error?: string } => {
  if (!policyString || policyString.trim().length === 0) {
    return { isValid: false, error: 'Policy string is empty.' };
  }

  const { modifiedString, extractedKeysMap } = extractAndReplacePkContent(policyString)

  // Check if keys are valid
  const keyIterator = extractedKeysMap.values()
  for (const key of keyIterator) {
    const ret = isValidBitcoinKey(key)
    if (!ret.isValid) {
      return { isValid: false, error: ret.msg }
      }
  }
  

  // This performs syntax checking.
  const { issane } = compilePolicy(modifiedString)


  if (issane) {
    return { isValid: true };
  }

  return { 
    isValid: false, 
    error: "Policy validation failed: Miniscript is invalid and does not follow the consensus and standardness rules for Bitcoin scripts"
  };
 
};


// --- Descriptor Generation Function (Using @bitcoinerlab/miniscript) ---

// Replace placeholder with actual library logic
export const generateDescriptor = (
  policyString: string,
  outputType: OutputDescriptorType
): string | undefined => {
  if (!policyString || !outputType) {
    return undefined;
  }

  const { modifiedString, extractedKeysMap } = extractAndReplacePkContent(policyString)
  
    // 1. Parse the policy string into a miniscript object
  const { miniscript } = compilePolicy(modifiedString)
  let originalpolicy = replaceKeysWithValues(miniscript, extractedKeysMap)
  let descriptor = ''
  switch(outputType) {
      case OutputDescriptorType.WSH:
        descriptor = `wsh(${originalpolicy})`
          break;
      default:
          // Miniscript expressions can only be used in wsh
           return `Error: Unsupported output type for descriptor generation: ${outputType}`;
    }

    // Return the generated descriptor string
    return descriptor;
};



export const updatePolicyValidation = (policy: PolicyListEntry): PolicyListEntry => {
    let policyString = '';
    let validationResult = { isValid: false, error: 'Policy string not generated or is empty.' }; // Updated default error

    // Determine the policy string to validate
    if ('policyString' in policy && policy.policyString) {
        // For configured or text policies with an existing string
        policyString = policy.policyString;
    } else if (isComposedPolicy(policy)) { // Use type guard for composed policies
        // For composed policies, generate the string if it doesn't exist
        policyString = generateCompositionPolicyString(policy) || '';
    } else if ('type' in policy) { // Handle other ConfiguredPolicy types (Common Patterns & Core Conditions)
        // For ConfiguredPolicy types without a generated string yet, generate it
         policyString = generateCommonPatternPolicyString(policy as CommonPatternConfig) || generateCoreConditionPolicyString(policy as CoreConditionConfig) || '';

    } else if (isTextPolicy(policy)) {
         policyString = policy.policyString; // Text policy string is already there
    }
     else {
        // Should not happen for valid PolicyListEntry types meant to have a string
        return {
            ...policy,
             isValid: false,
             validationError: 'Policy object missing policy string or data for generation.',
             policyString: ('policyString' in policy ? policy.policyString : undefined) // Keep potential partial string
        } as PolicyListEntry;
    }


    // Perform Miniscript validation on the determined string using the library
    if (policyString) {
       validationResult = validateMiniscriptPolicy(policyString);
    } else {
         validationResult = { isValid: false, error: 'Policy string is empty after generation attempt.' }; // Updated error message
    }


    // Create a new object with updated validation status
    const updatedPolicy = {
        ...policy,
        policyString: policyString, // Use the generated string (might be undefined if generation failed)
        isValid: validationResult.isValid,
        validationError: validationResult.error,
    };

     // Ensure policyString is explicitly set for composed policies if generated
     // Also ensure policyString is set for other types if generation was attempted
     if (isComposedPolicy(updatedPolicy) || 'type' in updatedPolicy || isTextPolicy(updatedPolicy)) {
          updatedPolicy.policyString = policyString; // Set the generated string
     }


    return updatedPolicy;
};
