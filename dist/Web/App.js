import { MainMcfFactory } from "../Aerofly/MainMcf.js";
import { Mission, MissionFactory } from "../Aerofly/Mission.js";
import { MissionConditionsCloud } from "../Aerofly/MissionConditions.js";
import { MissionsList } from "../Aerofly/MissionsList.js";
import { asciify } from "../Cli/Arguments.js";
import { GeoJson } from "../Export/GeoJson.js";
import { GeoJsonImport as GeoJsonImport } from "../Import/GeoJson.js";
import { Html } from "../Export/Html.js";
import { Markdown } from "../Export/Markdown.js";
import { SkyVector } from "../Export/SkyVector.js";
import { GarminFpl } from "../Import/GarminFpl.js";
import { Gpx } from "../Import/Gpx.js";
import { MsfsPln, MsfsPlnExport } from "../Import/MsfsPln.js";
import { XplaneFms, XplaneFmsExport } from "../Import/XplaneFms.js";
import { LonLat, LonLatArea } from "../World/LonLat.js";
import { MissionCheckpoint } from "../Aerofly/MissionCheckpoint.js";
import { Outputtable } from "../Export/Outputtable.js";
export class App {
    constructor() {
        this.elements = {
            aircraft_name: document.getElementById("aircraft_name"),
            callsign: document.getElementById("callsign"),
            cloud_base_feet: document.getElementById("cloud_base_feet"),
            cloud_cover_code: document.getElementById("cloud_cover_code"),
            cloud_cover: document.getElementById("cloud_cover"),
            cloud2_base_feet: document.getElementById("cloud2_base_feet"),
            cloud2_cover_code: document.getElementById("cloud2_cover_code"),
            cloud2_cover: document.getElementById("cloud2_cover"),
            cloud3_base_feet: document.getElementById("cloud3_base_feet"),
            cloud3_cover_code: document.getElementById("cloud3_cover_code"),
            cloud3_cover: document.getElementById("cloud3_cover"),
            cruise_altitude_ft: document.getElementById("cruise_altitude_ft"),
            cruise_speed: document.getElementById("cruise_speed"),
            date: document.getElementById("date"),
            description: document.getElementById("description"),
            expertMode: document.getElementById("expert-mode"),
            flightplan: document.getElementById("flightplan"),
            main: document.querySelector("main"),
            magneticDeclination: document.getElementById("magnetic_declination"),
            makeMetarDept: document.getElementById("make-metar-dept"),
            makeMetarDest: document.getElementById("make-metar-dest"),
            makeWeather: document.getElementById("make-weather"),
            metar: document.getElementById("metar"),
            metarApiKey: document.getElementById("metar-api-key"),
            origin_dir: document.getElementById("origin_dir"),
            settingsModal: document.getElementById("settings-modal"),
            thermal_strength: document.getElementById("thermal_strength"),
            time: document.getElementById("time"),
            title: document.getElementById("title"),
            turbulence_strength: document.getElementById("turbulence_strength"),
            turn_time: document.getElementById("turn_time"),
            turn_radius: document.getElementById("turn_radius"),
            upload: document.getElementById("upload"),
            visibility_sm: document.getElementById("visibility_sm"),
            visibility: document.getElementById("visibility"),
            wind_direction: document.getElementById("wind_direction"),
            wind_gusts: document.getElementById("wind_gusts"),
            wind_speed: document.getElementById("wind_speed"),
        };
        this.useIcao = true;
        this.metarApiKey = "";
        this.mapboxMap = null;
        this.mission = new Mission("", "");
        this.missionList = new MissionsList("");
        this.missionList.missions.push(this.mission);
        this.restore();
        this.flightplan = new Html(this.mission);
        this.skyVector = new SkyVector(this.mission);
        this.geoJson = new GeoJson();
        this.elements.main.addEventListener("input", (e) => {
            const target = e.target;
            let redraw = true;
            switch (target.id) {
                case "aircraft_name":
                    this.mission.aircraft_name = target.value;
                    this.drawMap();
                    this.syncToForm();
                    break;
                case "callsign":
                    this.mission.callsign = target.value;
                    break;
                case "cloud_base_feet":
                    this.mission.conditions.cloud.height_feet = target.valueAsNumber;
                    this.syncToOutput();
                    break;
                case "cloud_base2_feet":
                    this.mission.conditions.cloud2.height_feet = target.valueAsNumber;
                    this.syncToOutput();
                    break;
                case "cloud_base3_feet":
                    this.mission.conditions.cloud3.height_feet = target.valueAsNumber;
                    this.syncToOutput();
                    break;
                case "cloud_cover":
                    this.mission.conditions.cloud.cover = target.valueAsNumber / 100;
                    this.syncToOutput();
                    break;
                case "cloud_cover2":
                    this.mission.conditions.cloud2.cover = target.valueAsNumber / 100;
                    this.syncToOutput();
                    break;
                case "cloud_cover3":
                    this.mission.conditions.cloud3.cover = target.valueAsNumber / 100;
                    this.syncToOutput();
                    break;
                case "cruise_altitude_ft":
                    this.mission.cruise_altitude_ft = target.valueAsNumber;
                    this.mission.syncCruiseAltitude();
                    break;
                case "cruise_speed":
                    this.mission.cruise_speed = target.valueAsNumber;
                    this.mission.syncCruiseSpeed();
                    this.syncToOutput();
                    this.drawMap();
                    break;
                case "date":
                    if (target.valueAsDate) {
                        this.mission.conditions.time.dateTime.setUTCFullYear(target.valueAsDate.getUTCFullYear());
                        this.mission.conditions.time.dateTime.setUTCMonth(target.valueAsDate.getUTCMonth());
                        this.mission.conditions.time.dateTime.setUTCDate(target.valueAsDate.getUTCDate());
                    }
                    break;
                case "description":
                    this.mission.description = target.value;
                    break;
                case "magnetic_declination":
                    this.mission.magnetic_declination = target.value ? target.valueAsNumber : undefined;
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
                    break;
                case "time":
                    if (target.valueAsDate) {
                        this.mission.conditions.time.dateTime.setUTCHours(target.valueAsDate.getUTCHours());
                        this.mission.conditions.time.dateTime.setUTCMinutes(target.valueAsDate.getUTCMinutes());
                    }
                    break;
                case "title":
                    this.mission.title = target.value;
                    break;
                case "turbulence_strength":
                    this.mission.conditions.turbulence_strength = target.valueAsNumber / 100;
                    break;
                case "turn_time":
                    this.mission.turn_time = target.valueAsNumber;
                    this.syncToOutput();
                    this.drawMap();
                    break;
                case "upload":
                    this.uploadFile();
                    this.syncToForm();
                    break;
                case "visibility":
                    this.mission.conditions.visibility = target.valueAsNumber;
                    this.syncToOutput();
                    break;
                case "wind_direction":
                    this.mission.conditions.wind_direction = target.valueAsNumber;
                    this.drawMap();
                    break;
                case "wind_gusts":
                    this.mission.conditions.wind_gusts = target.valueAsNumber;
                    break;
                case "wind_speed":
                    this.mission.conditions.wind_speed = target.valueAsNumber;
                    this.drawMap();
                    break;
                default:
                    const prop = target.getAttribute("data-cp-prop");
                    const id = target.getAttribute("data-cp-id");
                    redraw = false;
                    if (prop && id) {
                        const index = Number(id);
                        switch (prop) {
                            case "name":
                                this.mission.checkpoints[index].name = target.value;
                                if (index === 1) {
                                    this.mission.checkpoints[index].type = target.value.match(/^\d\d[LRC]?$/)
                                        ? MissionCheckpoint.TYPE_DEPARTURE_RUNWAY
                                        : MissionCheckpoint.TYPE_WAYPOINT;
                                }
                                else if (index === this.mission.checkpoints.length - 2) {
                                    this.mission.checkpoints[index].type = target.value.match(/^\d\d[LRC]?$/)
                                        ? MissionCheckpoint.TYPE_DESTINATION_RUNWAY
                                        : MissionCheckpoint.TYPE_WAYPOINT;
                                }
                                break;
                            case "altitude_ft":
                                this.mission.checkpoints[index].lon_lat.altitude_ft = target.valueAsNumber;
                                break;
                            case "speed":
                                this.mission.checkpoints[index].speed = target.valueAsNumber;
                                this.mission.calculateCheckpoints();
                                const tr = target.closest('tr');
                                if (tr) {
                                    tr.querySelector('.heading').innerText = Outputtable.padThree(this.mission.checkpoints[index].heading);
                                    tr.querySelector('.time_enroute').innerText = Outputtable.convertHoursToMinutesString(this.mission.checkpoints[index].time_enroute);
                                }
                                const table = target.closest('table');
                                if (table) {
                                    table.querySelector('tfoot .time_enroute').innerText = Outputtable.convertHoursToMinutesString(this.mission.time_enroute);
                                }
                                break;
                            case "frequency_mhz":
                                this.mission.checkpoints[index].frequency_mhz = target.valueAsNumber;
                                break;
                        }
                    }
                    break;
            }
            if (redraw) {
                if (target.id !== "upload") {
                    this.mission.calculateCheckpoints();
                }
                this.showFlightplan();
            }
            else {
                this.drawMap();
                this.store();
            }
        });
        document.querySelectorAll("button.download").forEach((i) => {
            i.addEventListener("click", (e) => {
                var _a;
                const target = e.currentTarget;
                const filename = ((_a = target.querySelector("code")) === null || _a === void 0 ? void 0 : _a.innerText) || "";
                if (!filename) {
                    this.showError("Missing filename for saving");
                }
                switch (target.id) {
                    case "download-json":
                        this.download(filename, JSON.stringify(this.geoJson.fromMission(this.mission), null, 2), "application/geo+json");
                        break;
                    case "download-md":
                        this.download(filename, new Markdown(this.mission).toString(filename.replace(".md", ".tmc")), "text/markdown");
                        break;
                    case "download-pln":
                        this.download(filename, new MsfsPlnExport(this.mission).toString());
                        break;
                    case "download-fms":
                        this.download(filename, new XplaneFmsExport(this.mission).toString());
                        break;
                    case "download-tmc":
                        this.download(filename, this.missionList.toString());
                        break;
                }
            });
        });
        this.elements.expertMode.addEventListener('click', () => {
            this.elements.main.classList.toggle(App.CLASS_SIMPLE_MODE);
            localStorage.setItem(App.CLASS_SIMPLE_MODE, this.elements.main.classList.contains(App.CLASS_SIMPLE_MODE) ? '1' : '0');
        });
        // Modals
        document.querySelectorAll("button[data-modal]").forEach((i) => {
            i.addEventListener("click", (e) => {
                e.preventDefault();
                const tgt = e.currentTarget.getAttribute('data-modal');
                console.log(tgt);
                if (tgt) {
                    document.getElementById(tgt).showModal();
                }
            });
        });
        document.querySelectorAll("button.modal-close").forEach((i) => {
            i.addEventListener("click", (e) => {
                e.preventDefault();
                e.currentTarget.closest('dialog').close();
            });
        });
        // Reset buttons
        document.querySelectorAll("button.reset").forEach((i) => {
            i.addEventListener("click", (e) => {
                const target = e.currentTarget;
                switch (target.id) {
                    case 'reset-description':
                        this.mission.title = '';
                        this.mission.description = '';
                        this.mission.setAutoTitleDescription();
                        break;
                    case 'reset-aircraft':
                        this.mission.aircraft_name = 'c172';
                        this.mission.cruise_altitude = 0;
                        break;
                    case 'reset-time':
                        this.mission.conditions.time.dateTime = new Date();
                        this.mission.conditions.time.dateTime.setUTCSeconds(0);
                        this.mission.conditions.time.dateTime.setUTCMilliseconds(0);
                        break;
                    case 'reset-weather':
                        this.mission.conditions.wind_direction = 0;
                        this.mission.conditions.wind_gusts = 0;
                        this.mission.conditions.wind_speed = 0;
                        this.mission.conditions.turbulence_strength = 0;
                        this.mission.conditions.thermal_strength = 0;
                        this.mission.conditions.visibility_percent = 1;
                        this.mission.conditions.clouds = [];
                        break;
                    case 'reset-flightplan':
                        this.mission.checkpoints = [];
                        this.mission.magnetic_declination = undefined;
                        break;
                }
                this.syncToForm();
                this.showFlightplan();
            });
        });
        document.querySelectorAll("button.add-waypoint").forEach((i) => {
            i.addEventListener("click", (e) => {
                const target = e.currentTarget;
                switch (target.id) {
                    case 'add-departure':
                        {
                            let cpFrom = this.mission.checkpoints[0];
                            let cpTo = this.mission.checkpoints[1];
                            let spliceIndex = 1;
                            let distance = 3.5;
                            if (cpTo.type === MissionCheckpoint.TYPE_DEPARTURE_RUNWAY) {
                                cpFrom = this.mission.checkpoints[1];
                                cpTo = this.mission.checkpoints[2];
                                spliceIndex += 1;
                                distance -= 0.5;
                            }
                            const cp = new MissionCheckpoint();
                            cp.lon_lat = cpFrom.lon_lat.getRelativeCoordinates(distance, cpTo.direction);
                            cp.lon_lat.altitude_ft += 1000;
                            cp.name = cpFrom.name + '+3';
                            cp.speed = cpTo.speed;
                            cp.ground_speed = cpTo.ground_speed;
                            this.mission.checkpoints.splice(spliceIndex, 0, cp);
                        }
                        break;
                    case 'add-approach':
                        {
                            const lastIndex = this.mission.checkpoints.length - 1;
                            let cpTo = this.mission.checkpoints[lastIndex];
                            let spliceIndex = lastIndex;
                            let distance = 3.5;
                            if (this.mission.checkpoints[lastIndex - 1].type === MissionCheckpoint.TYPE_DESTINATION_RUNWAY) {
                                cpTo = this.mission.checkpoints[lastIndex - 1];
                                spliceIndex -= 1;
                                distance -= 0.5;
                            }
                            const cp = new MissionCheckpoint();
                            cp.lon_lat = cpTo.lon_lat.getRelativeCoordinates(distance, (cpTo.direction + 180) % 360);
                            cp.lon_lat.altitude_ft += 1000;
                            cp.name = cpTo.name + '+3';
                            cp.speed = cpTo.speed;
                            cp.ground_speed = cpTo.ground_speed;
                            this.mission.checkpoints.splice(spliceIndex, 0, cp);
                        }
                        break;
                }
                this.mission.calculateCheckpoints();
                this.showFlightplan();
                this.drawMap();
            });
        });
        this.elements.makeWeather.addEventListener("click", () => {
            this.makeWeather();
            this.syncToForm();
            this.showFlightplan();
        });
        document.querySelectorAll("button.make-metar").forEach((i) => {
            i.addEventListener("click", (e) => {
                const icao = e.currentTarget.id === 'make-metar-dept'
                    ? this.mission.origin_icao
                    : this.mission.destination_icao;
                this.fetchMetar(icao, () => {
                    this.syncToForm();
                    this.showFlightplan();
                });
            });
        });
        this.showFlightplan();
        this.syncToForm();
    }
    showFlightplan() {
        if (this.elements.flightplan) {
            this.elements.flightplan.innerHTML = this.flightplan.toString();
        }
        document.querySelectorAll("button.download").forEach((b) => {
            if (this.mission.checkpoints.length > 0) {
                b.removeAttribute("disabled");
            }
            else {
                b.setAttribute("disabled", "disabled");
            }
        });
        const slug = this.mission.title
            ? asciify(this.mission.title.replace(/^(?:From )?(\S+) to (\S+)$/i, "$1-$2"))
            : "custom_missions";
        document.querySelectorAll('button.download code').forEach((el) => {
            el.innerText = slug + el.innerText.replace(/^.+\./, '.');
        });
        this.store();
    }
    addMapbox(mapboxMap) {
        this.mapboxMap = mapboxMap;
        if (this.mission.origin_lon_lat) {
            this.mapboxMap.setZoom(5);
            this.mapboxMap.setCenter([this.mission.origin_lon_lat.lon, this.mission.origin_lon_lat.lat]);
        }
        this.mapboxMap.on("load", () => {
            if (!this.mapboxMap) {
                return;
            }
            this.mapboxMap.addSource('mapbox-dem', {
                'type': 'raster-dem',
                'url': 'mapbox://mapbox.mapbox-terrain-dem-v1',
                'tileSize': 512,
                'maxzoom': 14
            });
            this.mapboxMap.setTerrain({ 'source': 'mapbox-dem', 'exaggeration': 1.5 });
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
                    "line-dasharray": [
                        "match", ["get", "type"],
                        "Taxi", ["literal", [1, 2]],
                        ["literal", [10, 0]]
                    ]
                },
                //filter: ['==', '$type', 'Polygon']
            });
            this.mapboxMap.addLayer({
                'id': 'waypoints',
                'type': 'symbol',
                'source': 'waypoints',
                'layout': {
                    'icon-image': ['get', 'marker-symbol'],
                    'text-field': ['get', 'title'],
                    'text-offset': [0, 0.5],
                    'text-anchor': 'top',
                    'text-size': 12
                },
                paint: {
                    "icon-color": "#FF1493"
                },
                //filter: ['==', '$type', 'Point']
            });
            this.drawMap(true);
            // -----------------------------------------------------------------------
            let currentFeature = null;
            const source = this.mapboxMap.getSource('waypoints');
            const onDown = (e) => {
                if (!this.mapboxMap) {
                    return;
                }
                e.preventDefault();
                const features = this.mapboxMap.queryRenderedFeatures(e.point, {
                    layers: ['waypoints']
                });
                currentFeature = features[0];
            };
            const onMove = (e) => {
                if (!this.mapboxMap) {
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
                if (!this.mapboxMap) {
                    return;
                }
                this.mapboxMap.off('mousemove', onMove);
                currentFeature = null;
                this.mission.calculateCheckpoints();
                this.drawMap();
                this.showFlightplan();
            };
            // -----------------------------------------------------------------------
            // @see https://docs.mapbox.com/mapbox-gl-js/example/drag-a-point/
            this.mapboxMap.on('mouseenter', 'waypoints', () => {
                if (!this.mapboxMap) {
                    return;
                }
                this.mapboxMap.getCanvasContainer().style.cursor = 'move';
            });
            this.mapboxMap.on('mouseleave', 'waypoints', () => {
                if (!this.mapboxMap) {
                    return;
                }
                this.mapboxMap.getCanvasContainer().style.cursor = '';
            });
            this.mapboxMap.on('mousedown', 'waypoints', (e) => {
                if (!this.mapboxMap) {
                    return;
                }
                onDown(e);
                this.mapboxMap.getCanvasContainer().style.cursor = 'grab';
                this.mapboxMap.on('mousemove', onMove);
                this.mapboxMap.once('mouseup', onUp);
            });
            this.mapboxMap.on('touchstart', 'waypoints', (e) => {
                if (!this.mapboxMap || e.points.length !== 1) {
                    return;
                }
                onDown(e);
                this.mapboxMap.on('touchmove', onMove);
                this.mapboxMap.once('touchend', onUp);
            });
        });
    }
    drawMap(resetCenter = false) {
        if (!this.mapboxMap || this.mission.checkpoints.length === 0) {
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
                zoom: lonLatArea.getZoomLevel(16 / 9, 4.1, true)
            });
        }
        const source = this.mapboxMap.getSource("waypoints");
        if (source && source.type === "geojson") {
            const geoJsonData = this.geoJson.fromMission(this.mission);
            source.setData(geoJsonData);
        }
    }
    uploadFile() {
        if (!this.elements.upload || !this.elements.upload.files) {
            this.showError("No file given");
            return;
        }
        for (const file of this.elements.upload.files) {
            const reader = new FileReader();
            const fileEnding = file.name.replace(/^.*(\.[^.]+)$/, "$1");
            reader.onload = (e) => {
                if (e.target) {
                    switch (fileEnding) {
                        case ".mcf":
                            const mainMcf = new MainMcfFactory().create(e.target.result);
                            this.mission.fromMainMcf(mainMcf);
                            break;
                        case ".tmc":
                            new MissionFactory().create(e.target.result, this.mission);
                            break;
                        case ".fpl":
                            const fpl = new GarminFpl(e.target.result);
                            this.mission.fromGarminFpl(fpl);
                            break;
                        case ".pln":
                            const msfs = new MsfsPln(e.target.result);
                            this.mission.fromGarminFpl(msfs);
                            break;
                        case ".fms":
                            const xplane = new XplaneFms(e.target.result);
                            this.mission.fromGarminFpl(xplane);
                            break;
                        case ".gpx":
                            const gpx = new Gpx(e.target.result);
                            this.mission.fromGarminFpl(gpx);
                            break;
                        case ".geojson":
                            const geojson = new GeoJsonImport(e.target.result);
                            this.mission.fromGarminFpl(geojson);
                            break;
                        default:
                            this.showError("Unsupported file: " + file.name);
                            break;
                    }
                    this.useIcao = this.mission.origin_lon_lat.continent !== LonLat.CONTINENT_NORTH_AMERICA;
                    this.syncToForm();
                    this.showFlightplan();
                    this.drawMap(true);
                }
            };
            reader.readAsText(file);
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
        this.mission.conditions.wind_gusts = this.mission.conditions.wind_speed * (1 + this.mission.conditions.turbulence_strength);
    }
    fetchMetar(icao, callback = () => { }) {
        const url = "https://api.checkwx.com/metar/" + encodeURIComponent(icao) + "/decoded";
        fetch(url, {
            headers: {
                "X-API-Key": this.metarApiKey,
                Accept: "application/json",
            },
        })
            .then((response) => {
            if (!response.ok) {
                this.showError(`Error getting METAR data, got ${response.status} status code`);
            }
            return response.json();
        })
            .then((responseJson) => {
            var _a, _b, _c, _d, _e;
            if (responseJson.data.length < 1) {
                this.showError(`No data in METAR response`);
            }
            const metar = responseJson.data[0];
            if (metar.wind) {
                this.mission.conditions.wind_direction = (_a = metar.wind.degrees) !== null && _a !== void 0 ? _a : 0;
                this.mission.conditions.wind_gusts = (_b = metar.wind.gust_kts) !== null && _b !== void 0 ? _b : 0;
                this.mission.conditions.wind_speed = (_c = metar.wind.speed_kts) !== null && _c !== void 0 ? _c : 0;
            }
            else {
                this.mission.conditions.wind_direction = 0;
                this.mission.conditions.wind_gusts = 0;
                this.mission.conditions.wind_speed = 0;
            }
            let visibility = (_d = metar.visibility.meters_float) !== null && _d !== void 0 ? _d : 0;
            if (visibility === 9999) {
                visibility = 20000;
            }
            this.mission.conditions.visibility = Math.round(visibility / 500) * 500;
            this.mission.conditions.clouds = metar.clouds.map((c) => {
                var _a;
                const cloud = new MissionConditionsCloud();
                cloud.cover_code = c.code;
                cloud.height_feet = (_a = c.feet) !== null && _a !== void 0 ? _a : 0;
                return cloud;
            });
            // @see https://github.com/fboes/aerofly-wettergeraet/blob/main/src/WettergeraetLib/AeroflyWeather.cpp#L89
            this.mission.conditions.thermal_strength = (((_e = metar.temperature.celsius) !== null && _e !== void 0 ? _e : 14) - 5) / 25;
            this.mission.conditions.makeTurbulence();
            callback();
        });
    }
    download(filename, content, type = "text/plain") {
        const a = document.createElement("a");
        a.href = URL.createObjectURL(new File([content], filename, {
            type,
        }));
        a.download = filename;
        a.click();
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
        if (this.mission.magnetic_declination !== undefined) {
            this.elements.magneticDeclination.valueAsNumber = this.mission.magnetic_declination;
        }
        else {
            this.elements.magneticDeclination.value = '';
        }
        this.syncToOutput();
    }
    store() {
        localStorage.setItem(this.constructor.name, JSON.stringify(this));
    }
    restore() {
        this.metarApiKey = localStorage.getItem("metarApiKey") || this.metarApiKey;
        const classSimpleMode = localStorage.getItem(App.CLASS_SIMPLE_MODE) || '1';
        this.elements.main.classList.toggle(App.CLASS_SIMPLE_MODE, classSimpleMode === '1');
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
            this.elements.makeMetarDept.disabled = false;
            this.elements.makeMetarDest.disabled = false;
        }
        this.elements.turn_radius.value = (this.mission.cruise_speed * (this.mission.turn_time / 60) / (2 * Math.PI)).toFixed(1);
    }
    showError(message) {
        alert(message);
    }
    toJSON() {
        return {
            metarApiKey: this.metarApiKey,
            mission: this.mission,
        };
    }
    hydrate(json) {
        if (json.metarApiKey) {
            this.metarApiKey = json.metarApiKey;
        }
        if (json.mission) {
            this.mission.hydrate(json.mission);
        }
    }
}
App.CLASS_SIMPLE_MODE = 'is-simple-mode';
