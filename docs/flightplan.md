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
RT    ESIA → ESSL        DDT   2022-11-20T07:45Z
ACT   PTS2               TAS   152KTS
====================================================
SUN   ☀ DAY @ 003°       LST   08:56
WND   010° @ 007KTS      CLD   ◑ SCT @ 800FT
VIS   10,000M / 10SM     FR    ◑ VFR
----------------------------------------------------
>    WPT     FREQ       ALT  DTK   HDG    DIS    ETE
01.  ESIA               310
02.  06                 307  242°  242°   0.6  01:14
03.  W-2444           3,500  094°  091°  13.0  05:10
04.  W-5603           3,500  051°  049°   6.8  02:47
05.  SC       ✺ 300   3,500  114°  111°  16.7  06:31
06.  11      108.70     142  109°  107°   3.7  01:29
07.  ESSL               172  110°  110°   0.6  01:07
----------------------------------------------------
>    TOT                                 40.4  18:15
```

----

Back to [top](../README.md)
