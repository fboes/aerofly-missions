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
  elements = {
    upload: <HTMLInputElement>document.getElementById('upload'),
    metar: <HTMLAnchorElement>document.getElementById('metar'),
    aircraft_name: <HTMLSelectElement>document.getElementById('aircraft_name'),
    date: <HTMLInputElement>document.getElementById('date'),
    time: <HTMLInputElement>document.getElementById('time'),
    title: <HTMLInputElement>document.getElementById('title'),
    description: <HTMLTextAreaElement>document.getElementById('description'),
    cruise_speed: <HTMLInputElement>document.getElementById('cruise_speed'),
    cruise_altitude_ft: <HTMLInputElement>document.getElementById('cruise_altitude_ft'),
    origin_dir: <HTMLInputElement>document.getElementById('origin_dir'),
    ils_frequency: <HTMLInputElement>document.getElementById('ils_frequency'),
    wind_direction: <HTMLInputElement>document.getElementById('wind_direction'),
    wind_speed: <HTMLInputElement>document.getElementById('wind_speed'),
    visibility: <HTMLInputElement>document.getElementById('visibility'),
    visibility_sm: <HTMLOutputElement>document.getElementById('visibility_sm'),
    cloud_base_feet: <HTMLInputElement>document.getElementById('cloud_base_feet'),
    cloud_cover: <HTMLInputElement>document.getElementById('cloud_cover'),
    cloud_cover_code: <HTMLOutputElement>document.getElementById('cloud_cover_code'),
    wind_gusts: <HTMLInputElement>document.getElementById('wind_gusts'),
    turbulence_strength: <HTMLInputElement>document.getElementById('turbulence_strength'),
    thermal_strength: <HTMLInputElement>document.getElementById('thermal_strength'),
    callsign: <HTMLInputElement>document.getElementById('callsign'),
    flightplan: <HTMLPreElement>document.getElementById('flightplan'),
    downloadTmc: <HTMLButtonElement>document.getElementById('download-tmc'),
    downloadMd: <HTMLButtonElement>document.getElementById('download-md'),
    downloadJson: <HTMLButtonElement>document.getElementById('download-json'),
    downloadTmcCode: <HTMLElement>document.querySelector('#download-tmc code'),
    downloadMdCode: <HTMLElement>document.querySelector('#download-md code'),
    downloadJsonCode: <HTMLElement>document.querySelector('#download-json code'),
    randomizeWeather: <HTMLButtonElement>document.getElementById('randomize-weather')
  }
  mission: Mission;
  missionList: MissionsList;
  flightplan: Html;
  skyVector: SkyVector;
  useIcao = true;


  constructor() {
    this.mission = new Mission('', '');
    this.missionList = new MissionsList('');
    this.missionList.missions.push(this.mission);
    this.restore();
    this.flightplan = new Html(this.mission);
    this.skyVector = new SkyVector(this.mission);

    document.querySelectorAll('input, select, textarea').forEach(i => {
      i.addEventListener('input', (e) => {
        const target = e.currentTarget as HTMLInputElement;
        switch (target.id) {
          case 'upload': this.uploadFile(); this.syncToForm(); break;
          case 'aircraft_name': this.mission.aircraft_name = target.value; this.syncToForm(); break;
          case 'cruise_speed': this.mission.cruise_speed = target.valueAsNumber; break;
          case 'cruise_altitude_ft': this.mission.cruise_altitude_ft = target.valueAsNumber; break;
          case 'origin_dir': this.mission.origin_dir = target.valueAsNumber; break;
          case 'title': this.mission.title = target.value; break;
          case 'callsign': this.mission.callsign = target.value; break;
          case 'description': this.mission.description = target.value; break;
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
          case 'wind_direction': this.mission.conditions.wind_direction = target.valueAsNumber; break;
          case 'wind_speed': this.mission.conditions.wind_speed = target.valueAsNumber; break;
          case 'wind_gusts': this.mission.conditions.wind_gusts = target.valueAsNumber; break;
          case 'visibility': this.mission.conditions.visibility = target.valueAsNumber; this.syncToOutput(); break;
          case 'cloud_base_feet': this.mission.conditions.cloud_base_feet = target.valueAsNumber; this.syncToOutput(); break;
          case 'cloud_cover': this.mission.conditions.cloud_cover = target.valueAsNumber / 100; this.syncToOutput(); break;
          case 'turbulence_strength': this.mission.conditions.turbulence_strength = target.valueAsNumber / 100; break;
          case 'thermal_strength': this.mission.conditions.thermal_strength = target.valueAsNumber / 100; break;
        }
        if (target.id !== 'upload') {
          this.mission.calculateDirectionForCheckpoints();
        }
        this.showFlightplan();
      })
    });

    document.querySelectorAll('button.download').forEach(i => {
      i.addEventListener('click', (e) => {
        const target = e.currentTarget as HTMLButtonElement;
        const filename = target.querySelector('code')?.innerText || '';
        if (!filename) {
          this.showError('Missing filename for saving');
        }
        switch (target.id) {
          case 'download-tmc': this.download(filename, this.missionList.toString()); break;
          case 'download-md': this.download(filename, new Markdown(this.mission).toString(filename.replace('.md', '.tmc'))); break;
          case 'download-json': this.download(filename, JSON.stringify(new GeoJson().fromMission(this.mission), null, 2), 'text/json'); break;
        }
      });
    });

    this.elements.randomizeWeather.addEventListener('click', () => {
      this.randomizeWeather();
      this.syncToForm();
      this.showFlightplan();
    })

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
        b.removeAttribute('disabled')
      } else {
        b.setAttribute('disabled', 'disabled')
      }
    });
    const slug = this.mission.title ? asciify(this.mission.title.replace(/^(?:From )?(\S+) to (\S+)$/i, '$1-$2')) : 'custom_missions';
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
                const mainMcf = new MainMcf(<string>e.target.result)
                this.mission.fromMainMcf(mainMcf);
              }
              break;
            case '.tmc':
              {
                new MissionParsed(<string>e.target.result, this.mission)
              }
              break;
            case '.fpl':
              {
                const fpl = new GarminFpl(<string>e.target.result)
                this.mission.fromGarminFpl(fpl);
              }
              break;
            case '.pln':
              {
                const fpl = new MsfsPln(<string>e.target.result)
                this.mission.fromGarminFpl(fpl);
              }
              break;
            case '.fms':
              {
                const fpl = new XplaneFms(<string>e.target.result)
                this.mission.fromGarminFpl(fpl);
              }
              break;
            default:
              this.showError('Unsupported file: ' + file.name);
              break;
          }
          this.useIcao = this.mission.origin_lon_lat.continent !== LonLat.CONTINENT_NORTH_AMERICA
          this.syncToForm();
          this.showFlightplan();
        }
      }

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

  download(filename: string, content: string, type = 'text/plain') {
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new File([content], filename, {
      type
    }))
    a.download = filename
    a.click()
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
    this.elements.origin_dir.valueAsNumber = Math.round(this.mission.origin_dir);
    //this.elements.ils_frequency.valueAsNumber
    this.syncToOutput();
    this.store();
  }

  store() {
    localStorage.setItem('aircraft_name', this.mission.aircraft_name)
    localStorage.setItem('callsign', this.mission.callsign)
    localStorage.setItem('cruise_speed', this.mission.cruise_speed.toFixed())
    localStorage.setItem('conditions.wind_direction', this.mission.conditions.wind_direction.toFixed())
    localStorage.setItem('conditions.wind_speed', this.mission.conditions.wind_speed.toFixed())
    localStorage.setItem('conditions.wind_gusts', this.mission.conditions.wind_gusts.toFixed())
    localStorage.setItem('conditions.visibility', this.mission.conditions.visibility.toFixed(4))
    localStorage.setItem('conditions.cloud_base_feet', this.mission.conditions.cloud_base_feet.toFixed())
    localStorage.setItem('conditions.cloud_cover', this.mission.conditions.cloud_cover.toFixed(4))
    localStorage.setItem('conditions.turbulence_strength', this.mission.conditions.turbulence_strength.toFixed(4))
    localStorage.setItem('conditions.thermal_strength', this.mission.conditions.thermal_strength.toFixed(4))
  }

  restore() {
    this.mission.aircraft_name = localStorage.getItem('aircraft_name') || this.mission.aircraft_name;
    this.mission.callsign = localStorage.getItem('callsign') || this.mission.callsign;
    this.mission.cruise_speed = Number(localStorage.getItem('cruise_speed')) || this.mission.cruise_speed;
    this.mission.conditions.wind_direction = Number(localStorage.getItem('conditions.wind_direction')) || this.mission.conditions.wind_direction;
    this.mission.conditions.wind_speed = Number(localStorage.getItem('conditions.wind_speed')) || this.mission.conditions.wind_speed;
    this.mission.conditions.wind_gusts = Number(localStorage.getItem('conditions.wind_gusts')) || this.mission.conditions.wind_gusts;
    this.mission.conditions.visibility = Number(localStorage.getItem('conditions.visibility')) || this.mission.conditions.visibility;
    this.mission.conditions.cloud_base_feet = Number(localStorage.getItem('conditions.cloud_base_feet')) || this.mission.conditions.cloud_base_feet;
    this.mission.conditions.cloud_cover = Number(localStorage.getItem('conditions.cloud_cover')) || this.mission.conditions.cloud_cover;
    this.mission.conditions.turbulence_strength = Number(localStorage.getItem('conditions.turbulence_strength')) || this.mission.conditions.turbulence_strength;
    this.mission.conditions.thermal_strength = Number(localStorage.getItem('conditions.thermal_strength')) || this.mission.conditions.thermal_strength;
  }

  syncToOutput() {
    this.elements.visibility_sm.value = this.mission.conditions.visibility_sm.toFixed();
    this.elements.cloud_cover_code.value = this.mission.conditions.cloud_cover_code;
    if (this.mission.destination_icao) {
      this.elements.metar.setAttribute('href', 'https://www.checkwx.com/weather/' + this.mission.destination_icao + '/metar');
      this.elements.metar.innerText = 'check the weather for ' + this.mission.destination_icao;
    }
  }

  showError(message: string) {
    console.error(message)
  }
}

new App();
