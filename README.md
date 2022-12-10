![](docs/favicon-64x64.png) Aerofly Missionsgerät
============================================

The Aerofly Missionsgerät converts [Aerofly FS 4's](https://www.aerofly.com/) `main.mcf` file into a `custom_missions.tmc` file, using your current flight plan and other settings to generate a shareable mission.

Other features:

* Export Aerofly `main.mcf` flight to Aerofly FS 4 Custom Missions file.
* Export Aerofly `main.mcf` flight plan as [text briefing](docs/flightplan.md), including weather and aircraft settings.
* Export Aerofly `main.mcf` flight plan as [GeoJSON](https://geojson.org/).
* Export Aerofly `main.mcf` flight plan as Markdown file.
* Open Aerofly `main.mcf` flight plan in [SkyVector](https://skyvector.com/), including aircraft settings.
* [Convert Garmin `fpl` Flight Plan file to Aerofly FS 4 Custom Missions file](docs/importing-flightplans.md).
* [Convert Microsoft FS `pln` Flight Plan file to Aerofly FS 4 Custom Missions file](docs/importing-flightplans.md).
* [Convert X-Plane `fms` Flight Plan file to Aerofly FS 4 Custom Missions file](docs/importing-flightplans.md).

![Flight plan as text briefing](docs/flightplan.png)

Requirements
------------

You will need the following software installed on your PC:

* [Aerofly FS 4](https://www.aerofly.com/)
* [Node.js](https://nodejs.org/en/) (Version 16+)
* Optional: [Windows Terminal](https://apps.microsoft.com/store/detail/windows-terminal/9N0DX20HK701) or use your pre-installed terminal

Installation
------------

1. Run `npm install -g aerofly-missions` from your terminal to globally install `aerofly-missions`.
2. Optional: You might want to put [a preconfigured batch file](docs/aerofly-missions.bat) on your desktop for ease of access.

Updating
--------

1. Run `npm install -g aerofly-missions` from your terminal to update `aerofly-missions` to the current version.

Usage
------------

This manual is for Windows 10/11 installations. On other operating systems these steps are similar, but the file system locations will be different.

1. Open Aerofly FS 4, set up a flight plan, choose a aircraft, set time and weather. (You may want to use the [Aerofly Wettergerät](https://github.com/fboes/aerofly-wettergeraet/) to get weather data.)
1. Start the flight and check if the position of your aircraft is correct.
1. Quit Aerofly FS 4 so all your settings will be saved to your `main.mcf` configuration file, usually located at `C:\Users\…\Documents\Aerofly FS 4\main.mcf`.
1. Open the explorer and point it to the directory `main.mcf` is located, e.g. `Documents\Aerofly FS 4\`.
1. Right click on the folder name and choose "Open in terminal"
1. Run `aerofly-missions` in the open terminal to convert `main.mcf` to `custom_missions.tmc` (see below).
1. Grab your exported `custom_missions.tmc` file with all your settings converted into a single mission file. This file can now be placed into the custom mission directory in Aerofly FS 4.

Be aware that right now Aerofly FS 4 accepts custom missions exclusively from within `…\Aerofly FS 4 Flight Simulator\missions\custom_missions.tmc`. You will need to replace the file located there or append your missions to this file.

See the [custom missions documentation](docs/custom-missions.md) for more information.

Status
-------

[![npm version](https://badge.fury.io/js/aerofly-missions.svg)](https://badge.fury.io/js/aerofly-missions)
![GitHub tag (latest SemVer)](https://img.shields.io/github/v/tag/fboes/aerofly-missions.svg?sort=semver)
![GitHub](https://img.shields.io/github/license/fboes/aerofly-missions.svg)

Legal stuff
-----------

Author: [Frank Boës](https://3960.org)

Copyright & license: See [LICENSE.txt](LICENSE.txt)

This tool is NOT affiliated with, endorsed, or sponsored by IPACS GbR. As stated in the [LICENSE.txt](LICENSE.txt), this tool comes with no warranty and might damage your files.

This software complies with the General Data Protection Regulation (GDPR) as it does not collect nor transmits any personal data to third parties.
