var map;
var uid = Math.random().toString(36).slice(2);
var branch_colors = ["#e41a1c","#377eb8","#4daf4a","#984ea3","#ff7f00","#ffff33","#a65628","#f781bf","#999999"]
nb_branch = 0
coords = null
requesting = false

/* Data files */
var geojson_intersection = L.geoJSON(null)
geojson = {}
geojson.ways = L.geoJSON(null, {
  style : {color: "#555555", weight: 1}
})
geojson.branch = L.geoJSON(null, {
  style : function(feature) {
    branch_number = parseInt(feature.properties.name.substr(9).split("|")[0].trim())
    if(branch_number > nb_branch)
      nb_branch = branch_number
    return {
      color: branch_colors[(branch_number-1)%branch_colors.length],
      weight : 5
    }
  },
  onEachFeature: function(feature, layer) {
    layer.bindPopup(feature.properties.description)
  }
})
geojson.crossing_shadow = L.geoJSON(null, {
  style : {color: "#ffffff", weight: 5, opacity: 0},
  onEachFeature: function(feature, layer) {
    layer.bindPopup(feature.properties.description)
  }
})
geojson.crossing = L.geoJSON(null, {
  style : {color: "#222222", weight: 2, dashArray : "5, 5"},
  onEachFeature: function(feature, layer) {
    layer.bindPopup(feature.properties.description)
  }
})
geojson.crosswalk = L.geoJSON(null, {
  style: {weight: 0},
  pointToLayer: function(feature, coords) {
    if(feature.properties.type == "crosswalk")
      L.circle(coords, 0.8, {color: "#000000", fillColor: "#000000", fillOpacity: 1})
      .bindPopup(feature.properties.description)
      .addTo(geojson.crosswalk)
  }
})

/* Core function */
function getPigeon(e, comment="") {
  if(!requesting){
    requesting = true
    disableReload()

    // Fetch parameters
    coords = e.latlng
    c0 = document.getElementById("C0").value
    c1 = document.getElementById("C1").value
    c2 = document.getElementById("C2").value
    comment = comment.replaceAll("\n", "%0A")
    args = "?lat="+coords.lat+"&lng="+coords.lng+"&c0="+c0+"&c1="+c1+"&c2="+c2+"&uid="+uid

    // Replace content with loading animation
    content = document.getElementById("content").innerHTML
    document.getElementById("content").innerHTML = '<div id="loading" class="lds-spinner"><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div></div>'
    
    // Fetch data from the API. Timeout of 10s.
    fetchTimeout(window.location.origin+window.location.pathname+"pigeon"+"?lat="+coords.lat+"&lng="+coords.lng+"&c0="+c0+"&c1="+c1+"&c2="+c2+"&uid="+uid+"&comment="+comment, 10000).then(function(response) {
      return response.json();
    }).then(function(data) {

      // Put the content back on the page
      document.getElementById("content").innerHTML = content
      document.getElementById("C0").value = c0
      document.getElementById("C1").value = c1
      document.getElementById("C2").value = c2

      // Clear layers
      geojson_intersection.clearLayers()
      for(id of Object.keys(geojson)) {
        geojson[id].clearLayers()
      }

      // Add new layers
      json_data = JSON.parse(data[2])
      if(Object.keys(json_data).length > 0) {
        geojson_intersection.addData(JSON.parse(data[2]))
      }
      geojson_intersection.eachLayer(function(layer) {
          switch(layer.feature.properties.type) {
            case "branch":
              geojson.branch.addData(layer.feature)
              break
            case "crosswalk":
              geojson.crosswalk.addData(layer.feature)
              break
            case "crossing":
              if(layer.feature.geometry.type == "LineString") {
                geojson.crossing_shadow.addData(layer.feature)
                geojson.crossing.addData(layer.feature)
              }
              break
            case "way":
              geojson.ways.addData(layer.feature)
              break
          }
      })

      // Reorder layers
      for(id of Object.keys(geojson)) {
        geojson[id].bringToFront()
      }

      // Update content according to fetched data
      legend = "Branche du carrefour : "
      for(i = 0; i < nb_branch; i++) {
        legend += "<span style='color:"+branch_colors[i%branch_colors.length]+"'><strong>––</strong></span> "
      }
      legend += "<br/>Intérieur du carrefour : <span style='color: #000000'>––</span><br/>Passage piéton : <span style='color: #222222'>⬤</span><br/>Traversée : <span style='color: #222222'>- - -</span><br/><br/><br/>"
      document.getElementById("text").innerHTML = legend + data[1].txt.replace(/\n/g, "<br/><br/>")
      nb_branch = 0

      // Display a message to indicate that the comment was sent 
      if(comment != "") {
        document.getElementById("comment_text").value = ""
        document.getElementById("text").innerHTML = "Votre commentaire a bien été envoyé."
      }

      // Update UI elements and enable to request again
      updateSendButton(document.getElementById("comment_text").value)
      requesting = false
    }).catch(error => {
      document.getElementById("content").innerHTML = content
      document.getElementById("C0").value = c0
      document.getElementById("C1").value = c1
      document.getElementById("C2").value = c2
      document.getElementById("text").innerHTML = "Le serveur n'a pas répondu. Veuillez réessayer ultérieurement."
      requesting = false
    })
  }
}

/* Handler functions */

function reloadPigeon() {
  getPigeon({latlng : coords})
}

function sendComment() {
  comment = document.getElementById("comment_text").value
  getPigeon({latlng : coords}, comment)
}

function toggleComment() {
  comment = document.getElementById("comment")
  if(comment.style.display != "grid") {
    comment.style.display = "grid"
    document.getElementById("content").scrollTop = document.getElementById("content").scrollHeight;
  }
  else
    comment.style.display = "none"  
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

/* UI updating functions */

function enableReload() {
  reload_button = document.getElementById("reload_button")
  reload_button.disabled = false
  reload_button.className = "button"
}

function disableReload() {
  reload_button = document.getElementById("reload_button")
  reload_button.disabled = true
  reload_button.className = "button_disabled"
}

function updateSendButton(message) {
  send_button = document.getElementById("send_button")
  if(message.trim().length > 0 && coords != null) {
    send_button.className = "button"
    send_button.disabled = false
  }
  else {
    send_button.className = "button_disabled"
    send_button.disabled = true
  }
}

function updateSlider(slider, value) {
  document.getElementById(slider.id+"val").innerHTML = value
  slider.value = value
  if(coords != null) {
    enableReload()
  }
}

function resetSliders() {
  document.getElementById("C0").value = 2
  document.getElementById("C1").value = 2
  document.getElementById("C2").value = 4
  document.getElementById("C0val").innerHTML = 2
  document.getElementById("C1val").innerHTML = 2
  document.getElementById("C2val").innerHTML = 4
}

/* Initialisation function */
function init() {

  // Init map and controls
  map= L.map('map', {attributionControl: false}).setView([46.8, 2.52], 6);
  L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap',
    opacity : 0.7
  }).addTo(map);
  L.control.attribution({
    position: 'topright'
  }).addTo(map);

  // Add layers to map
  for(id of Object.keys(geojson)) {
    geojson[id].addTo(map)
  }

  // Enable interaction on the map to get the description
  map.on("click", getPigeon);

  // Add view parameters to the window, mainly to keep the current view on reload
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

  // Reinit some UI elements
  document.getElementById("comment_text").value = ""
  resetSliders()

}