class TspApp {

    constructor() {
        // create the map
        let center = SMap.Coords.fromWGS84(177, -40)
        this.m = new SMap(JAK.gel("m"), center)
        this.m.addDefaultLayer(SMap.DEF_BASE).enable()
        this.m.addDefaultControls()

        // marker layer
        this.marker_layer = new SMap.Layer.Marker()
        this.m.addLayer(this.marker_layer)
        this.marker_layer.enable()

        // geometry layer
        this.geometry_layer = new SMap.Layer.Geometry()
        this.m.addLayer(this.geometry_layer).enable()
        /** @type {Place[]} */
        this.all_places = []
        this.progress = document.querySelector("#progress")
        this.criterion = ""
    }

    /**
     *
     * @param {number|boolean|null} cmd If number, set the counter to this count. If null, increment. If true, starts with max. If false, ends it.
     * @param {number} max
     */
    counter(cmd = null, max = 100) {
        if (cmd === null) {
            this.progress.value += 1
        } else if (cmd === false) {
            this.progress.hidden = true
        } else if (cmd === true) {
            this.progress.max = max
            this.progress.value = 0
            this.progress.hidden = false
        } else {
            this.progress.value = cmd
        }
    }

    /**
     *
     * @param {*} places
     * @returns {boolean} True if all places have been successfully fetched.
     */
    async build_places(places) {
        // build all_places from cache
        const unfiltered = this.all_places = places.map(place_name => new Place(place_name))
        this.all_places = await Place.assure_all_coord(this.all_places)
        const invalid = unfiltered.filter(place => !this.all_places.includes(place))
        this.display_markers()
        if (invalid.length) {
            this.info("Invalid:<br>" + invalid.map(p => p.name).join("<br>"))
        } else if (this.all_places.length < 4) {
            this.info(`At least 4 places needed`)
        } else {
            this.info(`${this.all_places.length} places ready`)
            return true
        }
    }

    /**
     * Call each other place and count the length in between.
     * @param {function} counter Called when step completed
     * */
    async compute_distances() {
        this.counter(true, this.all_places.length * this.all_places.length - 1)
        for (const place of this.all_places) {
            for (const p of this.all_places.filter(p => p !== place)) {
                // XX if wanted to increase the performance,
                // we may launch around 6 API call instead of waiting
                // till the single one ends
                await place.compute_distance(p, this)
                this.counter()
            }
        }
        this.clear_geometry()
        this.info("Places fetched.")
        this.counter(false)
    }

    generate_matrix_time() {
        return this._generate_matrix("time")
    }
    generate_matrix_length() {
        return this._generate_matrix("length")
    }


    /**
     *
     * @param {number[][]} matrix
     * @returns {Place[]}
     */
    async compute_route(matrix) {
        const max = factorial(matrix.length - 3)  // Full number of permutations (subtracting start and finish)
        this.counter(true, max)
        let last_path = []
        const ff = new Intl.NumberFormat(navigator.language)

        const { bare, places } = this.transform_matrix(matrix)
        const solution = (await TSP(bare, async (shortestPath, shortestDistance, counter) => {
            const solution = this._names_to_places(shortestPath.map(n => places[n]))
            this.info(`...Best so far ${this.formatDistance(shortestDistance)}: ${solution.map(r => r.name).join(" → ")} <br>Permutation: ${ff.format(counter)}/${ff.format(max)}`)
            this.counter(counter)
            if (arraysEqual(last_path, shortestPath)) {
                await sleep(1)  // without async + await, nothing would be output, nor this.info
            } else {
                last_path = shortestPath
                await this.display_route(solution)
            }
        })).map(n => places[n])
        this.counter(false)
        return this._names_to_places(solution)
    }

    /**
     * Displaying kilometers
     * @param {number} m Meters
     * @returns {string}
     */
    formatDistance(m) {
        const km = m / 1000
        if (km < 10) {
            return km.toFixed(1) + ' km'
        } else {
            return Math.round(km) + ' km'
        }
    }

    /**
     * Displaying time
     * @param {number} s Seconds
     * @returns {string}
     */
    formatTime(s) {
        const ciph = num => (num < 10 ? `0${num}` : num)

        const seconds = s % 60
        const minutes = Math.floor(s / 60) % 60
        const hours = Math.floor(s / 3600)

        if (hours > 0) {
            return `${hours}h${ciph(minutes)}`
        } else if (minutes > 10) {
            return `${minutes} m`;
        } else if (minutes > 1) {
            return `${minutes}:${ciph(seconds)}`
        } else {
            return `${seconds}s`;
        }
    }

    /**
     * Takes matrix generated by generate_matrix_length, replaces 0 with Infinity and removes cities
     * @param {number[][]} matrix
     */
    transform_matrix(matrix) {
        return { "bare": matrix.slice(1).map(row => row.slice(1).map(val => val === 0 ? Infinity : val)), "places": matrix[0].slice(1) }
    }

    _generate_matrix(pivot) {
        const lines = []
        lines.push([""].concat(this.all_places.map(place => place.name)))
        for (const place1 of this.all_places) {
            const line = [place1.name]
            for (const place2 of this.all_places) {
                try {
                    line.push((place1.name == place2.name) ? 0 : place1.distances[this.criterion + place2.name][pivot])
                } catch (e) {
                    console.warn("Value not found", `place1: ${place1.name}, place2: ${place2.name}, wanted: ${pivot}`)
                }
            }
            lines.push(line)
        }

        return lines
    }

    _names_to_places(names = null) {
        const places = names ? (names.map(name => this.all_places.find(p => p.name == name))) : this.all_places
        return places
    }


    _show_route_on_map(route) {
        var coords = route.getResults().geometry
        // m.setCenterZoom(...m.computeCenterZoom(coords))
        var g = new SMap.Geometry(SMap.GEOMETRY_POLYLINE, null, coords)
        this.clear_geometry(g)
    }

    /**
     *
     * @param {*} geometry Geometry to be added.
     */
    clear_geometry(geometry) {
        this.geometry_layer.removeAll()
        this.geometry_layer.clear()

        if (geometry) {
            this.geometry_layer.addGeometry(geometry)
        }
    }

    /**
    *
    * Display route on map.
    *
    * @param {Place[]} places
    * @returns {SMap.Route }
    */
    display_route(places) {
        return SMap.Route.route(places.map(place => place.coord()), {
            geometry: true,
            criterion: this.criterion,
        }).then((route => {
            if (route._results.error) {
                console.warn("Cannot find route", route)
                return
            }
            this._show_route_on_map(route)
            return route
        }))
    }

    /**
     * @param {string[]} names
     */
    async display_markers(names = null) {
        const places = this._names_to_places(names)

        places.forEach(place => {
            if (this.marker_layer._markers[place.name]) {
                // due to an error of the SDK, if the same marker is added twice, it is not removed on zoom and stays as an errant point
                return
            }
            var card = new SMap.Card()
            card.getHeader().innerHTML = "<strong>What is this place?</strong>"
            card.getBody().innerHTML = place.name

            // const znacka = JAK.mel("div");
            // const popisek = JAK.mel("div", { }, {position:"absolute", left:"0px", top:"2px", textAlign:"center", width:"22px", color:"red", fontWeight:"bold"});
            // popisek.innerHTML = place.name;
            // znacka.appendChild(popisek);


            const marker = new SMap.Marker(place.coord(), place.name, {
                title: place.name,
                //  url: znacka
            });
            marker.decorate(SMap.Marker.Feature.Card, card)
            this.marker_layer.addMarker(marker)
        })

        // centralize the map
        this.m.setCenterZoom(...this.m.computeCenterZoom(places.map(p => p.coord())))
    }

    /**
     * @param {string} text
     */
    info(text) {
        $status.html(text)
    }
}