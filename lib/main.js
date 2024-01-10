var app = new TspApp() // expose

const $start = $("#start")
const $status = $("#status")
const $places = $("#places")
const $place_suffix = $("#place_suffix")
const $criterion = $("#criterion")
const wh = new WebHotkeys().init()
const $go_to_map = $("#go-to-map")

// closes SMap marker popover
wh.grab("Escape", "Close dialog", () => $(".close", ".card").click(), () => $(".card").length)

/**
 * Places from textarea to the app.
 */
const rebuild_places = async () => {
    $start.prop("disabled", true)
    $go_to_map.toggleClass("disabled", true)

    let suffix = $place_suffix.val().trim() // optinally append suffix
    suffix = suffix ? `, ${suffix}` : ""
    const places = $places.val().split("\n").map(r => r.trim()).filter(Boolean).map(r => r + suffix)

    app.criterion = $criterion.val()
    app.marker_layer.clear()

    if (await app.build_places(places)) {
        $start.prop("disabled", false)
    }
    save_to_hash()
}

$places.on("change", rebuild_places)
$place_suffix.on("change", rebuild_places)
$criterion.on("change", rebuild_places)

$start.click(async () => {
    $start.prop("disabled", true)
    $go_to_map.toggleClass("disabled", true)
    await rebuild_places()
    await app.compute_distances()
    const matrix = app.generate_matrix_length()
    const solution = await app.compute_route(matrix)
    const route = await app.display_route(solution)
    $go_to_map.attr("href", route._results.url)
    $go_to_map.toggleClass("disabled", false)
    app.info(`${app.formatDistance(route._results.length)} (${app.formatTime(route._results.time)}): ${solution.map(r => r.name).join(" → ")}`)

    $start.prop("disabled", false)
})

function load_from_hash() {
    const paramsArray = window.location.hash.substring(1).split('&')
    const valuesHash = {}
    paramsArray.forEach(param => {
        const [key, value] = param.split('=');
        valuesHash[key] = decodeURIComponent(value);
    })

    if (valuesHash["places"]) {
        $places.val(decodeURIComponent(valuesHash['places']))
    }
    if (valuesHash['suffix']) {
        $place_suffix.val(decodeURIComponent(valuesHash['suffix']))
    }
    if (valuesHash['criterion']) {
        $criterion.val(decodeURIComponent(valuesHash['criterion']))
    }
}

function save_to_hash() {
    location.hash = `places=${encodeURIComponent($places.val())}&suffix=${encodeURIComponent($place_suffix.val())}&criterion=${encodeURIComponent($criterion.val())}`;
}

// Main start
load_from_hash()

// Check if there are some values from the beginning
if ($places.val().trim().length) {
    rebuild_places()
}