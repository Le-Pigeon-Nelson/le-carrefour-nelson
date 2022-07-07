import requests
import osmnx as ox
import crseg.segmentation as cs
import crdesc.description as cd
import crdesc.config as cg

def generateDescription(pigeon, uid, latitude : float, longitude : float):
    r = requests.get("https://www.openstreetmap.org/api/0.6/map?bbox=%s,%s,%s,%s"%(longitude-0.002,latitude-0.002,longitude+0.002,latitude+0.002), allow_redirects=True)
    open("cache/"+uid+'/osm.xml', 'wb').write(r.content)

    # OSMnx configuration
    ox.settings.osm_xml_way_tags = ox.settings.osm_xml_way_tags + cg.way_tags_to_keep
    ox.settings.useful_tags_way = ox.settings.useful_tags_way + cg.way_tags_to_keep
    ox.settings.osm_xml_node_tags = ox.settings.osm_xml_way_tags + cg.node_tags_to_keep
    ox.settings.useful_tags_node = ox.settings.useful_tags_way + cg.node_tags_to_keep
    
    G = ox.graph_from_xml("cache/"+uid+"/osm.xml", simplify=False)

    # graph segmentation (from https://gitlab.limos.fr/jmafavre/crossroads-segmentation/-/blob/master/src/get-crossroad-description.py)

    # remove sidewalks, cycleways, service ways
    G = cs.Segmentation.prepare_network(G)
    # segment it using topology and semantic
    seg = cs.Segmentation(ox.utils_graph.get_undirected(G), C0 = 2, C1 = 2, C2 = 4, max_cycle_elements = 10)
    seg.process()
    seg.to_json("cache/"+uid+"/intersection.json", longitude, latitude)

    desc = cd.Description()
    desc.computeModel(G, "cache/"+uid+"/intersection.json")
    description = desc.generateDescription()["structure"]

    text = description["general_desc"] + "\n"
    for branch_desc in description["branches_desc"]:
        text += branch_desc + "\n"
    for crossing_desc in description["crossings_desc"]:
        text += crossing_desc + "\n"

    # create Pigeon Nelson
    pigeon.setMessage(text, "fr", 1)
    pigeon.setGeoJson(desc.getGeoJSON(description))