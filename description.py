import tempfile
import osmnx as ox
import crseg.utils as u
import crseg.segmentation as cs
import crmodel.crmodel as cm
import crmodel.config as cg
import crdesc.crdesc as cd

def generateDescription(pigeon, uid, latitude : float, longitude : float, c0: float, c1: float, c2 : float):  
    G = u.Util.get_osm_data(latitude, longitude, 150, False, cg.way_tags_to_keep, cg.node_tags_to_keep, tempfile.NamedTemporaryFile(mode='w', delete=False, suffix=".xml", dir="cache/"+uid))

    # graph segmentation (from https://gitlab.limos.fr/jmafavre/crossroads-segmentation/-/blob/master/src/get-crossroad-description.py)

    # remove sidewalks, cycleways, service ways
    G = cs.Segmentation.prepare_network(G)
    # segment it using topology and semantic
    seg = cs.Segmentation(ox.utils_graph.get_undirected(G), C0 = c0, C1 = c1, C2 = c2, max_cycle_elements = 10)
    seg.process()
    seg.to_json("cache/"+uid+"/intersection.json", longitude, latitude)

    model = cm.CrModel()
    model.computeModel(G, "cache/"+uid+"/intersection.json")

    with open("cache/"+uid+"/model.json", "w") as f:
        f.write(model.getJSON())
        f.close()

    with open("cache/"+uid+"/model.geojson", "w") as f:
        f.write(model.getGeoJSON())
        f.close()

    desc = cd.CrDesc()
    desc.loadModel("cache/"+uid+"/model.json")
    description = desc.generateDescription()["structure"]

    text = description["general_desc"] + "\n"
    for branch_desc in description["branches_desc"]:
        text += branch_desc + "\n"
    for crossing_desc in description["crossings_desc"]:
        text += crossing_desc + "\n"

    # create Pigeon Nelson
    pigeon.setMessage(text, "fr", 1)
    pigeon.setGeoJson(desc.getGeoJSON("cache/"+uid+"/model.geojson", description))