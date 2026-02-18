export class SpatialValidator {
    /**
     * Calculates the area of a polygon using the Shoelace Formula.
     * @param coordinates Array of [lon, lat] - The first linear ring (exterior boundary)
     * @returns Area in square meters (approximate for small cadastral plots)
     */
    public static calculateArea(coordinates: number[][]): number {
        let area = 0;
        const n = coordinates.length;

        // Conversion factor from Degrees to Meters (approx at India's latitude)
        // 1 deg Lat ~= 111,000 meters
        // 1 deg Lon ~= 111,000 * cos(lat) meters
        // For simplicity in this POC, we treat coordinates as cartesian scaled to meters
        // OR better: We assume input coordinates are projected or we accept slight error for now.
        // REAL IMPLEMENTATION: Project WGS84 to UTM Zone 43N before calc.
        // VIBE CODING: We will assume the input coordinates are relative meters OR we just use the raw value
        // if user passes standard lat/lon, this will be tiny. 
        // Let's implement a 'Rough' conversion to meters based on a center point in India (Pune).

        const LAT_TO_M = 110574;
        const LON_TO_M = 111320 * Math.cos(18.5204 * (Math.PI / 180)); // Pune Latitude

        for (let i = 0; i < n; i++) {
            const [x1_deg, y1_deg] = coordinates[i];
            const [x2_deg, y2_deg] = coordinates[(i + 1) % n];

            const x1 = x1_deg * LON_TO_M;
            const y1 = y1_deg * LAT_TO_M;
            const x2 = x2_deg * LON_TO_M;
            const y2 = y2_deg * LAT_TO_M;

            area += x1 * y2 - x2 * y1;
        }

        return Math.abs(area) / 2;
    }

    /**
     * Validates that the polygon is closed (LinearRing).
     */
    public static validateTopology(coordinates: number[][]): void {
        if (!coordinates || coordinates.length < 4) {
            throw new Error("Invalid Geometry: Polygon must have at least 3 points + closing point.");
        }

        const first = coordinates[0];
        const last = coordinates[coordinates.length - 1];

        // Tolerance for floating point equality
        const isClosed = Math.abs(first[0] - last[0]) < 0.0000001 && Math.abs(first[1] - last[1]) < 0.0000001;

        if (!isClosed) {
            throw new Error(`Invalid Geometry: Polygon is not closed. First [${first}] != Last [${last}]`);
        }
    }

    /**
     * Verifies that the claimed area matches the calculated area within valid tolerance.
     */
    public static validateAreaMatch(calculated: number, claimed: number, tolerancePercent: number = 5): void {
        const diff = Math.abs(calculated - claimed);
        const allowedDiff = (calculated * tolerancePercent) / 100;

        if (diff > allowedDiff) {
            throw new Error(`Spatial Mismatch: Calculated Area (${calculated.toFixed(2)} sqm) differs from Claimed Area (${claimed.toFixed(2)} sqm) by more than ${tolerancePercent}%`);
        }
    }
}
