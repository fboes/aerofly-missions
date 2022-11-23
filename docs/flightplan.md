![](favicon-64x64.png) Flight plan
==================================

This tool also allows for outputting a flight plan inferred from your `main.mcf`.

![](flightplan.png)

It uses all information supplied via the [custom missions conversion](custom-missions.md), and adds some extra assumptions:

* Depending if you are flying in North America or not, the flight plan will show the **US or ICAO flight rules**.
* It will also display the **time of day** as "day", "night", or "twilight". Check if your plane is equipped for night flights.
* **Frequencies** are shown in MHz for VOR / ILS. NDBs are displayed in kHz, and have an extra symbol prefixed.
* **Altitude** is shown in feet MSL. It takes into account if it is a VFR or IFR flight, and will increase your altitude to the proper [flight level](https://en.wikipedia.org/wiki/Flight_level).
* The **desired track** and **suggested heading** take magnetic variation into account. The heading calculates wind direction and speed and tries to give you a heading to keep to your track.
* **Estimated time en route** is calculated given the known cruise speed of your plane type, wind direction and speed relative to your desired track and the distance you want to travel. It is displayed in minutes:seconds.

```
ORIG  ESSL               DEP   2022-11-23T06:54Z
DSUN  ☼ DUSK @ -2°       DLST  08:09
----------------------------------------------------
DEST  ESKN               ARR   2022-11-23T07:19Z
ASUN  ☀ DAY @ 0°         ALST  08:39
----------------------------------------------------
WIND  080° @ 10KTS       CLD   ◕ BKN @ 2,000FT AGL
VIS   15,000M / 10SM     FR    VFR
----------------------------------------------------
ARCT  PTS2               TAS   152KTS
====================================================
>    WPT     FREQ       ALT  DTK   HDG    DIS    ETE
01.  ESSL               172
02.  11                 142  290°  290°   0.6  01:07
03.  W-3051           2,000  058°  059°  11.8  04:59
04.  W-1425           2,000  101°  099°  19.8  08:21
05.  08      111.30     113  020°  023°  22.9  09:24
06.  ESKN               140  079°  079°   0.7  01:20
----------------------------------------------------
>    TOT                                 54.8  25:09
```

----

Back to [top](../README.md)
