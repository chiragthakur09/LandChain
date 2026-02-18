import axios from 'axios';

// Base URL for the NestJS Server
// TODO: Make this configurable via env variables
const API_BASE_URL = 'http://localhost:3001';

const apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Interface for Parcel Creation
export interface CreateParcelDto {
    ulpin: string;
    owners: Array<{
        ownerId: string;
        sharePercentage: number;
        type: 'INDIVIDUAL' | 'CORPORATE' | 'GOVERNMENT';
    }>;
    geoJson: string;
    docHash: string; // IPFS Hash
}

// Interface for Parcel Transfer (Initiation)
export interface InitiateTransferDto {
    ulpin: string;
    sellerId: string;
    buyerId: string;
    sharePercentage: number;
    salePrice: number;
    paymentUtr: string;
    authToken?: string; // Optional for now
    // Metadata
    metadataJson?: string;
}

export const LandAPI = {
    // Get Parcel Details
    getParcel: async (id: string) => {
        try {
            const response = await apiClient.get(`/land/${id}`);
            return response.data;
        } catch (error) {
            console.error("Error fetching parcel:", error);
            throw error;
        }
    },

    // Create New Parcel
    createParcel: async (data: CreateParcelDto) => {
        const response = await apiClient.post('/land', data); // Fixed endpoint
        return response.data;
    },

    // Initiate Transfer (Step 1)
    initiateTransfer: async (data: InitiateTransferDto) => {
        const response = await apiClient.post('/land/transfer', data);
        return response.data;
    },

    // Approve Mutation (Step 2)
    approveMutation: async (ulpin: string) => {
        const response = await apiClient.post('/land/mutation/approve', { ulpin });
        return response.data;
    },

    // Get Pending Mutations
    getPendingMutations: async () => {
        const response = await apiClient.get('/land/pending');
        return response.data;
    },

    // Get Public Details (Sanitized)
    getPublicDetails: async (id: string) => {
        const response = await apiClient.get(`/land/public/${id}`); // Fixed endpoint
        return response.data;
    }
};
