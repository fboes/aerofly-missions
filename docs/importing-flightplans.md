# ![](favicon-64x64.png) Sources for flight plans

Flight planners:

- [SimBrief.com](https://www.simbrief.com/): You can either download flight plans from SimBrief and import these via the regular way, or you can use the SimBrief API (see below)
- [SkyVector](https://skyvector.com/): Use the "Save Plan" option and download your flight plan as Garmin `fpl` file
- [Little Nav Map](https://github.com/albar965/littlenavmap)

Flight plans:

- [Flight Plan Database](https://flightplandatabase.com/): Select "MSFS2020" as download option
- [Flight Plans for Microsoft Flight Simulator - Flightsim.to](https://flightsim.to/c/user-content/flight-plans/)
- [CGAVIATORS's jet flight plans](https://cgaviator.uk/)

## SimBrief API

[SimBrief](https://www.simbrief.com/home/) has a very handy Application Programming Interface (API) which allows the Missionsgerät to fetch your latest flight plan and convert it automatically into a Aerofly FS custom user mission.

Here's how to set it up:

1. Obviously you will need a **SimBrief account** with a SimBrief username (alias).
2. Activate the **expert mode** for the Missionsgerät with the small cog wheel in the upper right corner.
3. The "Import" section now has an input field for your [SimBrief username (alias)](https://dispatch.simbrief.com/account#settings), which you need to supply. No password needed, as the SimBrief API makes all your flight plans public by default.

Here's how to convert your flight plan:

1. **Create** a flight plan in SimBrief.
2. Hit the button labelled "Fetch SimBrief flight plan" to **fetch the flight plan** and automatically **convert** it into a Missionsgerät mission.
3. **Download** the Aerofly FS custom user mission and [install the mission file in Aerofly FS](./generic-installation.md) as usual.

This method not only saves a lot of time, but also receives extra information from SimBrief like basic weather, navigational aid frequencies and aircraft data.

---

Back to [top](./README.md)
