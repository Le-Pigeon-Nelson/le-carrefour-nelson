#!/usr/bin/env python3

import shutil
import os
import requests
from socketserver import ThreadingMixIn
from http.server import *
from urllib.parse import parse_qs
from pigeon import *
import osmnx as ox
import crseg.segmentation as cs
import crdesc.description as cd
import crdesc.config as cg

class ThreadingServer(ThreadingMixIn, HTTPServer):
    pass

class PigeonServer(BaseHTTPRequestHandler) :

        pigeon = PigeonNelson("Crossroads Describer", "Décrire un carrefour proche de sa position", "UTF-8", 0)
        html = open("index.html").read()

        def sendHTML(self):
            self.send_response(200)
            self.send_header("Content-type", "text/html")
            self.end_headers()
            self.wfile.write(bytes(self.html, "UTF-8"))

        def sendPigeon(self):
            self.send_response(200)
            self.send_header("Content-type", "text/json")
            self.end_headers()
            self.wfile.write(bytes(self.pigeon.getJson(), "UTF-8"))
            self.pigeon.clear()

        def generateDescription(self, uid, latitude, longitude):
            r = requests.get("https://www.openstreetmap.org/api/0.6/map?bbox=%s,%s,%s,%s"%(longitude-0.002,latitude-0.002,longitude+0.002,latitude+0.002), allow_redirects=True)
            open(uid+'/osm.xml', 'wb').write(r.content)

            # OSMnx configuration
            ox.config(use_cache=True, useful_tags_way = list(set(ox.settings.useful_tags_way + cg.way_tags_to_keep)), useful_tags_node = list(set(ox.settings.useful_tags_node + cg.node_tags_to_keep)))

            G = ox.graph_from_xml(uid+"/osm.xml", simplify=False)

            # graph segmentation (from https://gitlab.limos.fr/jmafavre/crossroads-segmentation/-/blob/master/src/get-crossroad-description.py)

            # remove sidewalks, cycleways, service ways
            G = cs.Segmentation.remove_footways_and_parkings(G, False)
            # segment it using topology and semantic
            seg = cs.Segmentation(ox.utils_graph.get_undirected(G), C0 = 2, C1 = 2, C2 = 4, max_cycle_elements = 10)
            seg.process()
            seg.to_json(uid+"/intersection.json", longitude, latitude)

            desc = cd.Description()
            desc.computeModel(G, uid+"/intersection.json")
            description = desc.generateDescription()["structure"]

            text = description["general_desc"] + "\n"
            for branch_desc in description["branches_desc"]:
                text += branch_desc + "\n"
            for crossing_desc in description["crossings_desc"]:
                text += crossing_desc + "\n"

            # create Pigeon Nelson
            self.pigeon.setMessage(text, "fr", 1)

        def do_GET(self) :     
            params = {}
            if '?' in self.path:
                params = parse_qs(self.path.split('?')[1])
                if "self-description" in params.keys():
                    self.sendPigeon()
                elif "lat" in params.keys() and "lng" in params.keys() and "uid" in params.keys():
                    latitude=float(params["lat"][0])
                    longitude=float(params["lng"][0])
                    uid = params["uid"][0]

                    # create / clean basic folder structure
                    folders = [uid]
                    for dir in  folders : shutil.rmtree(dir, ignore_errors=True), shutil.os.mkdir(dir) 
                    
                    self.generateDescription(uid, latitude, longitude)
                    self.sendPigeon()
                else:
                    self.sendHTML()
            else :
                self.sendHTML()


if __name__ == "__main__":      
    
    webServer = ThreadingServer(('', int(os.environ.get("PORT", 8080))), PigeonServer)

    try:
        webServer.serve_forever()
    except KeyboardInterrupt:
        pass

    webServer.server_close()
