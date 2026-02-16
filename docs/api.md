# LandChain API Reference (Model Act)

## Base URL
`http://localhost:3001`

## Core Endpoints

### 1. View Land Parcel (Composite View)
**GET** `/land/:id`

Returns the merged view of RoT, RoD, and RoCC.

**Response:**
```json
{
  "parcelId": "PARCEL_001",
  "status": "FREE",
  "title": { "titleId": "...", "owners": [...], "isConclusive": false },
  "disputes": [],
  "charges": []
}
```

### 2. Transfer Ownership (Sale Deed)
**POST** `/land/transfer`

**Body:**
```json
{
  "parcelId": "PARCEL_001",
  "newOwnerId": "IND_CITIZEN_789",
  "salePrice": 5000000
}
```

## Advanced Lifecycle Endpoints

### 3. Record Intimation (Courts/Banks)
**POST** `/land/intimation`

Pushes an entry to the Register of Disputes (RoD) or Charges (RoCC).

**Body:**
```json
{
  "parcelId": "PARCEL_001",
  "category": "CHARGE",       // or "DISPUTE"
  "type": "MORTGAGE",         // "TAX_DEFAULT", "CIVIL_SUIT"
  "issuer": "SBI_BANK_NODE",
  "details": "Loan Account 123456"
}
```

### 4. Create Strata Unit (Vertical)
**POST** `/land/strata`

Mints a new Apartment/Unit linked to a parent land.

**Body:**
```json
{
  "unitId": "APT_101",
  "parentParcelId": "PARCEL_001",
  "floor": 1,
  "carpetArea": 1200,
  "ownerId": "IND_CITIZEN_999"
}
```

### 5. Finalize Title (Indemnity)
**POST** `/land/finalize`

Attempts to mark the title as Conclusive after the statutory period.

**Body:**
```json
{
  "parcelId": "PARCEL_001"
}
```
