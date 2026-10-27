import os
import logging
from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
from gdelt import fetch_events, get_country_stats, GDELT_EVENT_TYPES, fetch_naval_events
from aircraft import fetch_aircraft
from markets import fetch_markets

FRONTEND = os.path.join(os.path.dirname(__file__), '..', 'frontend')

app = Flask(__name__, static_folder=FRONTEND, static_url_path='')
CORS(app)
log = logging.getLogger('arcwatch')


def upstream_error(source):
    """Log the real failure server-side; give the browser a generic message.
    Upstream exception text can contain request URLs, and some upstream APIs
    take credentials in the query string."""
    log.exception('%s request failed', source)
    return jsonify({'error': f'{source} is unavailable right now'}), 502


@app.route('/')
def index():
    return send_from_directory(FRONTEND, 'index.html')


@app.route('/api/health')
def health():
    return jsonify({'status': 'ok', 'source': 'GDELT'})


@app.route('/api/events')
def events():
    days           = max(1, min(request.args.get('days',  7,    type=int), 365))
    limit          = max(1, min(request.args.get('limit', 5000, type=int), 10000))
    event_types_raw = request.args.get('event_types', '')
    country        = request.args.get('country', None)
    event_types    = [e.strip() for e in event_types_raw.split(',') if e.strip()] or None
    try:
        return jsonify(fetch_events(days=days, event_types=event_types, limit=limit, country=country))
    except RuntimeError:
        return upstream_error('Event data')


@app.route('/api/event-types')
def event_types():
    return jsonify(GDELT_EVENT_TYPES)


@app.route('/api/country-stats')
def country_stats():
    days = max(1, min(request.args.get('days', 30, type=int), 365))
    try:
        return jsonify(get_country_stats(days=days))
    except RuntimeError:
        return upstream_error('Country stats')


@app.route('/api/naval')
def naval():
    days = max(1, min(request.args.get('days', 7, type=int), 30))
    try:
        return jsonify(fetch_naval_events(days=days))
    except RuntimeError:
        return upstream_error('Naval data')


@app.route('/api/aircraft')
def aircraft():
    military_only = request.args.get('military', 'false').lower() == 'true'
    try:
        return jsonify(fetch_aircraft(military_only=military_only))
    except RuntimeError:
        return upstream_error('Aircraft data')


@app.route('/api/markets')
def markets():
    try:
        return jsonify(fetch_markets())
    except Exception:
        return upstream_error('Market data')


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5050))
    app.run(host='0.0.0.0', port=port, debug=False)
