// src/utils.ts

import {
  CommonPatternConfig,
  CoreConditionConfig,
  ConfiguredPolicy,
  ComposedPolicyConfig,
  TextPolicy,
  PolicyListEntry,
  CompositionType,
  OutputDescriptorType,
  HashlockConfig, // Import HashlockConfig
  CoreConditionType, // Import CoreConditionType
  HashingAlgorithm, // Import HashingAlgorithm
} from './types';
import { Descriptors } from '@bitcoinerlab/miniscript';

// Helper to generate a unique ID
export const generateUniqueId = (prefix: string = 'policy'): string => {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

// --- Policy String Generation Functions ---

// Placeholder function to generate Miniscript string from common pattern config
// THIS IS A SIMPLIFIED PLACEHOLDER. Implement real Miniscript logic here.
export const generateCommonPatternPolicyString = (
  config: CommonPatternConfig
): string | undefined => {
  try {
    switch (config.type) {
      case 'multisig-timeout':
        // Example: or(and(thresh(M,pk(key1),...),after(timeout)),pk(timeoutKey))
        const multisigKeys = config.keys.map(key => `pk(${key})`).join(',');
        return `or(and(thresh(${config.m},${multisigKeys}),after(${config.timeout})),pk(${config.timeoutKey}))`;
      case 'vault':
        // Example: or(and(pk(destKey),after(delayBlocks)),and(pk(cancelKey),and(older(1),not(after(delayBlocks)))))
        return `or(and(pk(${config.destKey}),after(${config.delayBlocks})),and(pk(${config.cancelKey}),and(older(1),not(after(${config.delayBlocks})))))`;
      case 'inheritance':
         // Example: or(pk(Owner),thresh(M,pk(Heir1),...,older(Timelock1)),and(pk(ThirdParty),older(Timelock2)))
         const heirsKeys = config.heirsKeys.map(key => `pk(${key})`).join(',');
         return `or(pk(${config.ownerKey}),thresh(${config.heirsThreshold},${heirsKeys},older(${config.timelock1})),and(pk(${config.thirdPartyKey}),older(${config.timelock2})))`;
      case 'simple-escrow':
        // Example: or(and(pk(PartyA),pk(PartyB)),and(pk(Arbiter),after(Timeout)))
        return `or(and(pk(${config.partyAKey}),pk(${config.partyBKey})),and(pk(${config.arbiterKey}),after(${config.timeout})))`;
      default:
        return undefined;
    }
  } catch (e) {
    console.error('Error generating policy string for common pattern:', e);
    return undefined;
  }
};

// Placeholder function to generate Miniscript string from core condition config
// THIS IS A SIMPLIFIED PLACEHOLDER. Implement real Miniscript logic here.
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
                // This is trickier as it applies to other policies.
                // In the core condition section, maybe Threshold means M of N *keys* or *hashes*?
                // Assuming M of N keys/items for simplicity here as a core condition fragment.
                const items = config.items.join(','); // Could be pk(), hash(), etc.
                return `thresh(${config.m},${items})`;
            case CoreConditionType.AbsoluteTimelock:
                return `after(${config.timelock})`;
            case CoreConditionType.RelativeTimelock:
                return `older(${config.timelock})`;
            case CoreConditionType.Hashlock:
                const hlConfig = config as HashlockConfig;
                 // Use the selected algorithm and hash from the config
                 return `${hlConfig.algorithm}(${hlConfig.hash})`;
            default:
                return undefined;
        }
    } catch (e) {
        console.error('Error generating policy string for core condition:', e);
        return undefined;
    }
};

// Function to generate Miniscript string for composition
// THIS IS A SIMPLIFIED PLACEHOLDER. Implement real Miniscript logic here.
export const generateCompositionPolicyString = (
    composition: ComposedPolicyConfig
): string | undefined => {
    const policyStrings = composition.policies.map(p => p.policyString).filter(Boolean) as string[];
    if (policyStrings.length === 0) return undefined;

    try {
        switch (composition.type) {
            case CompositionType.AND:
                if (policyStrings.length !== 2) return undefined; // Basic validation already done in UI, but double check
                return `and(${policyStrings[0]},${policyStrings[1]})`;
            case CompositionType.OR:
                if (policyStrings.length !== 2) return undefined; // Basic validation already done in UI, but double check
                return `or(${policyStrings[0]},${policyStrings[1]})`;
            case CompositionType.THRESHOLD:
                 if (composition.threshold === undefined || composition.threshold < 1 || composition.threshold > policyStrings.length) return undefined;
                 // Note: thresh takes M, and then N items.
                 // A simple composition might look like thresh(M,policy1,policy2,...)
                 // More complex Miniscript composition might involve wrappers like sortedmulti or combining conditions more flexibly.
                 // Using a simple thresh wrapper here for demonstration.
                 return `thresh(${composition.threshold},${policyStrings.join(',')})`;
            default:
                return undefined;
        }
    } catch (e) {
        console.error('Error generating policy string for composition:', e);
        return undefined;
    }
};


// --- Validation Functions ---

// Placeholder function to validate a Miniscript policy string
// Implement validation using @bitcoinerlab/miniscript here.
// This basic version only checks for non-empty string and performs basic hash validation.
export const validateMiniscriptPolicy = (
  policyString: string | undefined
): { isValid: boolean; error?: string } => {
  if (!policyString) {
    return { isValid: false, error: 'Policy string is empty.' };
  }

  // Basic check for non-empty string
  if (policyString.trim().length === 0) {
       return { isValid: false, error: 'Policy string is empty after trimming.' };
  }

   // --- REAL MINISCRIPT VALIDATION GOES HERE ---
   // Use @bitcoinerlab/miniscript to parse/validate the policy string.
   // This involves checking syntax, script size, standardness, etc.
   // Example (conceptual, check library docs for Policy.fromString or similar):
   // try {
   //     const policy = Policy.fromString(policyString);
   //     // If parsing succeeds, it's likely syntactically valid Miniscript.
   //     // You might add further checks using the library if available.
   //     return { isValid: true };
   // } catch (e: any) {
   //     return { isValid: false, error: `Miniscript validation failed: ${e.message}` };
   // }
   // --- END REAL MINISCRIPT VALIDATION ---


   // Fallback Placeholder Validation:
   // We already do some basic validation during configuration (e.g., hex length for hash).
   // This function should ideally do a more thorough *Miniscript* validation.
   // For now, just pass the basic config validation result if available,
   // or assume valid if the string is non-empty as a simple placeholder.
   // In a real app, you would rely on the @bitcoinerlab/miniscript parsing here.

   // If the policy string was generated from a configuration with client-side validation
   // that failed, that error is usually carried over. This validation is more about the
   // *structure* of the final policy string itself.

  // Simple check for hashlock format based on string pattern if it looks like one
   const hashlockMatch = policyString.match(/^((sha256|hash256)\(([0-9a-fA-F]{64}|H)\)|(ripemd160|hash160)\(([0-9a-fA-F]{40}|H)\))$/i);
   if (hashlockMatch) {
       return { isValid: true }; // Looks like a valid hashlock format
   }

  // Default placeholder: Assume valid if non-empty string (until real library validation is added)
  return { isValid: true }; // Assume valid for now if non-empty and not obviously invalid hashlock


};

// Function to update validation status for a policy list entry
export const updatePolicyValidation = (policy: PolicyListEntry): PolicyListEntry => {
    let policyString = '';
    let validationResult = { isValid: false, error: 'Policy string not generated.' };

    if ('policyString' in policy && policy.policyString) {
        // For configured or text policies with an existing string
        policyString = policy.policyString;
        // Perform Miniscript validation on the string
        validationResult = validateMiniscriptPolicy(policyString);
    } else if ('policies' in policy) {
        // For composed policies, generate and validate the generated string
        policyString = generateCompositionPolicyString(policy as ComposedPolicyConfig) || '';
         if (policyString) {
            validationResult = validateMiniscriptPolicy(policyString);
         } else {
             validationResult = { isValid: false, error: 'Could not generate policy string for composition.' };
         }
    } else {
        // Should not happen if policy generation is done correctly before adding to list
        validationResult = { isValid: false, error: 'Policy object missing policy string or composition data.' };
    }


    // Create a new object with updated validation status
    const updatedPolicy = {
        ...policy,
        policyString: policyString || ('policyString' in policy ? policy.policyString : undefined), // Keep original if generation failed
        isValid: validationResult.isValid,
        validationError: validationResult.error,
    };

    // Ensure policyString is explicitly set for composed policies if generated
    if ('policies' in updatedPolicy) {
         (updatedPolicy as ComposedPolicyConfig).policyString = policyString;
    }


    return updatedPolicy;
};


// --- Descriptor Generation Function ---

// Placeholder function to generate the final descriptor string
// Implement real descriptor generation using @bitcoinerlab/miniscript here.
// Note: Miniscript policy string needs to be compiled into a script before generating a descriptor.
export const generateDescriptor = (
  policyString: string,
  outputType: OutputDescriptorType
): string | undefined => {
  if (!policyString || !outputType) {
    return undefined;
  }

  try {
    // --- REAL MINISCRIPT COMPILATION AND DESCRIPTOR GENERATION GOES HERE ---
    // Use @bitcoinerlab/miniscript to convert policy string to a script,
    // and then generate the descriptor.
    // This is a complex step depending on the library's API and the specifics of BIPs.
    // Example (conceptual, check library docs):
    // const policy = Policy.fromString(policyString);
    // const script = policy.compile(); // Or similar compilation step
    // const network = networks.bitcoin; // Or networks.testnet/regtest
    // const descriptor = Descriptors.fromScript(script, { network, outputType }).toString(); // Needs real API
    // return descriptor;
    // --- END REAL IMPLEMENTATION ---


     // Basic placeholder for wsh and tr, just wrapping the policy string.
     // THIS IS NOT A REAL DESCRIPTOR. It does NOT include checksums, derivation paths, or the compiled script.
     // Replace with actual @bitcoinerlab/miniscript calls.
    let descriptorPrefix = '';
    switch (outputType) {
      case OutputDescriptorType.WSH:
         descriptorPrefix = 'wsh(';
        break;
      case OutputDescriptorType.TR:
        // Taproot descriptors are more complex. This placeholder is incorrect for tr().
        // A real implementation needs to handle Tapscript compilation and tr() structure.
         descriptorPrefix = 'tr('; // Conceptual placeholder
        break;
      default:
         return `Error: Unsupported output type for placeholder descriptor generation: ${outputType}`;
    }

    const placeholderDescriptor = `${descriptorPrefix}${policyString})`;

    return placeholderDescriptor; // Return placeholder for now
  } catch (e: any) {
    console.error('Error generating descriptor:', e);
    return `Error generating descriptor: ${e.message}`;
  }
};