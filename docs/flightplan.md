Flight plan
===========

This tool also allows for outputting a flight plan inferred from your `main.mcf`.

![](flightplan.png)

It uses all information supplied via the [custom missions conversion](custom-missions.md), and adds some extra assumptions:

* Depending if you are flying in North America or not, the flight plan will show the **US or ICAO flight rules**.
* It will also display the **time of day** as "day", "night", or "twilight". Check if your plane is equipped for night flights.
* **Frequencies** are shown in MHz for VOR / ILS. NDBs are displayed in kHz, and have an extra symbol prefixed.
* **Altitude** is shown in feet MSL. It takes into account if it is a VFR or IFR flight, and will increase your altitude to the proper [flight level](https://en.wikipedia.org/wiki/Flight_level).
* The **desired track** and **suggested heading** take magnetic variation into account. The heading calculates wind direction and speed and tries to give you a heading to keep to your track.
* **Estimated time en route** is calculated given the known cruise speed of your plane type, wind direction and speed relative to your desired track and the distance you want to travel. It is displayed in minutes:seconds.

----

Back to [top](../README.md)
