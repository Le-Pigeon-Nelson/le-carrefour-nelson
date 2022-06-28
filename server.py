#!/usr/bin/env python3

import shutil
import os
from pigeon import *
from description import *
from flask import Flask, request, send_from_directory

# clear folders
shutil.rmtree("cache", ignore_errors=True), shutil.os.mkdir("cache") 

app = Flask(__name__)

@app.route("/")
def html():
    return app.send_static_file('index.html')

@app.route("/pigeon")
def send_pigeon():

    args = request.args
    selfdescription, lat, lng, uid = args.get("self-description"), args.get("lat"), args.get("lng"), args.get("uid")

    pigeon = PigeonNelson("Crossroads Describer", "Décrire un carrefour proche de sa position", "UTF-8", 0)

    if lat and lng and uid:
        shutil.rmtree("cache/"+uid, ignore_errors=True), shutil.os.mkdir("cache/"+uid) 
        try:
            generateDescription(pigeon, uid, float(lat), float(lng))
        except Exception as e:
            print(e)
            pigeon.setMessage("Erreur lors de la génération de la description.", "fr", 1)
            pigeon.setGeoJson("{}")

    return pigeon.getJson()

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=int(os.environ.get("PORT", 8080)))