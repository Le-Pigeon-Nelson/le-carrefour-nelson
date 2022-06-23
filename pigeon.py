import json

class PigeonNelson:

    def __init__(self, name, description, encoding, period):     
        self.json = [
            {
                "name": name,
                "description": description,
                "encoding": encoding,
                "period": period
            }
        ]
        self.init = self.json

    def clear(self):
        self.json = self.init

    def setMessage(self, message, language, priority):
        self.json.append({
            "txt": message,
            "lang": language,
            "priority": priority
        })

    def getJson(self):
        return json.dumps(self.json, ensure_ascii=False)
