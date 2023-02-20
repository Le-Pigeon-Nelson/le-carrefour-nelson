var map;
var uid = Math.random().toString(36).slice(2);
var branch_colors = ["#e41a1c","#377eb8","#4daf4a","#984ea3","#ff7f00","#ffff33","#a65628","#f781bf","#999999"]
coords = null
requesting = false

// Use geographic coordinates
ol.proj.useGeographic()

/* Data files */
var geojson_intersection = new ol.layer.Vector({
  source : new ol.source.Vector(),
  style : function(feature, resolution) {
    switch(feature.get("type")) {

      case "branch":
        branch_number = parseInt(feature.get("id"))
        return new ol.style.Style({
          stroke : new ol.style.Stroke({
            color: branch_colors[(branch_number-1)%branch_colors.length],
            width : 5
          })
        });

      case "crosswalk":
        return new ol.style.Style({
          image : new ol.style.Circle({
            radius: 5,
            fill: new ol.style.Fill({
              color: 'black'
            })
          })
        });

      case "crossing":
        return new ol.style.Style({
          stroke : new ol.style.Stroke({
            color: 'black',
            width: 2,
            lineDash: [6,6]
          })
        });
        break;

      case "way":
        return new ol.style.Style({
          stroke : new ol.style.Stroke({
            color: 'black',
          })
        });

    }
  }
});

/* Core function */
function getPigeon(e, comment="") {
  if(!requesting){
    requesting = true
    disableReload()

    // Fetch parameters
    coords = { lat : e.coordinate[1], lng : e.coordinate[0]}
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
      document.getElementById("download_button").disabled = false
      document.getElementById("download_button").className = "button"

      // Clear layers
      geojson_intersection.getSource().clear()

      // Add new layers
      json_data = JSON.parse(data[2])
      nb_branch = 0
      if(Object.keys(json_data).length > 0) {
        features = new ol.format.GeoJSON().readFeatures(json_data)
        nb_branch = parseInt(features.filter(f => f.values_.type == "branch").at(-1).values_.name.substr(9).split("|")[0].trim())
        geojson_intersection.getSource().addFeatures(features)
      }

      // Update content according to fetched data
      legend = "Branche du carrefour : "
      for(i = 0; i < nb_branch; i++) {
        legend += "<span style='color:"+branch_colors[i%branch_colors.length]+"'><strong>––</strong></span> "
      }
      legend += "<br/>Intérieur du carrefour : <span style='color: #000000'>––</span><br/>Passage piéton : <span style='color: #222222'>⬤</span><br/>Traversée : <span style='color: #222222'>- - -</span><br/><br/><br/>"
      document.getElementById("text").innerHTML = legend + data[1].txt.replace(/\n/g, "<br/><br/>")

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
      document.getElementById("download_button").disabled = true
      document.getElementById("download_button").className = "button_disabled"
      requesting = false
    })
  }
}

/* Handler functions */

function reloadPigeon() {
  getPigeon({coordinate: [coords.lng, coords.lat]})
}

function sendComment() {
  comment = document.getElementById("comment_text").value
  getPigeon({coordinate: [coords.lng, coords.lat]}, comment)
}

function downloadData() {
    data = new ol.format.GeoJSON().writeFeatures(geojson_intersection.getSource().getFeatures()) 
    data_holder = document.createElement('a');
    data_holder.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(data));
    data_holder.setAttribute('download', "carrefour.geojson");
    data_holder.style.display = 'none';
    document.body.appendChild(data_holder);
    data_holder.click();
    document.body.removeChild(data_holder);
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

  closer = document.getElementById('popup-closer');
  overlay = new ol.Overlay({
    element: document.getElementById('popup'),
    autoPan: {
      animation: {
        duration: 250,
      }
    }
  });

  closer.onclick = function () {
    overlay.setPosition(undefined);
    closer.blur();
    return false;
  };

  map = new ol.Map({
    layers: [
      new ol.layer.Tile({
        source: new ol.source.XYZ({
          url: 'https://{a-c}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png',
          attributions: "Contributeurs OpenStreetMap ©"
        }),
        opacity: 0.7
      }),
      geojson_intersection
    ],
    view: new ol.View({
      center: [4.658,47.123],
      zoom: 6,
      maxZoom: 20
    }),
    controls: ol.control.defaults.defaults({attribution: false}).extend([
      new ol.control.Attribution({
        collapsible: false,
      })
    ]),
    overlays: [overlay],
    target: 'map',
  })

  // Enable interaction on the map to get the description
  map.on("singleclick", function(e) {
    var features = [];
    map.forEachFeatureAtPixel(e.pixel, function(feature, layer) {
      features.push(feature);
    });
    feature = features[0]
    if(feature && ["branch", "crosswalk", "crossing"].includes(feature.values_.type)) {
      document.getElementById('popup-content').innerHTML = feature.values_.description;
      overlay.setPosition(e.coordinate);
    } else {
      overlay.setPosition(undefined);
      getPigeon(e);
    }
  });

  // Reinit some UI elements
  document.getElementById("comment_text").value = ""
  resetSliders()

  // Load url parameters
  url_params = new URLSearchParams(window.location.search);

  // Add a request parameter to enable requesting upon loading
  try {
    params = url_params.get("request").split("/")
    x = Number(params[0])
    y = Number(params[1])
    map.getView().setCenter([y,x]);
    map.getView().setZoom(18);
    coords = {lat : x, lng: y}
    reloadPigeon()
  } catch {
    // Add view parameters to the window, mainly to keep the current view on reload
    try {
      params = url_params.get("map").split("/")
      z = Number(params[0])
      x = Number(params[1])
      y = Number(params[2])
      map.getView().setCenter([y,x]);
      map.getView().setZoom(z);
    } catch {}
  }

  // reencode the window location in the url
  map.on('moveend', function() {
    params = "map="+map.getView().getZoom().toFixed()+"/"+map.getView().getCenter()[1].toFixed(5)+"/"+map.getView().getCenter()[0].toFixed(5)
    url = window.location.protocol + "//" + window.location.host + window.location.pathname + '?' + params;
    window.history.pushState({path: url}, '', url);
  });

}