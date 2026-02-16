'use client';

import { MapContainer, TileLayer, Polygon, Popup, Marker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useEffect, useState } from 'react';

// Fix Leaflet icon issue in Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Mock Data (In real app, fetch from API)
const mockParcels = [
    {
        id: 'PARCEL_001',
        coords: [
            [28.6139, 77.2090],
            [28.6149, 77.2090],
            [28.6149, 77.2100],
            [28.6139, 77.2100]
        ] as [number, number][],
        status: 'FREE',
        owner: 'IND_CITIZEN_123'
    },
    {
        id: 'PARCEL_LOCKED',
        coords: [
            [28.6150, 77.2090],
            [28.6160, 77.2090],
            [28.6160, 77.2100],
            [28.6150, 77.2100]
        ] as [number, number][],
        status: 'LOCKED',
        owner: 'IND_CITIZEN_456'
    }
];

export default function LandMap() {
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    if (!isMounted) return <div className="h-96 w-full bg-gray-100 flex items-center justify-center">Loading Map...</div>;

    const getColor = (status: string) => {
        switch (status) {
            case 'FREE': return 'green';
            case 'LOCKED': return 'red';
            case 'LITIGATION': return 'red';
            case 'MORTGAGED': return 'yellow';
            default: return 'blue';
        }
    };

    return (
        <MapContainer center={[28.6145, 77.2095]} zoom={16} scrollWheelZoom={false} className="h-96 w-full rounded-lg shadow-lg z-0">
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {mockParcels.map((parcel) => (
                <Polygon
                    key={parcel.id}
                    positions={parcel.coords}
                    pathOptions={{ color: getColor(parcel.status), fillColor: getColor(parcel.status), fillOpacity: 0.4 }}
                >
                    <Popup>
                        <div className="p-2">
                            <h3 className="font-bold text-lg">{parcel.id}</h3>
                            <p>Status: <span className={`font-semibold ${parcel.status === 'FREE' ? 'text-green-600' : 'text-red-600'}`}>{parcel.status}</span></p>
                            <p className="text-sm text-gray-600">Owner: {parcel.owner}</p>
                            <button className="mt-2 bg-blue-600 text-white text-xs px-2 py-1 rounded hover:bg-blue-700">View Details</button>
                        </div>
                    </Popup>
                </Polygon>
            ))}
        </MapContainer>
    );
}
