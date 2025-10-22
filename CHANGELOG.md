# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.29.0] - 2025-10-22

- Show SimBrief import field by default
- Removed flight plan guides by default
- Fixed altitude input field allowing for real low airfields
- Fixed service worker message showing up the first time PWA is loaded

## [2.28.9] - 2025-10-04

- Added logging of import source

## [2.28.8] - 2025-09-23

- Added new aircraft

## [2.28.7] - 2025-09-23

- Added test for removing guides from flight plan properly
- Added improved error message for SimBrief API errors

## [2.28.6] - 2025-08-15
## [2.28.5] - 2025-08-13

- Fixed "no guides" functionality to use correct direction value

## [2.28.4] - 2025-08-13

- Added "no guides" tracking
- Improved GPX import
- Added Boeing 737-800
- Improved closing of dialogs

## [2.28.3] - 2025-05-23

- Quick fix for download

## [2.28.2] - 2025-05-23

- Added new download button `custom_missions_user.tmc`
- Refactored CSS dark mode styling

## [2.28.1] - 2025-05-01

- Updated installation instructions

## [2.28.0] - 2025-04-30

- Added development documentation
- Added `eslint` and fixed reported warnings
- Added KML export

## [2.27.1] - 2025-04-22

- Fixed behavior on broken airport codes for origin / destination
- Improved cache update

## [2.27.0] - 2025-04-16

- Added SeeYou `cup` file format for import
- Improved initial aircraft heading
- Refactored CheckWx API to separate component
- Refactored upload field
- Fixed handling of altitudes while importing

## [2.26.0] - 2025-04-13

- Added functionality to SimBrief to import origin _or_ destination weather

## [2.25.1] - 2025-05-23

- Added Airbus A350

## [2.25.0] - 2025-05-23

- Added MSFS2024 export
- Fixed download MIME types

## [2.24.0] - 2025-05-23

- Fixed handling of ICAO regions
- Added Garmin FPL / Infinite Flight export

## [2.23.0] - 2025-05-23

- Added GeoFS import / export
- Added on-site GDPR conformal tracking
- Improved accessibility

## [2.22.0] - 2025-05-23

- Improved aircraft select field
- Changed default values for aircraft

## [2.21.4] - 2025-05-23

- Added hour output on flight plans

## [2.21.3] - 2025-05-23

- Improved SimBrief UX
- Added new aircraft types
- Improved handling of SimBrief weather

## [2.21.2] - 2025-05-23

- Added altitude constraint to all waypoints with a set altitude

## [2.21.1] - 2025-05-23

- Improved origin coordinates on importing `pln` flight plans
- SimBrief username can be substituted with SimBrief user id in API call

## [2.21.0] - 2025-05-23

- Added SimBrief support

## [2.20.1] - 2025-05-23

- Added runway support for STOL, Glider, Helicopter, Ultralight, Water
- Improved MSFS `pln` output
- Improved handling of `flyOver` property on waypoint

## [2.20.0] - 2025-05-23

- Fixed `no_guides` to hide guides
- Added DR 400 aircraft
- Added `no_guides` to hide guides
- Added `flyOver` property to waypoints
- Added `finish` property to missions
- Added new cloud layers
- Improved handling of Garmin `fpl` files
- Prioritizing waypoints in GeoJSON
- Improved GeoJSON output
- Added stub to import departure, approach and arrival waypoints
- Fixed METAR button disabling
- Improved GeoJSON symbols
- Changed airport links to be more clever
- Updated mission links
- Changed links for airports, changed styling for waypoints
- Improved handling of and documentation for MSFS / X-Plane flight plan files
- Changed map style
- Improved GeoJSON export

## [2.19.0] - 2025-05-23

- Added new instructions to reflect changes made in AFS4
