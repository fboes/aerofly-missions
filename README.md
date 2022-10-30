Aerofly Missions
================

Convert `main.mcf` file of [Aerofly FS 4](https://www.aerofly.com/) into a `custom_missions.tmc` file, converting your current flight plan and other settings into a shareable mission.

Requirements
------------

You will need the following software installed on your PC:

* [Aerofly FS 4](https://www.aerofly.com/)
* [Node.js](https://nodejs.org/en/) (Version 16+)
* Optional: [Windows Terminal](https://apps.microsoft.com/store/detail/windows-terminal/9N0DX20HK701) or use your pre-installed terminal

Installation
------------

1. Run `npm install -g aerofly-missions` from your terminal to globally install `aerofly-missions`.

Updating
--------

1. Run `npm install -g aerofly-missions` from your terminal to update `aerofly-missions` to the current version.

Usage
------------

This manual is for Windows 10/11 installations. On other operating systems these steps are similar, but the file system locations will be different.

1. Open Aerofly FS 4, set up a flight plan, choose a plane, set time and weather. (You may want to use the [Aerofly Wettergerät](https://github.com/fboes/aerofly-missions) to get weather data.)
1. Quit Aerofly FS 4 so all your settings will be saved to your `main.mcf` configuration file, usually located at `C:\Users\…\Documents\Aerofly FS 4\main.mcf`.
1. Open the explorer and point it to the directory `main.mcf` is located, e.g. `Documents\Aerofly FS 4\`.
1. Right click on the folder name and choose "Open in terminal"
1. Run `aerofly-missions` in the open terminal to convert `main.mcf` to `custom_missions.tmc` (see below).
1. Grab your exported `custom_missions.tmc` file with all your settings converted into a single mission file. This file can now be placed into the custom mission directory in Aerofly FS 4.

Be aware that right now Aerofly FS 4 accepts custom missions exclusively from within `…\Aerofly FS 4 Flight Simulator\missions\custom_missions.tmc`. You will need to replace the file located there or append your missions to this file.

There are additional parameters:

```
Usage: nodejs index.js [PARAMETERS...]

Parameters:
  -s, --source       Location of the main.mcf
  -t, --target       Location of your target file
      --title        Title of your mission
      --description  Description of your mission
  -d, --direction    Initial orientation of plane

Switches:
  -a  --append       Do not export mission list with a single mission,
                     but add mission to already existing file
      --geo-json     Output Geo.json for debugging
      --flightplan   Output flightplan for debugging
      --help         This help
```

### Redistribution

If you want to redistribute your mission file, you may want to include installation instructions:

```markdown
YOUR MISSION NAME
-----------------

To install this custom mission file:

1. Open a file explorer in your Aerofly FS 4 game folder.
2. Open up the `missions` folder.
3. Rename `custom_missions.tmc` to any other file name,
   e.g. `_custom_missions.tmc`.
4. Place the `custom_missions.tmc` from this ZIP archive in the
   `missions` folder.
5. On starting Aerofly FS 4, all your custom missions will be loaded from the 
   new `custom_missions.tmc`.

To revert back to the original custom missions file, simply delete the new file 
and rename the old file `_custom_missions.tmc` back to `custom_missions.tmc`.

In case your Aerofly FS 4 installation gets damaged in this process, consider
a fresh installation.

```


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
