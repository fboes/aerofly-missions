import { MainMcf } from "./Aerofly/MainMcf.js";
import { Mission, MissionParsed } from "./Aerofly/Mission.js";
import { MissionCheckpoint } from "./Aerofly/MissionCheckpoint.js";
import { MissionsList } from "./Aerofly/MissionsList.js";
import { asciify } from "./Cli/Arguments.js";
import { GeoJson } from "./Export/GeoJson.js";
import Html from "./Export/Html.js";
import { Markdown } from "./Export/Markdown.js";
import { SkyVector } from "./Export/SkyVector.js";
import { GarminFpl } from "./Import/GarminFpl.js";
import { MsfsPln } from "./Import/MsfsPln.js";
import { XplaneFms } from "./Import/XplaneFms.js";
import { LonLat } from "./World/LonLat.js";
class App {
    constructor() {
        this.elements = {
            aircraft_name: document.getElementById('aircraft_name'),
            callsign: document.getElementById('callsign'),
            cloud_base_feet: document.getElementById('cloud_base_feet'),
            cloud_cover_code: document.getElementById('cloud_cover_code'),
            cloud_cover: document.getElementById('cloud_cover'),
            cruise_altitude_ft: document.getElementById('cruise_altitude_ft'),
            cruise_speed: document.getElementById('cruise_speed'),
            date: document.getElementById('date'),
            description: document.getElementById('description'),
            downloadJson: document.getElementById('download-json'),
            downloadJsonCode: document.querySelector('#download-json code'),
            downloadMd: document.getElementById('download-md'),
            downloadMdCode: document.querySelector('#download-md code'),
            downloadTmc: document.getElementById('download-tmc'),
            downloadTmcCode: document.querySelector('#download-tmc code'),
            flightplan: document.getElementById('flightplan'),
            ils_frequency: document.getElementById('ils_frequency'),
            makeTime: document.getElementById('make-time'),
            makeWeather: document.getElementById('make-weather'),
            metar: document.getElementById('metar'),
            metarApikey: document.getElementById('metar-api-key'),
            origin_dir: document.getElementById('origin_dir'),
            thermal_strength: document.getElementById('thermal_strength'),
            time: document.getElementById('time'),
            title: document.getElementById('title'),
            turbulence_strength: document.getElementById('turbulence_strength'),
            upload: document.getElementById('upload'),
            visibility_sm: document.getElementById('visibility_sm'),
            visibility: document.getElementById('visibility'),
            wind_direction: document.getElementById('wind_direction'),
            wind_gusts: document.getElementById('wind_gusts'),
            wind_speed: document.getElementById('wind_speed'),
        };
        this.useIcao = true;
        this.metarApikey = '';
        this.mission = new Mission('', '');
        this.missionList = new MissionsList('');
        this.missionList.missions.push(this.mission);
        this.restore();
        this.flightplan = new Html(this.mission);
        this.skyVector = new SkyVector(this.mission);
        document.querySelectorAll('input, select, textarea').forEach(i => {
            i.addEventListener('input', (e) => {
                const target = e.currentTarget;
                switch (target.id) {
                    case 'aircraft_name':
                        this.mission.aircraft_name = target.value;
                        this.syncToForm();
                        break;
                    case 'callsign':
                        this.mission.callsign = target.value;
                        break;
                    case 'cloud_base_feet':
                        this.mission.conditions.cloud_base_feet = target.valueAsNumber;
                        this.syncToOutput();
                        break;
                    case 'cloud_cover':
                        this.mission.conditions.cloud_cover = target.valueAsNumber / 100;
                        this.syncToOutput();
                        break;
                    case 'cruise_altitude_ft':
                        this.mission.cruise_altitude_ft = target.valueAsNumber;
                        break;
                    case 'cruise_speed':
                        this.mission.cruise_speed = target.valueAsNumber;
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
                    case 'description':
                        this.mission.description = target.value;
                        break;
                    case 'metar-api-key':
                        this.metarApikey = target.value;
                        break;
                    case 'origin_dir':
                        this.mission.origin_dir = target.valueAsNumber;
                        break;
                    case 'thermal_strength':
                        this.mission.conditions.thermal_strength = target.valueAsNumber / 100;
                        break;
                    case 'time':
                        {
                            const match = target.value.match(/(\d+)\D(\d+)/);
                            if (match) {
                                this.mission.conditions.time.time_hours = Number(match[1]) + Number(match[2]) / 60;
                            }
                        }
                        break;
                    case 'title':
                        this.mission.title = target.value;
                        break;
                    case 'turbulence_strength':
                        this.mission.conditions.turbulence_strength = target.valueAsNumber / 100;
                        break;
                    case 'upload':
                        this.uploadFile();
                        this.syncToForm();
                        break;
                    case 'visibility':
                        this.mission.conditions.visibility = target.valueAsNumber;
                        this.syncToOutput();
                        break;
                    case 'wind_direction':
                        this.mission.conditions.wind_direction = target.valueAsNumber;
                        break;
                    case 'wind_gusts':
                        this.mission.conditions.wind_gusts = target.valueAsNumber;
                        break;
                    case 'wind_speed':
                        this.mission.conditions.wind_speed = target.valueAsNumber;
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
                    case 'download-json':
                        this.download(filename, JSON.stringify(new GeoJson().fromMission(this.mission), null, 2), 'text/json');
                        break;
                    case 'download-md':
                        this.download(filename, new Markdown(this.mission).toString(filename.replace('.md', '.tmc')));
                        break;
                    case 'download-tmc':
                        this.download(filename, this.missionList.toString());
                        break;
                }
            });
        });
        this.elements.makeWeather.addEventListener('click', () => {
            this.makeWeather();
            this.syncToForm();
            this.showFlightplan();
        });
        this.elements.makeTime.addEventListener('click', () => {
            const d = new Date();
            this.mission.conditions.time.time_year = d.getUTCFullYear();
            this.mission.conditions.time.time_month = d.getUTCMonth() + 1;
            this.mission.conditions.time.time_day = d.getUTCDate();
            this.mission.conditions.time.time_hours = d.getUTCHours();
            this.syncToForm();
            this.showFlightplan();
        });
        this.showFlightplan();
        this.syncToForm();
    }
    showFlightplan() {
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
        document.querySelectorAll('button.download').forEach(b => {
            if (this.mission.checkpoints.length > 0) {
                b.removeAttribute('disabled');
            }
            else {
                b.setAttribute('disabled', 'disabled');
            }
        });
        const slug = this.mission.title ? asciify(this.mission.title.replace(/^(?:From )?(\S+) to (\S+)$/i, '$1-$2')) : 'custom_missions';
        this.elements.downloadJsonCode.innerText = slug + '.json';
        this.elements.downloadMdCode.innerText = slug + '.md';
        this.elements.downloadTmcCode.innerText = slug + '.tmc';
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
                    this.useIcao = this.mission.origin_lon_lat.continent !== LonLat.CONTINENT_NORTH_AMERICA;
                    this.syncToForm();
                    this.showFlightplan();
                }
            };
            reader.readAsText(file);
        }
    }
    makeWeather() {
        if (this.mission.destination_icao && this.metarApikey) {
            const url = 'https://api.checkwx.com/metar/' + encodeURIComponent(this.mission.destination_icao) + '/decoded';
            fetch(url, {
                headers: {
                    'X-API-Key': this.metarApikey,
                    'Accept': 'application/json'
                }
            }).then(response => {
                if (!response.ok) {
                    this.showError(`Error getting METAR data, got ${response.status} status code`);
                }
                return response.json();
            }).then((responseJson) => {
                if (responseJson.data.length < 1) {
                    this.showError(`No data in METAR response`);
                }
                const metar = responseJson.data[0];
                if (metar.wind) {
                    this.mission.conditions.wind_direction = metar.wind.degrees || 0;
                    this.mission.conditions.wind_gusts = metar.wind.gust_kts || 0;
                    this.mission.conditions.wind_speed = metar.wind.speed_kts || 0;
                }
                else {
                    this.mission.conditions.wind_direction = 0;
                    this.mission.conditions.wind_gusts = 0;
                    this.mission.conditions.wind_speed = 0;
                }
                let visibility = metar.visibility.meters_float;
                if (visibility === 9999) {
                    visibility = 20000;
                }
                this.mission.conditions.visibility = visibility || 0;
                if (metar.clouds.length > 0) {
                    this.mission.conditions.cloud_base_feet = metar.clouds[0].feet || 0;
                    this.mission.conditions.cloud_cover_code = metar.clouds[0].code || 'CLR';
                }
                else {
                    this.mission.conditions.cloud_base_feet = 0;
                    this.mission.conditions.cloud_cover_code = 'CLR';
                }
                // @see https://github.com/fboes/aerofly-wettergeraet/blob/main/src/WettergeraetLib/AeroflyWeather.cpp#L89
                this.mission.conditions.thermal_strength = (((metar.temperature.celsius || 14) - 5) / 25);
                this.mission.conditions.makeTurbulence();
                this.syncToForm();
                this.showFlightplan();
            });
            return;
        }
        const lastHeading = this.mission.checkpoints.length ? this.mission.checkpoints[this.mission.checkpoints.length - 1].direction : Math.floor(Math.random() * 360);
        this.mission.conditions.cloud_base_feet = 1000 + Math.floor(Math.random() * 91) * 100;
        this.mission.conditions.cloud_cover = Math.random();
        this.mission.conditions.thermal_strength = Math.random() * 0.5;
        this.mission.conditions.turbulence_strength = Math.random() * 0.5;
        this.mission.conditions.visibility = 5000 + Math.floor(Math.random() * 16) * 1000;
        this.mission.conditions.wind_direction = (360 + lastHeading - 30 + Math.floor(Math.random() * 61)) % 360;
        this.mission.conditions.wind_gusts = this.mission.conditions.wind_speed * (1 + this.mission.conditions.turbulence_strength);
        this.mission.conditions.wind_speed = Math.floor(Math.random() * 10);
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
        this.elements.metarApikey.value = this.metarApikey;
        this.elements.thermal_strength.value = (this.mission.conditions.thermal_strength * 100).toFixed();
        this.elements.title.value = this.mission.title;
        this.elements.callsign.value = this.mission.callsign;
        this.elements.description.value = this.mission.description;
        this.elements.origin_dir.valueAsNumber = Math.round(this.mission.origin_dir);
        //this.elements.ils_frequency.valueAsNumber
        this.syncToOutput();
        this.store();
    }
    store() {
        localStorage.setItem('aircraft_name', this.mission.aircraft_name);
        localStorage.setItem('callsign', this.mission.callsign);
        localStorage.setItem('conditions.cloud_base_feet', this.mission.conditions.cloud_base_feet.toFixed());
        localStorage.setItem('conditions.cloud_cover', this.mission.conditions.cloud_cover.toFixed(4));
        localStorage.setItem('conditions.thermal_strength', this.mission.conditions.thermal_strength.toFixed(4));
        localStorage.setItem('conditions.turbulence_strength', this.mission.conditions.turbulence_strength.toFixed(4));
        localStorage.setItem('conditions.visibility', this.mission.conditions.visibility.toFixed(4));
        localStorage.setItem('conditions.wind_direction', this.mission.conditions.wind_direction.toFixed());
        localStorage.setItem('conditions.wind_gusts', this.mission.conditions.wind_gusts.toFixed());
        localStorage.setItem('conditions.wind_speed', this.mission.conditions.wind_speed.toFixed());
        localStorage.setItem('cruise_speed', this.mission.cruise_speed.toFixed());
        localStorage.setItem('metarApiKey', this.metarApikey);
    }
    restore() {
        this.metarApikey = localStorage.getItem('metarApikey') || this.metarApikey;
        this.mission.aircraft_name = localStorage.getItem('aircraft_name') || this.mission.aircraft_name;
        this.mission.callsign = localStorage.getItem('callsign') || this.mission.callsign;
        this.mission.conditions.cloud_base_feet = Number(localStorage.getItem('conditions.cloud_base_feet')) || this.mission.conditions.cloud_base_feet;
        this.mission.conditions.cloud_cover = Number(localStorage.getItem('conditions.cloud_cover')) || this.mission.conditions.cloud_cover;
        this.mission.conditions.thermal_strength = Number(localStorage.getItem('conditions.thermal_strength')) || this.mission.conditions.thermal_strength;
        this.mission.conditions.turbulence_strength = Number(localStorage.getItem('conditions.turbulence_strength')) || this.mission.conditions.turbulence_strength;
        this.mission.conditions.visibility = Number(localStorage.getItem('conditions.visibility')) || this.mission.conditions.visibility;
        this.mission.conditions.wind_direction = Number(localStorage.getItem('conditions.wind_direction')) || this.mission.conditions.wind_direction;
        this.mission.conditions.wind_gusts = Number(localStorage.getItem('conditions.wind_gusts')) || this.mission.conditions.wind_gusts;
        this.mission.conditions.wind_speed = Number(localStorage.getItem('conditions.wind_speed')) || this.mission.conditions.wind_speed;
        this.mission.cruise_speed = Number(localStorage.getItem('cruise_speed')) || this.mission.cruise_speed;
    }
    syncToOutput() {
        this.elements.visibility_sm.value = this.mission.conditions.visibility_sm.toFixed();
        this.elements.cloud_cover_code.value = this.mission.conditions.cloud_cover_code;
        if (this.mission.destination_icao) {
            this.elements.makeWeather.innerText = this.metarApikey
                ? 'Fetch weather for ' + this.mission.destination_icao
                : 'Set random weather';
            this.elements.metar.setAttribute('href', 'https://metar-taf.com/' + this.mission.destination_icao);
            this.elements.metar.innerText = 'check the weather for ' + this.mission.destination_icao;
        }
    }
    showError(message) {
        alert(message);
    }
}
new App();
