import json

class CrWebApi:

    def __init__(self):     
        self.json = []

    def setMessage(self, message):
        self.json.append({
            "txt": message,
        })

    def setGeoJson(self, geojson):
        self.json.append(geojson)

    def getJson(self):
        return json.dumps(self.json, ensure_ascii=False)
