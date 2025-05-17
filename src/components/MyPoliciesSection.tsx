import React, { useState, useEffect } from 'react';
import {
  PolicyListEntry,
  PolicyListItem,
  ComposedPolicyConfig,
  CompositionType,
  TextPolicy,
  isSelectablePolicy, // Import the type guard
  isComposedPolicy, // Import the type guard
} from '../types';
import { generateUniqueId, generateCompositionPolicyString, updatePolicyValidation, validateMiniscriptPolicy } from '../utils'; // Import utils including generateUniqueId
import PolicyItem from './PolicyItem';

interface MyPoliciesSectionProps {
  policies: PolicyListEntry[];
  onPoliciesChange: (policies: PolicyListEntry[]) => void; // Callback to update policies in parent
}

const MyPoliciesSection: React.FC<MyPoliciesSectionProps> = ({ policies, onPoliciesChange }) => {
  // We still need selectedPolicies to track IDs for the compose button logic
  const [selectedPolicies, setSelectedPolicies] = useState<string[]>([]);
  const [compositionType, setCompositionType] = useState<CompositionType | null>(null);
  const [thresholdM, setThresholdM] = useState<number>(1);
  const [textPolicy, setTextPolicy] = useState<string>('');
  const [textPolicyError, setTextPolicyError] = useState<string | null>(null);


  // Effect to keep `selectedPolicies` (IDs) in sync with the `isSelectedForComposition` property
  // This effect runs whenever the main `policies` list changes
  useEffect(() => {
      const currentlySelectedIds = policies
        .filter(isSelectablePolicy) // Only consider policies that can be selected
        .filter(policy => policy.isSelectedForComposition)
        .map(policy => policy.id);
      setSelectedPolicies(currentlySelectedIds);
  }, [policies]);


  const handleSelectForComposition = (id: string, isSelected: boolean) => {
    // Update the `policies` array by finding the policy and toggling its isSelectedForComposition prop
    const updatedPolicies = policies.map(policy => {
      // Only update if the policy is selectable
      if (isSelectablePolicy(policy) && policy.id === id) {
         // Create a new object with the updated isSelectedForComposition status
         return { ...policy, isSelectedForComposition: isSelected };
      }
      return policy; // Return other policies as is
    });

    // Use the parent callback to update the main policies state
    onPoliciesChange(updatedPolicies);

    // The useEffect above will automatically update `selectedPolicies` (the array of IDs)
    // based on the changes we just made to the `policies` array.
  };

  const handleCompose = () => {
    if (!compositionType) {
      alert('Please select a composition type (AND, OR, Threshold).');
      return;
    }

    // Get policies based on their `isSelectedForComposition` property, filtering only selectable types
    const policiesToCompose = policies.filter(isSelectablePolicy).filter(p => p.isSelectedForComposition);


    if (policiesToCompose.length < 2 && compositionType !== CompositionType.THRESHOLD) {
        alert(`Please select at least two policies for ${compositionType.toUpperCase()} composition.`);
        return;
    }

     // Specific validation for AND/OR
    if ((compositionType === CompositionType.AND || compositionType === CompositionType.OR) && policiesToCompose.length !== 2) {
         alert(`AND and OR composition require exactly two selected policies.`);
         return;
    }

     // Specific validation for Threshold
    if (compositionType === CompositionType.THRESHOLD) {
        if (policiesToCompose.length < 2) {
             alert('Threshold composition requires at least two policies.');
             return;
        }
        if (thresholdM < 1 || thresholdM > policiesToCompose.length) {
             alert(`Threshold M value must be between 1 and the number of selected policies (${policiesToCompose.length}).`);
             return;
        }
    }

    // Create the new composed policy object
    const composedPolicy: ComposedPolicyConfig = {
      id: generateUniqueId('composed'),
      name: `Composed (${compositionType.toUpperCase()})`,
      type: compositionType, // AND, OR, or THRESHOLD
      policies: policiesToCompose as PolicyListEntry[], // Policies being composed - should be SelectablePolicyItem or TextPolicy
      threshold: compositionType === CompositionType.THRESHOLD ? thresholdM : undefined,
      isSelectedForComposition: false, // New composed policy is not selected initially

      // Initialize BasePolicyConfig properties
      policyString: undefined, // Will be generated and validated below
      isValid: undefined,
      validationError: undefined,
    };

    // Generate and validate the composed policy string
    const validatedComposedPolicy = updatePolicyValidation(composedPolicy);

    // Add the new composed policy to the list
    const finalPolicies = [...policies, validatedComposedPolicy];

     // After composing, deselect all policies that were just used in the composition
     const deselectedPolicies = finalPolicies.map(p => {
         // Check if the policy is one of the ones that were just composed AND is selectable
         if (isSelectablePolicy(p) && policiesToCompose.some(compPolicy => compPolicy.id === p.id)) {
              return { ...p, isSelectedForComposition: false };
         }
         return p;
     });

    onPoliciesChange(deselectedPolicies); // Update parent state
    // setSelectedPolicies([]); // Use useEffect to sync this
    setCompositionType(null);
    setThresholdM(1); // Reset threshold M
  };

  const handleAddTextPolicy = () => {
      const policyString = textPolicy.trim();
      if (!policyString) {
          setTextPolicyError('Policy string cannot be empty.');
          return;
      }

       // Determine the next number for the custom policy
       const customPolicyCount = policies.filter(p => p.name.startsWith('Custom Policy')).length;
       const nextCustomPolicyNumber = customPolicyCount + 1;
       const customPolicyName = `Custom Policy ${nextCustomPolicyNumber}`;


       // Validate the text policy string
      const { isValid, error } = validateMiniscriptPolicy(policyString);

      const newTextPolicy: TextPolicy = {
          id: generateUniqueId('text'),
          name: customPolicyName, // Use the generated name
          policyString: policyString,
          isValid: isValid,
          validationError: error,
          isSelectedForComposition: false, // Default to not selected
      };

      const updatedPolicies = [...policies, newTextPolicy];
      onPoliciesChange(updatedPolicies);
      setTextPolicy('');
      setTextPolicyError(null);
  };


   // Filter policies that are currently selected for composition based on the prop
  const policiesSelectedForComposition = policies.filter(isSelectablePolicy).filter(p => p.isSelectedForComposition);


  return (
    <section className="mb-8">
      {/* Main Section Heading - text-gray-900 */}
      <h2 className="text-xl font-bold mb-4 text-gray-900">3. My Policies & Composition</h2>

      <div className="bg-gray-100 p-4 rounded-md mb-6 max-h-96 overflow-y-auto custom-scrollbar">
        {/* Subheading: Configured Policies - kept text-gray-700 as requested previously */}
        <h3 className="text-lg font-semibold mb-3 sticky top-0 bg-gray-100 z-10 text-gray-700">Configured Policies</h3>
        {policies.length === 0 ? (
          <p className="text-gray-500">No policies added yet. Configure patterns or conditions above.</p>
        ) : (
          policies.map((policy) => (
            // Show checkbox only if the policy object type has the isSelectablePolicy property
            <PolicyItem
              key={policy.id}
              policy={policy}
              onSelectForComposition={handleSelectForComposition}
              showCheckbox={isSelectablePolicy(policy)}
            />
          ))
        )}
      </div>

       <div className="mt-6 p-4 border rounded-md bg-gray-50">
           {/* Subheading: Manual Policy Input - Added text-gray-600 */}
           <h3 className="text-lg font-semibold mb-2 text-gray-600">Manual Policy Input (Advanced)</h3>
           <textarea
               value={textPolicy}
               onChange={(e) => setTextPolicy(e.target.value)}
               placeholder="Enter a Miniscript policy string directly (e.g., 'pk(PUBKEY)' or 'and(pk(A),pk(B))')"
               rows={4}
               className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm text-gray-600 placeholder-gray-500"
           />
           {textPolicyError && <p className="mt-1 text-sm text-red-600">{textPolicyError}</p>}
           <button
               onClick={handleAddTextPolicy}
               className="mt-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
           >
               Add Policy from Text
           </button>
       </div>


      <div className="mt-6 p-4 border rounded-md bg-gray-50">
        {/* Subheading: Compose Selected Policies - Added text-gray-600 */}
        <h3 className="text-lg font-semibold mb-2 text-gray-600">Compose Selected Policies</h3>

         {/* Display count and list of selected policies */}
        {policiesSelectedForComposition.length > 0 ? (
             <>
                <p className="text-sm text-gray-700 mb-2">
                    Policies selected ({policiesSelectedForComposition.length}):
                </p>
                <ul className="list-disc list-inside text-sm text-gray-600 mb-4"> {/* Added bottom margin */}
                   {policiesSelectedForComposition.map(p => (
                       // Check if it's a composed policy to maybe display slightly differently if needed
                       <li key={`selected-comp-${p.id}`}>
                            {isComposedPolicy(p) ? `[Composed] ${p.name}` : p.name}
                        </li>
                   ))}
                </ul>
             </>
        ) : (
            <p className="text-sm text-gray-700 mb-4">Select policies from the list above to combine them.</p>
        )}


        <div className="flex items-center space-x-4 mb-4">
          <label className="block text-sm font-medium text-gray-700">Composition Type:</label>
          <select
            value={compositionType || ''}
            onChange={(e) => setCompositionType(e.target.value as CompositionType)}
            className="mt-1 block rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm text-gray-600"
          >
            <option value="">Select...</option>
            <option value={CompositionType.AND}>AND</option>
            <option value={CompositionType.OR}>OR</option>
            <option value={CompositionType.THRESHOLD}>Threshold (M of N)</option>
          </select>

          {compositionType === CompositionType.THRESHOLD && (
              <div>
                <label className="ml-4 text-sm font-medium text-gray-700">M (Required):</label>
                <input
                    type="number"
                    value={thresholdM}
                    onChange={(e) => setThresholdM(parseInt(e.target.value, 10) || 0)}
                    min="1"
                    // Max M is the number of currently selected policies
                    max={policiesSelectedForComposition.length}
                    className="ml-2 inline-block w-20 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm text-gray-600 placeholder-gray-500"
                />
              </div>
          )}
        </div>

        <button
          onClick={handleCompose}
           // Disabled if no composition type, or if not enough policies are selected, or if Threshold M is invalid
          disabled={
               !compositionType ||
               policiesSelectedForComposition.length === 0 ||
               (compositionType === CompositionType.AND || compositionType === CompositionType.OR) && policiesSelectedForComposition.length !== 2 ||
               compositionType === CompositionType.THRESHOLD && (thresholdM < 1 || thresholdM > policiesSelectedForComposition.length)
          }
          className={`w-full inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white ${
             (!compositionType ||
              policiesSelectedForComposition.length === 0 ||
               (compositionType === CompositionType.AND || compositionType === CompositionType.OR) && policiesSelectedForComposition.length !== 2 ||
               compositionType === CompositionType.THRESHOLD && (thresholdM < 1 || thresholdM > policiesSelectedForComposition.length)
             )
               ? 'bg-gray-400 cursor-not-allowed'
               : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
           }`}
        >
          Compose Policies
        </button>
      </div>
    </section>
  );
};

export default MyPoliciesSection;