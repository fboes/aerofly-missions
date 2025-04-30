import { MissionCheckpoint } from "../Aerofly/MissionCheckpoint.js";
import { GeoJson } from "./GeoJson.js";
export class KeyholeMarkupLanguage extends GeoJson {
    fromMission(mission, forExport) {
        this._mission = mission;
        return super.fromMission(mission, forExport);
    }
    toString() {
        var _a, _b, _c, _d;
        const routeColor = "9314ff";
        const styles = [
            { id: MissionCheckpoint.TYPE_ORIGIN, iconHref: "https://maps.google.com/mapfiles/kml/shapes/airports.png" },
            {
                id: MissionCheckpoint.TYPE_DEPARTURE_RUNWAY,
                iconHref: "https://maps.google.com/mapfiles/kml/shapes/target.png",
            },
            { id: MissionCheckpoint.TYPE_DEPARTURE, iconHref: "https://maps.google.com/mapfiles/kml/shapes/square.png" },
            { id: MissionCheckpoint.TYPE_WAYPOINT, iconHref: "http://maps.google.com/mapfiles/kml/shapes/triangle.png" },
            { id: MissionCheckpoint.TYPE_ARRIVAL, iconHref: "https://maps.google.com/mapfiles/kml/shapes/square.png" },
            { id: MissionCheckpoint.TYPE_APPROACH, iconHref: "https://maps.google.com/mapfiles/kml/shapes/square.png" },
            {
                id: MissionCheckpoint.TYPE_DESTINATION_RUNWAY,
                iconHref: "https://maps.google.com/mapfiles/kml/shapes/target.png",
            },
            { id: MissionCheckpoint.TYPE_DESTINATION, iconHref: "https://maps.google.com/mapfiles/kml/shapes/airports.png" },
            { id: MissionCheckpoint.TYPE_VOR, iconHref: "https://maps.google.com/mapfiles/kml/shapes/polygon.png" },
            { id: MissionCheckpoint.TYPE_NDB, iconHref: "https://maps.google.com/mapfiles/kml/shapes/donut.png" },
            { id: MissionCheckpoint.TYPE_FIX, iconHref: "http://maps.google.com/mapfiles/kml/shapes/triangle.png" },
            { id: MissionCheckpoint.TYPE_INTERSECTION, iconHref: "https://maps.google.com/mapfiles/kml/shapes/diamond.png" },
            { id: MissionCheckpoint.TYPE_AIRPORT, iconHref: "https://maps.google.com/mapfiles/kml/shapes/star.png" },
            { id: "aircraft", iconHref: "https://maps.google.com/mapfiles/kml/shapes/airports.png" },
        ];
        return `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>${(_b = (_a = this._mission) === null || _a === void 0 ? void 0 : _a.title) !== null && _b !== void 0 ? _b : "Route"}</name>
    <description>${(_d = (_c = this._mission) === null || _c === void 0 ? void 0 : _c.description) !== null && _d !== void 0 ? _d : ""}</description>
    <Style id="flightplan">
      <LineStyle>
        <color>ff${routeColor}</color>
        <width>6</width>
      </LineStyle>
      <PolyStyle>
        <color>44${routeColor}</color>
      </PolyStyle>
    </Style>
    <Style id="taxi">
      <LineStyle>
        <color>cc${routeColor}</color>
        <width>2</width>
      </LineStyle>
      <PolyStyle>
        <color>22${routeColor}</color>
      </PolyStyle>
    </Style>
${styles
            .map((style) => {
            return `\
    <Style id="${style.id}">
      <IconStyle>
        <Icon>
          <href>${style.iconHref}</href>
        </Icon>
      </IconStyle>
      <color>ffffffff</color>
    </Style>`;
        })
            .join("\n")}
${this.features
            .map((feature) => {
            var _a;
            return `\
    <Placemark>
      <name>${feature.properties.title}</name>
      <description>${(_a = feature.properties.frequency) !== null && _a !== void 0 ? _a : ""}</description>
      <styleUrl>#${feature.properties.type}</styleUrl>
${this.getPlacemarkFeatures(feature)}\
      <${feature.geometry.type}>
${this.getGeometryFeatures(feature)}\
        <altitudeMode>${feature.geometry.coordinates[2] !== undefined ? "absolute" : "relativeToGround"}</altitudeMode>
        <coordinates>${this.coordinatesToString(feature)}</coordinates>
      </${feature.geometry.type}>
    </Placemark>`;
        })
            .join("\n")}
  </Document>
</kml>
`;
    }
    getPlacemarkFeatures(feature) {
        var _a;
        return feature.geometry.type === "Point"
            ? `\
        <LookAt>
          <longitude>${feature.geometry.coordinates[0]}</longitude>
          <latitude>${feature.geometry.coordinates[1]}</latitude>
          <altitude>${feature.geometry.coordinates[2]}</altitude>
          <range>10000</range>
          <tilt>70</tilt>
          <heading>${(((_a = feature.properties.direction) !== null && _a !== void 0 ? _a : 0) + 15) % 360}</heading>
          <altitudeMode>${feature.geometry.coordinates[2] !== 0 ? "absolute" : "relativeToGround"}</altitudeMode>
        </LookAt>
`
            : "";
    }
    getGeometryFeatures(feature) {
        return feature.geometry.type === "LineString"
            ? `\
        <tessellate>1</tessellate>
        <extrude>1</extrude>
`
            : "";
    }
    coordinatesToString(feature) {
        if (feature.geometry.type === "LineString") {
            return feature.geometry.coordinates
                .map((c) => {
                return c.join(",");
            })
                .join("\n");
        }
        return feature.geometry.coordinates.join(",");
    }
}
