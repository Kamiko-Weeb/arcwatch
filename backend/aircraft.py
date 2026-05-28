"""
Military aircraft tracker via ADSB.LOL — free, no API key needed.
/v2/mil returns military-flagged aircraft only.
"""

import requests

ADSBLOL_URL = 'https://api.adsb.lol/v2/mil'

# Rough aircraft category from ICAO type code
def classify(t):
    t = (t or '').upper()
    fighters   = {'F16','F15','F18','F22','F35','F14','F5','MIG','SU2','SU3','SU5','SU7','JF17','EURO','GRIF','TYPHO','RAFAL'}
    bombers    = {'B52','B1','B2','TU95','TU22','TU16','B21'}
    transport  = {'C17','C130','C5','C141','IL76','A400','C160','KC10','KC135','KC46'}
    recon      = {'U2','SR71','RQ4','MQ9','MQ1','P8','RC135','EP3','E3','E8','AWAC'}
    helicopter = {'H60','HH60','UH60','CH47','AH64','MH60','V22','H53'}

    if any(t.startswith(p) for p in fighters):   return 'Fighter'
    if any(t.startswith(p) for p in bombers):    return 'Bomber'
    if any(t.startswith(p) for p in transport):  return 'Transport'
    if any(t.startswith(p) for p in recon):      return 'Recon/ISR'
    if any(t.startswith(p) for p in helicopter): return 'Helicopter'
    return 'Military'

CATEGORY_COLORS = {
    'Fighter':    '#ff3333',
    'Bomber':     '#ff6600',
    'Transport':  '#ffcc00',
    'Recon/ISR':  '#00ccff',
    'Helicopter': '#cc44ff',
    'Military':   '#ff8800',
}

def fetch_aircraft(military_only=True):
    try:
        resp = requests.get(ADSBLOL_URL, timeout=15,
                            headers={'User-Agent': 'ArcWatch/1.0'})
        resp.raise_for_status()
        data = resp.json()
    except Exception as e:
        raise RuntimeError(f'ADSB.LOL error: {e}')

    aircraft_list = data.get('ac', [])
    features = []

    for ac in aircraft_list:
        lat = ac.get('lat')
        lon = ac.get('lon')
        if lat is None or lon is None:
            continue

        callsign = (ac.get('flight') or '').strip()
        ac_type  = (ac.get('t') or ac.get('type') or '').upper()
        cat      = classify(ac_type)
        alt      = ac.get('alt_baro') or ac.get('alt_geom') or 0
        speed    = round(ac.get('gs') or 0)
        heading  = round(ac.get('track') or 0)

        features.append({
            'type': 'Feature',
            'geometry': {'type': 'Point', 'coordinates': [lon, lat]},
            'properties': {
                'icao':     ac.get('hex', ''),
                'callsign': callsign,
                'type':     ac_type,
                'category': cat,
                'color':    CATEGORY_COLORS[cat],
                'reg':      ac.get('r', ''),
                'altitude': int(alt) if isinstance(alt, (int, float)) else 0,
                'speed':    speed,
                'heading':  heading,
                'squawk':   ac.get('squawk', ''),
                'military': True,
            },
        })

    return {
        'type': 'FeatureCollection',
        'features': features,
        'metadata': {
            'total':  len(features),
            'source': 'ADSB.LOL',
        },
    }
