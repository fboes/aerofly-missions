export class LonLat {
    constructor(lon, lat) {
        /**
         * Magnetic declination at this coordinate in degrees. "+" is to the East, "-" is to the West
         * @see https://en.wikipedia.org/wiki/Magnetic_declination
         */
        this.magnetic_declination = 0;
        this.lon = lon % 360;
        if (lon > 180) {
            this.lon -= 360;
        }
        this.lat = lat;
    }
    get lonRad() {
        return this.lon / 180 * Math.PI;
    }
    get latRad() {
        return this.lat / 180 * Math.PI;
    }
    toString() {
        return this.lon.toFixed(6) + " " + this.lat.toFixed(6);
    }
    /**
     * @returns a true bearing between coordinates in degrees
     */
    getBearingTo(lonLat) {
        const lat1 = this.latRad;
        const lon1 = this.lonRad;
        const lat2 = lonLat.latRad;
        const lon2 = lonLat.lonRad;
        const dLon = lon2 - lon1;
        const y = Math.sin(dLon) * Math.cos(lat2);
        const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
        return (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
    }
    getDistanceTo(lonLat) {
        const dLat = lonLat.latRad - this.latRad;
        const dLon = lonLat.lonRad - this.lonRad;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(this.latRad) * Math.cos(lonLat.latRad);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        // multiply with earth's mean radius in Nautical Miles
        return 3441.037 * c;
    }
    /**
     * @see https://www.aerofly.com/community/forum/index.php?thread/19105-custom-missions-converting-coordinates/
     */
    static fromMainMcf(coordinates) {
        const f = 1.0 / 298.257223563; // WGS84
        const e2 = 2 * f - f * f;
        //const lambda = VectorToAngle( coordinates[0], coordinates[1] );
        let lambda = 0;
        if (coordinates[0] > 0) {
            if (coordinates[1] < 0) {
                lambda = 2 * Math.PI + Math.atan(coordinates[1] / coordinates[0]);
            }
            else {
                lambda = Math.atan(coordinates[1] / coordinates[0]);
            }
        }
        else if (coordinates[0] < 0) {
            lambda = Math.PI + Math.atan(coordinates[1] / coordinates[0]);
        }
        else if (coordinates[1] > 0) {
            lambda = 0.5 * Math.PI;
        }
        else {
            lambda = 1.5 * Math.PI;
        }
        const rho = Math.sqrt(coordinates[0] * coordinates[0] + coordinates[1] * coordinates[1]);
        const phi = Math.atan(coordinates[2] / ((1.0 - e2) * rho));
        return new LonLat((lambda * 180) / Math.PI, (phi * 180) / Math.PI);
    }
}
