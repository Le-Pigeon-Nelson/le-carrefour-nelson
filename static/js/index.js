var map;
var uid = Math.random().toString(36).slice(2);
var branch_colors = ["#e41a1c","#377eb8","#4daf4a","#984ea3","#ff7f00","#ffff33","#a65628","#f781bf","#999999"]
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
          color: branch_colors[(branch_number-1)%branch_colors.length],
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
          color: "#555555",
          weight: 1
        }
    }
  },
  // for points
  pointToLayer: function(feature, coords) {
    if(feature.properties.type == "crosswalk")
      L.circle(coords, 0.8, {color: "#000000", fillColor: "#000000", fillOpacity: 1}).addTo(geojson_intersection)
  }
});

function getPigeon(e) {
  coords = e.latlng
  c0 = document.getElementById("C0").value
  c1 = document.getElementById("C1").value
  c2 = document.getElementById("C2").value
  fetch(window.location.origin+"/pigeon"+"?lat="+coords.lat+"&lng="+coords.lng+"&c0="+c0+"&c1="+c1+"&c2="+c2+"&uid="+uid).then(function(response) {
    return response.json();
  }).then(function(data) {
    geojson_intersection.clearLayers()
    json_data = JSON.parse(data[2])
    if(Object.keys(json_data).length > 0) {
      geojson_intersection.addData(JSON.parse(data[2]))
    }
    legend = "Branche du carrefour : "
    for(i = 0; i < nb_branch; i++) {
      legend += "<span style='color:"+branch_colors[i%branch_colors.length]+"'><strong>––</strong></span> "
    }
    legend += "<br/>Intérieur du carrefour : <span style='color: #000000'>––</span><br/>Passage piéton : <span style='color: #222222'>⬤</span><br/>Traversée : <span style='color: #222222'>- - -</span><br/><br/><br/>"
    document.getElementById("text").innerHTML = legend + data[1].txt.replace(/\n/g, "<br/><br/>")
    nb_branch = 0
  })
}

function toggleSettings() {
  settings = document.getElementById("settings")
  if(settings.style.display != "grid") {
    settings.style.display = "grid"
    document.getElementById("content").scrollTop = document.getElementById("content").scrollHeight;
  }
  else
    settings.style.display = "none"
}

function updateSlider(slider, value) {
  document.getElementById(slider.id+"val").innerHTML = value
  slider.value = value
}

function init() {
  map= L.map('map', {attributionControl: false}).setView([46.8, 2.52], 6);
  L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap',
    opacity : 0.7
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

  document.getElementById("C0").value = 2
  document.getElementById("C1").value = 2
  document.getElementById("C2").value = 4

}