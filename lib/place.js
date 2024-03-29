class Place {
    constructor(name, coordinates = null, distances = null) {
        this.name = name
        let cache
        try { // if there is something wrong in cache
            cache = JSON.parse(localStorage.getItem(this.name)) || {}
        } catch (e) {
            cache = {}
        }

        this.coordinates = coordinates || cache.coordinates || {}
        this.distances = distances || cache.distances || {} // {place.name: {"time": int, "length": m}}
    }

    /**
     * return true if coordinates already exist
     * */
    assure_coord() {
        if (this.coordinates && Object.keys(this.coordinates).length) {
            return true
        }

        return (new SMap.SuggestProvider()).get(this.name).then((addresses) => {
            if (addresses.length < 1) {
                console.warn("Coordinates error", this.name, addresses);
                return false
            }
            this.coordinates = addresses[0]
            console.warn("Coordinates", this.name, "possibilities:", addresses.length, this.coordinates)
            this.cache_self()
            return true
        })
    }

    coord() {
        if (!this.coordinates || !Object.keys(this.coordinates).length) {
            console.warn("Unknown coordinates of", this.name)
        }
        return SMap.Coords.fromWGS84(this.coordinates.longitude, this.coordinates.latitude)
    }

    /**
     * @param {Place[]} places
     * @returns {Place[]} Places with valid coordonates.
    */
    static async assure_all_coord(places) {
        const valid = []
        for (const place of places) {
            if (await place.assure_coord()) {
                valid.push(place)
            }
        }
        return valid
    }

    /**
     *
     * @param {Place} place
     * @param {TspApp} app
     * @returns
     */
    compute_distance(place, app) {
        if (this.distances[app.criterion + place.name] || this.name === place.name) { // we already have this distance
            return true
        }
        return (new SMap.Route([this.coord(), place.coord()], route => {
            if(route.getResults().error) { // HTTP request failed
                app.warn(`Request failed: ${this.name} -> ${place.name}, ${route.getResults().error}`)
                return false
            }
            const [time, len] = [route._results.time, route._results.length]
            if (time && len) {
                app.info(`${this.name} -> ${place.name}: ${len} m, ${time} s`)
                app._show_route_on_map(route) // XX looks amazing but slows down, might make it togglable in UI
                this.distances[app.criterion + place.name] = { "time": time, "length": len }
                this.cache_self()
            } else {
                app.warn(`FAIL, the algorithm will not work: ${this.name} -> ${place.name}.`)
            }
        }, { criterion: app.criterion })).getPromise()
    }

    /** Serialize all places to offline use
     */
    static output_objects() {
        return this.all_places
    }

    cache_self() {
        localStorage.setItem(this.name, JSON.stringify(this))
    }

}