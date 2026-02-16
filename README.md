# LandChain "Vibe-Code" Monorepo

> **India's First Conclusive Titling Blockchain POC (NITI Aayog Model Act Compliant)**

LandChain is a "Government-Grade" land registry system built on **Hyperledger Fabric**. It demonstrates how to transition from **Presumptive Titling** to **Conclusive Titling** using the **Three-Register System** (RoT, RoD, RoCC) and Smart Contracts.

## 🏗️ Tech Stack

- **Blockchain**: Hyperledger Fabric (TypeScript Chaincode)
- **Backend**: NestJS (API Gateway & Fabric SDK)
- **Frontend**: Next.js 14 + Tailwind CSS (Citizen Portal)

## 🚀 Getting Started

### Prerequisites
- Node.js v18+
- npm

### Installation
```bash
# Install dependencies for all packages
npm install
```

### Running the Vibe (Local Simulation)

Since this is a "Vibe Code" POC, we run the components in simulation mode without a heavy Docker network.

**1. Start the Backend (Mock Validator Node)**
```bash
cd packages/server
npm run start
```
*Runs on `http://127.0.0.1:3001`*

**2. Start the Frontend (Citizen Portal)**
```bash
cd packages/client
npm run dev
```
*Open `http://localhost:3000`*

## 🧪 Key Scenarios to Test

| ID | Scenario | Input ID | Expected Result |
| :--- | :--- | :--- | :--- |
| **1** | **Clean Title (RoT)** | `PARCEL_001` | ✅ **GREEN**: Conclusive Title Verified |
| **2** | **Tax Default (RoCC)** | `PARCEL_LOCKED` | ❌ **RED**: Blocked by Tax Default (Charge) |
| **3** | **Strata Unit** | `APT_101` | ✅ **GREEN**: Vertical Property Title Verified |

## 📂 Project Structure

- `packages/blockchain`: The Smart Contracts (`LandChainContract`, `AssetRegistry`).
- `packages/server`: The Bridge API (`LandController`).
- `packages/client`: The Next.js "Hero" UI.
- `docs/`: Architecture and Vision documentation.
    - [**Developer Guide**](docs/developer_guide.md): Detailed Codebase Walkthrough.

---
*Built with ❤️ for Digital India*
