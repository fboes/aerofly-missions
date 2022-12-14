import { MainMcf } from "./Aerofly/MainMcf.js";
import { Mission, MissionParsed } from "./Aerofly/Mission.js";
import { MissionCheckpoint } from "./Aerofly/MissionCheckpoint.js";
import { MissionsList } from "./Aerofly/MissionsList.js";
import { asciify } from "./Cli/Arguments.js";
import { BashColors } from "./Cli/BashColors.js";
import { Flightplan } from "./Export/Flightplan.js";
import { GeoJson } from "./Export/GeoJson.js";
import { Markdown } from "./Export/Markdown.js";
import { SkyVector } from "./Export/SkyVector.js";
import { GarminFpl } from "./Import/GarminFpl.js";
import { MsfsPln } from "./Import/MsfsPln.js";
import { XplaneFms } from "./Import/XplaneFms.js";
import { LonLatArea } from "./World/LonLat.js";
class App {
    constructor() {
        this.elements = {
            upload: document.getElementById('upload'),
            aircraft_name: document.getElementById('aircraft_name'),
            date: document.getElementById('date'),
            time: document.getElementById('time'),
            title: document.getElementById('title'),
            description: document.getElementById('description'),
            cruise_speed: document.getElementById('cruise_speed'),
            cruise_altitude_ft: document.getElementById('cruise_altitude_ft'),
            origin_dir: document.getElementById('origin_dir'),
            ils_frequency: document.getElementById('ils_frequency'),
            wind_direction: document.getElementById('wind_direction'),
            wind_speed: document.getElementById('wind_speed'),
            visibility: document.getElementById('visibility'),
            cloud_base_feet: document.getElementById('cloud_base_feet'),
            cloud_cover: document.getElementById('cloud_cover'),
            wind_gusts: document.getElementById('wind_gusts'),
            turbulence_strength: document.getElementById('turbulence_strength'),
            thermal_strength: document.getElementById('thermal_strength'),
            callsign: document.getElementById('callsign'),
            flightplan: document.getElementById('flightplan'),
            linkSkyvector: document.getElementById('link-skyvector'),
            linkGoogleMap: document.getElementById('link-gmap'),
            linkOpenStreetMap: document.getElementById('link-osm'),
            downloadTmc: document.getElementById('download-tmc'),
            downloadMd: document.getElementById('download-md'),
            downloadJson: document.getElementById('download-json'),
            downloadTmcCode: document.querySelector('#download-tmc code'),
            downloadMdCode: document.querySelector('#download-md code'),
            downloadJsonCode: document.querySelector('#download-json code'),
            randomizeWeather: document.getElementById('randomize-weather'),
        };
        this.mission = new Mission('', '');
        this.missionList = new MissionsList('');
        this.missionList.missions.push(this.mission);
        this.flightplan = new Flightplan(this.mission, new BashColors(BashColors.COLOR_HTML));
        this.skyVector = new SkyVector(this.mission);
        document.querySelectorAll('input, select, textarea').forEach(i => {
            i.addEventListener('input', (e) => {
                const target = e.currentTarget;
                switch (target.id) {
                    case 'upload':
                        this.uploadFile();
                        this.syncToForm();
                        break;
                    case 'aircraft_name':
                        this.mission.aircraft_name = target.value;
                        this.syncToForm();
                        break;
                    case 'cruise_speed':
                        this.mission.cruise_speed = target.valueAsNumber;
                        break;
                    case 'cruise_altitude_ft':
                        this.mission.cruise_altitude_ft = target.valueAsNumber;
                        break;
                    case 'origin_dir':
                        this.mission.origin_dir = target.valueAsNumber;
                        break;
                    case 'origin_dir':
                        this.mission.origin_dir = target.valueAsNumber;
                        break;
                    case 'title':
                        this.mission.title = target.value;
                        break;
                    case 'callsign':
                        this.mission.callsign = target.value;
                        break;
                    case 'description':
                        this.mission.description = target.value;
                        break;
                    case 'date':
                        {
                            const match = target.value.match(/(\d+)\D(\d+)\D(\d+)/);
                            if (match) {
                                this.mission.conditions.time.time_year = Number(match[1]);
                                this.mission.conditions.time.time_month = Number(match[2]);
                                this.mission.conditions.time.time_day = Number(match[3]);
                            }
                        }
                        break;
                    case 'time':
                        {
                            const match = target.value.match(/(\d+)\D(\d+)/);
                            if (match) {
                                this.mission.conditions.time.time_hours = Number(match[1]) + Number(match[2]) / 60;
                            }
                        }
                        break;
                    case 'wind_direction':
                        this.mission.conditions.wind_direction = target.valueAsNumber;
                        break;
                    case 'wind_speed':
                        this.mission.conditions.wind_speed = target.valueAsNumber;
                        break;
                    case 'wind_gusts':
                        this.mission.conditions.wind_gusts = target.valueAsNumber;
                        break;
                    case 'visibility':
                        this.mission.conditions.visibility = target.valueAsNumber;
                        break;
                    case 'cloud_base_feet':
                        this.mission.conditions.cloud_base_feet = target.valueAsNumber;
                        break;
                    case 'cloud_cover':
                        this.mission.conditions.cloud_cover = target.valueAsNumber / 100;
                        break;
                    case 'turbulence_strength':
                        this.mission.conditions.turbulence_strength = target.valueAsNumber / 100;
                        break;
                    case 'thermal_strength':
                        this.mission.conditions.thermal_strength = target.valueAsNumber / 100;
                        break;
                }
                if (target.id !== 'upload') {
                    this.mission.calculateDirectionForCheckpoints();
                }
                this.showFlightplan();
            });
        });
        document.querySelectorAll('button.download').forEach(i => {
            i.addEventListener('click', (e) => {
                var _a;
                const target = e.currentTarget;
                const filename = ((_a = target.querySelector('code')) === null || _a === void 0 ? void 0 : _a.innerText) || '';
                if (!filename) {
                    this.showError('Missing filename for saving');
                }
                switch (target.id) {
                    case 'download-tmc':
                        this.download(filename, this.missionList.toString());
                        break;
                    case 'download-md':
                        this.download(filename, new Markdown(this.mission).toString());
                        break;
                    case 'download-json':
                        this.download(filename, JSON.stringify(new GeoJson().fromMission(this.mission), null, 2), 'text/json');
                        break;
                }
            });
        });
        this.elements.randomizeWeather.addEventListener('click', () => {
            this.randomizeWeather();
            this.syncToForm();
            this.showFlightplan();
        });
        this.showFlightplan();
        this.syncToForm();
    }
    showFlightplan() {
        const lonLatArea = new LonLatArea(this.mission.origin_lon_lat);
        this.mission.checkpoints.forEach((c) => {
            lonLatArea.push(c.lon_lat);
        });
        const center = lonLatArea.center;
        const zoomLevel = lonLatArea.zoomLevel;
        if (this.elements.ils_frequency.valueAsNumber > 0 && this.mission.checkpoints.length > 2) {
            let runway = this.mission.checkpoints[this.mission.checkpoints.length - 2];
            if (runway.type !== MissionCheckpoint.TYPE_DESTINATION_RUNWAY) {
                runway = this.mission.checkpoints[this.mission.checkpoints.length - 1];
            }
            runway.frequency_mhz = this.elements.ils_frequency.valueAsNumber;
        }
        if (this.elements.flightplan) {
            this.elements.flightplan.innerHTML = this.flightplan.toString();
        }
        if (this.elements.linkSkyvector) {
            this.elements.linkSkyvector.href = this.skyVector.toString();
        }
        if (this.elements.linkGoogleMap) {
            this.elements.linkGoogleMap.href = `https://www.google.com/maps/@?api=1&map_action=map&center=${center.lat},${center.lon}&zoom=${zoomLevel}&basemap=terrain`;
        }
        if (this.elements.linkOpenStreetMap) {
            this.elements.linkOpenStreetMap.href = `https://www.openstreetmap.org/#map=${zoomLevel}/${center.lat}/${center.lon}`;
        }
        document.querySelectorAll('button.download').forEach(b => {
            if (this.mission.checkpoints.length > 0) {
                b.removeAttribute('disabled');
            }
            else {
                b.setAttribute('disabled', 'disabled');
            }
        });
        const slug = this.mission.title ? asciify(this.mission.title.replace(/(^|\W)(from|to|and|or|in) /gi, '$1')) : 'custom_this.missions';
        this.elements.downloadTmcCode.innerText = slug + '.tmc';
        this.elements.downloadMdCode.innerText = slug + '.md';
        this.elements.downloadJsonCode.innerText = slug + '.json';
    }
    uploadFile() {
        if (!this.elements.upload || !this.elements.upload.files) {
            this.showError('No file given');
            return;
        }
        for (const file of this.elements.upload.files) {
            const reader = new FileReader();
            const fileEnding = file.name.replace(/^.*(\.[^.]+)$/, '$1');
            reader.onload = (e) => {
                if (e.target) {
                    switch (fileEnding) {
                        case '.mcf':
                            {
                                const mainMcf = new MainMcf(e.target.result);
                                this.mission.fromMainMcf(mainMcf);
                            }
                            break;
                        case '.tmc':
                            {
                                new MissionParsed(e.target.result, this.mission);
                            }
                            break;
                        case '.fpl':
                            {
                                const fpl = new GarminFpl(e.target.result);
                                this.mission.fromGarminFpl(fpl);
                            }
                            break;
                        case '.pln':
                            {
                                const fpl = new MsfsPln(e.target.result);
                                this.mission.fromGarminFpl(fpl);
                            }
                            break;
                        case '.fms':
                            {
                                const fpl = new XplaneFms(e.target.result);
                                this.mission.fromGarminFpl(fpl);
                            }
                            break;
                        default:
                            this.showError('Unsupported file: ' + file.name);
                            break;
                    }
                    this.syncToForm();
                    this.showFlightplan();
                }
            };
            reader.readAsText(file);
        }
    }
    randomizeWeather() {
        const lastHeading = this.mission.checkpoints.length ? this.mission.checkpoints[this.mission.checkpoints.length - 1].direction : Math.floor(Math.random() * 360);
        this.mission.conditions.thermal_strength = Math.random() * 0.5;
        this.mission.conditions.turbulence_strength = Math.random() * 0.5;
        this.mission.conditions.wind_speed = Math.floor(Math.random() * 10);
        this.mission.conditions.wind_gusts = this.mission.conditions.wind_speed * (1 + this.mission.conditions.turbulence_strength);
        this.mission.conditions.wind_direction = (360 + lastHeading - 30 + Math.floor(Math.random() * 61)) % 360;
        this.mission.conditions.cloud_base_feet = 1000 + Math.floor(Math.random() * 91) * 100;
        this.mission.conditions.cloud_cover = Math.random();
        this.mission.conditions.visibility = 5000 + Math.floor(Math.random() * 16) * 1000;
    }
    download(filename, content, type = 'text/plain') {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(new File([content], filename, {
            type
        }));
        a.download = filename;
        a.click();
    }
    syncToForm() {
        this.elements.aircraft_name.value = this.mission.aircraft_name;
        this.elements.date.value = this.mission.conditions.time.time_year.toFixed().padStart(4, '0') + '-' + this.mission.conditions.time.time_month.toFixed().padStart(2, '0') + '-' + this.mission.conditions.time.time_day.toFixed().padStart(2, '0');
        this.elements.time.value = Math.floor(this.mission.conditions.time.time_hours).toFixed().padStart(2, '0') + ':' + Math.floor(this.mission.conditions.time.time_hours % 1 * 60).toFixed().padStart(2, '0');
        this.elements.cruise_speed.value = this.mission.cruise_speed.toFixed();
        this.elements.cruise_altitude_ft.value = this.mission.cruise_altitude_ft.toFixed();
        this.elements.origin_dir.value = this.mission.origin_dir.toFixed();
        this.elements.wind_direction.value = this.mission.conditions.wind_direction.toFixed();
        this.elements.wind_speed.value = this.mission.conditions.wind_speed.toFixed();
        this.elements.wind_gusts.value = this.mission.conditions.wind_gusts.toFixed();
        this.elements.visibility.value = this.mission.conditions.visibility.toFixed();
        this.elements.cloud_base_feet.value = this.mission.conditions.cloud_base_feet.toFixed();
        this.elements.cloud_cover.value = (this.mission.conditions.cloud_cover * 100).toFixed();
        this.elements.turbulence_strength.value = (this.mission.conditions.turbulence_strength * 100).toFixed();
        this.elements.thermal_strength.value = (this.mission.conditions.thermal_strength * 100).toFixed();
        this.elements.title.value = this.mission.title;
        this.elements.callsign.value = this.mission.callsign;
        this.elements.description.value = this.mission.description;
    }
    showError(message) {
        console.error(message);
    }
}
new App();
