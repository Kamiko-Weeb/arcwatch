/* ── ArcWatch map.js ─────────────────────────────────────────── */

const API = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://localhost:5050/api'
  : 'https://arcwatch-backend.up.railway.app/api'; // update after Railway deploy

/* Event colours — kept in sync with CSS data-colour tokens */
const EVENT_COLORS = {
  'Battles':                    '#e03535',  /* --c-battles   */
  'Explosions/Remote violence': '#d97706',  /* --c-explosion */
  'Violence against civilians': '#9333ea',  /* --c-violence  */
  'Protests':                   '#2563eb',  /* --c-protests  */
  'Military Activity':          '#b45309',  /* --c-military  */
  'Coercion':                   '#0891b2',  /* --c-coercion  */
};
const DEFAULT_COLOR = '#6b7280';  /* neutral grey for unknown types */

const AIRCRAFT_CATEGORY_COLORS = {
  'Fighter':    '#ff3333',
  'Bomber':     '#ff6600',
  'Transport':  '#ffcc00',
  'Recon/ISR':  '#00ccff',
  'Helicopter': '#cc44ff',
  'Military':   '#ff8800',
};

/* ISO 3166-1 numeric → {a2, n?}
   'a2' = alpha-2 code (for flag emoji)
   'n'  = display name override (only needed when GeoJSON stores numeric ID as name) */
const ISO = {
  '004':{a2:'AF',n:'Afghanistan'},'008':{a2:'AL',n:'Albania'},'010':{a2:'AQ',n:'Antarctica'},
  '012':{a2:'DZ',n:'Algeria'},'020':{a2:'AD',n:'Andorra'},'024':{a2:'AO',n:'Angola'},
  '028':{a2:'AG',n:'Antigua & Barbuda'},'031':{a2:'AZ',n:'Azerbaijan'},
  '032':{a2:'AR',n:'Argentina'},'036':{a2:'AU',n:'Australia'},'040':{a2:'AT',n:'Austria'},
  '044':{a2:'BS',n:'Bahamas'},'048':{a2:'BH',n:'Bahrain'},'050':{a2:'BD',n:'Bangladesh'},
  '051':{a2:'AM',n:'Armenia'},'052':{a2:'BB',n:'Barbados'},'056':{a2:'BE',n:'Belgium'},
  '064':{a2:'BT',n:'Bhutan'},'068':{a2:'BO',n:'Bolivia'},'070':{a2:'BA',n:'Bosnia & Herz.'},
  '072':{a2:'BW',n:'Botswana'},'076':{a2:'BR',n:'Brazil'},'084':{a2:'BZ',n:'Belize'},
  '090':{a2:'SB',n:'Solomon Islands'},'096':{a2:'BN',n:'Brunei'},'100':{a2:'BG',n:'Bulgaria'},
  '104':{a2:'MM',n:'Myanmar'},'108':{a2:'BI',n:'Burundi'},'116':{a2:'KH',n:'Cambodia'},
  '120':{a2:'CM',n:'Cameroon'},'124':{a2:'CA',n:'Canada'},'132':{a2:'CV',n:'Cabo Verde'},
  '140':{a2:'CF',n:'Cent. African Rep.'},'144':{a2:'LK',n:'Sri Lanka'},
  '148':{a2:'TD',n:'Chad'},'152':{a2:'CL',n:'Chile'},'156':{a2:'CN',n:'China'},
  '158':{a2:'TW',n:'Taiwan'},'170':{a2:'CO',n:'Colombia'},'174':{a2:'KM',n:'Comoros'},
  '180':{a2:'CD',n:'DR Congo'},'188':{a2:'CR',n:'Costa Rica'},'191':{a2:'HR',n:'Croatia'},
  '192':{a2:'CU',n:'Cuba'},'196':{a2:'CY',n:'Cyprus'},'203':{a2:'CZ',n:'Czech Republic'},
  '204':{a2:'BJ',n:'Benin'},'208':{a2:'DK',n:'Denmark'},'214':{a2:'DO',n:'Dominican Rep.'},
  '218':{a2:'EC',n:'Ecuador'},'818':{a2:'EG',n:'Egypt'},'222':{a2:'SV',n:'El Salvador'},
  '226':{a2:'GQ',n:'Equatorial Guinea'},'232':{a2:'ER',n:'Eritrea'},
  '233':{a2:'EE',n:'Estonia'},'238':{a2:'FK',n:'Falkland Islands'},
  '242':{a2:'FJ',n:'Fiji'},'246':{a2:'FI',n:'Finland'},'250':{a2:'FR',n:'France'},
  '258':{a2:'PF',n:'Fr. Polynesia'},'260':{a2:'TF',n:'Fr. S. Territories'},
  '262':{a2:'DJ',n:'Djibouti'},'266':{a2:'GA',n:'Gabon'},'268':{a2:'GE',n:'Georgia'},
  '270':{a2:'GM',n:'Gambia'},'275':{a2:'PS',n:'Palestine'},'276':{a2:'DE',n:'Germany'},
  '288':{a2:'GH',n:'Ghana'},'300':{a2:'GR',n:'Greece'},'304':{a2:'GL',n:'Greenland'},
  '308':{a2:'GD',n:'Grenada'},'320':{a2:'GT',n:'Guatemala'},'324':{a2:'GN',n:'Guinea'},
  '328':{a2:'GY',n:'Guyana'},'332':{a2:'HT',n:'Haiti'},'340':{a2:'HN',n:'Honduras'},
  '348':{a2:'HU',n:'Hungary'},'352':{a2:'IS',n:'Iceland'},'356':{a2:'IN',n:'India'},
  '360':{a2:'ID',n:'Indonesia'},'364':{a2:'IR',n:'Iran'},'368':{a2:'IQ',n:'Iraq'},
  '372':{a2:'IE',n:'Ireland'},'376':{a2:'IL',n:'Israel'},'380':{a2:'IT',n:'Italy'},
  '384':{a2:'CI',n:'Ivory Coast'},'388':{a2:'JM',n:'Jamaica'},'392':{a2:'JP',n:'Japan'},
  '398':{a2:'KZ',n:'Kazakhstan'},'400':{a2:'JO',n:'Jordan'},'404':{a2:'KE',n:'Kenya'},
  '408':{a2:'KP',n:'North Korea'},'410':{a2:'KR',n:'South Korea'},
  '414':{a2:'KW',n:'Kuwait'},'417':{a2:'KG',n:'Kyrgyzstan'},'418':{a2:'LA',n:'Laos'},
  '422':{a2:'LB',n:'Lebanon'},'426':{a2:'LS',n:'Lesotho'},'428':{a2:'LV',n:'Latvia'},
  '430':{a2:'LR',n:'Liberia'},'434':{a2:'LY',n:'Libya'},'440':{a2:'LT',n:'Lithuania'},
  '442':{a2:'LU',n:'Luxembourg'},'450':{a2:'MG',n:'Madagascar'},'454':{a2:'MW',n:'Malawi'},
  '458':{a2:'MY',n:'Malaysia'},'466':{a2:'ML',n:'Mali'},'478':{a2:'MR',n:'Mauritania'},
  '484':{a2:'MX',n:'Mexico'},'496':{a2:'MN',n:'Mongolia'},'498':{a2:'MD',n:'Moldova'},
  '499':{a2:'ME',n:'Montenegro'},'504':{a2:'MA',n:'Morocco'},'508':{a2:'MZ',n:'Mozambique'},
  '516':{a2:'NA',n:'Namibia'},'524':{a2:'NP',n:'Nepal'},'528':{a2:'NL',n:'Netherlands'},
  '540':{a2:'NC',n:'New Caledonia'},'554':{a2:'NZ',n:'New Zealand'},
  '558':{a2:'NI',n:'Nicaragua'},'562':{a2:'NE',n:'Niger'},'566':{a2:'NG',n:'Nigeria'},
  '578':{a2:'NO',n:'Norway'},'586':{a2:'PK',n:'Pakistan'},'591':{a2:'PA',n:'Panama'},
  '598':{a2:'PG',n:'Papua New Guinea'},'600':{a2:'PY',n:'Paraguay'},
  '604':{a2:'PE',n:'Peru'},'608':{a2:'PH',n:'Philippines'},'616':{a2:'PL',n:'Poland'},
  '620':{a2:'PT',n:'Portugal'},'624':{a2:'GW',n:'Guinea-Bissau'},
  '626':{a2:'TL',n:'Timor-Leste'},'634':{a2:'QA',n:'Qatar'},'642':{a2:'RO',n:'Romania'},
  '643':{a2:'RU',n:'Russia'},'646':{a2:'RW',n:'Rwanda'},'682':{a2:'SA',n:'Saudi Arabia'},
  '686':{a2:'SN',n:'Senegal'},'694':{a2:'SL',n:'Sierra Leone'},'703':{a2:'SK',n:'Slovakia'},
  '704':{a2:'VN',n:'Vietnam'},'706':{a2:'SO',n:'Somalia'},'710':{a2:'ZA',n:'South Africa'},
  '716':{a2:'ZW',n:'Zimbabwe'},'724':{a2:'ES',n:'Spain'},'728':{a2:'SS',n:'South Sudan'},
  '729':{a2:'SD',n:'Sudan'},'732':{a2:'EH',n:'W. Sahara'},'740':{a2:'SR',n:'Suriname'},
  '748':{a2:'SZ',n:'Eswatini'},'752':{a2:'SE',n:'Sweden'},'756':{a2:'CH',n:'Switzerland'},
  '760':{a2:'SY',n:'Syria'},'762':{a2:'TJ',n:'Tajikistan'},'764':{a2:'TH',n:'Thailand'},
  '768':{a2:'TG',n:'Togo'},'780':{a2:'TT',n:'Trinidad & Tobago'},'788':{a2:'TN',n:'Tunisia'},
  '792':{a2:'TR',n:'Turkey'},'800':{a2:'UG',n:'Uganda'},'804':{a2:'UA',n:'Ukraine'},
  '784':{a2:'AE',n:'UAE'},'826':{a2:'GB',n:'United Kingdom'},'834':{a2:'TZ',n:'Tanzania'},
  '840':{a2:'US',n:'United States'},'854':{a2:'BF',n:'Burkina Faso'},
  '858':{a2:'UY',n:'Uruguay'},'860':{a2:'UZ',n:'Uzbekistan'},'862':{a2:'VE',n:'Venezuela'},
  '887':{a2:'YE',n:'Yemen'},'894':{a2:'ZM',n:'Zambia'},
  // entries where GeoJSON already has proper name but we still need alpha-2 for flag
  '112':{a2:'BY',n:'Belarus'},'178':{a2:'CG',n:'Congo'},'231':{a2:'ET',n:'Ethiopia'},
  '512':{a2:'OM',n:'Oman'},'548':{a2:'VU',n:'Vanuatu'},'630':{a2:'PR',n:'Puerto Rico'},
  '688':{a2:'RS',n:'Serbia'},'705':{a2:'SI',n:'Slovenia'},'795':{a2:'TM',n:'Turkmenistan'},
  '807':{a2:'MK',n:'North Macedonia'},
};
// Countries to skip labelling (uninhabited / tiny / special territories)
const SKIP_LABELS = new Set(['AQ','TF','FK','GS','SJ','BV','HM','UM','EH','NC','GL','PF']);

/* ── Label tier system ────────────────────────────────────────
   Tier 1: Global powers — always visible, largest text
   Tier 2: Regional powers — visible until far zoom
   Tier 3: Everything else — only visible when zoomed in      */
const LABEL_TIER1 = new Set([
  'United States','Russia','China','India','Brazil',
  'United Kingdom','France','Germany',
]);
const LABEL_TIER2 = new Set([
  'Ukraine','Iran','Iraq','Israel','Saudi Arabia','Pakistan','Turkey',
  'Japan','South Korea','North Korea','Egypt','Ethiopia','Nigeria',
  'South Africa','Mexico','Indonesia','Syria','Libya','Somalia',
  'Sudan','South Sudan','Yemen','Venezuela','Afghanistan','Algeria',
  'Morocco','Canada','Australia','Poland','Taiwan','Kazakhstan',
  'Myanmar','Colombia','Argentina','Romania','Serbia',
]);

function isoFlag(a2) {
  if (!a2 || a2.length !== 2) return '🌐';
  return [...a2.toUpperCase()].map(c =>
    String.fromCodePoint(c.charCodeAt(0) - 65 + 0x1F1E6)).join('');
}

function getGeoCentroid(geometry) {
  let ring;
  if (geometry.type === 'Polygon') {
    ring = geometry.coordinates[0];
  } else if (geometry.type === 'MultiPolygon') {
    ring = geometry.coordinates.map(p => p[0]).reduce((a,b) => a.length > b.length ? a : b);
  } else return null;
  if (!ring?.length) return null;
  let x = 0, y = 0;
  ring.forEach(([lng,lat]) => { x += lng; y += lat; });
  return [x / ring.length, y / ring.length];
}

/* Cluster conflict features into grid cells (reduces overlap, creates spike groups) */
function clusterFeatures(features, gridDeg = 1.5) {
  const cells = {};
  features.forEach(f => {
    const [lng, lat] = f.geometry.coordinates;
    const clat = Math.round(lat / gridDeg) * gridDeg;
    const clng = Math.round(lng / gridDeg) * gridDeg;
    const key  = `${clat},${clng}`;
    if (!cells[key]) cells[key] = { lat:clat, lng:clng, count:0, totalMentions:0, features:[], typeCount:{} };
    const c = cells[key];
    c.count++;
    c.totalMentions += f.properties.mentions || 0;
    c.features.push(f);
    const et = f.properties.event_type || 'Conflict';
    c.typeCount[et] = (c.typeCount[et] || 0) + 1;
  });
  return Object.values(cells).map(c => {
    c.dominant   = Object.entries(c.typeCount).sort((a,b)=>b[1]-a[1])[0]?.[0] || 'Conflict';
    c.topFeature = c.features.reduce((best, f) =>
      (f.properties.mentions||0) > (best.properties.mentions||0) ? f : best);
    return c;
  });
}

const GLOBE_TEXTURES = {
  dark:      'textures/earth-gray.jpg',
  satellite: 'textures/earth-blue-marble.jpg',
};

function colorFor(t) { return EVENT_COLORS[t] || DEFAULT_COLOR; }

/* Compact number display: 7286 → "7.3k", 1200000 → "1.2M" */
function fmtK(n) {
  if (n >= 1e6) return (n/1e6).toFixed(1).replace(/\.0$/,'') + 'M';
  if (n >= 1e3) return (n/1e3).toFixed(1).replace(/\.0$/,'') + 'k';
  return String(n);
}

function severity(p) {
  const gs = p.goldstein || 0, m = p.mentions || 0;
  if (gs <= -7 || m > 400) return 'HIGH';
  if (gs <= -3 || m > 80)  return 'MEDIUM';
  return 'LOW';
}

function gsColor(gs) {
  if (!gs) return 'var(--text-3)';
  if (gs <= -7) return 'var(--red)';
  if (gs <= -3) return 'var(--c-explosion)';
  if (gs >= 5)  return 'var(--green-t)';
  return 'var(--text-3)';
}

/* Minimum mentions to show on map & feed — filters noise from raw GDELT stream */
const SIGNIFICANCE_THRESHOLD = 50;

/* Title-case a GDELT actor string (e.g. "UNITED KINGDOM" → "United Kingdom") */
function toTitle(s) {
  if (!s) return '';
  return s.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
}

/* Generate a one-sentence narrative summary from GDELT structured fields */
function buildSummary(p) {
  const loc  = (p.location && p.location !== p.country)
               ? `${toTitle(p.location)}, ${p.country}`
               : p.country || 'unknown location';
  const a1   = toTitle(p.actor1);
  const a2   = toTitle(p.actor2);
  const gs   = parseFloat(p.goldstein || 0);
  const m    = p.mentions || 0;

  const templates = {
    'Battles': () =>
      `${a1 || 'Armed forces'}${a2 ? ` clashing with ${a2}` : ' engaged in combat operations'} in ${loc}.`,
    'Explosions/Remote violence': () =>
      `${a1 ? a1 + ' carried out' : 'Explosive or remote violence'} attacks reported in ${loc}.`,
    'Violence against civilians': () =>
      `Civilian harm${a1 ? ` attributed to ${a1}` : ''}${a2 ? ` targeting ${a2}` : ''} in ${loc}.`,
    'Protests': () =>
      `${a1 || 'Demonstrators'}${a2 ? ` protesting against ${a2}` : ' staging demonstrations'} in ${loc}.`,
    'Military Activity': () =>
      `${a1 || 'Military forces'} conducting operations${a2 ? ` involving ${a2}` : ''} near ${loc}.`,
    'Coercion': () =>
      `${a1 || 'State actors'}${a2 ? ` applying pressure on ${a2}` : ' employing coercive measures'} in ${loc}.`,
  };

  const fn = templates[p.event_type];
  let text = fn ? fn() : `${p.event_type || 'Conflict'} event reported in ${loc}.`;

  if (m >= 200)      text += ` Major international coverage — ${m} sources.`;
  else if (m >= 50)  text += ` Significant media attention: ${m} sources.`;
  else               text += ` Reported across ${m} news sources.`;

  if (gs <= -8)     text += ' Classified as highly destabilizing.';
  else if (gs <= -4) text += ' Conflict severity assessed as high.';

  return text;
}

/* ── State ──────────────────────────────────────────────────── */
let globe, allFeatures = [], aircraftFeatures = [], navalFeatures = [], activeId = null, sevFilter = '';
let countriesGeoJSON = null, countryLabelData = [];

/* ── Backface visibility — returns true if lat/lng faces the camera ── */
function isFacingCamera(lat, lng) {
  if (!globe) return true;
  const cam = globe.camera();
  if (!cam) return true;
  // Convert lat/lng → unit vector on globe surface
  const phi   = (90 - lat)  * Math.PI / 180;
  const theta = (lng + 180) * Math.PI / 180;
  const px = -Math.sin(phi) * Math.cos(theta);
  const py =  Math.cos(phi);
  const pz =  Math.sin(phi) * Math.sin(theta);
  // Camera unit vector (points toward globe centre)
  const cl = Math.sqrt(cam.position.x**2 + cam.position.y**2 + cam.position.z**2);
  const cx = cam.position.x / cl;
  const cy = cam.position.y / cl;
  const cz = cam.position.z / cl;
  // Visible if dot product > threshold (0.0 = exactly on limb)
  return (px*cx + py*cy + pz*cz) > 0.08;
}

/* Throttled re-render for camera movement */
let _htmlFramePending = false;
function scheduleHtmlLayer() {
  if (_htmlFramePending) return;
  _htmlFramePending = true;
  requestAnimationFrame(() => { _htmlFramePending = false; renderHtmlLayer(); });
}

/* Current zoom factor: 0 = fully zoomed in, 1 = fully zoomed out */
function getZoomT() {
  if (!globe) return 0;
  const cam = globe.camera();
  if (!cam) return 0;
  const dist = Math.sqrt(cam.position.x**2 + cam.position.y**2 + cam.position.z**2);
  return Math.max(0, Math.min(1, (dist - 108) / (650 - 108)));
}

/* Per-label visual props based on tier + zoom.
   Returns {size, opacity} or null if the label should be hidden.
   Thresholds are intentionally aggressive — negative space is a feature. */
function labelProps(displayName, t) {
  if (LABEL_TIER1.has(displayName)) {
    // Always visible; 10→7.5px, opacity 0.62→0.46
    return {
      size:    +(10.0 - t * 2.5).toFixed(1),
      opacity: +(0.62 - t * 0.16).toFixed(2),
    };
  }
  if (LABEL_TIER2.has(displayName)) {
    // Hide at far zoom (t > 0.65); 8.0→6.0px, opacity 0.46→0.28
    if (t > 0.65) return null;
    return {
      size:    +(8.0 - t * 2.0).toFixed(1),
      opacity: +(0.46 - t * 0.18).toFixed(2),
    };
  }
  // Tier 3 — only close zoom (t ≤ 0.35); 7.0→5.8px, opacity 0.34→0.26
  if (t > 0.35) return null;
  return {
    size:    +(7.0 - t * 0.6).toFixed(1),
    opacity: +(0.34 - t * 0.06).toFixed(2),
  };
}

/* Classify a conflict cluster into primary / secondary / tertiary
   based on total mentions — drives badge size, glow, and zoom visibility */
function clusterTier(c) {
  if (c.totalMentions >= 500 || c.count >= 12) return 'primary';
  if (c.totalMentions >= 160 || c.count >= 5)  return 'secondary';
  return 'tertiary';
}

/* ── DOM refs ───────────────────────────────────────────────── */
const $ = id => document.getElementById(id);
const loadingEl   = $('loading-overlay');
const loadingMsg  = $('loading-msg');
const feedList    = $('feed-list');
const feedCount   = $('feed-count');
const feedSearch  = $('feed-search');
const detailOverlay  = $('detail-overlay');
const detailContent  = $('detail-content');
const statActive     = $('stat-active');
const statTensions   = $('stat-tensions');
const statAircraft   = $('stat-aircraft');
const statEvents     = $('stat-events');
const statCountries  = $('stat-countries');
const daysSelect     = $('days-select');
const typeSelect     = $('type-select');
const keywordList    = $('keyword-list');
const countryListEl  = $('country-list');
const typeBreakdown  = $('type-breakdown');
const tickerInner    = $('ticker-inner');
const liveViewers    = $('live-viewers');
const suggestionsEl  = $('country-suggestions');
const feedRefresh    = $('feed-refresh');
const errorToast     = $('error-toast');
const marketsGrid    = $('markets-grid');
const aircraftHstat  = $('aircraft-hstat');

/* ── Globe init ─────────────────────────────────────────────── */
function initGlobe() {
  const container = $('globe-container');

  globe = Globe({ animateIn: true })
    .globeImageUrl(GLOBE_TEXTURES.dark)
    .backgroundImageUrl('textures/night-sky.png')
    .atmosphereColor('#000000')
    .atmosphereAltitude(0.04)
    .width(container.offsetWidth)
    .height(container.offsetHeight)
    (container);

  // Apply cinematic canvas filter after WebGL canvas is created
  const applyCanvasFilter = (mode = 'dark') => {
    const canvas = container.querySelector('canvas');
    if (!canvas) return;
    canvas.classList.toggle('sat-mode', mode === 'satellite');
  };
  // Retry — canvas may not exist synchronously
  requestAnimationFrame(() => applyCanvasFilter('dark'));
  setTimeout(() => applyCanvasFilter('dark'), 300);

  const ctrl = globe.controls();
  ctrl.autoRotate      = false;
  ctrl.autoRotateSpeed = 0.22;
  ctrl.enableDamping   = true;
  ctrl.dampingFactor   = 0.08;   // slightly more inertia than default 0.1
  ctrl.zoomSpeed       = 0.30;   // tighter, more deliberate zoom
  ctrl.rotateSpeed     = 0.45;
  ctrl.maxDistance     = 650;    // prevent globe shrinking to a dot
  ctrl.minDistance     = 108;    // keep slight clearance from surface

  container.addEventListener('pointerdown', () => { ctrl.autoRotate = false; });
  container.addEventListener('pointerup', () => {
    // Only resume rotation if user has the Rotate toggle ON
    if ($('tog-rotate')?.checked) setTimeout(() => { ctrl.autoRotate = true; }, 2200);
  });

  // Re-cull labels on every camera move (throttled to one rAF per frame)
  ctrl.addEventListener('change', scheduleHtmlLayer);

  window.addEventListener('resize', () => {
    globe.width(container.offsetWidth).height(container.offsetHeight);
  });

  // View mode buttons
  $('view-btns').addEventListener('click', e => {
    const btn = e.target.closest('.view-btn');
    if (!btn) return;
    document.querySelectorAll('.view-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const mode = btn.dataset.view;
    globe.globeImageUrl(GLOBE_TEXTURES[mode]);
    globe.atmosphereColor('#000000');
    // Switch canvas filter
    const canvas = container.querySelector('canvas');
    if (canvas) canvas.classList.toggle('sat-mode', mode === 'satellite');
  });

  // Layer toggles
  $('tog-rotate').addEventListener('change',    e => { ctrl.autoRotate = e.target.checked; });
  $('tog-conflicts').addEventListener('change', () => { renderConflictLayer(); renderHtmlLayer(); });
  $('tog-heat').addEventListener('change',      () => renderConflictLayer());
  $('tog-aircraft').addEventListener('change',  e => {
    if (e.target.checked) loadAircraft();
    else {
      aircraftFeatures = [];
      aircraftHstat.style.display = 'none';
      renderHtmlLayer();  // keep country labels, remove plane icons
    }
  });
  $('tog-vessels').addEventListener('change', e => {
    if (e.target.checked) loadNaval();
    else {
      globe.ringsData([]);
      navalFeatures = [];
      resetNavalPanel();
    }
  });
}

/* ── Country polygons + label data ──────────────────────────── */
async function loadCountries() {
  try {
    const res = await fetch('data/countries.geojson');
    countriesGeoJSON = await res.json();

    // Pre-compute label data for every country
    countryLabelData = [];
    countriesGeoJSON.features.forEach(feat => {
      const centroid = getGeoCentroid(feat.geometry);
      if (!centroid) return;

      const idStr  = String(feat.properties.id).padStart(3, '0');
      const entry  = ISO[idStr] || {};
      const a2     = entry.a2 || '';
      if (SKIP_LABELS.has(a2)) return;

      // Use ISO override name for numeric-only names, otherwise keep GeoJSON name
      const rawName    = feat.properties.name || '';
      const isNumeric  = /^\d+$/.test(rawName);
      const displayName = (isNumeric ? entry.n : rawName) || rawName || idStr;

      countryLabelData.push({
        type: 'country',
        lat:  centroid[1],
        lng:  centroid[0],
        displayName,
        a2,
        flag: isoFlag(a2),
      });
    });
  } catch (e) {
    console.warn('Could not load countries GeoJSON:', e);
  }
}

// Name normalisation table (GDELT display name → GeoJSON name)
// Module-scope so openCountryDetail can use it too
const ALIASES = {
  'united states':'United States','united states of america':'United States',
  'russia':'Russia','russian federation':'Russia',
  'south korea':'South Korea','republic of korea':'South Korea',
  'north korea':'North Korea',
  'iran':'Iran','islamic republic of iran':'Iran',
  'syria':'Syria','syrian arab republic':'Syria',
  'tanzania':'Tanzania','united republic of tanzania':'Tanzania',
  'bolivia':'Bolivia','plurinational state of bolivia':'Bolivia',
  'venezuela':'Venezuela','bolivarian republic of venezuela':'Venezuela',
  'united kingdom':'United Kingdom','great britain':'United Kingdom',
  'czech republic':'Czech Republic','czechia':'Czech Republic',
  'north macedonia':'North Macedonia','macedonia':'North Macedonia',
  'dr congo':'DR Congo','democratic republic of the congo':'DR Congo','congo kinshasa':'DR Congo',
  'congo':'Congo','republic of the congo':'Congo',
};

let hoveredPolygon = null;

/* ── Conflict intensity — mentions-weighted so major wars dominate ── */
function capColor(d) {
  if (d._count === 0) return 'rgba(0,0,0,0)';
  // Mentions-weighted intensity: high-significance zones pop, minor ones barely register
  const i = d._intensity; // 0-1, mentions/maxMentions
  if (d === hoveredPolygon) {
    const base = Math.min(0.14 + i * 0.52, 0.66);
    return `rgba(215,40,40,${Math.min(base + 0.14, 0.80).toFixed(2)})`;
  }
  // Progressive fill: very low activity = near-invisible, dominant zones = saturated
  if (i < 0.04) return `rgba(140,18,18,${(0.06 + i * 2.5).toFixed(2)})`;
  if (i < 0.12) return `rgba(165,20,20,${(0.12 + i * 1.2).toFixed(2)})`;
  const alpha = Math.min(0.20 + i * 0.42, 0.62);
  return `rgba(185,25,25,${alpha.toFixed(2)})`;
}

/* ── Polygon altitude — significant zones protrude from the globe ── */
function polyAltitude(d) {
  if (d === hoveredPolygon && d._count > 0) return 0.018;
  if (d._count === 0) return 0.002;
  // Scale altitude 0.004-0.014 with mentions intensity
  return 0.004 + d._intensity * 0.010;
}

function renderCountryPolygons(features) {
  if (!countriesGeoJSON) return;

  // Accumulate both event count and total mentions per country
  const counts   = {};
  const mentions = {};
  features.forEach(f => {
    const c = (f.properties.country || '').toLowerCase().trim();
    if (!c) return;
    counts[c]   = (counts[c]   || 0) + 1;
    mentions[c] = (mentions[c] || 0) + (f.properties.mentions || 1);
  });

  // Intensity driven by MENTIONS (not count) → major wars visually dominate
  const maxMentions = Math.max(...Object.values(mentions), 1);

  const colored = countriesGeoJSON.features.map(feat => {
    const geoName = feat.properties.name || '';
    const key     = (ALIASES[geoName.toLowerCase()] || geoName).toLowerCase();
    const count   = counts[key]   || 0;
    const ment    = mentions[key] || 0;
    const intensity = ment / maxMentions; // 0-1, mentions-weighted
    return { ...feat, _intensity: intensity, _count: count, _mentions: ment, _geoName: geoName };
  });

  globe
    .polygonsData(colored)
    .polygonGeoJsonGeometry(d => d.geometry)
    .polygonCapColor(capColor)
    .polygonSideColor(() => 'rgba(0,0,0,0)')
    .polygonStrokeColor(d => {
      // Ghost borders — near-invisible base, faint accent on active zones
      if (d._count === 0) return 'rgba(255,255,255,0.03)';
      // Low intensity: barely perceptible
      if (d._intensity < 0.08) return 'rgba(255,255,255,0.05)';
      // High intensity: subtle but present
      const alpha = 0.07 + d._intensity * 0.12;
      return `rgba(255,255,255,${alpha.toFixed(2)})`;
    })
    .polygonAltitude(polyAltitude)
    .polygonLabel(d => d._count > 0
      ? `<span style="font-family:var(--font);font-size:11px;font-weight:700;color:#e2e6ee">${d._geoName}</span>
         <br><span style="font-size:10px;color:var(--red)">${d._count} events</span>`
      : '')
    .onPolygonHover(polygon => {
      if (hoveredPolygon === polygon) return;
      hoveredPolygon = polygon;
      globe.polygonCapColor(capColor);
      globe.polygonAltitude(polyAltitude);
    })
    .onPolygonClick((d) => { if (d._count > 0) openCountryDetail(d); })
    .polygonsTransitionDuration(400);
}

/* ── Conflict layer — heatmap only (markers handled in renderHtmlLayer) ── */
function renderConflictLayer() {
  // Clear legacy point layer
  globe.pointsData([]);

  const showHeat = $('tog-heat')?.checked ?? false;
  if (showHeat) {
    const heatPts = allFeatures.map(f => ({
      lat:    f.geometry.coordinates[1],
      lng:    f.geometry.coordinates[0],
      weight: Math.log2((f.properties.mentions || 1) + 1),
    }));
    const maxW = Math.max(...heatPts.map(p => p.weight), 1);
    globe
      .hexBinPointsData(heatPts).hexBinPointWeight('weight')
      .hexAltitude(d => (d.sumWeight / (maxW * 8)) * 0.18)
      .hexBinResolution(3)
      .hexTopColor(d => { const t = Math.min(1, d.sumWeight/(maxW*2)); return `rgba(255,${Math.round(120*(1-t))},0,0.80)`; })
      .hexSideColor(() => 'rgba(255,40,0,0.15)')
      .hexTransitionDuration(800);
  } else {
    globe.hexBinPointsData([]);
  }
}

/* ── Aircraft layer ─────────────────────────────────────────── */
async function loadAircraft() {
  loadingMsg.textContent = 'Loading aircraft…';
  loadingEl.classList.remove('hidden');
  try {
    const res = await fetch(`${API}/aircraft`);
    if (!res.ok) throw new Error(`Server ${res.status}`);
    const data = await res.json();
    if (data.error) throw new Error(data.error);

    aircraftFeatures = data.features || [];
    statAircraft.textContent    = aircraftFeatures.length.toLocaleString();
    aircraftHstat.style.display = '';

    renderHtmlLayer();

  } catch (err) {
    showError(`Aircraft data: ${err.message}`);
    $('tog-aircraft').checked = false;
  } finally {
    loadingEl.classList.add('hidden');
  }
}

function openAircraftDetail(p) {
  const color = AIRCRAFT_CATEGORY_COLORS[p.category] || '#ff8800';
  detailContent.innerHTML = `
    <div style="display:flex;gap:6px;align-items:center;margin-bottom:10px">
      <span class="det-badge" style="background:${color}22;color:${color};border:1px solid ${color}55">${p.category || 'Military'}</span>
      <span style="font-size:10px;color:var(--muted);letter-spacing:.6px">MILITARY AIRCRAFT</span>
    </div>
    <div class="det-title" style="font-size:18px;letter-spacing:1px">${p.callsign || p.icao || 'UNKNOWN'}</div>
    <div class="det-sub">${p.type || 'Unknown type'} · ${p.reg || 'No reg'}</div>
    <div class="det-big-row">
      <div class="det-big">
        <span class="det-big-val" style="color:${color};font-size:20px">${p.altitude ? p.altitude.toLocaleString() : '—'}</span>
        <span class="det-big-lbl">ALT (ft)</span>
      </div>
      <div class="det-big">
        <span class="det-big-val" style="font-size:20px">${p.speed || '—'}</span>
        <span class="det-big-lbl">SPEED (kts)</span>
      </div>
      <div class="det-big">
        <span class="det-big-val" style="font-size:20px">${p.heading != null ? p.heading + '°' : '—'}</span>
        <span class="det-big-lbl">HEADING</span>
      </div>
    </div>
    <div class="det-meta">
      <div class="det-row"><span>ICAO Hex</span><span>${p.icao || '—'}</span></div>
      ${p.squawk ? `<div class="det-row"><span>Squawk</span><span>${p.squawk}</span></div>` : ''}
      <div class="det-row"><span>Category</span><span style="color:${color}">${p.category || 'Military'}</span></div>
      <div class="det-row"><span>Source</span><span>ADSB.LOL</span></div>
    </div>`;
  detailOverlay.classList.remove('hidden');
}

/* ── Combined HTML layer (country labels + conflict markers + aircraft) ── */
function renderHtmlLayer() {
  // Significant events only — filters GDELT noise
  const sigFeatures = allFeatures.filter(f => (f.properties.mentions || 0) >= SIGNIFICANCE_THRESHOLD);

  // Zoom factor computed once — drives cluster budget, label tier cutoffs, sizing
  const zoomT = getZoomT();

  // ── Country labels ──
  const items = [...countryLabelData];

  // ── Conflict cluster markers ──
  // Zoom-adaptive budget: far zoom → primary hotspots only; close → full detail
  if ($('tog-conflicts')?.checked && sigFeatures.length) {
    // Budget: fewer clusters at far zoom for a cleaner globe
    const clusterCap = zoomT > 0.70 ? 12 : zoomT > 0.42 ? 28 : 55;
    // Minimum tier at far zoom: primary-only → secondary+ → all
    const minTierRank = zoomT > 0.70 ? 3 : zoomT > 0.42 ? 2 : 1;
    const tierRank = { tertiary: 1, secondary: 2, primary: 3 };

    const clusters = clusterFeatures(sigFeatures, 6.0)
      .sort((a, b) => b.totalMentions - a.totalMentions)
      .filter(c => tierRank[clusterTier(c)] >= minTierRank)
      .slice(0, clusterCap);

    clusters.forEach(c => {
      items.push({ type: 'cluster', lat: c.lat, lng: c.lng, cluster: c });
    });
  }

  // ── Aircraft plane icons ──
  if ($('tog-aircraft')?.checked && aircraftFeatures.length) {
    aircraftFeatures.slice(0, 800).forEach(f => {
      items.push({
        type:  'aircraft',
        lat:   f.geometry.coordinates[1],
        lng:   f.geometry.coordinates[0],
        props: f.properties,
        color: AIRCRAFT_CATEGORY_COLORS[f.properties.category] || '#ff8800',
      });
    });
  }

  // Backface culling + tier-based label filtering + cluster count threshold
  // Spread each object so globe.gl sees a new reference and re-calls htmlElement()
  const visibleItems = items
    .filter(d => isFacingCamera(d.lat, d.lng))
    .filter(d => d.type !== 'cluster' || d.cluster.count >= 3)
    .filter(d => {
      if (d.type !== 'country') return true;
      // Aggressive progressive disclosure — preserve negative space
      if (LABEL_TIER1.has(d.displayName)) return true;
      if (LABEL_TIER2.has(d.displayName)) return zoomT <= 0.65;
      return zoomT <= 0.35; // Tier 3 — only when meaningfully zoomed in
    })
    .map(d => ({ ...d }));

  globe
    .htmlElementsData(visibleItems)
    .htmlLat('lat').htmlLng('lng')
    .htmlAltitude(0)
    .htmlElement(d => {
      // ── Cluster marker — 3-tier visual hierarchy ──
      if (d.type === 'cluster') {
        const c    = d.cluster;
        const tier = clusterTier(c);
        const el   = document.createElement('div');
        const color = colorFor(c.dominant);
        el.className = `conflict-badge conflict-badge--${tier}`;
        el.style.setProperty('--bc', color);
        el.textContent = c.count;
        el.addEventListener('click', () => openClusterDetail(c));
        el.title = `${c.dominant} ×${c.count} — ${c.topFeature.properties.location || c.topFeature.properties.country}`;
        return el;
      }

      // ── Aircraft marker ──
      if (d.type === 'aircraft') {
        const el = document.createElement('div');
        el.className = 'plane-marker';
        el.style.color = d.color;
        el.style.setProperty('--hdg', `${d.props.heading || 0}deg`);
        el.title = `${d.props.callsign || d.props.icao} · ${d.props.category} · ${(d.props.altitude||0).toLocaleString()}ft · ${d.props.speed}kts`;
        el.innerHTML = '✈';
        el.addEventListener('click', () => openAircraftDetail(d.props));
        return el;
      }

      // ── Country label — tiered typography, zoom-aware size & opacity ──
      const el = document.createElement('div');
      el.className = 'country-label';
      const lp      = labelProps(d.displayName, zoomT);
      const size    = lp ? lp.size    : 7;
      const opacity = lp ? lp.opacity : 0.28;
      el.innerHTML  = `<span class="cl-name" style="font-size:${size}px;opacity:${opacity}">${d.displayName.toUpperCase()}</span>`;
      return el;
    });
}

/* ── Naval layer ─────────────────────────────────────────────── */
async function loadNaval() {
  try {
    const days = daysSelect.value;
    const res  = await fetch(`${API}/naval?days=${days}`);
    if (!res.ok) throw new Error(`Server ${res.status}`);
    const data = await res.json();
    if (data.error) throw new Error(data.error);

    navalFeatures = data.features || [];

    const rings = navalFeatures.map(f => ({
      lat:   f.geometry.coordinates[1],
      lng:   f.geometry.coordinates[0],
      props: f.properties,
    }));

    globe
      .ringsData(rings)
      .ringLat('lat').ringLng('lng')
      .ringColor(() => t => `rgba(0,170,255,${(1-t)*0.8})`)
      .ringMaxRadius(1.8)
      .ringPropagationSpeed(2)
      .ringRepeatPeriod(1400)
      .ringAltitude(0.01);

    updateNavalPanel(navalFeatures);

  } catch (err) {
    showError(`Naval data: ${err.message}`);
    $('tog-vessels').checked = false;
  }
}

function openNavalDetail(p) {
  if (!p) return;
  const color = '#00aaff';
  detailContent.innerHTML = `
    <div style="display:flex;gap:6px;align-items:center;margin-bottom:10px">
      <span class="det-badge" style="background:${color}22;color:${color};border:1px solid ${color}55">Naval Activity</span>
      <span style="font-size:10px;color:var(--muted);letter-spacing:.6px">MARITIME EVENT</span>
    </div>
    <div class="det-title">${p.location || p.country}</div>
    <div class="det-sub">${p.country} · ${p.date}</div>
    <div class="det-big-row">
      <div class="det-big"><span class="det-big-val">${p.mentions ?? 0}</span><span class="det-big-lbl">Mentions</span></div>
      <div class="det-big"><span class="det-big-val" style="color:${gsColor(p.goldstein)}">${(p.goldstein||0).toFixed(1)}</span><span class="det-big-lbl">Goldstein</span></div>
    </div>
    <div class="det-meta">
      ${p.actor1 ? `<div class="det-row"><span>Actor 1</span><span>${p.actor1}</span></div>` : ''}
      ${p.actor2 ? `<div class="det-row"><span>Actor 2</span><span>${p.actor2}</span></div>` : ''}
      <div class="det-row"><span>Source</span><span>GDELT</span></div>
    </div>
    ${p.source_url ? `<a href="${p.source_url}" target="_blank" rel="noopener" class="det-src-link">↗ View source article</a>` : ''}`;
  detailOverlay.classList.remove('hidden');
}

function updateNavalPanel(features) {
  const section = $('vessel-notice');
  if (!section) return;

  if (!features.length) {
    resetNavalPanel();
    return;
  }

  // top actors
  const actorCounts = {};
  features.forEach(f => {
    const p = f.properties;
    [p.actor1, p.actor2].forEach(a => {
      if (a && a.length > 2) actorCounts[a] = (actorCounts[a] || 0) + 1;
    });
  });
  const topActors = Object.entries(actorCounts).sort((a,b)=>b[1]-a[1]).slice(0,5);
  const maxA = topActors[0]?.[1] || 1;

  // top locations
  const locCounts = {};
  features.forEach(f => {
    const c = f.properties.country;
    if (c) locCounts[c] = (locCounts[c]||0) + 1;
  });
  const topLocs = Object.entries(locCounts).sort((a,b)=>b[1]-a[1]).slice(0,3);

  section.innerHTML = `
    <div class="panel-title">NAVAL ACTIVITY <span class="panel-sub">GDELT</span></div>
    <div class="naval-summary">
      <div class="naval-count-row">
        <span class="naval-big">${features.length}</span>
        <span class="naval-lbl">maritime events</span>
      </div>
      <div class="naval-zones">
        ${topLocs.map(([c,n]) => `<span class="naval-zone">${c} <span class="naval-zone-n">${n}</span></span>`).join('')}
      </div>
      <ul class="naval-actors">
        ${topActors.map(([a,cnt]) => `
          <li class="naval-actor-item">
            <span class="naval-actor-name">${a}</span>
            <div class="naval-bar-wrap"><div class="naval-bar-fill" style="width:${(cnt/maxA*100).toFixed(0)}%"></div></div>
            <span class="naval-actor-cnt">${cnt}</span>
          </li>`).join('')}
      </ul>
    </div>`;
}

function resetNavalPanel() {
  const section = $('vessel-notice');
  if (!section) return;
  section.innerHTML = `
    <div class="panel-title">NAVAL ACTIVITY</div>
    <div class="notice-card">
      <div class="notice-icon">⚓</div>
      <div class="notice-text">Enable the Naval layer to show GDELT maritime events.</div>
    </div>`;
}

/* ── Main data load ─────────────────────────────────────────── */
async function loadData() {
  const days = daysSelect.value;
  loadingMsg.textContent = `Fetching ${days}-day GDELT data… (first load may take ~30s)`;
  loadingEl.classList.remove('hidden');
  feedRefresh.classList.add('spinning');

  const eventType = typeSelect.value;
  const country   = feedSearch.value.trim();
  const params    = new URLSearchParams({ days });
  if (eventType) params.append('event_types', eventType);
  if (country)   params.append('country', country);

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 120000); // 2 min timeout
    const res = await fetch(`${API}/events?${params}`, { signal: controller.signal });
    clearTimeout(timeout);
    if (!res.ok) throw new Error(`Server responded with ${res.status}`);
    const geojson = await res.json();
    if (geojson.error) throw new Error(geojson.error);

    allFeatures = geojson.features || [];
    renderConflictLayer();
    renderCountryPolygons(allFeatures);
    renderHtmlLayer();   // refresh conflict cluster markers with new data
    renderFeed(allFeatures);
    updateStats(geojson.metadata, allFeatures);
    renderKeywords(allFeatures);
    renderCountryList(allFeatures);
    renderTypeBreakdown(allFeatures);
    updateTicker(allFeatures);
    buildSuggestions(allFeatures);
  } catch (err) {
    const msg = err.name === 'AbortError'
      ? 'Request timed out. Is the backend running? (cd backend && python3 app.py)'
      : err.message.includes('Failed to fetch')
        ? 'Cannot reach backend. Start it: cd ~/Desktop/ArcWatch/backend && python3 app.py'
        : `Error: ${err.message}`;
    loadingMsg.textContent = msg;
    showError(msg);
    console.error(err);
  } finally {
    loadingEl.classList.add('hidden');
    feedRefresh.classList.remove('spinning');
  }
}

/* ── Feed ───────────────────────────────────────────────────── */
function renderFeed(features) {
  const query = feedSearch.value.toLowerCase().trim();
  // Apply significance threshold — only show events with meaningful media coverage
  // (unless user has searched/filtered, in which case show everything they asked for)
  const base = (query || sevFilter)
    ? features
    : features.filter(f => (f.properties.mentions || 0) >= SIGNIFICANCE_THRESHOLD);

  let filtered = sevFilter ? base.filter(f => severity(f.properties) === sevFilter) : base;
  if (query) {
    filtered = filtered.filter(f => {
      const p = f.properties;
      return [p.country, p.location, p.event_type, p.actor1, p.actor2]
        .some(v => v && v.toLowerCase().includes(query));
    });
  }

  const sorted = [...filtered].sort((a, b) => b.properties.mentions - a.properties.mentions);
  feedCount.textContent = `${sorted.length.toLocaleString()} incidents`;
  feedList.innerHTML = '';

  sorted.slice(0, 250).forEach(f => {
    const p   = f.properties;
    const sev = severity(p);
    const li  = document.createElement('li');
    li.className  = 'feed-item';
    li.dataset.id  = p.id;
    li.dataset.lat = f.geometry.coordinates[1];
    li.dataset.lng = f.geometry.coordinates[0];
    if (p.id === activeId) li.classList.add('active');

    li.innerHTML = `
      <div class="fi-top">
        <span class="sev-badge sev-${sev}">${sev}</span>
        <span class="fi-type">${p.event_type}</span>
        <span class="fi-date">${p.date}</span>
      </div>
      <div class="fi-loc">${p.location || '—'}, ${p.country}</div>
      <div class="fi-meta">
        <span class="fi-mentions">${p.mentions}</span> mentions
        · GS <span style="color:${gsColor(p.goldstein)}">${(p.goldstein||0).toFixed(1)}</span>
      </div>`;

    li.addEventListener('click', () => {
      openDetail(p);
      globe.pointOfView({ lat: +li.dataset.lat, lng: +li.dataset.lng, altitude: 1.8 }, 800);
    });
    feedList.appendChild(li);
  });
}

function scrollFeedTo(id) {
  const el = feedList.querySelector(`[data-id="${id}"]`);
  if (el) { el.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); markActive(id); }
}

function markActive(id) {
  feedList.querySelectorAll('.feed-item').forEach(e => e.classList.toggle('active', e.dataset.id === id));
}

/* ── Cluster detail — shown when clicking a map badge ───────── */
function openClusterDetail(c) {
  // Fly camera to cluster centre
  globe.pointOfView({ lat: c.lat, lng: c.lng, altitude: 1.6 }, 700);

  const top     = c.topFeature.properties;
  const color   = colorFor(c.dominant);
  const zone    = top.location && top.location !== top.country
                  ? `${top.location}, ${top.country}`
                  : top.country || 'Unknown region';

  // Collect unique countries in cluster
  const countries = [...new Set(c.features.map(f => f.properties.country).filter(Boolean))];
  const countriesStr = countries.slice(0, 3).join(' · ') + (countries.length > 3 ? ` +${countries.length - 3}` : '');

  // Event type breakdown
  const typeCounts = {};
  c.features.forEach(f => {
    const t = f.properties.event_type || 'Unknown';
    typeCounts[t] = (typeCounts[t] || 0) + 1;
  });
  const sortedTypes = Object.entries(typeCounts).sort((a, b) => b[1] - a[1]);
  const typeHTML = sortedTypes.map(([type, cnt]) => {
    const tc = colorFor(type);
    const pct = Math.max(6, Math.round(cnt / c.count * 100));
    return `<div class="cd-type-row">
      <span class="cd-type-dot" style="background:${tc}"></span>
      <span class="cd-type-name">${type}</span>
      <div class="cd-type-bar-wrap"><div class="cd-type-bar-fill" style="width:${pct}%;background:${tc}30;border-right:2px solid ${tc}80"></div></div>
      <span class="cd-type-cnt">${cnt}</span>
    </div>`;
  }).join('');

  // Top 5 events by mentions
  const topEvents = [...c.features]
    .sort((a, b) => (b.properties.mentions || 0) - (a.properties.mentions || 0))
    .slice(0, 5);

  window._clusterEventMap = {};
  topEvents.forEach(f => { window._clusterEventMap[f.properties.id] = f; });
  window._openFromCluster = id => { const f = window._clusterEventMap[id]; if (f) openDetail(f.properties); };

  const eventsHTML = topEvents.map(f => {
    const p = f.properties;
    const ec = colorFor(p.event_type);
    const sev = severity(p);
    const summary = buildSummary(p);
    return `<div class="cd-event-item" onclick="window._openFromCluster('${p.id}')">
      <div class="cd-ei-top">
        <span class="sev-badge sev-${sev}">${sev}</span>
        <span class="cd-ei-type" style="color:${ec}">${p.event_type}</span>
        <span class="cd-ei-date">${p.date}</span>
      </div>
      <div class="cd-ei-loc">${p.location || p.country}</div>
      <div class="det-summary" style="margin:4px 0 2px;font-size:11px">${summary}</div>
      <div class="cd-ei-meta">${p.mentions} mentions
        · GS <span style="color:${gsColor(p.goldstein)}">${(p.goldstein||0).toFixed(1)}</span>
        ${p.source_url ? `· <a href="${p.source_url}" target="_blank" rel="noopener" style="color:var(--text-3);text-decoration:underline">source ↗</a>` : ''}
      </div>
    </div>`;
  }).join('');

  detailContent.innerHTML = `
    <div style="display:flex;gap:8px;align-items:flex-start;margin-bottom:10px">
      <span class="det-badge" style="background:${color}22;color:${color};border:1px solid ${color}55">${c.dominant}</span>
      <span class="det-badge" style="background:var(--bg3);color:var(--text-3);border:1px solid var(--border)">${c.count} EVENTS</span>
    </div>
    <div class="det-title">${zone}</div>
    <div class="det-sub" style="margin-bottom:8px">${countriesStr}</div>

    <div class="det-big-row" style="margin-bottom:10px">
      <div class="det-big">
        <span class="det-big-val">${c.count}</span>
        <span class="det-big-lbl">Events</span>
      </div>
      <div class="det-big">
        <span class="det-big-val">${fmtK(c.totalMentions)}</span>
        <span class="det-big-lbl">Mentions</span>
      </div>
      <div class="det-big">
        <span class="det-big-val" style="color:${gsColor(top.goldstein)}">${(top.goldstein||0).toFixed(1)}</span>
        <span class="det-big-lbl">Top GS</span>
      </div>
    </div>

    <div class="cd-section-label">EVENT TYPES</div>
    <div class="cd-type-breakdown" style="margin-bottom:10px">${typeHTML}</div>

    <div class="cd-divider"></div>
    <div class="cd-section-label">TOP INCIDENTS</div>
    <div class="cd-event-list">${eventsHTML}</div>`;

  detailOverlay.classList.remove('hidden');
}

/* ── Single event detail card ───────────────────────────────── */
function openDetail(p) {
  activeId = p.id;
  markActive(p.id);
  const color = colorFor(p.event_type);
  const sev   = severity(p);

  const summary = buildSummary(p);
  const srcDomain = p.source_url ? (() => { try { return new URL(p.source_url).hostname.replace('www.',''); } catch(e) { return ''; } })() : '';

  detailContent.innerHTML = `
    <div style="display:flex;gap:6px;align-items:center;margin-bottom:10px">
      <span class="det-badge" style="background:${color}22;color:${color};border:1px solid ${color}55">${p.event_type}</span>
      <span class="sev-badge sev-${sev}">${sev}</span>
    </div>
    <div class="det-title">${p.location || p.country}</div>
    <div class="det-sub">${p.country} · ${p.date}</div>
    <div class="det-summary">${summary}</div>
    <div class="det-big-row">
      <div class="det-big"><span class="det-big-val">${p.mentions ?? 0}</span><span class="det-big-lbl">Mentions</span></div>
      <div class="det-big"><span class="det-big-val" style="color:${gsColor(p.goldstein)}">${(p.goldstein||0).toFixed(1)}</span><span class="det-big-lbl">Goldstein</span></div>
      <div class="det-big"><span class="det-big-val" style="color:${parseFloat(p.avg_tone||0)<0?'var(--red)':'var(--text-3)'}">${parseFloat(p.avg_tone||0).toFixed(1)}</span><span class="det-big-lbl">Tone</span></div>
    </div>
    <div class="det-meta">
      ${p.actor1 ? `<div class="det-row"><span>Actor 1</span><span>${toTitle(p.actor1)}</span></div>` : ''}
      ${p.actor2 ? `<div class="det-row"><span>Actor 2</span><span>${toTitle(p.actor2)}</span></div>` : ''}
      <div class="det-row"><span>Country</span><span>${p.country}</span></div>
      ${p.fatalities ? `<div class="det-row"><span>Fatalities</span><span style="color:var(--red)">${p.fatalities}</span></div>` : ''}
    </div>
    ${p.source_url ? `<a href="${p.source_url}" target="_blank" rel="noopener" class="det-src-link">↗ ${srcDomain || 'View source article'}</a>` : ''}`;

  detailOverlay.classList.remove('hidden');
}

/* ── Country detail panel ───────────────────────────────────── */
async function openCountryDetail(polygonData) {
  // Resolve display name + flag
  const geoName        = polygonData._geoName || '';
  const idStr          = String(polygonData.properties?.id ?? '').padStart(3, '0');
  const isoEntry       = ISO[idStr] || {};
  const a2             = isoEntry.a2 || '';
  const flag           = isoFlag(a2);
  const countryDisplay = isoEntry.n || geoName;

  // Fly to country centroid
  const centroid = getGeoCentroid(polygonData.geometry);
  if (centroid) globe.pointOfView({ lat: centroid[1], lng: centroid[0], altitude: 2.2 }, 900);

  // Match events
  const normalised = geoName.toLowerCase();
  const aliasKeys  = Object.entries(ALIASES)
    .filter(([, v]) => v.toLowerCase() === normalised).map(([k]) => k);
  const matchKeys  = new Set([normalised, ...aliasKeys]);
  const events     = allFeatures.filter(f => {
    const c = (f.properties.country || '').toLowerCase().trim();
    return matchKeys.has(c) || matchKeys.has((ALIASES[c] || '').toLowerCase());
  });

  // Determine active conflict status
  const hasActive = events.some(f =>
    ['Battles','Explosions/Remote violence','Violence against civilians'].includes(f.properties.event_type)
    && (f.properties.mentions || 0) >= 20
  );
  const statusBadge = hasActive
    ? `<span class="cd-status cd-status-active">● ACTIVE CONFLICT</span>`
    : `<span class="cd-status cd-status-monitor">◉ MONITORING</span>`;

  // Event type breakdown
  const typeCounts = {};
  events.forEach(f => { const et = f.properties.event_type || 'Conflict'; typeCounts[et] = (typeCounts[et]||0)+1; });
  const sortedTypes = Object.entries(typeCounts).sort((a,b) => b[1]-a[1]);
  const maxTC = sortedTypes[0]?.[1] || 1;
  const typeRowsHTML = sortedTypes.map(([type, cnt]) => {
    const color = colorFor(type);
    const pct   = Math.max(4, cnt/maxTC*100).toFixed(0);
    return `<div class="cd-type-row">
      <span class="cd-type-dot" style="background:${color}"></span>
      <span class="cd-type-name">${type}</span>
      <div class="cd-type-bar-wrap"><div class="cd-type-bar-fill" style="width:${pct}%;background:${color}30;border-right:2px solid ${color}80"></div></div>
      <span class="cd-type-cnt">${cnt}</span>
    </div>`;
  }).join('');

  // Top incidents (up to 5, significant ones first)
  window._countryEventMap = {};
  const topEvents = [...events]
    .sort((a,b) => (b.properties.mentions||0)-(a.properties.mentions||0))
    .slice(0, 5);
  topEvents.forEach(f => { window._countryEventMap[f.properties.id] = f; });
  window._openDetailFromCountry = id => { const f = window._countryEventMap[id]; if (f) openDetail(f.properties); };

  const totalMentions = events.reduce((s,f) => s+(f.properties.mentions||0), 0);
  const eventsHTML = topEvents.map(f => {
    const p = f.properties, color = colorFor(p.event_type), sev = severity(p);
    return `<div class="cd-event-item" onclick="window._openDetailFromCountry('${p.id}')">
      <div class="cd-ei-top">
        <span class="sev-badge sev-${sev}">${sev}</span>
        <span class="cd-ei-type" style="color:${color}">${p.event_type}</span>
        <span class="cd-ei-date">${p.date}</span>
      </div>
      <div class="cd-ei-loc">${p.location || p.country}</div>
      <div class="cd-ei-meta">${p.mentions} mentions · GS <span style="color:${gsColor(p.goldstein)}">${(p.goldstein||0).toFixed(1)}</span></div>
    </div>`;
  }).join('');

  // Pull from local intel DB (instant, no network)
  const intel = countryIntelDB[a2.toUpperCase()] || {};
  const fmtPop = n => n >= 1e9 ? (n/1e9).toFixed(2)+'B'
                    : n >= 1e6 ? (n/1e6).toFixed(1)+'M'
                    : n >= 1e3 ? (n/1e3).toFixed(0)+'K'
                    : n ? String(n) : '—';
  // Icon SVGs (inline, monochrome)
  const iconPerson = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>`;
  const iconGov    = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="10" width="18" height="11"/><path d="M3 10L12 3l9 7"/><line x1="9" y1="21" x2="9" y2="14"/><line x1="15" y1="21" x2="15" y2="14"/></svg>`;
  const iconPeople = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="7" r="3"/><path d="M3 20c0-3 2.7-5 6-5s6 2 6 5"/><circle cx="17" cy="7" r="3"/><path d="M21 20c0-3-2-5-4.5-5"/></svg>`;
  const iconPin    = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 21C12 21 5 13.5 5 8.5a7 7 0 0 1 14 0c0 5-7 12.5-7 12.5z"/><circle cx="12" cy="8.5" r="2.5"/></svg>`;

  const intelHTML = intel.hos ? `
    <div class="cd-intel-section">
      <div class="cd-section-label">${iconPerson} COUNTRY INTEL</div>
      <div class="cd-intel-grid">
        <div class="cd-intel-card">
          <div class="cd-intel-lbl">${iconPerson} HEAD OF STATE</div>
          <div class="cd-intel-val">${intel.hos || '—'}</div>
        </div>
        <div class="cd-intel-card">
          <div class="cd-intel-lbl">${iconPeople} HEAD OF GOV</div>
          <div class="cd-intel-val">${intel.hog && intel.hog !== intel.hos ? intel.hog : intel.hos || '—'}</div>
        </div>
        <div class="cd-intel-card">
          <div class="cd-intel-lbl">${iconGov} GOVERNMENT</div>
          <div class="cd-intel-val cd-intel-val-sm">${intel.gov || '—'}</div>
        </div>
        <div class="cd-intel-card">
          <div class="cd-intel-lbl">${iconPeople} POPULATION</div>
          <div class="cd-intel-val">${fmtPop(intel.pop)}</div>
        </div>
        <div class="cd-intel-card cd-intel-card-wide">
          <div class="cd-intel-lbl">${iconPin} CAPITAL</div>
          <div class="cd-intel-val">${intel.capital || '—'}</div>
        </div>
      </div>
    </div>
    <div class="cd-divider"></div>` : '';

  detailContent.innerHTML = `
    <div class="cd-header">
      <div class="cd-flag-circle">${flag}</div>
      <div class="cd-header-text">
        <div class="cd-country-name">${countryDisplay}</div>
        ${statusBadge}
      </div>
    </div>
    ${intelHTML}
    <div class="cd-section-label">CONFLICT DATA <span style="color:var(--text-3);font-weight:400">${events.length} events · ${totalMentions.toLocaleString()} mentions</span></div>
    <div class="cd-type-breakdown">${typeRowsHTML}</div>
    ${topEvents.length ? `<div class="cd-divider"></div><div class="cd-section-label">TOP INCIDENTS</div><div class="cd-event-list">${eventsHTML}</div>` : ''}`;

  detailOverlay.classList.remove('hidden');

  detailOverlay.classList.remove('hidden');
}

$('detail-close').addEventListener('click', () => {
  detailOverlay.classList.add('hidden');
  activeId = null;
  feedList.querySelectorAll('.feed-item').forEach(e => e.classList.remove('active'));
});

/* ── Stats ──────────────────────────────────────────────────── */
function updateStats(meta, features) {
  statEvents.textContent    = (meta?.total_events ?? features.length).toLocaleString();
  const countries = new Set(features.map(f => f.properties.country).filter(Boolean));
  statCountries.textContent = countries.size;
  const active   = features.filter(f => ['Battles','Explosions/Remote violence','Violence against civilians'].includes(f.properties.event_type));
  const tensions = features.filter(f => ['Coercion','Military Activity','Protests'].includes(f.properties.event_type));
  statActive.textContent   = active.length.toLocaleString();
  statTensions.textContent = tensions.length.toLocaleString();
}

/* ── Keywords ───────────────────────────────────────────────── */
const STOP = new Set(['','government','police','military','armed','forces','group','party','people','national','state','man','men']);
function renderKeywords(features) {
  const freq = {};
  features.forEach(f => {
    [f.properties.actor1, f.properties.actor2].forEach(a => {
      if (!a) return;
      a.split(/\s+|,/).forEach(w => {
        const wl = w.toLowerCase().replace(/[^a-z]/g,'');
        if (wl.length < 3 || STOP.has(wl)) return;
        freq[w] = (freq[w]||0) + (f.properties.mentions||1);
      });
    });
  });
  const sorted = Object.entries(freq).sort((a,b)=>b[1]-a[1]).slice(0,10);
  const maxV = sorted[0]?.[1]||1;
  keywordList.innerHTML = sorted.map(([w,cnt],i) => {
    const pct = Math.max(4, Math.round(cnt/maxV*100));
    return `
    <li class="kw-item" onclick="filterByKeyword('${w.replace(/'/g,"\\'")}')">
      <span class="kw-rank">#${i+1}</span>
      <span class="kw-name">${w}</span>
      <div class="kw-bar-wrap"><div class="kw-bar-fill" style="width:${pct}%"></div></div>
      <span class="kw-count">${fmtK(cnt)}</span>
    </li>`;
  }).join('');
}
function filterByKeyword(kw) { feedSearch.value = kw; renderFeed(allFeatures); }
window.filterByKeyword = filterByKeyword;

/* ── Country list ───────────────────────────────────────────── */
function renderCountryList(features) {
  const counts = {};
  features.forEach(f => { const c=f.properties.country; if(c) counts[c]=(counts[c]||0)+1; });
  const sorted = Object.entries(counts).sort((a,b)=>b[1]-a[1]).slice(0,10);
  const maxV = sorted[0]?.[1]||1;
  countryListEl.innerHTML = sorted.map(([c,cnt],i) => {
    const pct = Math.max(4, Math.round(cnt/maxV*100));
    return `
    <li class="country-item" onclick="focusCountry('${c.replace(/'/g,"\\'")}')">
      <span class="ci-rank">#${i+1}</span>
      <span class="ci-name">${c}</span>
      <div class="ci-bar-wrap"><div class="ci-bar-fill" style="width:${pct}%"></div></div>
      <span class="ci-count">${cnt}</span>
    </li>`;
  }).join('');
}
function focusCountry(country) {
  const f = allFeatures.find(f => f.properties.country === country);
  if (f) globe.pointOfView({ lat: f.geometry.coordinates[1], lng: f.geometry.coordinates[0], altitude: 2.5 }, 1000);
  feedSearch.value = country;
  renderFeed(allFeatures);
}
window.focusCountry = focusCountry;

/* ── Type breakdown ─────────────────────────────────────────── */
function renderTypeBreakdown(features) {
  const counts = {};
  features.forEach(f => { const t=f.properties.event_type; counts[t]=(counts[t]||0)+1; });
  const sorted = Object.entries(counts).sort((a,b)=>b[1]-a[1]);
  const maxV = sorted[0]?.[1]||1;
  typeBreakdown.innerHTML = sorted.map(([t,cnt]) => {
    const pct = Math.max(2, Math.round(cnt/maxV*100));  // min 2% so bar is always visible
    return `
    <div class="tb-row">
      <span class="tb-dot" style="background:${colorFor(t)}"></span>
      <span class="tb-name">${t}</span>
      <div class="tb-bar-wrap"><div class="tb-bar-fill" style="width:${pct}%;background:${colorFor(t)}"></div></div>
      <span class="tb-count">${cnt}</span>
    </div>`;
  }).join('');
}

/* ── Ticker ─────────────────────────────────────────────────── */
function updateTicker(features) {
  const top = [...features].sort((a,b)=>b.properties.mentions-a.properties.mentions).slice(0,30);
  tickerInner.innerHTML = top.map(f => {
    const p=f.properties, color=colorFor(p.event_type);
    return `<span class="ticker-item" onclick="openDetailById('${p.id}')">
      <span class="ticker-type" style="background:${color}22;color:${color};border:1px solid ${color}44">${p.event_type.toUpperCase()}</span>
      ${p.location||p.country}, ${p.country} — ${p.mentions} mentions
    </span><span class="ticker-sep">·</span>`;
  }).join('');
}
function openDetailById(id) {
  const f = allFeatures.find(f=>f.properties.id===id);
  if (f) { openDetail(f.properties); globe.pointOfView({lat:f.geometry.coordinates[1],lng:f.geometry.coordinates[0],altitude:1.8},800); }
}
window.openDetailById = openDetailById;

/* ── Markets ────────────────────────────────────────────────── */
async function loadMarkets() {
  try {
    const res  = await fetch(`${API}/markets`);
    const data = await res.json();
    marketsGrid.innerHTML = data.map(m => {
      if (m.price === null) return `<div class="market-card"><div class="mc-name">${m.name}</div><div class="mc-price mc-flat">—</div></div>`;
      const up = m.change > 0, dn = m.change < 0;
      const cls = up ? 'mc-up' : dn ? 'mc-down' : 'mc-flat';
      const arrow = up ? '▲' : dn ? '▼' : '—';
      return `
        <div class="market-card">
          <div class="mc-name">${m.name}</div>
          <div class="mc-price">${m.price.toLocaleString()}</div>
          <div class="mc-change ${cls}">${arrow} ${Math.abs(m.change).toFixed(2)}%</div>
        </div>`;
    }).join('');
  } catch { marketsGrid.innerHTML = '<div style="color:var(--muted);font-size:11px;grid-column:1/-1">Markets unavailable</div>'; }
}

/* ── Country search autocomplete ────────────────────────────── */
function buildSuggestions(features) {
  const countries = [...new Set(features.map(f=>f.properties.country).filter(Boolean))].sort();
  const handler = () => {
    const q = feedSearch.value.trim().toLowerCase();
    renderFeed(allFeatures);
    if (!q) { suggestionsEl.classList.remove('open'); return; }
    const matches = countries.filter(c=>c.toLowerCase().includes(q)).slice(0,8);
    if (!matches.length) { suggestionsEl.classList.remove('open'); return; }
    suggestionsEl.innerHTML = matches.map(c=>`<div class="sug-item" data-val="${c}">${c}</div>`).join('');
    suggestionsEl.classList.add('open');
  };
  feedSearch.removeEventListener('input', handler);
  feedSearch.addEventListener('input', handler);
  suggestionsEl.addEventListener('click', e => {
    const item = e.target.closest('.sug-item');
    if (!item) return;
    feedSearch.value = item.dataset.val;
    suggestionsEl.classList.remove('open');
    renderFeed(allFeatures);
  });
  document.addEventListener('click', e => {
    if (!e.target.closest('#feed-search-wrap')) suggestionsEl.classList.remove('open');
  });
}

/* ── CSV export ─────────────────────────────────────────────── */
$('export-btn').addEventListener('click', () => {
  if (!allFeatures.length) return;
  const cols = ['id','date','event_type','country','location','actor1','actor2','mentions','goldstein','avg_tone','source_url'];
  const header = cols.join(',');
  const rows = allFeatures.map(f => {
    const p = f.properties;
    return cols.map(c => `"${String(p[c]??'').replace(/"/g,'""')}"`).join(',');
  });
  const csv  = [header, ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url;
  a.download = `arcwatch-${daysSelect.value}d-${new Date().toISOString().slice(0,10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
});

/* ── Severity filter buttons ────────────────────────────────── */
$('feed-sev-filters').addEventListener('click', e => {
  const btn = e.target.closest('.sev-btn');
  if (!btn) return;
  document.querySelectorAll('.sev-btn').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  sevFilter = btn.dataset.sev;
  renderFeed(allFeatures);
});

/* ── Live viewer counter (simulated) ────────────────────────── */
let viewers = Math.floor(Math.random()*150)+80;
function tickViewers() { viewers += Math.floor(Math.random()*7)-3; viewers=Math.max(50,Math.min(400,viewers)); liveViewers.textContent=viewers; }
setInterval(tickViewers, 3000);
tickViewers();

/* ── Error toast ────────────────────────────────────────────── */
function showError(msg) {
  errorToast.textContent = msg;
  errorToast.classList.add('show');
  setTimeout(()=>errorToast.classList.remove('show'), 7000);
}

/* ── Controls ───────────────────────────────────────────────── */
daysSelect.addEventListener('change', loadData);
typeSelect.addEventListener('change', loadData);
feedRefresh.addEventListener('click', loadData);

/* ── Country intel cache (loaded from local JSON) ───────────── */
let countryIntelDB = {};
async function loadCountryIntel() {
  try {
    const res = await fetch('data/country-intel.json');
    countryIntelDB = await res.json();
  } catch (e) { console.warn('Could not load country-intel.json', e); }
}

/* ── Init ───────────────────────────────────────────────────── */
if (typeof Globe === 'undefined') {
  loadingMsg.textContent = 'Globe.gl failed to load. Hard-refresh (Cmd+Shift+R).';
  console.error('Globe is not defined.');
} else {
  try {
    initGlobe();
  } catch (e) {
    console.error('Globe init error:', e);
    loadingMsg.textContent = 'Globe failed to initialise: ' + e.message;
  }
  loadCountries().then(() => { renderHtmlLayer(); loadData(); });
  loadMarkets();
  loadCountryIntel();
  setInterval(loadMarkets, 5 * 60 * 1000);
}
