![](favicon-64x64.png) Custom missions
======================================

On reading the Aerofly FS 4 `main.mcf`, a few conversions and assumptions are made:

* The **title** will be inferred from your current flight plan. You may supply your own title via CLI parameter (see below), or edit the title in the generated text file.  
  Be aware that your title should not be longer than 32 characters.
* The **description** will be inferred from your current flight plan. You may supply your own description via CLI parameter (see below), or edit the description in the generated text file.  
  Be aware that your description should not be longer than 8 lines of 50 characters each. The description allows for line breaks.  
  The auto-generated description contains information about the IFR/VFR state, time of day, as well as navigational aids in your flight plan.
* You may want to supply an **ILS frequency** for your destination airport. As this cannot be read from the `main.mcf`, you will have to supply this using the ILS parameter (see below).
* As the **initial orientation** of your plane cannot be read from the `main.mcf`, you will have to supply a direction manually to the tool (see below).
* As there is no information available about the Aerofly FS 4 magnetic model, you will have to set the **magnetic declination** manually:  
  Check the _true_ direction your plane is pointing to. Subtract the _magnetic_ direction to get the magnetic declination.
* If the **position of your plane** as given in the `main.mcf` is not close enough to your flight plan origin, the position and direction of your plane gets set to the first checkpoint in your flight plan.
* As the custom missions contain less information about **clouds**, this tool will find the lowest clouds and add these to your custom missions file.
* The **ICAO callsign** of your plane will be set to match a registration visible in Aerofly FS 4.

Parameters
-----------

```
Usage: nodejs index.js [PARAMETERS...]

Parameters:
  -s, --source       Location of the main.mcf
  -t, --target       Location of your target file
      --title        Title of your mission
      --description  Description of your mission; line breaks allowed
  -i, --ils          ILS frequency like '123.45'
  -d, --direction    Initial orientation of plane
  -m, --magnetic     Magnetic declination used for waypoints

Switches:
  -a  --append       Do not export mission list with a single mission,
                     but add mission to already existing file
      --geo-json     Output Geo.json for debugging
      --flightplan   Output flightplan for debugging
      --help         This help
```

This tool may also output a [flight plan](flightplan.md).

Manual editing
--------------

As the generated file is a text file, it can be edited with any kind of text editor. You _will_ have to use manual editing to stitch together a mission file for multiple missions.

Redistribution
--------------

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

----

Back to [top](../README.md)