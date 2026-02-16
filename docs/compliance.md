# Legal to Code Mapping (NITI Aayog Model Act)

LandChain is the **reference implementation** of the **Model Conclusive Land Titling Act**.

## 1. The Three Registers (Section 2 & 5)

| Act Requirement | LandChain Implementation |
| :--- | :--- |
| **Register of Titles (RoT)** | `LandParcel.title` (Type: `TitleRecord`). Stores conclusive ownership shares. |
| **Register of Disputes (RoD)** | `LandParcel.disputes` (Type: `DisputeRecord[]`). Stores pending litigation. |
| **Register of Charges (RoCC)** | `LandParcel.charges` (Type: `ChargeRecord[]`). Stores mortgages and liens. |

## 2. Compulsory Intimation (Section 12)

| Act Requirement | Code Implementation |
| :--- | :--- |
| **Banks/FI**: Must intimate mortgages. | `recordIntimation(category='CHARGE', type='MORTGAGE')`. Locks the Title. |
| **Courts**: Must intimate suits. | `recordIntimation(category='DISPUTE', type='CIVIL_SUIT')`. Tags Title as `LITIGATION`. |
| **Section 55**: Void Transactions. | `transferParcel` REJECTS any tx if `RoD` or `RoCC` has active blocking entries. |

## 3. Conclusivity & Indemnity (Section 16 & 18)

| Act Requirement | Code Implementation |
| :--- | :--- |
| **3 Year Window**: Titles become conclusive after 3 years. | `finalizeTitle()` checks `publicationDate + 3 Years`. |
| **Indemnification**: Govt guarantees title. | On success, `finalizeTitle` sets `isConclusive = true` and emits `TitleFinalized` event, triggering Indemnity Bond issuance (off-chain). |

## 4. Strata Titling (Vertical Growth)

| Act Requirement | Code Implementation |
| :--- | :--- |
| **Vertical Units**: Defined ownership of apartments. | `StrataUnit` asset class. Links to `parentParcelId` but maintains independent RoT/RoD/RoCC. |
