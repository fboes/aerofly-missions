![](favicon-64x64.png) Flight plan
==================================

This tool also allows for outputting a flight plan inferred from your `main.mcf`.

![](flightplan.png)

It uses all information supplied via the [custom missions conversion](custom-missions.md), and adds some extra assumptions:

* It will display the **time of day** as "day", "night", or "twilight" at origin and destination. Check if your aircraft is equipped for night flights. It will also show the sun elevation and the Local Solar Time (LST).
* **Clouds** are reported in feet AGL.
* Depending if you are flying in North America or not, the flight plan will show the **US or ICAO flight rules**.
* **Frequencies** are shown in MHz for VOR / ILS. NDBs are displayed in kHz, and have an extra symbol prefixed.
* **Altitude** is shown in feet MSL. It takes into account if it is a VFR or IFR flight, and will increase your altitude to the proper [flight level](https://en.wikipedia.org/wiki/Flight_level).
* The **desired track** and **suggested heading** take magnetic declination into account. The heading calculates wind direction and speed, to give you a heading to keep to your track.
* The **distance** is displayed in Nautical Miles.
* **Estimated time en route** is calculated given the known cruise speed of your aircraft type, wind direction and speed relative to your desired track and the distance you want to travel. It is displayed in minutes:seconds.

```
ORIG  ESSL               DEP   2022-11-23T06:54Z
DSUN  ☼ DUSK @ -2°       DLST  08:09
-----------------------------------------------------
DEST  ESKN               ARR   2022-11-23T07:19Z
ASUN  ☀ DAY @ 0°         ALST  08:39
-----------------------------------------------------
WIND  080° @ 10KTS       CLD   ◕ BKN @ 2,000FT
VIS   15,000M / 10SM     FR    VFR
-----------------------------------------------------
ARCT  PTS2               TAIL  D-EUJS
TAS   152KTS             ALT   2,000FT
=====================================================
>     WPT     FREQ       ALT  DTK   HDG    DIS    ETE
01.   ESSL               172
02.   11                 142  291°  291°   0.6  01:07
03.   W-3051           2,000  058°  060°  11.8  04:59
04.   W-1425           2,000  101°  099°  19.8  08:21
05.   08      111.30     113  020°  023°  22.9  09:24
06.   ESKN               140  079°  079°   0.7  01:20
-----------------------------------------------------
>    TOT                                 54.8  25:09
```

----

Back to [top](../README.md)
