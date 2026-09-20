import httpx

headers = {"User-Agent": "SkyGuardX-DecisionIntelligence/1.0 (space-earth-decision-prototype; contact@skyguardx.org)"}
query = """[out:json][timeout:15];
(
  node["amenity"="hospital"](34.02,-118.63,34.10,-118.47);
  way["amenity"="hospital"](34.02,-118.63,34.10,-118.47);
);
out geom;"""

r = httpx.post("https://overpass-api.de/api/interpreter", data={"data": query}, headers=headers, timeout=20.0)
print("Status:", r.status_code)
data = r.json()
elements = data.get("elements", [])
print(f"Elements found: {len(elements)}")
for el in elements[:3]:
    print(el.get("type"), el.get("id"), el.get("tags", {}).get("name"))
