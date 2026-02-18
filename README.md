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

### Running the Full Stack (Docker) - Recommended
The easiest way to run the entire system (Blockchain + API + UI) is via Docker Compose.

```bash
docker-compose up --build
```
*   **Frontend**: `http://localhost:3001`
*   **Backend**: `http://localhost:3000`
*   **Fabric**: `localhost:7051`

### Running Locally (Dev Mode)
If you want to run components individually for debugging:

**1. Start the Backend (Mock Mode)**
```bash
cd packages/server
# Set USE_MOCK_FABRIC=true to bypass Docker requirement
USE_MOCK_FABRIC=true npm run start
```

**2. Start the Frontend**
```bash
cd packages/client && npm run dev
```

## 🧪 Key Scenarios to Test

| ID | Scenario | Input ID | Expected Result |
| :--- | :--- | :--- | :--- |
| **1** | **Clean Title (RoT)** | `MH12PUNE010001` | ✅ **GREEN**: Conclusive Title Verified |
| **2** | **Tax Default (RoCC)** | `MH12LOCK000001` | ❌ **RED**: Blocked by Tax Default (Charge) |
| **3** | **Strata Unit** | `MH12APT00101` | ✅ **GREEN**: Vertical Property Title Verified |

## 📂 Project Structure

- `packages/blockchain`: The Smart Contracts (`LandChainContract`, `AssetRegistry`).
- `packages/server`: The Bridge API (`LandController`).
- `packages/client`: The Next.js "Hero" UI.
- `packages/blockchain`: The Smart Contracts (`LandChainContract`, `AssetRegistry`).
- `packages/server`: The Bridge API (`LandController`).
- `packages/client`: The Next.js "Hero" UI.
- `docs/`: Architecture and Vision documentation.
    - [**Developer Guide**](docs/developer_guide.md): Detailed Codebase Walkthrough.
    - [**Administrative Engine**](docs/architecture.md): Transaction Decoupling & RBAC.
    - [**Manual Test Guide**](manual_test_guide.md): How to test the 2-Step Transfer.

## 🏛️ Administrative Engine (New)
We have implemented a **Transaction Decoupling** model:
1.  **Initiate Transfer**: Sellers/Buyers sign the deed. Asset Status -> `PENDING_MUTATION`.
2.  **Scrutiny Period**: 30-Day public notice window (simulated).
3.  **Approve Mutation**: Registrar Finalizes the transfer -> Conclusive Title.

---
*Built with ❤️ for Digital India*
