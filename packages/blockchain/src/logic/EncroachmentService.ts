export class EncroachmentService {
    // Mocked restricted zones (Bounding Boxes for simplicity in POC)
    // Format: [minLon, minLat, maxLon, maxLat]
    private static RESTRICTED_ZONES = {
        FOREST_DEPT_PUNE: [73.00, 18.00, 73.01, 18.01], // Mock Forest
        HIGHWAY_BUFFER_NH48: [73.80, 18.50, 73.82, 18.52] // Mock Highway
    };

    /**
     * Checks if the parcel centroid falls within any restricted zone.
     * @param centroid [lon, lat]
     * @returns void if safe, throws Error if encroachment
     */
    public static verifyZoningCompliance(centroid: number[]): void {
        const [lon, lat] = centroid;

        // Check Forest
        if (this.isInside(lon, lat, this.RESTRICTED_ZONES.FOREST_DEPT_PUNE)) {
            throw new Error("ENCROACHMENT_DETECTED: Parcel overlaps with Protected Forest Area (PUNE_FOREST). Transaction Blocked.");
        }

        // Check Highway
        if (this.isInside(lon, lat, this.RESTRICTED_ZONES.HIGHWAY_BUFFER_NH48)) {
            console.warn("WARNING: Parcel is within Highway Buffer Zone. LandUse and Construction might be restricted.");
        }
    }

    private static isInside(x: number, y: number, bbox: number[]): boolean {
        const [minX, minY, maxX, maxY] = bbox;
        return x >= minX && x <= maxX && y >= minY && y <= maxY;
    }
}
