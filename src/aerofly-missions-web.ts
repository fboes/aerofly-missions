import { MainMcf } from "./Aerofly/MainMcf.js";
import { Mission } from "./Aerofly/Mission.js";
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

const App = {
  elements: {
    upload: <HTMLInputElement>document.getElementById('upload'),
    aircraft_name: <HTMLSelectElement>document.getElementById('aircraft_name'),
    date: <HTMLInputElement>document.getElementById('date'),
    time: <HTMLInputElement>document.getElementById('time'),
    title: <HTMLInputElement>document.getElementById('title'),
    description: <HTMLTextAreaElement>document.getElementById('description'),
    cruise_speed: <HTMLSelectElement>document.getElementById('cruise_speed'),
    cruise_altitude_ft: <HTMLSelectElement>document.getElementById('cruise_altitude_ft'),
    wind_direction: <HTMLInputElement>document.getElementById('wind_direction'),
    wind_speed: <HTMLInputElement>document.getElementById('wind_speed'),
    visibility: <HTMLInputElement>document.getElementById('visibility'),
    cloud_base_feet: <HTMLInputElement>document.getElementById('cloud_base_feet'),
    cloud_cover: <HTMLInputElement>document.getElementById('cloud_cover'),
    wind_gusts: <HTMLInputElement>document.getElementById('wind_gusts'),
    turbulence_strength: <HTMLInputElement>document.getElementById('turbulence_strength'),
    thermal_strength: <HTMLInputElement>document.getElementById('thermal_strength'),
    callsign: <HTMLInputElement>document.getElementById('callsign'),
    flightplan: <HTMLPreElement>document.getElementById('flightplan'),
    linkSkyvector: <HTMLAnchorElement>document.getElementById('link-skyvector'),
    linkGoogleMap: <HTMLAnchorElement>document.getElementById('link-gmap'),
    linkOpenStreetMap: <HTMLAnchorElement>document.getElementById('link-osm'),
    downloadTmc: <HTMLButtonElement>document.getElementById('download-tmc'),
    downloadMd: <HTMLButtonElement>document.getElementById('download-md'),
    downloadJson: <HTMLButtonElement>document.getElementById('download-json'),
    downloadTmcCode: <HTMLElement>document.querySelector('#download-tmc code'),
    downloadMdCode: <HTMLElement>document.querySelector('#download-md code'),
    downloadJsonCode: <HTMLElement>document.querySelector('#download-json code'),
  },
  showFlightplan: () => {
    const lonLatArea = new LonLatArea(mission.origin_lon_lat);
    mission.checkpoints.forEach((c) => {
      lonLatArea.push(c.lon_lat);
    });
    const center = lonLatArea.center;
    const zoomLevel = lonLatArea.zoomLevel
    if (App.elements.flightplan) {
      App.elements.flightplan.innerHTML = flightplan.toString();
    }
    if (App.elements.linkSkyvector) {
      App.elements.linkSkyvector.href = skyVector.toString();
    }
    if (App.elements.linkGoogleMap) {
      App.elements.linkGoogleMap.href = `https://www.google.com/maps/@?api=1&map_action=map&center=${center.lat},${center.lon}&zoom=${zoomLevel}&basemap=terrain`;
    }
    if (App.elements.linkOpenStreetMap) {
      App.elements.linkOpenStreetMap.href = `https://www.openstreetmap.org/#map=${zoomLevel}/${center.lat}/${center.lon}`;
    }
    document.querySelectorAll('button').forEach(b => {
      if (mission.checkpoints.length > 0) {
        b.removeAttribute('disabled')
      } else {
        b.setAttribute('disabled', 'disabled')
      }
    });
    const slug = mission.title ? asciify(mission.title.replace(/(^|\W)(from|to|and|or|in) /gi, '$1')) : 'custom_missions';
    App.elements.downloadTmcCode.innerText = slug + '.tmc';
    App.elements.downloadMdCode.innerText = slug + '.md';
    App.elements.downloadJsonCode.innerText = slug + '.json';
  },
  uploadFile: () => {
    if (!App.elements.upload || !App.elements.upload.files) {
      App.showError('No file given');
      return;
    }
    for (const file of App.elements.upload.files) {
      const reader = new FileReader();
      const fileEnding = file.name.replace(/^.*(\.[^.]+)$/, '$1');

      reader.onload = (e) => {
        if (e.target) {
          switch (fileEnding) {
            case '.mcf':
              {
                const mainMcf = new MainMcf(<string>e.target.result)
                mission.fromMainMcf(mainMcf);
              }
              break;
            case '.fpl':
              {
                const fpl = new GarminFpl(<string>e.target.result)
                mission.fromGarminFpl(fpl);
              }
              break;
            case '.pln':
              {
                const fpl = new MsfsPln(<string>e.target.result)
                mission.fromGarminFpl(fpl);
              }
              break;
            case '.fms':
              {
                const fpl = new XplaneFms(<string>e.target.result)
                mission.fromGarminFpl(fpl);
              }
              break;
            default:
              App.showError('Unsupported file: ' + file.name);
              break;
          }
          App.syncToForm();
          App.showFlightplan();
        }
      }

      reader.readAsText(file);
    }
  },
  download: (filename: string, content: string, type = 'text/plain') => {
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new File([content], filename, {
      type
    }))
    a.download = filename
    a.click()
  },
  syncToForm: () => {
    App.elements.aircraft_name.value = mission.aircraft_name;
    App.elements.date.value = mission.conditions.time.time_year.toFixed().padStart(4, '0') + '-' + mission.conditions.time.time_month.toFixed().padStart(2, '0') + '-' + mission.conditions.time.time_day.toFixed().padStart(2, '0');
    App.elements.time.value = Math.floor(mission.conditions.time.time_hours).toFixed().padStart(2, '0') + ':' + Math.floor(mission.conditions.time.time_hours % 1 * 60).toFixed().padStart(2, '0');
    App.elements.cruise_speed.value = mission.cruise_speed.toFixed();
    App.elements.cruise_altitude_ft.value = mission.cruise_altitude_ft.toFixed();
    App.elements.wind_direction.value = mission.conditions.wind_direction.toFixed(),
      App.elements.wind_speed.value = mission.conditions.wind_speed.toFixed(),
      App.elements.wind_gusts.value = mission.conditions.wind_gusts.toFixed(),
      App.elements.visibility.value = mission.conditions.visibility.toFixed(),
      App.elements.cloud_base_feet.value = mission.conditions.cloud_base_feet.toFixed(),
      App.elements.cloud_cover.value = (mission.conditions.cloud_cover * 100).toFixed(),
      App.elements.turbulence_strength.value = (mission.conditions.turbulence_strength * 100).toFixed(),
      App.elements.thermal_strength.value = (mission.conditions.thermal_strength * 100).toFixed(),
      App.elements.title.value = mission.title;
    App.elements.callsign.value = mission.callsign;
    App.elements.description.value = mission.description;
  },
  showError: (message: string) => {
    console.error(message)
  },
  fetchVersion: async () => {
    const sup = <HTMLSpanElement>document.querySelector('h1 sup');
    if (sup) {
      const request = new Request('../package.json');
      const response = await fetch(request);
      if (response.ok){
        const pkg = await response.json();
        sup.innerText = pkg.version;
      }
    }
  },
  init: () => {
    App.fetchVersion();
    document.querySelectorAll('input, select, textarea').forEach(i => {
      i.addEventListener('input', (e) => {
        const target = e.currentTarget as HTMLInputElement;
        switch (target.id) {
          case 'upload': App.uploadFile(); App.syncToForm(); break;
          case 'aircraft_name': mission.aircraft_name = target.value; App.syncToForm(); break;
          case 'cruise_speed': mission.cruise_speed = target.valueAsNumber; break;
          case 'cruise_altitude_ft': mission.cruise_altitude_ft = target.valueAsNumber; break;
          case 'title': mission.title = target.value; break;
          case 'callsign': mission.callsign = target.value; break;
          case 'description': mission.description = target.value; break;
          case 'date':
            {
              const match = target.value.match(/(\d+)\D(\d+)\D(\d+)/);
              if (match) {
                mission.conditions.time.time_year = Number(match[1]);
                mission.conditions.time.time_month = Number(match[2]);
                mission.conditions.time.time_day = Number(match[3]);
              }
            }
            break;
          case 'time':
            {
              const match = target.value.match(/(\d+)\D(\d+)/);
              if (match) {
                mission.conditions.time.time_hours = Number(match[1]) + Number(match[2]) / 60;
              }
            }
            break;
          case 'wind_direction': mission.conditions.wind_direction = target.valueAsNumber; break;
          case 'wind_speed': mission.conditions.wind_speed = target.valueAsNumber; break;
          case 'wind_gusts': mission.conditions.wind_gusts = target.valueAsNumber; break;
          case 'visibility': mission.conditions.visibility = target.valueAsNumber; break;
          case 'cloud_base_feet': mission.conditions.cloud_base_feet = target.valueAsNumber; break;
          case 'cloud_cover': mission.conditions.cloud_cover = target.valueAsNumber / 100; break;
          case 'turbulence_strength': mission.conditions.turbulence_strength = target.valueAsNumber / 100; break;
          case 'thermal_strength': mission.conditions.thermal_strength = target.valueAsNumber / 100; break;
        }
        if (target.id !== 'upload') {
          mission.calculateDirectionForCheckpoints();
        }
        App.showFlightplan();
      })
    });

    document.querySelectorAll('button').forEach(i => {
      i.addEventListener('click', (e) => {
        const target = e.currentTarget as HTMLButtonElement;
        const filename = target.querySelector('code')?.innerText || '';
        if (!filename) {
          App.showError('Missing filename for saving');
        }
        switch (target.id) {
          case 'download-tmc': App.download(filename, missionList.toString()); break;
          case 'download-md': App.download(filename, new Markdown(mission).toString()); break;
          case 'download-json': App.download(filename, JSON.stringify(new GeoJson().fromMission(mission), null, 2), 'text/json'); break;
        }
      });
    });

    App.showFlightplan();
    App.syncToForm();
  }
}

const mission = new Mission('', '');
const missionList = new MissionsList('');
missionList.missions.push(mission);
const flightplan = new Flightplan(mission, new BashColors(BashColors.COLOR_HTML));
const skyVector = new SkyVector(mission);

App.init();

