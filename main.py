#!/usr/bin/env python3

import shutil
from http.server import *
from urllib.parse import parse_qs
from pigeon import *
import osmnx as ox
import crseg.segmentation as cs
import crdesc.description as cd
import crdesc.config as cg

class PigeonServer(BaseHTTPRequestHandler) :

        def do_GET(self) :
                
            params = {}
            if '?' in self.path:
                params = parse_qs(self.path.split('?')[1])

                # create / clean basic folder structure
                folders = ["data", "output", "cache"]
                for dir in  folders : shutil.rmtree(dir, ignore_errors=True), shutil.os.mkdir(dir) 

                latitude=float(params["lat"][0])
                longitude=float(params["lng"][0])

                # OSMnx configuration
                ox.config(use_cache=True, useful_tags_way = list(set(ox.settings.useful_tags_way + cg.way_tags_to_keep)), useful_tags_node = list(set(ox.settings.useful_tags_node + cg.node_tags_to_keep)))

                G = ox.graph_from_point((latitude, longitude), dist=50, network_type="all", retain_all=False, truncate_by_edge=True, simplify=False)

                # graph segmentation (from https://gitlab.limos.fr/jmafavre/crossroads-segmentation/-/blob/master/src/get-crossroad-description.py)

                # remove sidewalks, cycleways, service ways
                G = cs.Segmentation.remove_footways_and_parkings(G, False)
                # build an undirected version of the graph
                G = ox.utils_graph.get_undirected(G)
                # segment it using topology and semantic
                seg = cs.Segmentation(G, C0 = 1, C1 = 2, C2 = 4, max_cycle_elements = 10)
                seg.process()
                seg.to_json("data/intersection.json", longitude, latitude)

                desc = cd.Description()
                desc.computeModel(G, "data/intersection.json", None)
                description = desc.generateDescription()["structure"]
                print(description)

                text = description["general_desc"] + "\n"
                for branch_desc in description["branches_desc"]:
                    text += branch_desc + "\n"
                for crossing_desc in description["crossings_desc"]:
                    text += crossing_desc + "\n"

                # create Pigeon Nelson
                pigeon = PigeonNelson("Crossroads Describer", "Décrire un carrefour proche de sa position", "UTF-8", 0)
                pigeon.setMessage(text, "fr", 1)

                self.send_response(200)
                self.send_header("Content-type", "text/json")
                self.end_headers()
                self.wfile.write(bytes(pigeon.getJson(), "UTF-8"))


if __name__ == "__main__":        
    webServer = HTTPServer(('', process.env.PORT || 8080), PigeonServer)

    try:
        webServer.serve_forever()
    except KeyboardInterrupt:
        pass

    webServer.server_close()
