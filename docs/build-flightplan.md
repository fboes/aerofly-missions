# ![](favicon-64x64.png) How to build a flight plan

Read for a good start on how to do flight planning:

- [How I Cross-Country - KITPLANES](https://www.kitplanes.com/how-i-cross-country/)
- [Flight Planning - AOPA](https://www.aopa.org/training-and-safety/online-learning/safety-spotlights/mountain-flying/flight-planning)
- [How To Plan a Cross-Country Flight - Pilot Institute](https://pilotinstitute.com/flight-planning/)

## How to build in Aerofly FS 4

1. First check if your airports exist in Aerofly FS 4.
1. Build a basic flight plan in Aerofly FS 4.
   1. You may want to use named checkpoints in Aerofly for your flight plan: VORs, NDBs and waypoints / fixes.
   1. Think about alternate airports along your route, or at least emergency landing sites.
1. Rebuild the flight plan in a flight planning tool like [SkyVector: Flight Planning / Aeronautical Charts](https://skyvector.com/); you may want to use `aerofly-missions --skyvector`. Take a proper look at:
   1. Runway length
   1. Restricted airspace
   1. Terrain heights (see [maximum elevation figure](https://en.wikipedia.org/wiki/Maximum_elevation_figure))
   1. Weather reports
1. Check if your plan is legal to fly under [visual flight rules](https://en.wikipedia.org/wiki/Visual_flight_rules) or [instrument flight rules](https://en.wikipedia.org/wiki/Instrument_flight_rules) rules.
1. Set time and weather conditions in Aerofly FS 4 to match real life conditions. (You may want to use the [Aerofly Wettergerät](https://github.com/fboes/aerofly-wettergeraet/) to get weather data.)
1. Modify your flight plan in Aerofly FS 4. (Be aware that nav data in Aerofly FS 4 is out of date and may not match real world data.) You may want to [import the flight plan](./importing-flightplans.md).
   1. Match the waypoints from your flight planning tool.
   1. Adjust the cruise altitude.
   1. Set your departure and approach to head into the wind.

## Airspaces

It is very important to know your [airspaces](https://en.wikipedia.org/wiki/Airspace_class#ICAO_definitions). Europe is tightly controlled, so check for no-fly zones and controlled airspace.

> - Class C/D: All aircraft are subject to ATC clearance
> - Class E: Aircraft operating under IFR and SVFR are subject to ATC clearance.

To help your with your adventure:

- [Flight Maps for Europe excluding Norway](https://www.openflightmaps.org/wp-content/plugins/ofmTileMap/ofmTileMap_full.php?airac=2210&language=local&coverage&controls)
- [Flight Maps for Norway](https://www.ippc.no/ippc/index.jsp)

No fly regions:

- [German NOTAM](https://www.notaminfo.com/germanymap)
- [Danish NOTAM](https://notaminfo.com/denmarkmap)
- [Swedish NOTAM](https://notaminfo.com/swedenmap)

---

Back to [top](./README.md)
