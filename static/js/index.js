var map;
var uid = Math.random().toString(36).slice(2);
branch_colors = []; for(i = 0; i < 50; i++){branch_colors.push(randomColor())} 
nb_branch = 0
var geojson_intersection = L.geoJSON(null, {
  // for lines
  style : function(feature) {
    switch(feature.properties.type) {
      case "branch":
        branch_number = parseInt(feature.properties.name.substr(9).split("|")[0].trim())
        if(branch_number > nb_branch)
          nb_branch = branch_number
        return {
          color: branch_colors[branch_number-1],
          weight : 5
        }
      case "crossing":
        return {
          color: "#222222",
          weight: 2,
          dashArray : "5, 5"
        }
      default:
        return {
          color: "#000000",
          weight: 2
        }
    }
  },
  // for points
  pointToLayer: function(feature, coords) {
    if(feature.properties.type == "crossing")
      L.circle(coords, 1, {color: "#000000", fillColor: "#000000", fillOpacity: 1}).addTo(geojson_intersection)
  }
});

function getPigeon(e) {
  coords = e.latlng
  fetch(window.location.origin+"/pigeon"+"?lat="+coords.lat+"&lng="+coords.lng+"&uid="+uid).then(function(response) {
    return response.json();
  }).then(function(data) {
    branch_colors = []; for(i = 0; i < 50; i++){branch_colors.push(randomColor())}
    geojson_intersection.clearLayers()
    geojson_intersection.addData(JSON.parse(data[2]))
    legend = "Branche du carrefour : "
    for(i = 0; i < nb_branch; i++) {
      legend += "<span style='color:"+branch_colors[i]+"'>––</span> "
    }
    legend += "<br/>Intérieur du carrefour : <span style='color: #000000'>––</span><br/>Traversée : <span style='color: #222222'>⬤ et - - -</span><br/><br/>"
    document.getElementById("text").innerHTML = legend + data[1].txt.replace(/\n/g, "<br/><br/>")
    nb_branch = 0
  })
}

function init() {
  map= L.map('map', {attributionControl: false}).setView([46.8, 2.52], 6);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap'
  }).addTo(map);

  L.control.attribution({
    position: 'topright'
  }).addTo(map);

  geojson_intersection.addTo(map);

  map.on("click", getPigeon);

  params = new URLSearchParams(window.location.search);
  try {
    params = params.get("map").split("/")
    z = Number(params[0])
    x = Number(params[1])
    y = Number(params[2])
    map.setView([x,y], z);
  } catch {
    map.setView([47.123,4.658], 6);
  }

  map.on('moveend zoomend', function() {
    params = "map="+map.getZoom()+"/"+map.getCenter().lat+"/"+map.getCenter().lng
    url = window.location.protocol + "//" + window.location.host + window.location.pathname + '?' + params;
    window.history.pushState({path: url}, '', url);
  });

}