# Bitscriptr
Bitscriptr is a service for generating Bitcoin wallet descriptors for miniscript policies. It takes the user's desired security rules (the Miniscript policy, e.g., "require two signatures, or one signature after a year if a specific person isn't available") and automatically generates the correct Bitcoin wallet descriptor. 

This descriptor which can then be imported into bitcoin core or hardware wallets such as ledger, blockstream jade, BitBox02 etc allowing them to correctly track the funds and build spending transactions according to those complex rules, all without the user needing to understand the underlying bitcoin scripting language.

Using Bitscriptr, you can set up truly unique and powerful security rules for your Bitcoin, beyond what standard wallets typically offer.


## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```
