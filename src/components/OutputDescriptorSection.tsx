import React, { useState } from 'react';
import { PolicyListEntry, OutputDescriptorType, isSelectablePolicy, isComposedPolicy, isTextPolicy } from '../types'; // Import type guards
import { generateDescriptor, updatePolicyValidation } from '../utils'; // Import validation utility
import { Clipboard } from 'lucide-react'; // Import the Clipboard icon

interface OutputDescriptorSectionProps {
  policies: PolicyListEntry[];
}

const outputTypes = [
  { type: OutputDescriptorType.WSH, name: 'Wrapped SegWit Script Hash (wsh)' },
];

const OutputDescriptorSection: React.FC<OutputDescriptorSectionProps> = ({ policies }) => {
  const [selectedPolicyId, setSelectedPolicyId] = useState<string | null>(null);
  const [selectedOutputType, setSelectedOutputType] = useState<OutputDescriptorType | null>(null);
  const [generatedDescriptor, setGeneratedDescriptor] = useState<string | null>(null);
   const [error, setError] = useState<string | null>(null);
   const [copied, setCopied] = useState(false); // State to track if descriptor is copied

  const handleGenerateDescriptor = () => {
    setError(null); // Clear previous errors
    setGeneratedDescriptor(null); // Clear previous descriptor
    setCopied(false); // Reset copied status

    if (!selectedPolicyId) {
      setError('Please select a policy from the list.');
      return;
    }
    if (!selectedOutputType) {
      setError('Please select an output descriptor type.');
      return;
    }

    const policy = policies.find(p => p.id === selectedPolicyId);

    if (!policy) {
      setError('Selected policy not found.');
      return;
    }

     // Re-validate the selected policy just in case
     // Note: This validation is basic. Real Miniscript validation needed in utils.ts
     const validatedPolicy = updatePolicyValidation(policy);

     if (!validatedPolicy.isValid || !validatedPolicy.policyString) {
          setError(`Selected policy is invalid or has no generated policy string: ${validatedPolicy.validationError || 'Unknown error'}`);
          // Display the policy string if available, even if invalid
          if (validatedPolicy.policyString) { // Check if policyString exists on the validated object
               setGeneratedDescriptor(`Attempted policy string: ${validatedPolicy.policyString}`);
          }
          return;
     }

    // Generate the descriptor
    const descriptor = generateDescriptor(validatedPolicy.policyString, selectedOutputType);

    if (descriptor && !descriptor.startsWith('Error')) { // Check if generateDescriptor returned an error string
      setGeneratedDescriptor(descriptor);
    } else {
        setError(descriptor || 'Failed to generate descriptor.'); // Set error if generation failed
    }
  };

   const handleCopy = async () => {
       if (generatedDescriptor) {
           try {
               await navigator.clipboard.writeText(generatedDescriptor);
               setCopied(true);
               // Hide the "Copied!" message after 2 seconds
               setTimeout(() => {
                   setCopied(false);
               }, 2000);
           } catch (err) {
               console.error('Failed to copy descriptor: ', err);
               // Optionally, show an error message to the user
               setError('Failed to copy descriptor.');
           }
       }
   };


  return (
    <section className="mb-8">
      {/* Added text-gray-900 */}
      <h2 className="text-xl font-bold mb-4 text-gray-900">4. Generate Descriptor</h2>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700">Select Policy to Generate Descriptor For:</label>
        <select
          value={selectedPolicyId || ''}
          onChange={(e) => setSelectedPolicyId(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm text-gray-600" // Added text-gray-600 here
        >
          <option value="">Select a policy...</option>
          {policies.map((policy) => (
            <option key={policy.id} value={policy.id}>
              {/* Display name and preview of policy string */}
               {isComposedPolicy(policy) ? `[Composed] ${policy.name}` : policy.name}
               {'policyString' in policy && policy.policyString ? ` (${policy.policyString.substring(0, 50)}${policy.policyString.length > 50 ? '...' : ''})` : ' (Not configured)'}
            </option>
          ))}
        </select>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700">Select Output Descriptor Type:</label>
        <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-4">
          {outputTypes.map((outputType) => (
            <div key={outputType.type} className="flex items-center">
              <input
                id={`output-type-${outputType.type}`}
                name="output-type"
                type="radio"
                value={outputType.type}
                checked={selectedOutputType === outputType.type}
                onChange={(e) => setSelectedOutputType(e.target.value as OutputDescriptorType)}
                className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300"
              />
              <label htmlFor={`output-type-${outputType.type}`} className="ml-2 block text-sm text-gray-900">
                {outputType.name}
              </label>
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={handleGenerateDescriptor}
        disabled={!selectedPolicyId || !selectedOutputType}
        className={`w-full inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white ${
           !selectedPolicyId || !selectedOutputType
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
        }`}
      >
        Generate Descriptor
      </button>

       {error && (
           <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-md">
               <p className="font-semibold">Error:</p>
               <p className="text-sm break-all">{error}</p>
           </div>
       )}

      {generatedDescriptor && (
        <div className="mt-6 p-4 bg-green-100 border border-green-400 text-green-700 rounded-md">
          <h3 className="text-lg font-semibold mb-2 flex items-center justify-between">
             Generated Descriptor:
             {/* Copy Button/Icon */}
             <button
                onClick={handleCopy}
                className="ml-4 p-1 rounded hover:bg-green-200 transition-colors flex items-center text-green-800"
                title="Copy to clipboard"
             >
                 <Clipboard size={20} />
                 {copied && <span className="ml-2 text-sm font-medium">Copied!</span>}
             </button>
          </h3>
          <p className="text-sm break-all font-mono">{generatedDescriptor}</p>
        </div>
      )}
    </section>
  );
};

export default OutputDescriptorSection;