import { Object, Property } from 'fabric-contract-api';

@Object()
export class Geometry {
    @Property()
    public type: 'Polygon' = 'Polygon';

    @Property()
    public coordinates: number[][][] = []; // GeoJSON standard: Array of LinearRings
}

@Object()
export class SpatialProperties {
    @Property()
    public calculatedAreaSqM: number = 0;

    @Property()
    public centroid: number[] = []; // [lon, lat]

    @Property()
    public localAreaValue: number = 0;

    @Property()
    public localAreaUnit: 'HECTARE' | 'ACRE' | 'GUNTHA' | 'BIGHA' = 'HECTARE';

    @Property()
    public surveyMethod: 'ETS' | 'GPS' | 'DRONE' | 'LEGACY_DIGITIZED' = 'LEGACY_DIGITIZED';

    @Property()
    public accuracyMarginM: number = 0;
}

@Object()
export class SpatialData {
    @Property()
    public type: 'Feature' = 'Feature';

    @Property()
    public geometry: Geometry = new Geometry();

    @Property()
    public properties: SpatialProperties = new SpatialProperties();
}
