import { GaminFplWaypoint, GarminFpl } from "./GarminFpl.js";

export class GeoJson extends GarminFpl {
  read(configFileContent: string): void {
    this.cruisingAlt = 0;
    const json = JSON.parse(configFileContent);
    const coordinates = json.features[0].geometry.coordinates;

    // TODO: Search for LineString

    this.waypoins = coordinates.map((coords: number[], index: number): GaminFplWaypoint => {
      return {
        identifier: 'WP' + index.toFixed().padStart(2, '0'),
        type: (index === 0 || index === coordinates.length - 1) ? 'AIRPORT' : 'USER WAYPOINT',
        lon: coords[0],
        lat: coords[1]
      }
    })

    if (json.features[0].properties.origin) {
      this.waypoins[0].identifier = json.features[0].properties.origin;
    }
    if (json.features[0].properties.destination) {
      this.waypoins[coordinates.length - 1].identifier = json.features[0].properties.destination;
    }
  }
}
