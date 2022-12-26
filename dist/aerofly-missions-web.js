import { MainMcf } from "./Aerofly/MainMcf.js";
import { Mission, MissionParsed } from "./Aerofly/Mission.js";
import { MissionConditionsCloud } from "./Aerofly/MissionConditions.js";
import { MissionsList } from "./Aerofly/MissionsList.js";
import { asciify } from "./Cli/Arguments.js";
import { GeoJson } from "./Export/GeoJson.js";
import { GeoJson as GeoJsonImport } from "./Import/GeoJson.js";
import Html from "./Export/Html.js";
import { Markdown } from "./Export/Markdown.js";
import { SkyVector } from "./Export/SkyVector.js";
import { GarminFpl } from "./Import/GarminFpl.js";
import { Gpx } from "./Import/Gpx.js";
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
            downloadMcf: document.getElementById('download-mcf'),
            downloadMd: document.getElementById('download-md'),
            downloadMdCode: document.querySelector('#download-md code'),
            downloadTmc: document.getElementById('download-tmc'),
            downloadTmcCode: document.querySelector('#download-tmc code'),
            flightplan: document.getElementById('flightplan'),
            main: document.querySelector('main'),
            makeTime: document.getElementById('make-time'),
            makeWeather: document.getElementById('make-weather'),
            makeMetarDept: document.getElementById('make-metar-dept'),
            makeMetarDest: document.getElementById('make-metar-dest'),
            metar: document.getElementById('metar'),
            metarApiKey: document.getElementById('metar-api-key'),
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
        this.metarApiKey = '';
        this.mainMcf = null;
        this.mission = new Mission('', '');
        this.missionList = new MissionsList('');
        this.missionList.missions.push(this.mission);
        this.restore();
        this.flightplan = new Html(this.mission);
        this.skyVector = new SkyVector(this.mission);
        this.elements.main.addEventListener('input', (e) => {
            const target = e.target;
            let redraw = true;
            switch (target.id) {
                case 'aircraft_name':
                    this.mission.aircraft_name = target.value;
                    this.syncToForm();
                    break;
                case 'callsign':
                    this.mission.callsign = target.value;
                    break;
                case 'cloud_base_feet':
                    this.mission.conditions.cloud.height_feet = target.valueAsNumber;
                    this.syncToOutput();
                    break;
                case 'cloud_cover':
                    this.mission.conditions.cloud.cover = target.valueAsNumber / 100;
                    this.syncToOutput();
                    break;
                case 'cruise_altitude_ft':
                    this.mission.cruise_altitude_ft = target.valueAsNumber;
                    break;
                case 'cruise_speed':
                    this.mission[target.id] = target.valueAsNumber;
                    break;
                case 'date':
                    if (target.valueAsDate) {
                        this.mission.conditions.time.dateTime.setUTCFullYear(target.valueAsDate.getUTCFullYear());
                        this.mission.conditions.time.dateTime.setUTCMonth(target.valueAsDate.getUTCMonth());
                        this.mission.conditions.time.dateTime.setUTCDate(target.valueAsDate.getUTCDate());
                    }
                    break;
                case 'description':
                    this.mission.description = target.value;
                    break;
                case 'metar-api-key':
                    this.metarApiKey = target.value;
                    this.syncToForm();
                    break;
                case 'origin_dir':
                    this.mission.origin_dir = target.valueAsNumber;
                    break;
                case 'thermal_strength':
                    this.mission.conditions.thermal_strength = target.valueAsNumber / 100;
                    break;
                case 'time':
                    if (target.valueAsDate) {
                        this.mission.conditions.time.dateTime.setUTCHours(target.valueAsDate.getUTCHours());
                        this.mission.conditions.time.dateTime.setUTCMinutes(target.valueAsDate.getUTCMinutes());
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
                default:
                    const prop = target.getAttribute('data-cp-prop');
                    const id = target.getAttribute('data-cp-id');
                    redraw = false;
                    if (prop && id) {
                        switch (prop) {
                            case 'name':
                                this.mission.checkpoints[Number(id)].name = target.value;
                                break;
                            case 'altitude_ft':
                                this.mission.checkpoints[Number(id)].altitude_ft = target.valueAsNumber;
                                break;
                            case 'frequency_mhz':
                                this.mission.checkpoints[Number(id)].frequency_mhz = target.valueAsNumber;
                                break;
                        }
                    }
                    break;
            }
            if (redraw) {
                if (target.id !== 'upload') {
                    this.mission.calculateDirectionForCheckpoints();
                }
                this.showFlightplan();
            }
            else {
                this.store();
            }
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
                        this.download(filename, JSON.stringify(new GeoJson().fromMission(this.mission), null, 2), 'application/geo+json');
                        break;
                    case 'download-md':
                        this.download(filename, new Markdown(this.mission).toString(filename.replace('.md', '.tmc')), 'text/markdown');
                        break;
                    case 'download-tmc':
                        this.download(filename, this.missionList.toString());
                        break;
                    case 'download-mcf':
                        if (this.mainMcf) {
                            this.mainMcf.fromMission(this.mission);
                            this.download('main.mcf', this.mainMcf.toString());
                        }
                        break;
                }
            });
        });
        this.elements.makeWeather.addEventListener('click', () => {
            this.makeWeather();
            this.syncToForm();
            this.showFlightplan();
        });
        this.elements.makeMetarDept.addEventListener('click', () => {
            this.fetchMetar(this.mission.origin_icao);
            this.syncToForm();
            this.showFlightplan();
        });
        this.elements.makeMetarDest.addEventListener('click', () => {
            this.fetchMetar(this.mission.destination_icao);
            this.syncToForm();
            this.showFlightplan();
        });
        this.elements.makeTime.addEventListener('click', () => {
            this.mission.conditions.time.dateTime = new Date();
            this.mission.conditions.time.dateTime.setUTCSeconds(0);
            this.mission.conditions.time.dateTime.setUTCMilliseconds(0);
            this.syncToForm();
            this.showFlightplan();
        });
        this.showFlightplan();
        this.syncToForm();
    }
    showFlightplan() {
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
        this.elements.downloadMcf.style.display = this.mainMcf !== null ? 'block' : 'none';
        const slug = this.mission.title ? asciify(this.mission.title.replace(/^(?:From )?(\S+) to (\S+)$/i, '$1-$2')) : 'custom_missions';
        this.elements.downloadJsonCode.innerText = slug + '.geojson';
        this.elements.downloadMdCode.innerText = slug + '.md';
        this.elements.downloadTmcCode.innerText = slug + '.tmc';
        this.store();
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
                            this.mainMcf = new MainMcf(e.target.result);
                            this.mission.fromMainMcf(this.mainMcf);
                            this.elements.downloadMcf.style.display = this.mainMcf !== null ? 'block' : 'none';
                            break;
                        case '.tmc':
                            new MissionParsed(e.target.result, this.mission);
                            break;
                        case '.fpl':
                            const fpl = new GarminFpl(e.target.result);
                            this.mission.fromGarminFpl(fpl);
                            break;
                        case '.pln':
                            const msfs = new MsfsPln(e.target.result);
                            this.mission.fromGarminFpl(msfs);
                            break;
                        case '.fms':
                            const xplane = new XplaneFms(e.target.result);
                            this.mission.fromGarminFpl(xplane);
                            break;
                        case '.gpx':
                            const gpx = new Gpx(e.target.result);
                            this.mission.fromGarminFpl(gpx);
                            break;
                        case '.geojson':
                            const geojson = new GeoJsonImport(e.target.result);
                            this.mission.fromGarminFpl(geojson);
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
        const lastHeading = this.mission.checkpoints.length ? this.mission.checkpoints[this.mission.checkpoints.length - 1].direction : Math.floor(Math.random() * 360);
        this.mission.conditions.cloud.height_feet = 1000 + Math.floor(Math.random() * 91) * 100;
        this.mission.conditions.cloud.cover = Math.random();
        this.mission.conditions.thermal_strength = Math.random() * 0.5;
        this.mission.conditions.turbulence_strength = Math.random() * 0.5;
        this.mission.conditions.visibility = 5000 + Math.floor(Math.random() * 16) * 1000;
        this.mission.conditions.wind_direction = (360 + lastHeading - 30 + Math.floor(Math.random() * 61)) % 360;
        this.mission.conditions.wind_speed = Math.floor(Math.random() * 20);
        this.mission.conditions.wind_gusts = this.mission.conditions.wind_speed * (1 + this.mission.conditions.turbulence_strength);
    }
    fetchMetar(icao) {
        const url = 'https://api.checkwx.com/metar/' + encodeURIComponent(icao) + '/decoded';
        fetch(url, {
            headers: {
                'X-API-Key': this.metarApiKey,
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
            this.mission.conditions.clouds = metar.clouds.map(c => {
                const cloud = new MissionConditionsCloud();
                cloud.cover_code = c.code;
                cloud.height_feet = c.feet || 0;
                return cloud;
            });
            // @see https://github.com/fboes/aerofly-wettergeraet/blob/main/src/WettergeraetLib/AeroflyWeather.cpp#L89
            this.mission.conditions.thermal_strength = (((metar.temperature.celsius || 14) - 5) / 25);
            this.mission.conditions.makeTurbulence();
            this.syncToForm();
            this.showFlightplan();
        });
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
        this.elements.callsign.value = this.mission.callsign;
        this.elements.cloud_base_feet.value = this.mission.conditions.cloud.height_feet.toFixed();
        this.elements.cloud_cover.value = (this.mission.conditions.cloud.cover * 100).toFixed();
        this.elements.cruise_altitude_ft.value = this.mission.cruise_altitude_ft.toFixed();
        this.elements.cruise_speed.value = this.mission.cruise_speed.toFixed();
        this.elements.date.valueAsDate = this.mission.conditions.time.dateTime;
        this.elements.description.value = this.mission.description;
        this.elements.metarApiKey.value = this.metarApiKey;
        this.elements.origin_dir.value = this.mission.origin_dir.toFixed();
        this.elements.origin_dir.valueAsNumber = Math.round(this.mission.origin_dir);
        this.elements.thermal_strength.value = (this.mission.conditions.thermal_strength * 100).toFixed();
        this.elements.time.valueAsDate = this.mission.conditions.time.dateTime;
        ;
        this.elements.title.value = this.mission.title;
        this.elements.turbulence_strength.value = (this.mission.conditions.turbulence_strength * 100).toFixed();
        this.elements.visibility.value = this.mission.conditions.visibility.toFixed();
        this.elements.wind_direction.value = this.mission.conditions.wind_direction.toFixed();
        this.elements.wind_gusts.value = this.mission.conditions.wind_gusts.toFixed();
        this.elements.wind_speed.value = this.mission.conditions.wind_speed.toFixed();
        this.syncToOutput();
    }
    store() {
        localStorage.setItem(this.constructor.name, JSON.stringify(this));
    }
    restore() {
        this.metarApiKey = localStorage.getItem('metarApiKey') || this.metarApiKey;
        const appState = localStorage.getItem(this.constructor.name);
        if (appState) {
            this.fromJSON(JSON.parse(appState));
        }
    }
    syncToOutput() {
        this.elements.visibility_sm.value = this.mission.conditions.visibility_sm.toFixed();
        this.elements.cloud_cover_code.value = this.mission.conditions.cloud.cover_code;
        if (this.mission.origin_icao && this.mission.destination_icao) {
            this.elements.makeMetarDept.innerText = 'Fetch weather for ' + this.mission.origin_icao;
            this.elements.makeMetarDest.innerText = 'Fetch weather for ' + this.mission.destination_icao;
            this.elements.makeMetarDept.disabled = (this.metarApiKey.length < 4);
            this.elements.makeMetarDest.disabled = (this.metarApiKey.length < 4);
            this.elements.metar.setAttribute('href', 'https://metar-taf.com/' + this.mission.destination_icao);
            this.elements.metar.innerText = 'check the weather for ' + this.mission.destination_icao;
        }
        else {
            this.elements.makeMetarDept.disabled = false;
            this.elements.makeMetarDest.disabled = false;
        }
    }
    showError(message) {
        alert(message);
    }
    toJSON() {
        return {
            metarApiKey: this.metarApiKey,
            mission: this.mission
        };
    }
    fromJSON(json) {
        if (json.metarApiKey) {
            this.metarApiKey = json.metarApiKey;
        }
        if (json.mission) {
            this.mission.fromJSON(json.mission);
        }
    }
}
new App();
