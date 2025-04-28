import { Mission } from "../Aerofly/Mission.js";
import { GeoJson, GeoJsonFeature, GeoJsonTypes } from "./GeoJson.js";

type KeyholeMarkupLanguageRouteStyle = {
  id: string;
  iconHref: string;
};

export class KeyholeMarkupLanguage extends GeoJson {
  protected _mission: Mission | undefined;

  fromMission(mission: Mission, forExport?: boolean): this {
    this._mission = mission;
    return super.fromMission(mission, forExport);
  }

  toString(): string {
    const routeColor = "9314ff";

    const styles: KeyholeMarkupLanguageRouteStyle[] = [
      { id: GeoJsonTypes.ORIGIN_DESINTATION, iconHref: "https://maps.google.com/mapfiles/kml/shapes/airports.png" },
      { id: GeoJsonTypes.AIRPORT, iconHref: "https://maps.google.com/mapfiles/kml/shapes/star.png" },
      { id: GeoJsonTypes.VOR, iconHref: "https://maps.google.com/mapfiles/kml/shapes/polygon.png" },
      { id: GeoJsonTypes.NDB, iconHref: "https://maps.google.com/mapfiles/kml/shapes/donut.png" },
      { id: GeoJsonTypes.FIX, iconHref: "http://maps.google.com/mapfiles/kml/shapes/triangle.png" },
      { id: GeoJsonTypes.WAYPOINT, iconHref: "http://maps.google.com/mapfiles/kml/shapes/triangle.png" },
      { id: GeoJsonTypes.FINISH, iconHref: "https://maps.google.com/mapfiles/kml/shapes/target.png" },
    ];

    return `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>${this._mission?.title ?? "Route"}</name>
    <description>${this._mission?.description ?? ""}</description>
    <Style id="flightplan">
      <LineStyle>
        <color>ff${routeColor}</color>
        <width>6</width>
      </LineStyle>
      <PolyStyle>
        <color>dd${routeColor}</color>
      </PolyStyle>
    </Style>
    <Style id="taxi">
      <LineStyle>
        <color>cc${routeColor}</color>
        <width>2</width>
      </LineStyle>
      <PolyStyle>
        <color>ee${routeColor}</color>
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
  .join("\n")}\
${this.features
  .map((feature) => {
    return `\
    <Placemark>
      <name>${feature.properties.title}</name>
      <styleUrl>#${this.getStyleUrl(feature)}</styleUrl>
      <altitudeMode>absolute</altitudeMode>
      <${feature.geometry.type}>
${this.getGeometryFeatures(feature)}\
        <coordinates>${this.coordinatesToString(feature)}</coordinates>
      </${feature.geometry.type}>
    </Placemark>`;
  })
  .join("\n")}
  </Document>
</kml>
`;
  }

  protected getGeometryFeatures(feature: GeoJsonFeature) {
    return feature.geometry.type === "LineString"
      ? `\
        <tessellate>1</tessellate>
        <extrude>1</extrude>
`
      : "";
  }

  protected getStyleUrl(feature: GeoJsonFeature) {
    return feature.geometry.type === "LineString"
      ? feature.properties.title.toLowerCase()
      : feature.properties["marker-symbol"];
  }

  protected coordinatesToString(feature: GeoJsonFeature) {
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
