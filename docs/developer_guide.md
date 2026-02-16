# LandChain Developer Guide

This document provides a comprehensive overview of the LandChain project, including its vision, structure, and core logic components.

## 1. Project Overview and Vision
For high-level context on why the project exists and its primary goals, refer to the Vision and Whitepaper documents:

*   **[Vision](vision.md)**: Outlines the core mission of transforming land registration in India from presumptive to conclusive proof.
*   **[Whitepaper](whitepaper.md)**: Provides a deep dive into the "Mutation Gap" problem and the proposed blockchain solution.
*   **[Compliance](compliance.md)**: Specifically maps the codebase logic to sections of the NITI Aayog Model Act.

## 2. File and Monorepo Structure
The project is organized as a monorepo to separate the blockchain logic from the application layers:

*   **`packages/blockchain`**: Contains the "Source of Truth" including Smart Contracts (Chaincode) and asset definitions.
*   **`packages/server`**: A NestJS backend that acts as the bridge between the blockchain and external APIs.
*   **`packages/client`**: A Next.js frontend providing the user interface for citizens and government officials.

## 3. Core Blockchain Logic (The "Smart" Layer)
To understand the functions, parameters, and return purposes of the core logic, examine the files in `packages/blockchain/src/`:

### Contracts
*   **[`LandChainContract.ts`](../packages/blockchain/src/contracts/LandChainContract.ts)**: The primary entry point. It contains transactions like `createParcel`, `recordIntimation`, and `transferParcel`.
    *   **`recordIntimation`**: Parameters include `category` (DISPUTE/CHARGE) and `issuer`. It returns nothing but updates the ledger state to lock or flag a property.
    *   **`transferParcel`**: Performs "Atomic Mutation" by checking for active disputes or charges before updating ownership.

### Logic Helpers
*   **[`AssetRegistry.ts`](../packages/blockchain/src/logic/AssetRegistry.ts)**: Handles the recursive subdivision logic (e.g., splitting Gat 45 into 45/1).
*   **[`LifecycleManager.ts`](../packages/blockchain/src/logic/LifecycleManager.ts)**: Manages the conversion of land use (e.g., Agricultural to Non-Agricultural).
*   **[`EncumbranceLogic.ts`](../packages/blockchain/src/logic/EncumbranceLogic.ts)**: Contains the logic for processing tax defaults and bank liens.

## 4. Data Schemas (Asset Definitions)
The "State" of the blockchain is defined by these classes in `packages/blockchain/src/assets/`:

*   **[`LandParcel.ts`](../packages/blockchain/src/assets/LandParcel.ts)**: The base 2D land object containing `surveyNo`, `subDivision`, and `geoJson`.
*   **[`StrataUnit.ts`](../packages/blockchain/src/assets/StrataUnit.ts)**: Defines vertical units (flats/shops) and their Undivided Share (UDS) of the parent land.
*   **[`TitleRecord.ts`](../packages/blockchain/src/assets/TitleRecord.ts)**: Maps to the Register of Titles (RoT), storing owner hashes and the `isConclusive` status.
*   **[`ChargeRecord.ts`](../packages/blockchain/src/assets/ChargeRecord.ts)** and **[`DisputeRecord.ts`](../packages/blockchain/src/assets/DisputeRecord.ts)**: Map to the Register of Charges (RoCC) and Register of Disputes (RoD) respectively.

## 5. API and Integration Layer
For the "how" of external communication, refer to:

*   **[`docs/api.md`](api.md)**: Lists the REST endpoints for interacting with the blockchain.
*   **[`fabric.service.ts`](../packages/server/src/fabric/fabric.service.ts)**: Shows how the backend connects to the Hyperledger Fabric network to invoke transactions.
