import axios from 'axios';

// Base URL for the NestJS Server
// TODO: Make this configurable via env variables
const API_BASE_URL = 'http://localhost:3000';

const apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Interface for Parcel Creation
export interface CreateParcelDto {
    ulpin: string;
    ownerId: string;
    geoJson: string;
    docHash: string; // IPFS Hash
}

// Interface for Parcel Transfer
export interface TransferParcelDto {
    ulpin: string;
    fromOwner: string;
    toOwner: string;
    share: number;
    price: number;
    paymentId: string;
    // Metadata
    metadataJson?: string;
}

export const LandAPI = {
    // Get Parcel Details
    getParcel: async (id: string) => {
        const response = await apiClient.get(`/land/${id}`);
        return response.data;
    },

    // Create New Parcel
    createParcel: async (data: CreateParcelDto) => {
        const response = await apiClient.post('/land/create', data);
        return response.data;
    },

    // Transfer Parcel
    transferParcel: async (data: TransferParcelDto) => {
        const response = await apiClient.post('/land/transfer', data);
        return response.data;
    },

    // Get Public Details (Sanitized)
    getPublicDetails: async (id: string) => {
        const response = await apiClient.get(`/land/search/${id}`);
        return response.data;
    }
};
