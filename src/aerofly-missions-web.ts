import { MainMcf } from "./Aerofly/MainMcf.js";
import { Mission } from "./Aerofly/Mission.js";
import { MissionsList } from "./Aerofly/MissionsList.js";
import { BashColors } from "./Cli/BashColors.js";
import { Flightplan } from "./Export/Flightplan.js";
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
    cruise_speed: <HTMLSelectElement>document.getElementById('cruise_speed'),
    cruise_altitude_ft: <HTMLSelectElement>document.getElementById('cruise_altitude_ft'),
    flightplan: <HTMLPreElement>document.getElementById('flightplan'),
    linkSkyvector: <HTMLAnchorElement>document.getElementById('link-skyvector'),
    linkGoogleMap: <HTMLAnchorElement>document.getElementById('link-gmap'),
    linkOpenStreetMap: <HTMLAnchorElement>document.getElementById('link-osm'),
    downloadTmc: <HTMLButtonElement>document.getElementById('download-tmc'),
    downloadMd: <HTMLButtonElement>document.getElementById('download-md'),
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
  },
  uploadFile: () => {
    if (!App.elements.upload || !App.elements.upload.files) {
      return;
    }
    for (const file of App.elements.upload.files) {
      const reader = new FileReader();
      const fileEnding = file.name.replace(/^.*(\.[^.]+)$/, '$1');

      switch (fileEnding) {
        case '.mcf':
          reader.onload = (e) => {
            if (e.target) {
              const mainMcf = new MainMcf(<string>e.target.result)
              mission.fromMainMcf(mainMcf);
              App.syncToForm();
              App.showFlightplan();
            }
          }
          break;
        case '.fpl':
          reader.onload = (e) => {
            if (e.target) {
              const fpl = new GarminFpl(<string>e.target.result)
              mission.fromGarminFpl(fpl);
              App.syncToForm();
              App.showFlightplan();
            }
          }
          break;
        case '.pln':
          reader.onload = (e) => {
            if (e.target) {
              const fpl = new MsfsPln(<string>e.target.result)
              mission.fromGarminFpl(fpl);
              App.syncToForm();
              App.showFlightplan();
            }
          }
          break;
        case '.fms':
          reader.onload = (e) => {
            if (e.target) {
              const fpl = new XplaneFms(<string>e.target.result)
              mission.fromGarminFpl(fpl);
              App.syncToForm();
              App.showFlightplan();
            }
          }
          break;
        default:
          App.showError('Unsupported file: ' + file.name);
          break;
      }

      reader.readAsText(file);
    }
  },
  download: (filename: string, content: string) => {
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new File([content], filename, {
      type: "text/plain",
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
  },
  showError: (message: string) => {
    console.error(message)
  },
  init: () => {
    App.elements.upload.addEventListener('change', App.uploadFile);
    App.elements.aircraft_name.addEventListener('change', (e) => {
      const target = e.target as HTMLSelectElement;
      mission.aircraft_name = target.value;
      App.syncToForm();
      App.showFlightplan();
    });
    App.elements.date.addEventListener('change', (e) => {
      const target = e.target as HTMLInputElement;
      const match = target.value.match(/(\d+)\D(\d+)\D(\d+)/);
      if (match) {
        mission.conditions.time.time_year = Number(match[1]);
        mission.conditions.time.time_month = Number(match[2]);
        mission.conditions.time.time_day = Number(match[3]);
      }
      App.showFlightplan();
    });
    App.elements.time.addEventListener('change', (e) => {
      const target = e.target as HTMLInputElement;
      const match = target.value.match(/(\d+)\D(\d+)/);
      if (match) {
        mission.conditions.time.time_hours = Number(match[1]) + Number(match[2]) / 60;
      }
      App.showFlightplan();
    });
    App.elements.cruise_speed.addEventListener('change', (e) => {
      const target = e.target as HTMLInputElement;
      mission.cruise_speed = target.valueAsNumber;
      mission.calculateDirectionForCheckpoints();
      App.showFlightplan();
    });
    App.elements.cruise_altitude_ft.addEventListener('change', (e) => {
      const target = e.target as HTMLInputElement;
      mission.cruise_altitude_ft = target.valueAsNumber;
      mission.calculateDirectionForCheckpoints();
      App.showFlightplan();
    });
    App.elements.downloadTmc.addEventListener('click', () => {
      App.download('custom_mission.tmc', missionList.toString());
    });
    App.elements.downloadMd.addEventListener('click', () => {
      App.download('custom_mission.md', markdown.toString());
    });

    App.showFlightplan();
    App.syncToForm();
  }
}

const mission = new Mission('Custom mission', '');
const missionList = new MissionsList('');
missionList.missions.push(mission);
const flightplan = new Flightplan(mission, new BashColors(BashColors.COLOR_HTML));
const skyVector = new SkyVector(mission);
const markdown = new Markdown(mission);

App.init();

