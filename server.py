#!/usr/bin/env python3

import shutil
from datetime import datetime
from importlib.metadata import version
import random
import string
import traceback
from crwebapi import *
from description import *
from flask import Flask, request

def log(uid, lat, lng, c0, c1, c2, error=None, comment=None):
    xml = ""
    for file in shutil.os.listdir("cache/"+uid):
        if file.endswith('.xml'):
            xml = "cache/%s/%s"%(uid,file)
            break
    libraries = ""
    for lib in ["osmnx","crossroads-segmentation","crmodel","crdesc"]:
        libraries += "%s %s\n"%(lib, version(lib))
    logfile = "DATE : %s\nPOSITION : %s %s\nC0 C1 C2 : %s %s %s\nLIBRARIES : \n%s"%(datetime.now().strftime("%d/%m/%Y %H:%M:%S"), lat, lng, c0, c1, c2, libraries)
    if comment:
        logfile += "COMMENT : \n%s\n"%comment
    if error:
        logfile += "ERROR : \n%s"%error
    if xml:
        with open(xml, 'r') as f:
            content = f.read()
            logfile += "OSMXML CONTENT : \n%s"%content

    fname = ("error_%s%s.log" if error else "%s%s.log")%(''.join(random.choice(string.ascii_letters) for i in range(10)), datetime.now().timestamp())
    with open("log/"+fname, 'w') as f:
        f.write(logfile)


# clear folders
shutil.rmtree("cache", ignore_errors=True), shutil.os.mkdir("cache") , shutil.os.makedirs("log", exist_ok=True)

app = Flask(__name__)

@app.route("/")
def html():
    return app.send_static_file('index.html')

@app.route("/api")
def api_route():

    args = request.args
    selfdescription, lat, lng, c0, c1, c2, uid, comment = args.get("self-description"), args.get("lat"), args.get("lng"), args.get("c0"), args.get("c1"), args.get("c2"), args.get("uid"), args.get("comment")

    if c0 is None or c1 is None or c2 is None:
        c0 = 2
        c1 = 2
        c2 = 4

    api = CrWebApi()

    if lat and lng and uid:
        shutil.rmtree("cache/"+uid, ignore_errors=True), shutil.os.mkdir("cache/"+uid)
        error = None
        try:
            generateDescription(api, uid, float(lat), float(lng), float(c0), float(c1), float(c2))
        except Exception as e:
            error = traceback.format_exc()
            api.setMessage("Erreur lors de la génération de la description. Veuillez essayer un autre carrefour.")
            api.setGeoJson("{}")
            
        if comment is not None and len(comment) == 0 : comment = None

        log(uid, lat, lng, c0, c1, c2, error, comment)

    return api.getJson()

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=int(shutil.os.environ.get("PORT", 8080)))