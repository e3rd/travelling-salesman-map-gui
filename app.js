// the nodes are stated here
let places = [
    "Wellington, Nový Zéland",
    "Tawhai Falls, Nový Zéland",
    "Whakapapa ski, Nový Zéland",
    "Mangawhero Falls, Nový Zéland",
    "Mount Victoria, Nový Zéland",
    "Huka Falls, Nový Zéland",
    "Putangirua Pinnacles, Nový Zéland",
    "Dawson Falls, Nový Zéland",
    "New Plymouth, Nový Zéland",
    "Rainbow Crater, Nový Zéland"
]//.map(el => el + ", Nový Zéland")


// create the map
let center = SMap.Coords.fromWGS84(177, -40)
let m = new SMap(JAK.gel("m"), center)
m.addDefaultLayer(SMap.DEF_BASE).enable()
m.addDefaultControls()

// marker layer
var marker_layer = new SMap.Layer.Marker()
m.addLayer(marker_layer)
marker_layer.enable()

const sleep = ms => new Promise(r => setTimeout(r, ms))

// build all_places from cache
/** @type {Place[]} */
const all_places = places.map(place_name => new Place(place_name))
Place.assure_all_coord(all_places)
console.log("Coords assured, displaying markers.")
display_markers()

/**
 * Call each other place and count the length in between.
 * */
async function start() {
    for (const place of all_places) {
        for (const p of all_places.filter(p => p !== place)) {
            // XX if wanted to increase the performance,
            // we may launch around 6 API call instead of waiting
            // till the single one ends
            await place.compute_distance(p)
        }
    }
    geometry_layer.clear() // routes might have been cast to the map
    console.info("Start finished. Continue with `generate_matrix_length`.")
}

console.info("Tutorial: Hardcode places. Call `start`. Results are automatically cache to localStorage. Call `generate_matrix_length`. Go to Python to solve TSP. Call `display_route()`. ")

function generate_matrix_time() {
    return _generate_matrix("time")
}
function generate_matrix_length() {
    return _generate_matrix("length", ((x) => Math.round(x / 1000)))
}


function run(matrix) {
    const { bare, places } = transform_matrix(matrix)
    const solution = TSP(bare).map(n => places[n])
    console.log(solution)
    display_route(solution)
}

/**
 * Takes matrix generated by generate_matrix_length, replaces 0 with Infinity and removes cities
 * @param {number[][]} matrix
 */
function transform_matrix(matrix) {
    return { "bare": matrix.slice(1).map(row => row.slice(1).map(val => val === 0 ? Infinity : val)), "places": matrix[0].slice(1) }
}

function _generate_matrix(pivot, callback = null) {
    lines = []
    lines.push([""].concat(all_places.map(place => place.name)))
    for (const place1 of all_places) {
        line = [place1.name]
        for (const place2 of all_places) {
            try {
                let val = (place1 == place2) ? 0 : place1.distances[place2.name][pivot]
                if (callback) {
                    val = callback(val)
                }
                line.push(val)
            } catch (e) {
                console.warn("Value not found", "place1", place1.name, "place2", place2.name, "wanted", pivot)
            }
        }
        lines.push(line)
    }

    return lines
    lines = lines.map(line => line.join("\t")).join("\n")

}

function _names_to_places(names = null) {
    const places = names ? (names.map(name => all_places.find(p => p.name == name))) : all_places
    console.log("Displaying route", places)
    return places
}

var geometry_layer = new SMap.Layer.Geometry();
m.addLayer(geometry_layer).enable();

function _show_route_on_map(route) {
    var coords = route.getResults().geometry
    // m.setCenterZoom(...m.computeCenterZoom(coords))
    var g = new SMap.Geometry(SMap.GEOMETRY_POLYLINE, null, coords)
    geometry_layer.clear()
    geometry_layer.addGeometry(g)
}

/*
*
* In new window, open route through all places in `all_places`.
* names - optional list of strings, use places in order of their names.
*/
async function display_route(names = null) {
    var nalezeno = function (route) {
        if (route._results.error) {
            console.log("***Cannot find route", route)
            return
        }
        console.log("Route", route)
        _show_route_on_map(route)
        window.open(route._results.url)
    }

    const places = _names_to_places(names)
    const route = SMap.Route.route(places.map(place => place.coord()), {
        geometry: true
    }).then(nalezeno);
}

async function display_markers(names = null) {
    const places = _names_to_places(names)
    places.forEach(place => {

        var card = new SMap.Card();
        card.getHeader().innerHTML = "<strong>Nadpis</strong>";
        card.getBody().innerHTML = "Ahoj, já jsem <em>obsah vizitky</em>!";

        // const znacka = JAK.mel("div");
        // const popisek = JAK.mel("div", { }, {position:"absolute", left:"0px", top:"2px", textAlign:"center", width:"22px", color:"white", fontWeight:"bold"});
        // popisek.innerHTML = this.name;
        // znacka.appendChild(popisek);

        const marker = new SMap.Marker(place.coord(), place.name, {
            title: place.name,
            // url: znacka
        });
        marker.decorate(SMap.Marker.Feature.Card, card);
        marker_layer.addMarker(marker);
    })

    // centralize the map
    m.setCenterZoom(...m.computeCenterZoom(places.map(p => p.coord())))
}