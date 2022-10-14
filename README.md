Aerofly Missions
================

Convert `main.mcf` file of [Aerofly FS 4](https://www.aerofly.com/) into a `custom_missions.tmc` file, converting your current flight plan and other settings into a shareable mission.

Requirements
------------

You will need the following software installed on your PC:

* [Aerofly FS 4](https://www.aerofly.com/)
* [NodeJs](https://nodejs.org/en/) (Version 16+)
* Optional: [Windows Terminal](https://apps.microsoft.com/store/detail/windows-terminal/9N0DX20HK701) or use your pre-installed terminal

Installation
------------

1. Run `npm install -g aerofly-missions` from your terminal to globally install `aerofly-missions`.

Usage
------------

This manual is for WIndows 10/11 installations. On other operating systems these steps are similiar, but the file system locations will be different.

1. Open Aerofly FS 4, set up a flight plan, choose a plane, set time and weather. (You may want to use the [Aerofly Wettergerät](https://github.com/fboes/aerofly-wettergeraet) to get weather data.)
1. Quit Aerofly FS 4 so all your settings will be saved to your `main.mcf` configuration file, usually located at `C:\Users\…\Documents\Aerofly FS 4\main.mcf`.
1. Open the explorer and point it to the directory `main.mcf` is located, e.g. `Documents\Aerofly FS 4\`.
1. Right click on the folder name and choose "Open in terminal"
1. Run `aerofly-missions` in the open terminal to convert `main.mcf` to `custom_missions.tmc` (see below).
1. Grab your exported `custom_missions.tmc` file with all your settings converted into a single mission file. This file can now be placed into the custom mission directory in Aerofly FS 4.

Be aware that right now Aerofly FS 4 accepts custom missions exclusively from within `…\Aerofly FS 4 Flight Simulator\missions\custom_missions.tmc`. You will need to replace the file located there or append your missions to this file.

Legal stuff
-----------

Author: [Frank Boës](https://3960.org)

Copyright & license: See [LICENSE.txt](LICENSE.txt)
