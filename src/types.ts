// Enum for the four main sections
export enum AppSection {
  CommonPatterns = 'common-patterns',
  CoreConditions = 'core-conditions',
  MyPolicies = 'my-policies',
  GenerateDescriptor = 'generate-descriptor',
}

// Enums for Common Patterns
export enum CommonPatternType {
  Vault = 'vault',
  Inheritance = 'inheritance',
  SimpleEscrow = 'simple-escrow',
}

// Enums for Core Conditions
export enum CoreConditionType {
  SingleSig = 'single-sig',
  MultiSig = 'multisig',
  Threshold = 'threshold',
  AbsoluteTimelock = 'absolute-timelock',
  RelativeTimelock = 'relative-timelock',
  Hashlock = 'hashlock',
}

// Enum for Hashing Algorithms used in Hashlock
export enum HashingAlgorithm {
  SHA256 = 'sha256',
  HASH256 = 'hash256',
  RIPEMD160 = 'ripemd160',
  HASH160 = 'hash160',
}

export enum CompositionType {
  AND = 'and',
  OR = 'or',
  THRESHOLD = 'threshold',
}

// Enum for Delay Types in Vault
export enum DelayType {
  BLOCKS = 'blocks',
  TIMESTAMP = 'timestamp',
}


// Base type for any configurable policy or condition
interface BasePolicyConfig {
  id: string; // Unique ID for the configured item
  name: string; // Display name for the configured item
  type: CommonPatternType | CoreConditionType;
  policyString?: string; // The generated Miniscript policy string (optional initially)
  isValid?: boolean; // Whether the generated policy string is valid
  validationError?: string; // Error message if validation fails
}

// --- Common Pattern Configurations ---

export interface VaultConfig extends BasePolicyConfig {
  type: CommonPatternType.Vault; // Use the new Vault enum value
  m: number;
  n: number;
  keys: string[]; // List of public keys
  delay: number; // Renamed from timeout - will be used with after()
  cancelKey: string; // Renamed from timeoutKey
}

export interface InheritanceConfig extends BasePolicyConfig {
  type: CommonPatternType.Inheritance;
  ownerKey: string;
  heirsKeys: string[]; // List of heirs' public keys
  heirsThreshold: number; // M of N for heirs
  timelock1: number; // First timelock (e.g., for heirs)
  thirdPartyKey: string;
  timelock2: number; // Second timelock (e.g., for third party)
}

export interface SimpleEscrowConfig extends BasePolicyConfig {
  type: CommonPatternType.SimpleEscrow;
  partyAKey: string;
  partyBKey: string;
  arbiterKey: string;
  timeout: number; // Timeout for arbiter path
}

// Union type for all common pattern configurations
export type CommonPatternConfig =
  | VaultConfig
  | InheritanceConfig
  | SimpleEscrowConfig;


// --- Core Condition Configurations ---

export interface SingleSigConfig extends BasePolicyConfig {
  type: CoreConditionType.SingleSig;
  key: string; // Public key
}

export interface MultiSigConfig extends BasePolicyConfig {
  type: CoreConditionType.MultiSig;
  m: number; // Required signatures
  n: number; // Total keys
  keys: string[]; // List of public keys
}

export interface ThresholdConfig extends BasePolicyConfig {
  type: CoreConditionType.Threshold;
  m: number; // Required conditions
  n: number; // Total items
  items: string[]; // e.g., List of keys or hashes
}

export interface AbsoluteTimelockConfig extends BasePolicyConfig {
  type: CoreConditionType.AbsoluteTimelock;
  timelock: number; // Absolute timelock (timestamp or block height)
}

export interface RelativeTimelockConfig extends BasePolicyConfig {
  type: CoreConditionType.RelativeTimelock;
  timelock: number; // Relative timelock (blocks)
}

export interface HashlockConfig extends BasePolicyConfig {
  type: CoreConditionType.Hashlock;
  algorithm: HashingAlgorithm; // The selected hashing algorithm
  hash: string; // Hash value (e.g., hex string)
}

// Union type for all core condition configurations
export type CoreConditionConfig =
  | SingleSigConfig
  | MultiSigConfig
  | ThresholdConfig
  | AbsoluteTimelockConfig
  | RelativeTimelockConfig
  | HashlockConfig;


// Interface for a Policy Item (Configured or Text) - has selection capability
export interface SelectablePolicyItem extends BasePolicyConfig {
   isSelectedForComposition: boolean;
}

// Configuration for a composed policy - now also has selection capability
export interface ComposedPolicyConfig { // Removed extends BasePolicyConfig here as we add base properties directly
  id: string; // Unique ID
  name: string; // Name generated from the composition
  type: CompositionType; // AND, OR, or THRESHOLD
  policies: PolicyListEntry[]; // The policies being composed
  threshold?: number; // Required for Threshold composition (M value)

  // Properties from BasePolicyConfig, now added explicitly
  policyString?: string; // The generated Miniscript policy string
  isValid?: boolean; // Whether the generated policy string is valid
  validationError?: string; // Error message if validation fails

  // Added selection capability
  isSelectedForComposition: boolean;
}


// Type for an explicitly entered text policy - has selection capability
// Reverting TextPolicy extends BasePolicyConfig for clarity on what's included
export interface TextPolicy {
  id: string; // Unique ID
  name: string; // Usually "Custom Policy"
  policyString: string;
  isValid?: boolean; // Whether the policy string is valid
  validationError?: string; // Error message if validation fails
  isSelectedForComposition: boolean;
   // Note: Does not have a 'type' field like ConfiguredPolicy
}



export type SelectablePolicyItemType = TextPolicy;


// Union type for any item that can be in the policies list (configured, composed, or text)
// All types in this union that are selectable for composition *must* have the isSelectedForComposition property
export type PolicyListEntry = SelectablePolicyItemType | ComposedPolicyConfig;


// Enum for Output Descriptor Types
export enum OutputDescriptorType {
WSH = 'wsh', // SegWit Script Hash
// TR = 'tr',   // Taproot (currently wsh is more common for complex miniscript)
}

// Helper function to check if a policy list entry is selectable (has the isSelectedForComposition prop)
// This is useful for type narrowing in components
export const isSelectablePolicy = (policy: PolicyListEntry): policy is SelectablePolicyItemType | ComposedPolicyConfig | TextPolicy => { // Corrected type guard union
  return 'isSelectedForComposition' in policy;
}

// Helper function to check if a policy list entry is a composed policy
export const isComposedPolicy = (policy: PolicyListEntry): policy is ComposedPolicyConfig => {
  return 'policies' in policy && 'type' in policy && (policy.type === CompositionType.AND || policy.type === CompositionType.OR || policy.type === CompositionType.THRESHOLD);
}

// Helper function to check if a policy list entry is a text policy
export const isTextPolicy = (policy: PolicyListEntry): policy is TextPolicy => {
  // Text policies don't have a 'type' property from the enums or 'policies' property
  return 'policyString' in policy && !('type' in policy) && !('policies' in policy);
}
