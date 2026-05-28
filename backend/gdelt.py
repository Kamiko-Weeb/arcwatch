"""
GDELT 1.0 conflict event fetcher.
Downloads daily export CSVs from data.gdeltproject.org — no API key needed.
Files are tab-separated with 58 columns (GDELT codebook v1).
"""

import os, csv, io, zipfile, json, requests
from datetime import datetime, timedelta

GDELT_BASE = 'http://data.gdeltproject.org/events'
CACHE_DIR  = os.path.join(os.path.dirname(__file__), '.gdelt_cache')
os.makedirs(CACHE_DIR, exist_ok=True)

# CAMEO EventRootCode → friendly label
CAMEO_TYPE = {
    '14': 'Protests',
    '15': 'Military Activity',
    '17': 'Coercion',
    '18': 'Violence against civilians',
    '19': 'Battles',
    '20': 'Explosions/Remote violence',
}

EVENT_TYPE_COLORS = {
    'Battles':                    '#e74c3c',
    'Explosions/Remote violence': '#e67e22',
    'Violence against civilians': '#9b59b6',
    'Protests':                   '#3498db',
    'Military Activity':          '#f39c12',
    'Coercion':                   '#1abc9c',
}
DEFAULT_COLOR = '#95a5a6'

# GDELT 1.0 column indices (0-based)
C_DATE       = 1
C_ACTOR1     = 6
C_ACTOR2     = 16
C_EVTROOT    = 28   # 1–2 digit CAMEO root code
C_QUAD       = 29   # 1=VerbalCoop 2=MatCoop 3=VerbalConfl 4=MatConfl
C_GOLDSTEIN  = 30
C_MENTIONS   = 31
C_AVGTONE    = 34
C_GEO_FULL   = 50   # "Kyiv, Ukraine"
C_GEO_CC     = 51   # FIPS country code
C_GEO_ADM1   = 52
C_GEO_LAT    = 53
C_GEO_LON    = 54
C_URL        = 57

CONFLICT_ROOTS = set(CAMEO_TYPE.keys())   # 14 15 17 18 19 20


# ── per-day fetch & cache ────────────────────────────────────────

def _cache_path(ds):
    return os.path.join(CACHE_DIR, f'{ds}.json')


def _fetch_day(date_str):
    """Download + filter one GDELT daily file. Returns list of row dicts."""
    cache = _cache_path(date_str)
    if os.path.exists(cache):
        with open(cache) as f:
            return json.load(f)

    url = f'{GDELT_BASE}/{date_str}.export.CSV.zip'
    try:
        resp = requests.get(url, timeout=90, stream=True)
        resp.raise_for_status()
        raw = resp.content
    except requests.RequestException as e:
        raise RuntimeError(f'GDELT download failed ({date_str}): {e}')

    rows = []
    with zipfile.ZipFile(io.BytesIO(raw)) as zf:
        name = zf.namelist()[0]
        with zf.open(name) as fh:
            reader = csv.reader(io.TextIOWrapper(fh, encoding='utf-8', errors='replace'),
                                delimiter='\t')
            for row in reader:
                if len(row) < 58:
                    continue

                root = row[C_EVTROOT]
                if root not in CONFLICT_ROOTS:
                    continue

                # material conflict (quad 4) OR protests (root 14)
                quad = row[C_QUAD]
                if quad not in ('3', '4') and root != '14':
                    continue

                try:
                    lat = float(row[C_GEO_LAT])
                    lon = float(row[C_GEO_LON])
                except (ValueError, IndexError):
                    continue
                if lat == 0.0 and lon == 0.0:
                    continue

                try:
                    mentions = int(row[C_MENTIONS])
                except ValueError:
                    mentions = 0
                if mentions < 2:
                    continue

                fullname = row[C_GEO_FULL]
                if ',' in fullname:
                    parts       = [p.strip() for p in fullname.split(',')]
                    country_disp = parts[-1]
                    location     = parts[0]
                else:
                    country_disp = fullname
                    location     = fullname

                rows.append({
                    'id':       row[0],
                    'date':     row[C_DATE],
                    'root':     root,
                    'quad':     quad,
                    'actor1':   row[C_ACTOR1],
                    'actor2':   row[C_ACTOR2],
                    'country':  country_disp,
                    'cc':       row[C_GEO_CC],
                    'location': location,
                    'lat':      lat,
                    'lon':      lon,
                    'mentions': mentions,
                    'goldstein':row[C_GOLDSTEIN],
                    'tone':     row[C_AVGTONE],
                    'url':      row[C_URL],
                })

    # only cache completed past days
    today = datetime.utcnow().strftime('%Y%m%d')
    if date_str != today and rows:
        with open(cache, 'w') as f:
            json.dump(rows, f)

    return rows


# ── public API ───────────────────────────────────────────────────

def fetch_events(days=7, event_types=None, limit=5000, country=None):
    """Return GeoJSON FeatureCollection of conflict events."""
    days = max(1, min(days, 30))

    all_rows = []
    for i in range(1, days + 1):          # yesterday → N days ago
        ds = (datetime.utcnow() - timedelta(days=i)).strftime('%Y%m%d')
        try:
            all_rows.extend(_fetch_day(ds))
        except RuntimeError:
            continue

    # filter by event type
    if event_types:
        type_set = set(event_types)
        all_rows = [r for r in all_rows if CAMEO_TYPE.get(r['root']) in type_set]

    # filter by country (partial, case-insensitive)
    if country:
        cl = country.lower()
        all_rows = [r for r in all_rows if cl in r['country'].lower()]

    # sort: most recent first, then most-mentioned
    all_rows.sort(key=lambda r: (r['date'], r['mentions']), reverse=True)
    all_rows = all_rows[:limit]

    return _to_geojson(all_rows)


def _to_geojson(rows):
    features = []
    for r in rows:
        etype = CAMEO_TYPE.get(r['root'], 'Conflict')
        d     = r['date']
        date_fmt = f"{d[:4]}-{d[4:6]}-{d[6:]}" if len(d) == 8 else d

        try:
            gs = float(r['goldstein'])
        except (ValueError, TypeError):
            gs = 0.0

        features.append({
            'type': 'Feature',
            'geometry': {'type': 'Point', 'coordinates': [r['lon'], r['lat']]},
            'properties': {
                'id':           r['id'],
                'date':         date_fmt,
                'event_type':   etype,
                'sub_event_type': r['root'],
                'actor1':       r['actor1'],
                'actor2':       r['actor2'],
                'country':      r['country'],
                'location':     r['location'],
                'fatalities':   0,
                'mentions':     r['mentions'],
                'goldstein':    gs,
                'avg_tone':     r['tone'],
                'source_url':   r['url'],
                'notes':        '',
                'source':       'GDELT',
                'color':        EVENT_TYPE_COLORS.get(etype, DEFAULT_COLOR),
            },
        })

    total_mentions = sum(f['properties']['mentions'] for f in features)
    return {
        'type': 'FeatureCollection',
        'features': features,
        'metadata': {
            'total_events':    len(features),
            'total_fatalities': 0,
            'total_mentions':  total_mentions,
            'source':          'GDELT',
        },
    }


def get_country_stats(days=7):
    geojson = fetch_events(days=days, limit=100000)
    stats = {}
    for f in geojson['features']:
        p = f['properties']
        c = p['country']
        if not c:
            continue
        if c not in stats:
            stats[c] = {'country': c, 'events': 0, 'fatalities': 0, 'event_types': {}}
        stats[c]['events'] += 1
        et = p['event_type']
        stats[c]['event_types'][et] = stats[c]['event_types'].get(et, 0) + 1
    return sorted(stats.values(), key=lambda x: x['events'], reverse=True)


GDELT_EVENT_TYPES = list(CAMEO_TYPE.values())

# ── Naval events ─────────────────────────────────────────────────
NAVAL_KEYWORDS = {
    'navy','naval','warship','destroyer','carrier','frigate',
    'submarine','corvette','fleet','maritime','coast guard',
    'coastguard','amphibious','minesweeper','cruiser','battleship',
}

def fetch_naval_events(days=7):
    """Return GDELT events with naval/maritime actors as GeoJSON."""
    geojson = fetch_events(days=days, limit=50000)
    naval = []
    for f in geojson['features']:
        p = f['properties']
        combined = (p.get('actor1','') + ' ' + p.get('actor2','')).lower()
        if any(kw in combined for kw in NAVAL_KEYWORDS):
            # override color to teal for naval events
            f['properties']['color']      = '#00aaff'
            f['properties']['event_type'] = 'Naval Activity'
            naval.append(f)

    total_mentions = sum(f['properties']['mentions'] for f in naval)
    return {
        'type': 'FeatureCollection',
        'features': naval,
        'metadata': {
            'total_events':   len(naval),
            'total_mentions': total_mentions,
            'source':         'GDELT',
        },
    }
