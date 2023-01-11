export type GarminFplWaypointType = 'AIRPORT' | 'USER WAYPOINT' | 'NDB' | 'VOR';

export type GaminFplWaypoint = {
  identifier: string,
  type: GarminFplWaypointType,
  lat: number,
  lon: number,
  alt: number,
};

export class GarminFpl {
  waypoins: GaminFplWaypoint[] = [];
  /**
   * In feet MSL
   */
  cruisingAlt: number = 0;

  constructor(configFileContent: string) {
    this.read(configFileContent);
  }

  read(configFileContent: string): void {
    this.cruisingAlt = 0;
    const waypointTableXml = this.getXmlNode(configFileContent, 'waypoint-table')

    this.waypoins = this.getXmlNodes(waypointTableXml, 'waypoint').map((xml): GaminFplWaypoint => {
      return {
        identifier: this.getXmlNode(xml, 'identifier'),
        type: <GarminFplWaypointType>this.getXmlNode(xml, 'type'),
        lat: Number(this.getXmlNode(xml, 'lat')),
        lon: Number(this.getXmlNode(xml, 'lon')),
        alt: 0
      }
    })
  }

  protected getXmlNode(xml: string, tag: string): string {
    const match = xml.match(new RegExp(`<${tag}[^>]*>(.*?)</${tag}>`, 'ms'));
    return match ? match[1] : "";
  }

  protected getXmlNodes(xml: string, tag: string): string[] {
    const nodes = xml.match(new RegExp(`<${tag}.*?</${tag}>`, 'gms'));

    return nodes ? nodes : [];
  }

  protected getXmlAttribute(xml: string, attribute: string): string {
    const regex = new RegExp(` ${attribute}="(.*?)"`, 'ms');
    const match = xml.match(regex);
    return match ? match[1] : "";
  }
}
