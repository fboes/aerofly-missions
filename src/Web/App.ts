import { MainMcfFactory } from "../Aerofly/MainMcf.js";
import { Mission, MissionFactory } from "../Aerofly/Mission.js";
import { MissionConditionsCloud } from "../Aerofly/MissionConditions.js";
import { MissionsList } from "../Aerofly/MissionsList.js";
import { asciify } from "../Cli/Arguments.js";
import { GeoJson, GeoJsonFeature } from "../Export/GeoJson.js";
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
import mapboxgl, { Map } from "mapbox-gl";
import { Outputtable } from "../Export/Outputtable.js";

type ApiResult = {
  data: {
    clouds: {
      code: string;
      feet: number;
    }[];
    visibility: {
      meters_float: number;
    };
    wind: {
      degrees: number;
      speed_kts: number;
      gust_kts: number;
    };
    temperature: {
      celsius: number;
    };
  }[];
};

type AppStorable = {
  metarApiKey: string;
  mission: Mission;
};

export class App {
  elements = {
    addRunway: <HTMLButtonElement>document.getElementById("add-runway"),
    aircraft_name: <HTMLSelectElement>document.getElementById("aircraft_name"),
    callsign: <HTMLInputElement>document.getElementById("callsign"),
    cloud_base_feet: <HTMLInputElement>document.getElementById("cloud_base_feet"),
    cloud_cover_code: <HTMLOutputElement>document.getElementById("cloud_cover_code"),
    cloud_cover: <HTMLInputElement>document.getElementById("cloud_cover"),
    cloud2_base_feet: <HTMLInputElement>document.getElementById("cloud2_base_feet"),
    cloud2_cover_code: <HTMLOutputElement>document.getElementById("cloud2_cover_code"),
    cloud2_cover: <HTMLInputElement>document.getElementById("cloud2_cover"),
    cloud3_base_feet: <HTMLInputElement>document.getElementById("cloud3_base_feet"),
    cloud3_cover_code: <HTMLOutputElement>document.getElementById("cloud3_cover_code"),
    cloud3_cover: <HTMLInputElement>document.getElementById("cloud3_cover"),
    cruise_altitude_ft: <HTMLInputElement>document.getElementById("cruise_altitude_ft"),
    cruise_speed: <HTMLInputElement>document.getElementById("cruise_speed"),
    date: <HTMLInputElement>document.getElementById("date"),
    description: <HTMLTextAreaElement>document.getElementById("description"),
    expertMode: <HTMLTextAreaElement>document.getElementById("expert-mode"),
    flightplan: <HTMLPreElement>document.getElementById("flightplan"),
    main: <HTMLElement>document.querySelector("main"),
    magneticDeclination: <HTMLInputElement>document.getElementById("magnetic_declination"),
    makeMetarDept: <HTMLButtonElement>document.getElementById("make-metar-dept"),
    makeMetarDest: <HTMLButtonElement>document.getElementById("make-metar-dest"),
    makeWeather: <HTMLButtonElement>document.getElementById("make-weather"),
    metar: <HTMLAnchorElement>document.getElementById("metar"),
    metarApiKey: <HTMLInputElement>document.getElementById("metar-api-key"),
    origin_dir: <HTMLInputElement>document.getElementById("origin_dir"),
    settingsModal: <HTMLDialogElement>document.getElementById("settings-modal"),
    thermal_strength: <HTMLInputElement>document.getElementById("thermal_strength"),
    time: <HTMLInputElement>document.getElementById("time"),
    title: <HTMLInputElement>document.getElementById("title"),
    turbulence_strength: <HTMLInputElement>document.getElementById("turbulence_strength"),
    turn_time: <HTMLInputElement>document.getElementById("turn_time"),
    turn_radius: <HTMLOutputElement>document.getElementById("turn_radius"),
    upload: <HTMLInputElement>document.getElementById("upload"),
    visibility_sm: <HTMLOutputElement>document.getElementById("visibility_sm"),
    visibility: <HTMLInputElement>document.getElementById("visibility"),
    wind_direction: <HTMLInputElement>document.getElementById("wind_direction"),
    wind_gusts: <HTMLInputElement>document.getElementById("wind_gusts"),
    wind_speed: <HTMLInputElement>document.getElementById("wind_speed"),
  };
  mission: Mission;
  missionList: MissionsList;
  flightplan: Html;
  skyVector: SkyVector;
  useIcao = true;
  metarApiKey = "";
  protected mapboxMap: Map | null = null;
  protected geoJson: GeoJson;
  static CLASS_SIMPLE_MODE = 'is-simple-mode';

  constructor() {
    this.mission = new Mission("", "");
    this.missionList = new MissionsList("");
    this.missionList.missions.push(this.mission);
    this.restore();
    this.flightplan = new Html(this.mission);
    this.skyVector = new SkyVector(this.mission);
    this.geoJson = new GeoJson();


    this.elements.main.addEventListener("input", (e) => {
      const target = e.target as HTMLInputElement;
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
                } else if (index === this.mission.checkpoints.length - 2) {
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
                  (tr.querySelector('.heading') as HTMLElement).innerText = Outputtable.padThree(this.mission.checkpoints[index].heading);
                  (tr.querySelector('.time_enroute') as HTMLElement).innerText = Outputtable.convertHoursToMinutesString(this.mission.checkpoints[index].time_enroute);
                }
                const table = target.closest('table');
                if (table) {
                  (table.querySelector('tfoot .time_enroute') as HTMLElement).innerText = Outputtable.convertHoursToMinutesString(this.mission.time_enroute);
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
      } else {
        this.drawMap();
        this.store();
      }
    });

    document.querySelectorAll("button.download").forEach((i) => {
      i.addEventListener("click", (e) => {
        const target = e.currentTarget as HTMLButtonElement;
        const filename = target.querySelector("code")?.innerText || "";
        if (!filename) {
          this.showError("Missing filename for saving");
        }
        switch (target.id) {
          case "download-json":
            this.download(
              filename,
              JSON.stringify(this.geoJson.fromMission(this.mission), null, 2),
              "application/geo+json"
            );
            break;
          case "download-md":
            this.download(
              filename,
              new Markdown(this.mission).toString(filename.replace(".md", ".tmc")),
              "text/markdown"
            );
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
    })

    // Modals
    document.querySelectorAll("button[data-modal]").forEach((i) => {
      i.addEventListener("click", (e) => {
        e.preventDefault();
        const tgt = (e.currentTarget as HTMLButtonElement).getAttribute('data-modal');
        console.log(tgt)
        if (tgt) {
          (document.getElementById(tgt) as HTMLDialogElement).showModal();
        }
      })
    });
    document.querySelectorAll("button.modal-close").forEach((i) => {
      i.addEventListener("click", (e) => {
        e.preventDefault();
        ((e.currentTarget as HTMLButtonElement).closest('dialog') as HTMLDialogElement).close();
      })
    });

    // Reset buttons
    document.querySelectorAll("button.reset").forEach((i) => {
      i.addEventListener("click", (e) => {
        const target = e.currentTarget as HTMLButtonElement;
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


    this.elements.makeWeather.addEventListener("click", () => {
      this.makeWeather();
      this.syncToForm();
      this.showFlightplan();
    });
    this.elements.makeMetarDept.addEventListener("click", () => {
      this.fetchMetar(this.mission.origin_icao, () => {
        this.syncToForm();
        this.showFlightplan();
      });
    });
    this.elements.makeMetarDest.addEventListener("click", () => {
      this.fetchMetar(this.mission.destination_icao, () => {
        this.syncToForm();
        this.showFlightplan();
      });
    });
    this.elements.addRunway.addEventListener("click", (e) => {
      if (this.mission.checkpoints) {
        if (this.mission.checkpoints[1] && this.mission.checkpoints[1].type !== MissionCheckpoint.TYPE_DEPARTURE_RUNWAY) {
          const direction = this.mission.checkpoints[1].direction;
          const cp = new MissionCheckpoint();
          cp.type = MissionCheckpoint.TYPE_DEPARTURE_RUNWAY;
          cp.lon_lat = this.mission.checkpoints[0].lon_lat.getRelativeCoordinates(0.5, direction)
          cp.name = Math.round(direction / 10).toFixed().padStart(2, '0');
          cp.speed = 30;
          cp.ground_speed = 30;
          this.mission.checkpoints.splice(1, 0, cp);
        }
        const runwayIndex = this.mission.checkpoints.length - 2;
        if (this.mission.checkpoints[runwayIndex] && this.mission.checkpoints[runwayIndex].type !== MissionCheckpoint.TYPE_DESTINATION_RUNWAY) {
          const direction = (this.mission.checkpoints[runwayIndex + 1].direction);
          const cp = new MissionCheckpoint();
          cp.type = MissionCheckpoint.TYPE_DEPARTURE_RUNWAY;
          cp.lon_lat = this.mission.checkpoints[runwayIndex + 1].lon_lat.getRelativeCoordinates(0.5, (direction + 180) % 360);
          cp.name = Math.round(direction / 10).toFixed().padStart(2, '0');
          cp.speed = this.mission.checkpoints[runwayIndex + 1].speed;
          cp.ground_speed = this.mission.checkpoints[runwayIndex + 1].ground_speed;
          this.mission.checkpoints.splice(runwayIndex + 1, 0, cp);

          this.mission.checkpoints[runwayIndex + 2].speed = 30;
          this.mission.checkpoints[runwayIndex + 2].ground_speed = 30;
        }
      }
      this.mission.calculateCheckpoints();
      this.showFlightplan();
      this.drawMap();
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
      } else {
        b.setAttribute("disabled", "disabled");
      }
    });

    const runwayIndex = this.mission.checkpoints.length - 2;
    const hasRunway = this.mission.checkpoints && (
      (this.mission.checkpoints[1] && this.mission.checkpoints[1].type === MissionCheckpoint.TYPE_DEPARTURE_RUNWAY)
      || (this.mission.checkpoints[runwayIndex] && this.mission.checkpoints[runwayIndex].type === MissionCheckpoint.TYPE_DESTINATION_RUNWAY)
    );
    console.log(hasRunway);
    if (hasRunway) {
      this.elements.addRunway.setAttribute("disabled", "disabled");
    } else {
      this.elements.addRunway.removeAttribute("disabled");
    }
    const slug = this.mission.title
      ? asciify(this.mission.title.replace(/^(?:From )?(\S+) to (\S+)$/i, "$1-$2"))
      : "custom_missions";

    document.querySelectorAll<HTMLElement>('button.download code').forEach((el) => {
      el.innerText = slug + el.innerText.replace(/^.+\./, '.')
    });
    this.store();
  }

  addMapbox(mapboxMap: Map) {
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

      let currentFeature: null | mapboxgl.MapboxGeoJSONFeature = null;
      const source = this.mapboxMap.getSource('waypoints');

      const onDown = (e: any) => {
        if (!this.mapboxMap) { return }
        e.preventDefault();
        const features = this.mapboxMap.queryRenderedFeatures(e.point, {
          layers: ['waypoints']
        });
        currentFeature = features[0];
      }

      const onMove = (e: any) => {
        if (!this.mapboxMap) { return }
        const coords = e.lngLat;

        if (!currentFeature || !source || source.type !== "geojson") {
          return;
        }
        const featureId = <number>currentFeature.id;
        this.geoJson.features[featureId].geometry.coordinates = [coords.lng, coords.lat];
        if (featureId === 0) {
          this.mission.origin_lon_lat.lon = coords.lng;
          this.mission.origin_lon_lat.lat = coords.lat;
        } else if (featureId === this.mission.checkpoints.length + 1) {
          this.mission.destination_lon_lat.lon = coords.lng;
          this.mission.destination_lon_lat.lat = coords.lat;
        } else {
          this.mission.checkpoints[featureId - 1].lon_lat.lon = coords.lng;
          this.mission.checkpoints[featureId - 1].lon_lat.lat = coords.lat;
        }
        source.setData(this.geoJson);
      };

      const onUp = () => {
        if (!this.mapboxMap) { return }
        this.mapboxMap.off('mousemove', onMove);
        currentFeature = null;
        this.mission.calculateCheckpoints();
        this.drawMap();
        this.showFlightplan();
      }

      // -----------------------------------------------------------------------
      // @see https://docs.mapbox.com/mapbox-gl-js/example/drag-a-point/

      this.mapboxMap.on('mouseenter', 'waypoints', () => {
        if (!this.mapboxMap) { return }
        this.mapboxMap.getCanvasContainer().style.cursor = 'move';
      });

      this.mapboxMap.on('mouseleave', 'waypoints', () => {
        if (!this.mapboxMap) { return }
        this.mapboxMap.getCanvasContainer().style.cursor = '';
      });

      this.mapboxMap.on('mousedown', 'waypoints', (e) => {
        if (!this.mapboxMap) { return }
        onDown(e);
        this.mapboxMap.getCanvasContainer().style.cursor = 'grab';
        this.mapboxMap.on('mousemove', onMove);
        this.mapboxMap.once('mouseup', onUp);
      });

      this.mapboxMap.on('touchstart', 'waypoints', (e) => {
        if (!this.mapboxMap || e.points.length !== 1) { return }
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
              const mainMcf = new MainMcfFactory().create(<string>e.target.result);
              this.mission.fromMainMcf(mainMcf);
              break;
            case ".tmc":
              new MissionFactory().create(<string>e.target.result, this.mission);
              break;
            case ".fpl":
              const fpl = new GarminFpl(<string>e.target.result);
              this.mission.fromGarminFpl(fpl);
              break;
            case ".pln":
              const msfs = new MsfsPln(<string>e.target.result);
              this.mission.fromGarminFpl(msfs);
              break;
            case ".fms":
              const xplane = new XplaneFms(<string>e.target.result);
              this.mission.fromGarminFpl(xplane);
              break;
            case ".gpx":
              const gpx = new Gpx(<string>e.target.result);
              this.mission.fromGarminFpl(gpx);
              break;
            case ".geojson":
              const geojson = new GeoJsonImport(<string>e.target.result);
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

  fetchMetar(icao: string, callback = () => { }) {
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
      .then((responseJson: ApiResult) => {
        if (responseJson.data.length < 1) {
          this.showError(`No data in METAR response`);
        }
        const metar = responseJson.data[0];

        if (metar.wind) {
          this.mission.conditions.wind_direction = metar.wind.degrees ?? 0;
          this.mission.conditions.wind_gusts = metar.wind.gust_kts ?? 0;
          this.mission.conditions.wind_speed = metar.wind.speed_kts ?? 0;
        } else {
          this.mission.conditions.wind_direction = 0;
          this.mission.conditions.wind_gusts = 0;
          this.mission.conditions.wind_speed = 0;
        }

        let visibility = metar.visibility.meters_float ?? 0;
        if (visibility === 9999) {
          visibility = 20000;
        }
        this.mission.conditions.visibility = Math.round(visibility / 500) * 500;
        this.mission.conditions.clouds = metar.clouds.map((c) => {
          const cloud = new MissionConditionsCloud();
          cloud.cover_code = c.code;
          cloud.height_feet = c.feet ?? 0;
          return cloud;
        });

        // @see https://github.com/fboes/aerofly-wettergeraet/blob/main/src/WettergeraetLib/AeroflyWeather.cpp#L89
        this.mission.conditions.thermal_strength = ((metar.temperature.celsius ?? 14) - 5) / 25;
        this.mission.conditions.makeTurbulence();
        callback();
      });
  }

  download(filename: string, content: string, type = "text/plain") {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(
      new File([content], filename, {
        type,
      })
    );
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
    } else {
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
    } else {
      this.elements.makeMetarDept.disabled = false;
      this.elements.makeMetarDest.disabled = false;
    }
    this.elements.turn_radius.value = (this.mission.cruise_speed * (this.mission.turn_time / 60) / (2 * Math.PI)).toFixed(1)
  }

  showError(message: string) {
    alert(message);
  }

  toJSON(): AppStorable {
    return {
      metarApiKey: this.metarApiKey,
      mission: this.mission,
    };
  }

  hydrate(json: AppStorable) {
    if (json.metarApiKey) {
      this.metarApiKey = json.metarApiKey;
    }
    if (json.mission) {
      this.mission.hydrate(json.mission);
    }
  }
}
