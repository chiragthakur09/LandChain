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

### 6. Execute Generic Transaction (Pluggable)
**POST** `/land/transaction`

Executes any supported transaction type via the dynamic state machine.

**Body:**
```json
{
  "transactionType": "SALE", // or PARTITION, INHERITANCE, CONVERSION
  "transactionData": { ... }, // Payload specific to type
  "evidenceHash": "QmHashOfDoc",
  "authToken": "MOCK_AADHAAR_TOKEN_..."
}
```

## Error Handling

The API uses standard HTTP status codes to indicate the success or failure of an API request.

| Status Code | Description | Verified Scenario |
| :--- | :--- | :--- |
| `200 OK` | The request was successful. | Asset fetched found. |
| `201 Created` | The resource was successfully created. | Parcel/Unit minted. |
| `400 Bad Request` | The request was invalid or cannot be served. | Missing parameters, Logic errors. |
| `403 Forbidden` | The request is understood, but it has been refused or access is denied. | Transfer of **LOCKED** asset. |
| `404 Not Found` | The requested resource could not be found. | Querying unknown `parcelId`. |
| `409 Conflict` | The request could not be completed due to a conflict with the current state of the target resource. | Asset already exists. |
| `500 Internal Server Error` | An unexpected condition was encountered. | Fabric network issues. |

### Standard Error Response Body
```json
{
  "statusCode": 403,
  "timestamp": "2026-02-16T10:30:00.000Z",
  "path": "/land/transaction",
  "message": "Asset is LOCKED. Cannot execute SALE."
}
```
