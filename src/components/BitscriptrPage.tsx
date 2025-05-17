'use client'; // This is needed if you are using App Router in Next.js

import React, { useState } from 'react';
import Head from 'next/head';
import { PolicyListEntry } from '../types';
import CommonPatternsSection from './CommonPatternsSection';
import CoreConditionsSection from './CoreConditionsSection';
import MyPoliciesSection from './MyPoliciesSection';
import OutputDescriptorSection from './OutputDescriptorSection';


const BitscriptrPage: React.FC = () => {
  // State to hold all configured and composed policies/conditions
  const [policies, setPolicies] = useState<PolicyListEntry[]>([]);

  // Callback function to add a new policy to the list
  const handleAddPolicy = (policy: PolicyListEntry) => {
    // Ensure the policy has a unique ID and is marked as not selected for composition initially
    const policyToAdd = {
        ...policy,
        id: policy.id || `policy-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, // Generate ID if missing
        isSelectedForComposition: false, // Ensure this property exists
    };
    setPolicies((prevPolicies) => [...prevPolicies, policyToAdd]);
  };

   // Callback function to update the entire policies list (used after composition or text input)
  const handlePoliciesChange = (updatedPolicies: PolicyListEntry[]) => {
      setPolicies(updatedPolicies);
  };


  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4 sm:px-6 lg:px-8">
      <Head>
        <title>Bitscriptr - Bitcoin Policy Generator</title>
        <meta name="description" content="Generate Bitcoin wallet descriptors for complex Miniscript policies." />
        <link rel="icon" href="/favicon.ico" />
         {/* Ensure you have Inter font or replace with your chosen font */}
         <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" />
      </Head>

      <main className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center text-gray-900 mb-8">
          Bitscriptr <span className="text-blue-600">Builder</span>
        </h1>
        <p className="text-center text-gray-600 mb-12">
          Design custom Bitcoin spending policies and generate wallet descriptors.
        </p>

        <div className="space-y-10">
          {/* Section 1: Common Patterns */}
          <CommonPatternsSection onAddPolicy={handleAddPolicy} />

          {/* Section 2: Core Conditions */}
          <CoreConditionsSection onAddPolicy={handleAddPolicy} />

          {/* Section 3: My Policies & Composition */}
          <MyPoliciesSection policies={policies} onPoliciesChange={handlePoliciesChange} />

          {/* Section 4: Generate Descriptor */}
          <OutputDescriptorSection policies={policies} />
        </div>
      </main>
    </div>
  );
};

export default BitscriptrPage;