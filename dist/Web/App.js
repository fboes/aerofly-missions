import { Mission } from "../Aerofly/Mission.js";
import { GeoJson } from "../Export/GeoJson.js";
import { LonLatArea } from "../World/LonLat.js";
import { MissionCheckpoint } from "../Aerofly/MissionCheckpoint.js";
import { Outputtable } from "../Export/Outputtable.js";
import { ComponentsAirports, ComponentsCheckpoints, ComponentsWeather } from "./Components.js";
import { ComponentsDownloadButtons } from "./ComponentsDownloadButtons.js";
import { ComponentSimBrief } from "./ComponentSimbrief.js";
import { SimBrief } from "../Import/SimBrief.js";
import { StatEvent } from "./StatEvent.js";
import { ComponentUploadField } from "./ComponentUploadField.js";
import { CheckWx } from "../Import/CheckWx.js";
export class App {
    constructor() {
        this.elements = {
            wind_speed: document.getElementById("wind_speed"),
            wind_gusts: document.getElementById("wind_gusts"),
            wind_direction: document.getElementById("wind_direction"),
            visibility_sm: document.getElementById("visibility_sm"),
            visibility: document.getElementById("visibility"),
            upload: document.querySelector("missionsgeraet-upload-field"),
            turn_time: document.getElementById("turn_time"),
            turn_radius: document.getElementById("turn_radius"),
            turbulence_strength: document.getElementById("turbulence_strength"),
            expertMode: document.getElementById("expertMode"),
            title: document.getElementById("title"),
            time: document.getElementById("time"),
            thermal_strength: document.getElementById("thermal_strength"),
            outputWeather: document.getElementById("output-weather"),
            outputCheckpoints: document.getElementById("output-checkpoints"),
            outputAirports: document.getElementById("output-airports"),
            origin_dir: document.getElementById("origin_dir"),
            no_guides: document.getElementById("no_guides"),
            metarApiKey: document.getElementById("metar-api-key"),
            metar: document.getElementById("metar"),
            makeMetarDest: document.getElementById("make-metar-dest"),
            makeMetarDept: document.getElementById("make-metar-dept"),
            main: document.querySelector("main"),
            magneticDeclination: document.getElementById("magnetic_declination"),
            flight_setting: document.getElementById("flight_setting"),
            downloadButtons: document.getElementById("download-buttons"),
            description: document.getElementById("description"),
            date: document.getElementById("date"),
            cruise_speed: document.getElementById("cruise_speed"),
            cruise_altitude_ft: document.getElementById("cruise_altitude_ft"),
            cloud_cover_code: document.getElementById("cloud_cover_code"),
            cloud_cover: document.getElementById("cloud_cover"),
            cloud_base_feet: document.getElementById("cloud_base_feet"),
            cloud3_cover_code: document.getElementById("cloud3_cover_code"),
            cloud3_cover: document.getElementById("cloud3_cover"),
            cloud3_base_feet: document.getElementById("cloud3_base_feet"),
            cloud2_cover_code: document.getElementById("cloud2_cover_code"),
            cloud2_cover: document.getElementById("cloud2_cover"),
            cloud2_base_feet: document.getElementById("cloud2_base_feet"),
            callsign: document.getElementById("callsign"),
            aircraft_name: document.getElementById("aircraft_name"),
            simBrief: document.querySelector("missionsgeraet-simbrief"),
            simBriefUseDestinationWeather: document.getElementById("simBriefUseDestinationWeather"),
        };
        this.useIcao = true;
        this.metarApiKey = "";
        this.simBriefUseDestinationWeather = false;
        this.mission = new Mission("", "");
        customElements.define("missionsgeraet-upload-field", ComponentUploadField);
        this.elements.upload.mission = this.mission;
        this.elements.upload.addEventListener("file-uploaded", (event) => {
            var _a, _b;
            if (((_a = event.detail) === null || _a === void 0 ? void 0 : _a.filename) === undefined || ((_b = event.detail) === null || _b === void 0 ? void 0 : _b.fileEnding) === undefined) {
                return;
            }
            document.body.dispatchEvent(StatEvent.createEvent("Import", "Upload " + event.detail.fileEnding + " file"));
            this.useIcao = this.mission.origin_country !== "US";
            this.mission.magnetic_declination = undefined;
            this.syncToForm();
            this.showFlightplan(App.SHOW_ALL | App.SHOW_MAP_CENTER);
        });
        customElements.define("missionsgeraet-simbrief", ComponentSimBrief);
        this.elements.simBrief.addEventListener("simbrief-payload-fetched", (event) => {
            if (!event.detail) {
                return;
            }
            const simBrief = new SimBrief();
            simBrief.convertMission(event.detail, this.mission, this.simBriefUseDestinationWeather);
            this.syncToForm();
            this.showFlightplan(App.SHOW_ALL | App.SHOW_MAP_CENTER);
        });
        customElements.define("missionsgeraet-buttons", ComponentsDownloadButtons);
        this.elements.downloadButtons.mission = this.mission;
        this.elements.downloadButtons.draw();
        customElements.define("missionsgeraet-weather", ComponentsWeather);
        this.elements.outputWeather.mission = this.mission;
        this.elements.outputWeather.draw();
        customElements.define("missionsgeraet-airports", ComponentsAirports);
        this.elements.outputAirports.mission = this.mission;
        this.elements.outputAirports.draw();
        customElements.define("missionsgeraet-checkpoints", ComponentsCheckpoints);
        this.elements.outputCheckpoints.mission = this.mission;
        this.elements.outputCheckpoints.draw();
        this.restore();
        this.geoJson = new GeoJson();
        document.body.addEventListener("input", this);
        document.body.addEventListener("click", this);
        this.showFlightplan();
        this.syncToForm();
    }
    handleEvent(e) {
        switch (e.type) {
            case "click":
                const target = e.target.closest("[data-handler]");
                if (!target) {
                    return;
                }
                const handler = target.getAttribute("data-handler");
                switch (handler) {
                    case "add-separation":
                        this.handleEventClickAddSeparation(target);
                        break;
                    case "fetch-metar":
                        this.handleEventClickFetchMetar(target);
                        break;
                    case "modal-close":
                        this.handleEventClickModalClose(target);
                        break;
                    case "modal-open":
                        this.handleEventClickModalOpen(target);
                        break;
                    case "random-weather":
                        this.handleEventClickRandomWeather();
                        break;
                    case "reset":
                        this.handleEventClickReset(target);
                        break;
                    case "reverse-flightplan":
                        this.handleEventClickReverseFlightplan();
                        break;
                    case "waypoint-edit":
                        this.handleEventClickWaypointEdit(target);
                        break;
                }
                break;
            case "input":
                this.handleEventInput(e.target);
                break;
        }
    }
    handleEventClickAddSeparation(target) {
        const type = target.getAttribute("data-type");
        this.mission.calculateCheckpoints(type);
        this.showFlightplan(App.SHOW_CHECKPOINTS);
    }
    handleEventClickWaypointEdit(target) {
        var _a;
        const type = target.getAttribute("data-type");
        const waypointId = Number(target.closest("dialog").getAttribute("data-cp-id"));
        switch (type) {
            case "delete":
                this.mission.checkpoints.splice(waypointId, 1);
                break;
            case "add-before":
                this.mission.addCheckpointBefore(waypointId, 3, 1000);
                break;
            case "add-after":
                this.mission.addCheckpointAfter(waypointId, 3, 1000);
                break;
            case "make-finish":
                const currentWaypoint = this.mission.checkpoints[waypointId];
                this.mission.finish =
                    currentWaypoint === this.mission.finish ? null : (_a = this.mission.checkpoints[waypointId]) !== null && _a !== void 0 ? _a : null;
                break;
            case "toggle-flyover":
                this.mission.checkpoints[waypointId].flyOver = !this.mission.checkpoints[waypointId].flyOver;
                break;
        }
        this.handleEventClickModalClose(target);
        this.mission.calculateCheckpoints();
        this.showFlightplan(App.SHOW_AIRPORTS | App.SHOW_CHECKPOINTS | App.SHOW_MAP);
    }
    async handleEventClickFetchMetar(target) {
        const icao = target.id === "make-metar-dept" ? this.mission.origin_icao : this.mission.destination_icao;
        const checkWxApi = new CheckWx(this.metarApiKey);
        try {
            const result = await checkWxApi.fetch(icao);
            checkWxApi.addToMission(result, this.mission);
            this.syncToForm();
            this.showFlightplan(App.SHOW_WEATHER | App.SHOW_CHECKPOINTS);
            document.body.dispatchEvent(StatEvent.createEvent("Weather", "Fetched METAR via API"));
        }
        catch (e) {
            this.showError("Error fetching METAR: " + e);
            return;
        }
    }
    handleEventClickModalClose(target) {
        target.closest("dialog").close();
    }
    handleEventClickModalOpen(target) {
        const tgt = target.getAttribute("data-modal");
        if (tgt) {
            document.getElementById(tgt).showModal();
        }
    }
    handleEventClickRandomWeather() {
        this.makeWeather();
        this.syncToForm();
        this.showFlightplan(App.SHOW_WEATHER | App.SHOW_CHECKPOINTS);
    }
    handleEventClickReset(target) {
        let show = 0;
        switch (target.id) {
            case "reset-description":
                this.mission.title = "";
                this.mission.description = "";
                this.mission.setAutoTitleDescription();
                break;
            case "reset-aircraft":
                this.mission.aircraft_name = "c172";
                this.mission.cruise_altitude = 0;
                this.mission.flight_setting = Mission.FLIGHT_SETTING_TAXI;
                show = App.SHOW_AIRPORTS | App.SHOW_CHECKPOINTS;
                break;
            case "reset-time":
                this.mission.conditions.time.dateTime = new Date();
                this.mission.conditions.time.dateTime.setUTCSeconds(0);
                this.mission.conditions.time.dateTime.setUTCMilliseconds(0);
                show = App.SHOW_AIRPORTS | App.SHOW_CHECKPOINTS;
                break;
            case "reset-weather":
                this.mission.conditions.wind_direction = 0;
                this.mission.conditions.wind_gusts = 0;
                this.mission.conditions.wind_speed = 0;
                this.mission.conditions.turbulence_strength = 0;
                this.mission.conditions.thermal_strength = 0;
                this.mission.conditions.visibility_percent = 1;
                this.mission.conditions.clouds = [];
                show = App.SHOW_WEATHER | App.SHOW_CHECKPOINTS;
                break;
            case "reset-flightplan":
                this.mission.checkpoints = [];
                this.mission.magnetic_declination = undefined;
                show = App.SHOW_WEATHER | App.SHOW_AIRPORTS | App.SHOW_CHECKPOINTS;
                break;
        }
        this.syncToForm();
        this.showFlightplan(show);
    }
    handleEventClickReverseFlightplan() {
        this.mission.reverseWaypoints();
        this.syncToForm();
        this.showFlightplan(App.SHOW_ALL);
    }
    handleEventClickToggleExpertMode(target) {
        const isChecked = target.checked;
        this.elements.main.classList.toggle(App.CLASS_SIMPLE_MODE, !isChecked);
        localStorage.setItem(App.CLASS_SIMPLE_MODE, !isChecked ? "1" : "0");
    }
    handleEventInput(target) {
        let show = 0;
        switch (target.id) {
            case "aircraft_name":
                this.mission.aircraft_name = target.value;
                show |= App.SHOW_MAP | App.SHOW_AIRPORTS | App.SHOW_CHECKPOINTS;
                this.syncToForm();
                break;
            case "callsign":
                this.mission.callsign = target.value;
                break;
            case "cloud_base_feet":
                this.mission.conditions.cloud.height_feet = target.valueAsNumber;
                show |= App.SHOW_WEATHER;
                this.syncToOutput();
                break;
            case "cloud2_base_feet":
                this.mission.conditions.cloud2.height_feet = target.valueAsNumber;
                show |= App.SHOW_WEATHER;
                this.syncToOutput();
                break;
            case "cloud3_base_feet":
                this.mission.conditions.cloud3.height_feet = target.valueAsNumber;
                show |= App.SHOW_WEATHER;
                this.syncToOutput();
                break;
            case "cloud_cover":
                this.mission.conditions.cloud.cover = target.valueAsNumber / 100;
                show |= App.SHOW_WEATHER;
                this.syncToOutput();
                break;
            case "cloud2_cover":
                this.mission.conditions.cloud2.cover = target.valueAsNumber / 100;
                show |= App.SHOW_WEATHER;
                this.syncToOutput();
                break;
            case "cloud3_cover":
                this.mission.conditions.cloud3.cover = target.valueAsNumber / 100;
                show |= App.SHOW_WEATHER;
                this.syncToOutput();
                break;
            case "cruise_altitude_ft":
                this.mission.cruise_altitude_ft = target.valueAsNumber;
                show |= App.SHOW_CHECKPOINTS;
                this.mission.syncCruiseAltitude();
                break;
            case "cruise_speed":
                this.mission.cruise_speed = target.valueAsNumber;
                this.mission.syncCruiseSpeed();
                this.syncToOutput();
                show |= App.SHOW_MAP | App.SHOW_AIRPORTS | App.SHOW_CHECKPOINTS;
                break;
            case "date":
                if (target.valueAsDate) {
                    this.mission.conditions.time.dateTime.setUTCFullYear(target.valueAsDate.getUTCFullYear());
                    this.mission.conditions.time.dateTime.setUTCMonth(target.valueAsDate.getUTCMonth());
                    this.mission.conditions.time.dateTime.setUTCDate(target.valueAsDate.getUTCDate());
                }
                show |= App.SHOW_AIRPORTS | App.SHOW_WEATHER;
                break;
            case "description":
                this.mission.description = target.value;
                break;
            case "magnetic_declination":
                this.mission.magnetic_declination = target.value ? target.valueAsNumber : undefined;
                show |= App.SHOW_CHECKPOINTS;
                break;
            case "metar-api-key":
                this.metarApiKey = target.value;
                this.syncToForm();
                break;
            case "origin_dir":
                this.mission.origin_dir = target.valueAsNumber;
                break;
            case "thermal_strength":
                this.mission.conditions.thermal_strength = target.valueAsNumber / 100;
                show |= App.SHOW_WEATHER;
                break;
            case "time":
                if (target.valueAsDate) {
                    this.mission.conditions.time.dateTime.setUTCHours(target.valueAsDate.getUTCHours());
                    this.mission.conditions.time.dateTime.setUTCMinutes(target.valueAsDate.getUTCMinutes());
                    show |= App.SHOW_AIRPORTS | App.SHOW_WEATHER;
                }
                break;
            case "title":
                this.mission.title = target.value;
                break;
            case "turbulence_strength":
                this.mission.conditions.turbulence_strength = target.valueAsNumber / 100;
                show |= App.SHOW_WEATHER;
                break;
            case "turn_time":
                this.mission.turn_time = target.valueAsNumber;
                this.syncToOutput();
                show |= App.SHOW_MAP;
                break;
            case "visibility":
                this.mission.conditions.visibility = target.valueAsNumber;
                show |= App.SHOW_WEATHER;
                this.syncToOutput();
                break;
            case "wind_direction":
                this.mission.conditions.wind_direction = target.valueAsNumber;
                show |= App.SHOW_ALL;
                break;
            case "wind_gusts":
                this.mission.conditions.wind_gusts = target.valueAsNumber;
                show |= App.SHOW_WEATHER;
                break;
            case "wind_speed":
                this.mission.conditions.wind_speed = target.valueAsNumber;
                show |= App.SHOW_ALL;
                break;
            case "no_guides":
                this.mission.no_guides = target.checked;
                break;
            case "expertMode":
                this.handleEventClickToggleExpertMode(target);
                break;
            case "simBriefUseDestinationWeather":
                this.simBriefUseDestinationWeather = target.checked;
                break;
            default:
                const prop = target.getAttribute("data-cp-prop");
                const id = (target.closest("[data-cp-id]") || target).getAttribute("data-cp-id");
                if (prop && id) {
                    const index = Number(id);
                    switch (prop) {
                        case "name":
                            this.mission.checkpoints[index].name = target.value;
                            if (index === 1) {
                                this.mission.checkpoints[index].type = target.value.match(/^\d\d[LRCSGHUW]?$/)
                                    ? MissionCheckpoint.TYPE_DEPARTURE_RUNWAY
                                    : MissionCheckpoint.TYPE_WAYPOINT;
                            }
                            else if (index === this.mission.checkpoints.length - 2) {
                                this.mission.checkpoints[index].type = target.value.match(/^\d\d[LRCSGHUW]?$/)
                                    ? MissionCheckpoint.TYPE_DESTINATION_RUNWAY
                                    : MissionCheckpoint.TYPE_WAYPOINT;
                            }
                            show |= App.SHOW_MAP;
                            break;
                        case "altitude_ft":
                            this.mission.checkpoints[index].lon_lat.altitude_ft = target.valueAsNumber;
                            break;
                        case "lat":
                            this.mission.checkpoints[index].lon_lat.lat = target.valueAsNumber;
                            show |= App.SHOW_MAP;
                            break;
                        case "lon":
                            this.mission.checkpoints[index].lon_lat.lon = target.valueAsNumber;
                            show |= App.SHOW_MAP;
                            break;
                        case "speed":
                            this.mission.checkpoints[index].speed = target.valueAsNumber;
                            this.mission.calculateCheckpoints();
                            const tr = target.closest("tr");
                            if (tr) {
                                tr.querySelector(".heading").innerText = Outputtable.padThree(this.mission.checkpoints[index].heading);
                                tr.querySelector(".time_enroute").innerText =
                                    Outputtable.convertHoursToMinutesString(this.mission.checkpoints[index].time_enroute);
                            }
                            const table = target.closest("table");
                            if (table) {
                                table.querySelector("tfoot .time_enroute").innerText =
                                    Outputtable.convertHoursToMinutesString(this.mission.time_enroute);
                            }
                            show |= App.SHOW_AIRPORTS | App.SHOW_MAP;
                            break;
                        case "frequency_mhz":
                            this.mission.checkpoints[index].frequency_mhz = target.valueAsNumber;
                            break;
                    }
                }
                break;
        }
        if (target.id !== "upload") {
            this.mission.calculateCheckpoints();
        }
        this.showFlightplan(show);
    }
    showFlightplan(show = App.SHOW_WEATHER | App.SHOW_AIRPORTS | App.SHOW_CHECKPOINTS) {
        if (App.SHOW_WEATHER & show) {
            this.elements.outputWeather.draw();
        }
        if (App.SHOW_AIRPORTS & show) {
            this.elements.outputAirports.draw();
        }
        if (App.SHOW_CHECKPOINTS & show) {
            this.elements.outputCheckpoints.draw();
        }
        if (App.SHOW_MAP & show || App.SHOW_MAP_CENTER & show) {
            this.drawMap((App.SHOW_MAP_CENTER & show) !== 0);
        }
        this.elements.downloadButtons.draw();
        this.store();
    }
    addMapbox(mapboxMap) {
        this.mapboxMap = mapboxMap;
        if (this.mission.origin_lon_lat) {
            this.mapboxMap.setZoom(5);
            this.mapboxMap.setCenter([this.mission.origin_lon_lat.lon, this.mission.origin_lon_lat.lat]);
        }
        this.mapboxMap.on("load", () => {
            if (this.mapboxMap === undefined) {
                return;
            }
            this.mapboxMap.addSource("mapbox-dem", {
                type: "raster-dem",
                url: "mapbox://mapbox.mapbox-terrain-dem-v1",
                tileSize: 512,
                maxzoom: 14,
            });
            this.mapboxMap.setTerrain({ source: "mapbox-dem" });
            this.geoJson.fromMission(this.mission);
            this.mapboxMap.addSource("waypoints", {
                type: "geojson",
                data: this.geoJson,
            });
            this.mapboxMap.addLayer({
                id: "waypoints-line",
                type: "line",
                source: "waypoints",
                layout: {
                    "line-join": "round",
                    "line-cap": "round",
                },
                paint: {
                    "line-color": "#FF1493",
                    "line-width": 2,
                    "line-dasharray": ["match", ["get", "type"], "Taxi", ["literal", [1, 2]], ["literal", [10, 0]]],
                },
                //filter: ['==', '$type', 'Polygon']
            });
            this.mapboxMap.addLayer({
                id: "waypoints",
                type: "symbol",
                source: "waypoints",
                layout: {
                    "icon-image": ["get", "marker-symbol"],
                    "text-field": ["get", "title"],
                    // 'icon-rotate': ['get', 'direction'],
                    "text-offset": [0, 0.5],
                    "text-anchor": "top",
                    "text-size": 12,
                    "symbol-sort-key": ["get", "symbol-sort-key"],
                },
                paint: {
                    "icon-color": "#FF1493",
                },
                //filter: ['==', '$type', 'Point']
            });
            this.drawMap(true);
            // -----------------------------------------------------------------------
            let currentFeature = null;
            const source = this.mapboxMap.getSource("waypoints");
            const onDown = (e) => {
                if (this.mapboxMap === undefined) {
                    return;
                }
                e.preventDefault();
                const features = this.mapboxMap.queryRenderedFeatures(e.point, {
                    layers: ["waypoints"],
                });
                currentFeature = features[0];
            };
            const onMove = (e) => {
                if (this.mapboxMap === undefined) {
                    return;
                }
                const coords = e.lngLat;
                if (!currentFeature || !source || source.type !== "geojson") {
                    return;
                }
                const featureId = currentFeature.id;
                this.geoJson.features[featureId].geometry.coordinates = [coords.lng, coords.lat];
                if (featureId === 0) {
                    this.mission.origin_lon_lat.lon = coords.lng;
                    this.mission.origin_lon_lat.lat = coords.lat;
                }
                else if (featureId === this.mission.checkpoints.length + 1) {
                    this.mission.destination_lon_lat.lon = coords.lng;
                    this.mission.destination_lon_lat.lat = coords.lat;
                }
                else {
                    this.mission.checkpoints[featureId - 1].lon_lat.lon = coords.lng;
                    this.mission.checkpoints[featureId - 1].lon_lat.lat = coords.lat;
                }
                source.setData(this.geoJson);
            };
            const onUp = () => {
                if (this.mapboxMap === undefined) {
                    return;
                }
                this.mapboxMap.off("mousemove", onMove);
                currentFeature = null;
                this.mission.calculateCheckpoints();
                this.showFlightplan(App.SHOW_AIRPORTS | App.SHOW_CHECKPOINTS | App.SHOW_MAP);
            };
            const onClick = () => {
                if (!currentFeature) {
                    return;
                }
                const modal = document.getElementById("edit-waypoint-modal");
                const currentCheckpointIndex = Number(currentFeature.id) - 1;
                if (currentCheckpointIndex < 0 || currentCheckpointIndex >= this.mission.checkpoints.length) {
                    return;
                }
                const currentCheckpoint = this.mission.checkpoints[currentCheckpointIndex];
                modal.setAttribute("data-cp-id", String(currentCheckpointIndex));
                modal.querySelector('[data-type="delete"]').disabled =
                    currentFeature.id === 1 || currentFeature.id === this.mission.checkpoints.length - 1;
                modal.querySelector('[data-type="add-before"]').disabled = currentFeature.id === 1;
                modal.querySelector('[data-type="add-after"]').disabled =
                    currentFeature.id === this.mission.checkpoints.length;
                document.getElementById("wp-lon").value = currentCheckpoint.lon_lat.lon.toFixed(5);
                document.getElementById("wp-lat").value = currentCheckpoint.lon_lat.lat.toFixed(5);
                document.getElementById("wp-name").value = currentCheckpoint.name;
                modal.addEventListener("close", () => {
                    this.showFlightplan(App.SHOW_ALL);
                }, { once: true });
                modal.showModal();
            };
            // -----------------------------------------------------------------------
            // @see https://docs.mapbox.com/mapbox-gl-js/example/drag-a-point/
            this.mapboxMap.on("mouseenter", "waypoints", (e) => {
                if (this.mapboxMap === undefined) {
                    return;
                }
                this.mapboxMap.getCanvasContainer().style.cursor = e.originalEvent.shiftKey ? "move" : "pointer";
            });
            this.mapboxMap.on("mouseleave", "waypoints", () => {
                if (this.mapboxMap === undefined) {
                    return;
                }
                this.mapboxMap.getCanvasContainer().style.cursor = "";
            });
            this.mapboxMap.on("mousedown", "waypoints", (e) => {
                if (this.mapboxMap === undefined) {
                    return;
                }
                onDown(e);
                if (e.originalEvent.shiftKey) {
                    this.mapboxMap.getCanvasContainer().style.cursor = "grab";
                    this.mapboxMap.on("mousemove", onMove);
                    this.mapboxMap.once("mouseup", onUp);
                }
                else {
                    onClick();
                }
            });
            this.mapboxMap.on("touchstart", "waypoints", () => {
                onClick();
            });
        });
    }
    drawMap(resetCenter = false) {
        if (this.mapboxMap === undefined || this.mission.checkpoints.length === 0) {
            return;
        }
        if (resetCenter) {
            const lonLatArea = new LonLatArea(this.mission.origin_lon_lat);
            this.mission.checkpoints.forEach((c) => {
                lonLatArea.push(c.lon_lat);
            });
            const center = lonLatArea.center;
            this.mapboxMap.flyTo({
                center: [center.lon, center.lat],
                zoom: lonLatArea.getZoomLevel(16 / 9, 0.75, true),
            });
        }
        const source = this.mapboxMap.getSource("waypoints");
        if (source && source.type === "geojson") {
            const geoJsonData = this.geoJson.fromMission(this.mission);
            source.setData(geoJsonData);
        }
    }
    makeWeather() {
        const lastHeading = this.mission.checkpoints.length
            ? this.mission.checkpoints[this.mission.checkpoints.length - 1].direction
            : Math.floor(Math.random() * 360);
        this.mission.conditions.cloud.cover = Math.random();
        this.mission.conditions.cloud.height_feet = this.mission.conditions.cloud.cover
            ? 1000 + Math.floor(Math.random() * 91) * 100
            : 0;
        this.mission.conditions.cloud2.cover = this.mission.conditions.cloud.cover ? Math.random() : 0;
        this.mission.conditions.cloud2.height_feet = this.mission.conditions.cloud2.cover
            ? 1000 + this.mission.conditions.cloud.height_feet + Math.floor(Math.random() * 41) * 100
            : 0;
        this.mission.conditions.cloud3.cover = this.mission.conditions.cloud2.cover ? Math.random() : 0;
        this.mission.conditions.cloud3.height_feet = this.mission.conditions.cloud3.cover
            ? 1000 + this.mission.conditions.cloud2.height_feet + Math.floor(Math.random() * 41) * 100
            : 0;
        this.mission.conditions.thermal_strength = Math.random() * 0.5;
        this.mission.conditions.turbulence_strength = Math.random() * 0.5;
        this.mission.conditions.visibility = 5000 + Math.floor(Math.random() * 16) * 1000;
        this.mission.conditions.wind_direction = (360 + lastHeading - 30 + Math.floor(Math.random() * 61)) % 360;
        this.mission.conditions.wind_speed = Math.floor(Math.random() * 20);
        this.mission.conditions.wind_gusts =
            this.mission.conditions.wind_speed * (1 + this.mission.conditions.turbulence_strength);
    }
    syncToForm() {
        this.elements.aircraft_name.value = this.mission.aircraft_name;
        this.elements.callsign.value = this.mission.callsign;
        this.elements.cloud_base_feet.value = this.mission.conditions.cloud.height_feet.toFixed();
        this.elements.cloud_cover.value = (this.mission.conditions.cloud.cover * 100).toFixed();
        this.elements.cloud2_base_feet.value = this.mission.conditions.cloud2.height_feet.toFixed();
        this.elements.cloud2_cover.value = (this.mission.conditions.cloud2.cover * 100).toFixed();
        this.elements.cloud3_base_feet.value = this.mission.conditions.cloud3.height_feet.toFixed();
        this.elements.cloud3_cover.value = (this.mission.conditions.cloud3.cover * 100).toFixed();
        this.elements.cruise_altitude_ft.value = this.mission.cruise_altitude_ft.toFixed();
        this.elements.cruise_speed.value = this.mission.cruise_speed.toFixed();
        this.elements.flight_setting.value = this.mission.flight_setting;
        this.elements.date.valueAsDate = this.mission.conditions.time.dateTime;
        this.elements.description.value = this.mission.description;
        this.elements.metarApiKey.value = this.metarApiKey;
        this.elements.origin_dir.value = this.mission.origin_dir.toFixed();
        this.elements.origin_dir.valueAsNumber = Math.round(this.mission.origin_dir);
        this.elements.thermal_strength.value = (this.mission.conditions.thermal_strength * 100).toFixed();
        this.elements.time.valueAsDate = this.mission.conditions.time.dateTime;
        this.elements.title.value = this.mission.title;
        this.elements.turbulence_strength.value = (this.mission.conditions.turbulence_strength * 100).toFixed();
        this.elements.turn_time.valueAsNumber = this.mission.turn_time;
        this.elements.visibility.value = this.mission.conditions.visibility.toFixed();
        this.elements.wind_direction.value = this.mission.conditions.wind_direction.toFixed();
        this.elements.wind_gusts.value = this.mission.conditions.wind_gusts.toFixed();
        this.elements.wind_speed.value = this.mission.conditions.wind_speed.toFixed();
        this.elements.no_guides.checked = this.mission.no_guides;
        this.elements.simBriefUseDestinationWeather.checked = this.simBriefUseDestinationWeather;
        if (this.mission.magnetic_declination !== undefined) {
            this.elements.magneticDeclination.valueAsNumber = this.mission.magnetic_declination;
        }
        else {
            this.elements.magneticDeclination.value = "";
        }
        this.syncToOutput();
    }
    store() {
        localStorage.setItem(this.constructor.name, JSON.stringify(this));
    }
    restore() {
        const classSimpleMode = localStorage.getItem(App.CLASS_SIMPLE_MODE) || "1";
        this.elements.main.classList.toggle(App.CLASS_SIMPLE_MODE, classSimpleMode === "1");
        this.elements.expertMode.checked = classSimpleMode !== "1";
        const appState = localStorage.getItem(this.constructor.name);
        if (appState) {
            this.hydrate(JSON.parse(appState));
        }
    }
    syncToOutput() {
        this.elements.visibility_sm.value = this.mission.conditions.visibility_sm.toFixed();
        this.elements.cloud_cover_code.value = this.mission.conditions.cloud.cover_code;
        this.elements.cloud2_cover_code.value = this.mission.conditions.cloud2.cover_code;
        this.elements.cloud3_cover_code.value = this.mission.conditions.cloud3.cover_code;
        if (this.mission.origin_icao && this.mission.destination_icao) {
            this.elements.makeMetarDept.innerText = "Fetch weather for " + this.mission.origin_icao;
            this.elements.makeMetarDest.innerText = "Fetch weather for " + this.mission.destination_icao;
            this.elements.makeMetarDept.disabled = this.metarApiKey.length < 4;
            this.elements.makeMetarDest.disabled = this.metarApiKey.length < 4;
            this.elements.metar.setAttribute("href", "https://metar-taf.com/" + this.mission.destination_icao);
            this.elements.metar.innerText = "check the weather for " + this.mission.destination_icao;
        }
        else {
            this.elements.makeMetarDept.disabled = true;
            this.elements.makeMetarDest.disabled = true;
        }
        this.elements.turn_radius.value = ((this.mission.cruise_speed * (this.mission.turn_time / 60)) /
            (2 * Math.PI)).toFixed(1);
    }
    showError(message) {
        alert(message);
    }
    toJSON() {
        return {
            metarApiKey: this.metarApiKey,
            simBriefUsername: this.elements.simBrief.username,
            simBriefUseDestinationWeather: this.simBriefUseDestinationWeather,
            mission: this.mission,
        };
    }
    hydrate(json) {
        this.metarApiKey = json.metarApiKey || this.metarApiKey;
        this.elements.simBrief.username = json.simBriefUsername || this.elements.simBrief.username;
        this.simBriefUseDestinationWeather = json.simBriefUseDestinationWeather === true;
        this.elements.simBriefUseDestinationWeather.checked = this.simBriefUseDestinationWeather;
        if (json.mission) {
            this.mission.hydrate(json.mission);
        }
    }
}
App.CLASS_SIMPLE_MODE = "is-simple-mode";
App.SHOW_WEATHER = 2 ** 0;
App.SHOW_AIRPORTS = 2 ** 1;
App.SHOW_CHECKPOINTS = 2 ** 2;
App.SHOW_MAP = 2 ** 3;
App.SHOW_MAP_CENTER = 2 ** 4;
App.SHOW_ALL = App.SHOW_WEATHER | App.SHOW_AIRPORTS | App.SHOW_CHECKPOINTS | App.SHOW_MAP;
