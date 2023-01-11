import { GeoJsonFeature } from "../Export/GeoJson.js";
import { Units } from "../World/Units.js";
import { GaminFplWaypoint, GarminFpl, GarminFplWaypointType } from "./GarminFpl.js";

export class GeoJsonImport extends GarminFpl {
  read(configFileContent: string): void {
    this.cruisingAlt = 0;
    const json = JSON.parse(configFileContent);
    const lineFeatures = json.features.filter((f: GeoJsonFeature) => {
      return f.geometry.type && f.geometry.type === 'LineString';
    });
    const pointFeatures = json.features.filter((f: GeoJsonFeature) => {
      return f.geometry.type && f.geometry.type === 'Point' && f.properties.type !== 'plane';
    });

    if (pointFeatures.length > 0) {
      this.waypoins = pointFeatures.map((f: GeoJsonFeature, index: number): GaminFplWaypoint => {
        this.cruisingAlt = Math.max(this.cruisingAlt, f.properties.altitude || 0);
        let type: GarminFplWaypointType = (index === 0 || index === pointFeatures.length - 1) ? 'AIRPORT' : 'USER WAYPOINT';
        if (type === 'USER WAYPOINT' && f.properties.frequency) {
          type = (f.properties.frequency.match('MHz')) ? 'VOR' : 'NDB';
        }
        return {
          identifier: f.properties.title || ('WP' + index.toFixed().padStart(2, '0')),
          type: type,
          lon: f.geometry.coordinates[0],
          lat: f.geometry.coordinates[1],
          alt: f.properties.altitude * Units.feetPerMeter
        }
      })
    } else if (lineFeatures[0]) {
      const coordinates = lineFeatures[0].geometry.coordinates;

      this.waypoins = coordinates.map((coords: number[], index: number): GaminFplWaypoint => {
        return {
          identifier: 'WP' + index.toFixed().padStart(2, '0'),
          type: (index === 0 || index === coordinates.length - 1) ? 'AIRPORT' : 'USER WAYPOINT',
          lon: coords[0],
          lat: coords[1],
          alt: 0
        }
      })

      if (json.features[0].properties.origin) {
        this.waypoins[0].identifier = json.features[0].properties.origin;
      }
      if (json.features[0].properties.destination) {
        this.waypoins[coordinates.length - 1].identifier = json.features[0].properties.destination;
      }
    } else {
      throw new Error("Missing relevant GeoJSON features for flightplan");
    }
  }
}
