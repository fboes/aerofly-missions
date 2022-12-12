import { MainMcf } from "./Aerofly/MainMcf.js";
import { Mission } from "./Aerofly/Mission.js";
import { MissionsList } from "./Aerofly/MissionsList.js";
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
    flightplan: <HTMLPreElement>document.getElementById('flightplan'),
    linkSkyvector: <HTMLAnchorElement>document.getElementById('link-skyvector'),
    linkGoogleMap: <HTMLAnchorElement>document.getElementById('link-gmap'),
    linkOpenStreetMap: <HTMLAnchorElement>document.getElementById('link-osm'),
    downloadTmc: <HTMLButtonElement>document.getElementById('download-tmc'),
    downloadMd: <HTMLButtonElement>document.getElementById('download-md'),
    downloadJson: <HTMLButtonElement>document.getElementById('download-json'),
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
    })
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
    App.elements.title.value = mission.title;
    App.elements.description.value = mission.description;
  },
  showError: (message: string) => {
    console.error(message)
  },
  init: () => {
    document.querySelectorAll('input, select, textarea').forEach(i => {
      i.addEventListener('change', (e) => {
        const target = e.target as HTMLInputElement;
        switch (target.id) {
          case 'upload': App.uploadFile(); break;
          case 'aircraft_name': mission.aircraft_name = target.value; break;
          case 'cruise_speed': mission.cruise_speed = target.valueAsNumber; mission.calculateDirectionForCheckpoints(); break;
          case 'cruise_altitude_ft': mission.cruise_altitude_ft = target.valueAsNumber; mission.calculateDirectionForCheckpoints(); break;
          case 'title': mission.title = target.value; break;
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
        }
        App.syncToForm();
        App.showFlightplan();
      })
    });

    App.elements.downloadTmc.addEventListener('click', () => {
      App.download('custom_missions.tmc', missionList.toString());
    });
    App.elements.downloadMd.addEventListener('click', () => {
      App.download('custom_missions.md', new Markdown(mission).toString());
    });
    App.elements.downloadMd.addEventListener('click', () => {
      App.download('custom_missions.json', JSON.stringify(new GeoJson().fromMission(mission), null, 2));
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

