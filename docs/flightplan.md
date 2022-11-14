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
RT    EKAE → EKRK        DDT   2022-11-13T09:20Z
ACT   M339               TAS   350KTS
====================================================
SUN   ☀ DAY @ 013°       LST   10:17
WND   180° @ 004KTS      CLD   ● OVC @ 700FT
VIS   10,000M / 10SM     FR    ● IFR
----------------------------------------------------
>    WPT     FREQ       ALT  DTK   HDG    DIS    ETE
01.  EKAE                -3
02.  15                      311°  311°   0.2  00:23
03.  LUGAS            5,000  030°  031°  33.4  05:41
04.  KOR     112.80   5,000  073°  073°  23.7  04:04
05.  RK       ✺ 368   5,000  047°  048°  16.6  02:50
06.  11      111.50   1,000  115°  116°   4.5  00:47
07.  EKRK             1,000  115°  115°   0.6  01:12
----------------------------------------------------
>    TOT                                 78.1  14:54
```

----

Back to [top](../README.md)
