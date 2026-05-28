import os
import requests
from datetime import datetime, timedelta
from dotenv import load_dotenv

load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '..', '.env'))

ACLED_EMAIL = os.getenv('ACLED_EMAIL', '')
# ACLED uses email + API key (not password). Get your key at developer.acleddata.com
ACLED_KEY = os.getenv('ACLED_KEY') or os.getenv('ACLED_PASSWORD', '')

ACLED_BASE_URL = 'https://api.acleddata.com/acled/read'

EVENT_TYPE_COLORS = {
    'Battles': '#e74c3c',
    'Explosions/Remote violence': '#e67e22',
    'Violence against civilians': '#9b59b6',
    'Protests': '#3498db',
    'Riots': '#f39c12',
    'Strategic developments': '#1abc9c',
}

DEFAULT_COLOR = '#95a5a6'

ACLED_EVENT_TYPES = list(EVENT_TYPE_COLORS.keys())


def fetch_events(days=7, event_types=None, limit=5000, country=None):
    """Fetch ACLED conflict events and return as GeoJSON FeatureCollection."""
    end_date = datetime.utcnow()
    start_date = end_date - timedelta(days=days)

    params = {
        'key': ACLED_KEY,
        'email': ACLED_EMAIL,
        'event_date': f"{start_date.strftime('%Y-%m-%d')}|{end_date.strftime('%Y-%m-%d')}",
        'event_date_where': 'BETWEEN',
        'limit': limit,
        'fields': 'event_id_cnty|event_date|event_type|sub_event_type|actor1|actor2|country|admin1|location|latitude|longitude|fatalities|notes|source',
    }

    if event_types:
        # ACLED expects pipe-separated values for multi-value filters
        params['event_type'] = '|'.join(event_types)
        params['event_type_where'] = 'IN'

    if country:
        params['country'] = country

    try:
        resp = requests.get(ACLED_BASE_URL, params=params, timeout=30)
        resp.raise_for_status()
        data = resp.json()
    except requests.exceptions.HTTPError as e:
        raise RuntimeError(f"ACLED API HTTP error: {e}")
    except requests.exceptions.RequestException as e:
        raise RuntimeError(f"ACLED API request failed: {e}")
    except ValueError:
        raise RuntimeError("ACLED API returned invalid JSON")

    if data.get('status') != 200 and 'data' not in data:
        msg = data.get('message', 'Unknown ACLED error')
        raise RuntimeError(f"ACLED API error: {msg}")

    events = data.get('data', [])
    return _to_geojson(events)


def _to_geojson(events):
    features = []
    total_fatalities = 0

    for ev in events:
        try:
            lat = float(ev.get('latitude', 0))
            lon = float(ev.get('longitude', 0))
        except (TypeError, ValueError):
            continue

        if lat == 0 and lon == 0:
            continue

        event_type = ev.get('event_type', 'Unknown')
        fatalities = int(ev.get('fatalities', 0) or 0)
        total_fatalities += fatalities

        features.append({
            'type': 'Feature',
            'geometry': {'type': 'Point', 'coordinates': [lon, lat]},
            'properties': {
                'id': ev.get('event_id_cnty', ''),
                'date': ev.get('event_date', ''),
                'event_type': event_type,
                'sub_event_type': ev.get('sub_event_type', ''),
                'actor1': ev.get('actor1', ''),
                'actor2': ev.get('actor2', ''),
                'country': ev.get('country', ''),
                'admin1': ev.get('admin1', ''),
                'location': ev.get('location', ''),
                'fatalities': fatalities,
                'notes': ev.get('notes', ''),
                'source': ev.get('source', ''),
                'color': EVENT_TYPE_COLORS.get(event_type, DEFAULT_COLOR),
            },
        })

    return {
        'type': 'FeatureCollection',
        'features': features,
        'metadata': {
            'total_events': len(features),
            'total_fatalities': total_fatalities,
        },
    }


def get_country_stats(days=30):
    """Return per-country aggregated stats."""
    geojson = fetch_events(days=days, limit=10000)
    stats = {}
    for f in geojson['features']:
        p = f['properties']
        c = p['country']
        if c not in stats:
            stats[c] = {'country': c, 'events': 0, 'fatalities': 0, 'event_types': {}}
        stats[c]['events'] += 1
        stats[c]['fatalities'] += p['fatalities']
        et = p['event_type']
        stats[c]['event_types'][et] = stats[c]['event_types'].get(et, 0) + 1

    return sorted(stats.values(), key=lambda x: x['events'], reverse=True)
