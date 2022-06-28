var map;
var uid = Math.random().toString(36).slice(2);
var geojson_intersection = L.geoJSON();

function getPigeon(e) {
  coords = e.latlng
  fetch(window.location.origin+"/pigeon"+"?lat="+coords.lat+"&lng="+coords.lng+"&uid="+uid).then(function(response) {
    return response.json();
  }).then(function(data) {
    document.getElementById("description").innerHTML = data[1].txt.replace(/\n/g, "<br/>");
    geojson_intersection.clearLayers()
    geojson_intersection.addData(JSON.parse(data[2]))
  }).catch(function() {
    console.log("Request fail");
  });
}

function init() {
  map= L.map('map').setView([46.8, 2.52], 6);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap'
  }).addTo(map);

  geojson_intersection.addTo(map);

  map.on("click", getPigeon);
}