import React from 'react';
import { PolicyListEntry } from '../types';
import { CheckCircle2, XCircle } from 'lucide-react';

interface PolicyItemProps {
  policy: PolicyListEntry;
  onSelectForComposition: (id: string, isSelected: boolean) => void;
  showCheckbox: boolean; // Prop to control checkbox visibility
}

const PolicyItem: React.FC<PolicyItemProps> = ({ policy, onSelectForComposition, showCheckbox }) => {
  // Determine if the policy is currently selected for composition
  const isSelected = 'isSelectedForComposition' in policy ? policy.isSelectedForComposition : false;

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSelectForComposition(policy.id, e.target.checked);
  };

  // Determine the display name and policy string based on type
  let displayName = policy.name;
  let policyString = '';
   let isValid = policy.isValid;
   let validationError = policy.validationError;


  if ('policyString' in policy && policy.policyString !== undefined) {
     policyString = policy.policyString;
  } else if ('policies' in policy) {
      // For composed policies, display the generated string
       policyString = (policy as any).policyString || 'Compose policies above...';
       // For composed policies, the isValid and validationError come directly from the composition result
       isValid = (policy as any).isValid;
       validationError = (policy as any).validationError;
  } else {
      // For policies not yet configured or composed
      policyString = 'Configuration needed...';
      isValid = false; // Assume invalid until string is generated
      validationError = 'Policy string not generated yet.';
  }

  return (
    <div className="flex items-start p-4 border-b border-gray-200 last:border-b-0">
      {showCheckbox && (
           <input
              type="checkbox"
              checked={isSelected}
              onChange={handleCheckboxChange}
              className="mr-4 mt-1 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
      )}

      <div className="flex-grow">
        <h4 className="text-md font-medium text-gray-800">{displayName}</h4>
        <p className="mt-1 text-sm text-gray-600 font-mono break-all">{policyString}</p> {/* Use font-mono for code */}
         {isValid === false && validationError && (
             <p className="mt-1 text-sm text-red-600 flex items-center">
                 <XCircle size={16} className="mr-1" /> Invalid Policy: {validationError}
             </p>
         )}
           {isValid === true && (
             <p className="mt-1 text-sm text-green-600 flex items-center">
                 <CheckCircle2 size={16} className="mr-1" /> Policy is Valid (syntax check)
             </p>
         )}
      </div>
    </div>
  );
};

export default PolicyItem;