"""
Market data relevant to global conflict monitoring.
Uses Yahoo Finance's free public chart API — no key required.
"""

import requests

HEADERS = {'User-Agent': 'Mozilla/5.0'}

SYMBOLS = [
    {'name': 'Gold',    'symbol': 'GC=F',    'unit': '$/oz'},
    {'name': 'Oil WTI', 'symbol': 'CL=F',    'unit': '$/bbl'},
    {'name': 'EUR/USD', 'symbol': 'EURUSD=X', 'unit': ''},
    {'name': 'VIX',     'symbol': '^VIX',    'unit': ''},
    {'name': 'Defense', 'symbol': 'ITA',      'unit': 'ETF'},
    {'name': 'USD/UAH', 'symbol': 'USDUAH=X', 'unit': ''},
]

def fetch_markets():
    results = []
    for item in SYMBOLS:
        try:
            url  = f'https://query1.finance.yahoo.com/v8/finance/chart/{item["symbol"]}?interval=1d&range=2d'
            resp = requests.get(url, timeout=6, headers=HEADERS)
            resp.raise_for_status()
            meta   = resp.json()['chart']['result'][0]['meta']
            price  = meta.get('regularMarketPrice') or meta.get('previousClose', 0)
            prev   = meta.get('chartPreviousClose') or price
            change = round((price - prev) / prev * 100, 2) if prev else 0.0
            results.append({
                'name':   item['name'],
                'symbol': item['symbol'],
                'unit':   item['unit'],
                'price':  round(price, 2),
                'change': change,
            })
        except Exception:
            results.append({
                'name': item['name'], 'symbol': item['symbol'],
                'unit': item['unit'], 'price': None, 'change': None,
            })
    return results
