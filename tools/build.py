#!/usr/bin/env python3
"""Static site generator for Speaker Cleaner. Run: python3 tools/build.py"""
import json, os, re, html
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
C = os.path.join(ROOT, 'tools', 'content')
SITE = 'https://speakercleanerapp.github.io'
REPO = 'https://github.com/speakercleanerapp/speakercleanerapp.github.io'
def rd(n): return open(os.path.join(C, n), encoding='utf-8').read()
def faqs(n): return json.load(open(os.path.join(C, n), encoding='utf-8'))

MODE_CARDS = {
 'water': ('Water eject', 'Steady 165 Hz, 30 s'),
 'sweep': ('Sweep &amp; pulse', '60–320 Hz + bursts, 35 s'),
 'auto': ('Auto clean cycle', '5 stages, 80 s'),
 'dust': ('Dust cleaner', '200–1500 Hz steps, 56 s'),
 'vibe': ('Vibration clean', 'Pulses + vibration, 40 s'),
 'lrtest': ('Left / right test', '440 &amp; 660 Hz, 18 s'),
 'fsweep': ('Frequency sweep', '50 Hz–16 kHz, 24 s'),
}
NAV = [('/water-eject/', 'Water eject'), ('/dust-cleaner/', 'Dust cleaner'), ('/vibration-cleaner/', 'Vibration'), ('/speaker-test/', 'Speaker test')]
TOOLS = {
 '/': ('Speaker cleaner', 'All cleaning modes in one place, including the auto clean cycle.'),
 '/water-eject/': ('Water eject', 'A steady 165 Hz tone that pushes water out of a wet speaker grille.'),
 '/dust-cleaner/': ('Dust cleaner', 'A stepped 200–1500 Hz tone band to shake lint and fine dust loose.'),
 '/vibration-cleaner/': ('Vibration cleaner', 'Low pulses combined with your phone\'s vibration motor where supported.'),
 '/speaker-test/': ('Speaker test', 'Check left and right channels and run a 50 Hz to 16 kHz sweep.'),
}

CSS = """:root{--bg:#f6f8fb;--card:#fff;--ink:#14202e;--mut:#4a5868;--pri:#0b5cab;--pri2:#084a8a;--ok:#0f7a4a;--line:#dbe3ec;--warn:#7a4f00;--warnbg:#fff6e0}
*{box-sizing:border-box}html{-webkit-text-size-adjust:100%;scroll-behavior:smooth}
body{margin:0;font:17px/1.65 system-ui,-apple-system,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;color:var(--ink);background:var(--bg)}
a{color:var(--pri)}.wrap{max-width:760px;margin:0 auto;padding:0 18px}
.vh{position:absolute!important;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}
header.top{background:var(--card);border-bottom:1px solid var(--line)}
header.top .wrap{display:flex;flex-wrap:wrap;align-items:center;column-gap:16px;padding-top:8px;padding-bottom:4px}
.brand{font-weight:700;color:var(--ink);text-decoration:none;display:flex;align-items:center;gap:8px;min-height:40px}
.nav{display:flex;gap:4px;overflow-x:auto;margin:0 -6px;padding:0;list-style:none;scrollbar-width:none}
.nav a{display:block;padding:8px 8px;white-space:nowrap;text-decoration:none;color:var(--mut);font-size:.92rem;border-radius:8px}
.nav a[aria-current]{color:var(--pri);font-weight:700;background:#eef5fd}
.skip{position:absolute;left:-999px}.skip:focus{left:10px;top:10px;background:#fff;padding:8px;z-index:9}
h1{font-size:1.55rem;line-height:1.25;margin:18px 0 6px}.lead{color:var(--mut);margin:0 0 14px}
.tool{background:var(--card);border:1px solid var(--line);border-radius:16px;padding:16px;box-shadow:0 2px 10px rgba(20,32,46,.05)}
.notice{display:flex;gap:10px;align-items:flex-start;background:var(--warnbg);color:var(--warn);border-radius:10px;padding:8px 12px;font-size:.9rem;line-height:1.5;margin-bottom:12px}
.notice svg{flex:0 0 20px;margin-top:2px}
fieldset{border:0;margin:0 0 12px;padding:0;min-width:0}legend{font-weight:600;margin-bottom:6px;padding:0}
.modes{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.modes label{display:flex;gap:8px;align-items:center;border:2px solid var(--line);border-radius:12px;padding:8px 10px;cursor:pointer;min-height:56px;line-height:1.3}
.modes input,.opt input[type=checkbox]{accent-color:var(--pri);width:20px;height:20px;margin:0;flex:0 0 20px}
.modes label:has(input:checked){border-color:var(--pri);background:#eef5fd}
.modes small{display:block;color:var(--mut);font-size:.8rem}
#sc-main{display:flex;align-items:center;justify-content:center;gap:10px;width:100%;min-height:62px;font:inherit;font-size:1.2rem;font-weight:700;color:#fff;background:var(--pri);border:0;border-radius:14px;cursor:pointer;touch-action:manipulation}
#sc-main:hover{background:var(--pri2)}#sc-main:focus-visible,.seg input:focus-visible+span{outline:3px solid #f2a900;outline-offset:3px}
#sc-main.on{background:#b3261e}#sc-main .i-stop{display:none}#sc-main.on .i-stop{display:block}#sc-main.on .i-play{display:none}
.meter{display:flex;justify-content:space-between;align-items:baseline;gap:8px;margin:12px 0 6px;font-size:.95rem}
.meter b{font-variant-numeric:tabular-nums;font-size:1.2rem}#sc-hz{font-variant-numeric:tabular-nums;color:var(--mut);margin-left:auto;margin-right:10px}
.track{height:10px;background:#e6ecf3;border-radius:6px;overflow:hidden}#sc-bar{height:100%;width:0;background:var(--ok);transition:width .2s linear}
#sc-status{min-height:1.6em;margin:8px 0 0;font-size:.93rem;color:var(--mut)}
.opts{border-top:1px solid var(--line);margin-top:12px;padding-top:12px;display:grid;gap:12px}
.seg{display:grid;grid-template-columns:repeat(3,1fr);border:2px solid var(--line);border-radius:12px;overflow:hidden}
.seg label{position:relative;cursor:pointer}.seg input{position:absolute;opacity:0;inset:0;margin:0;cursor:pointer}
.seg span{display:block;text-align:center;padding:9px 4px;font-weight:600;font-size:.95rem}
.seg label+label span{border-left:1px solid var(--line)}.seg input:checked+span{background:var(--pri);color:#fff}
.dim{opacity:.55}.opt{display:flex;gap:10px;align-items:center;font-weight:600}
#sc-vib-note{font-size:.85rem;color:var(--mut);margin:-6px 0 0}
.vol{display:flex;align-items:center;gap:10px;font-size:.95rem}.vol input{flex:1;accent-color:var(--pri);min-height:32px}
.wave{display:flex;gap:4px;height:18px;align-items:flex-end;justify-content:center;margin-top:8px}
.wave i{width:5px;height:4px;background:var(--pri);border-radius:3px}.playing .wave i{animation:w .8s ease-in-out infinite}
.wave i:nth-child(2){animation-delay:.1s}.wave i:nth-child(3){animation-delay:.2s}.wave i:nth-child(4){animation-delay:.3s}.wave i:nth-child(5){animation-delay:.4s}
@keyframes w{50%{height:18px}}@media (prefers-reduced-motion:reduce){.playing .wave i{animation:none;height:10px}html{scroll-behavior:auto}}
main h2{font-size:1.32rem;margin:34px 0 8px;line-height:1.3}main h3{font-size:1.07rem;margin:20px 0 4px}
.toc{background:var(--card);border:1px solid var(--line);border-radius:12px;padding:12px 16px;margin-top:26px}.toc ol{margin:6px 0 0;padding-left:20px}
table{border-collapse:collapse;width:100%;font-size:.93rem;background:var(--card)}th,td{border:1px solid var(--line);padding:8px;text-align:left;vertical-align:top}
details{background:var(--card);border:1px solid var(--line);border-radius:10px;padding:10px 14px;margin:8px 0}summary{font-weight:600;cursor:pointer}
.cards{display:grid;gap:10px;list-style:none;padding:0}.cards a{display:block;background:var(--card);border:1px solid var(--line);border-radius:12px;padding:12px 14px;text-decoration:none;color:var(--ink)}
.cards strong{color:var(--pri)}.cards span{display:block;color:var(--mut);font-size:.92rem}
.cta{display:inline-block;background:var(--pri);color:#fff;padding:12px 18px;border-radius:12px;text-decoration:none;font-weight:700}
footer{margin:40px 0 0;padding:20px 0 30px;border-top:1px solid var(--line);color:var(--mut);font-size:.9rem}
footer ul{list-style:none;padding:0;display:flex;flex-wrap:wrap;gap:6px 16px;margin:0 0 10px}footer a{display:inline-block;padding:4px 0}
@media (min-width:620px){h1{font-size:1.95rem}.cards{grid-template-columns:1fr 1fr}}"""

LOGO = '<svg width="26" height="26" viewBox="0 0 32 32" aria-hidden="true"><rect width="32" height="32" rx="8" fill="#0b5cab"/><path d="M7 13h4l6-5v16l-6-5H7z" fill="#fff"/><path d="M21 12c1.5 1.2 1.5 6.8 0 8M24 9.5c3 2.5 3 10.5 0 13" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round"/></svg>'

def tool(modes, default, note='media volume 70–100%, silent mode off, Bluetooth off. Keep the phone away from your ear.'):
    cards = ''.join('<label><input type="radio" name="sc-mode" value="%s"%s><span>%s<small>%s</small></span></label>' % (m, ' checked' if m == default else '', *MODE_CARDS[m]) for m in modes)
    return f'''<section class="tool" aria-labelledby="tool-h">
<h2 id="tool-h" class="vh">Speaker cleaning tool</h2>
<div class="notice" role="note"><svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 10v4h4l5 4V6L7 10H3z" fill="currentColor"/><path d="M16 8.5a5 5 0 0 1 0 7M18.5 6a8.5 8.5 0 0 1 0 12" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"/></svg>
<span><strong>Volume check:</strong> {note}</span></div>
<fieldset><legend>Mode</legend><div class="modes">{cards}</div></fieldset>
<button id="sc-main" type="button" aria-pressed="false" aria-describedby="sc-status">
<svg class="i-play" width="26" height="26" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z" fill="currentColor"/></svg>
<svg class="i-stop" width="24" height="24" viewBox="0 0 24 24" aria-hidden="true"><rect x="6" y="6" width="12" height="12" rx="2" fill="currentColor"/></svg>
<span class="lbl">Start</span></button>
<div class="meter"><span id="sc-stage">&nbsp;</span><span id="sc-hz" aria-hidden="true">–</span><b id="sc-time" aria-label="Time remaining">0:00</b></div>
<div class="track" role="presentation"><div id="sc-bar"></div></div>
<div class="wave" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></div>
<p id="sc-status" role="status" aria-live="polite">Ready. Tap Start.</p>
<div class="opts">
<fieldset id="sc-ch-wrap" style="margin:0"><legend>Speaker</legend><div class="seg">
<label><input type="radio" name="sc-ch" value="left"><span>Left</span></label>
<label><input type="radio" name="sc-ch" value="both" checked><span>Both</span></label>
<label><input type="radio" name="sc-ch" value="right"><span>Right</span></label></div></fieldset>
<label class="opt"><input type="checkbox" id="sc-vib" aria-describedby="sc-vib-note">Vibrate with tone</label>
<p id="sc-vib-note">Uses your phone's vibration motor where the browser allows it (Android). Not available on iPhone.</p>
<div class="vol"><label for="sc-vol">Tone level</label><input id="sc-vol" type="range" min="10" max="100" value="80" step="5"><output id="sc-vol-out" for="sc-vol">80%</output></div>
</div></section>'''

def faq_html(items):
    return '<h2 id="faq">Frequently asked questions</h2>\n' + '\n'.join('<details><summary>%s</summary><p>%s</p></details>' % (html.escape(q), html.escape(a)) for q, a in items)

def faq_ld(items):
    return {"@context": "https://schema.org", "@type": "FAQPage", "mainEntity": [{"@type": "Question", "name": q, "acceptedAnswer": {"@type": "Answer", "text": a}} for q, a in items]}

def toc(body, extra):
    hs = re.findall(r'<h2 id="([^"]+)">(.*?)</h2>', body)
    items = ''.join('<li><a href="#%s">%s</a></li>' % (i, re.sub('<[^>]+>', '', t)) for i, t in hs if i != 'tool-h')
    items += ''.join('<li><a href="#%s">%s</a></li>' % e for e in extra)
    return '<nav class="toc" aria-label="Table of contents"><strong>On this page</strong><ol>%s</ol></nav>' % items

def related(path):
    li = ''.join('<li><a href="%s"><strong>%s</strong><span>%s</span></a></li>' % (p, n, d) for p, (n, d) in TOOLS.items() if p != path)
    return '<h2 id="more">More speaker tools</h2><ul class="cards">%s</ul>' % li

def page(path, title, desc, h1, lead, body, lds, tool_html='', robots='index, follow'):
    url = SITE + path
    nav = ''.join('<li><a href="%s"%s>%s</a></li>' % (p, ' aria-current="page"' if p == path else '', n) for p, n in NAV)
    ld = ''.join('<script type="application/ld+json">%s</script>\n' % json.dumps(x, ensure_ascii=False, separators=(',', ':')) for x in lds)
    js = '<script src="/assets/app.js" defer></script>\n' if tool_html else ''
    foot = ''.join('<li><a href="%s">%s</a></li>' % x for x in [('/', 'Speaker cleaner')] + NAV + [('/about/', 'About'), ('/contact/', 'Contact'), ('/privacy.html', 'Privacy')])
    return f'''<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="google-site-verification" content="2jIgZuEql-BJPFPYbGsHNpLBpYFmeJlYRwIXqB-n86M">
<title>{html.escape(title)}</title>
<meta name="description" content="{html.escape(desc)}">
<link rel="canonical" href="{url}">
<meta name="robots" content="{robots}">
<meta name="theme-color" content="#0b5cab">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Speaker Cleaner">
<meta property="og:title" content="{html.escape(title)}">
<meta property="og:description" content="{html.escape(desc)}">
<meta property="og:url" content="{url}">
<meta property="og:image" content="{SITE}/og.png">
<meta name="twitter:card" content="summary_large_image">
<style>{CSS}</style>
{ld}</head>
<body>
<a class="skip" href="#content">Skip to content</a>
<header class="top"><div class="wrap">
<a class="brand" href="/">{LOGO}Speaker Cleaner</a>
<nav aria-label="Tools"><ul class="nav">{nav}</ul></nav>
</div></header>
<main id="content" class="wrap">
<h1>{h1}</h1>
<p class="lead">{lead}</p>
{tool_html}
{body}
</main>
<footer><div class="wrap">
<ul>{foot}</ul>
<p>Speaker Cleaner is a free, open-source tool. Tones are generated locally in your browser and no personal data is collected. It cannot fix hardware damage; for long liquid exposure, consult the manufacturer or a qualified repair service.</p>
</div></footer>
{js}</body>
</html>
'''

def crumbs(path, name):
    it = [{"@type": "ListItem", "position": 1, "name": "Speaker Cleaner", "item": SITE + '/'}]
    if path != '/': it.append({"@type": "ListItem", "position": 2, "name": name, "item": SITE + path})
    return {"@context": "https://schema.org", "@type": "BreadcrumbList", "itemListElement": it}

def webapp(path, name, desc):
    return {"@context": "https://schema.org", "@type": "WebApplication", "name": name, "url": SITE + path, "description": desc,
            "applicationCategory": "UtilitiesApplication", "operatingSystem": "Any (iOS, Android, Windows, macOS) with a modern web browser",
            "browserRequirements": "Requires a browser with Web Audio API support", "isAccessibleForFree": True,
            "offers": {"@type": "Offer", "price": "0", "priceCurrency": "USD"}}

def write(path, s):
    f = os.path.join(ROOT, path.strip('/'), 'index.html') if path.endswith('/') else os.path.join(ROOT, path.lstrip('/'))
    os.makedirs(os.path.dirname(f), exist_ok=True)
    open(f, 'w', encoding='utf-8').write(s)

TOOL_PAGES = [
 dict(path='/', modes=['water', 'sweep', 'dust', 'auto'], default='water', name='Speaker Cleaner',
      title='Speaker Cleaner – Free Sound to Clean Phone Speaker & Eject Water',
      desc='Free online speaker cleaner. Play a 165 Hz water eject tone, a low sweep, a dust tone band or an 80-second auto clean cycle, on the left, right or both speakers. No app needed.',
      h1='Speaker Cleaner: Free Sound to Eject Water &amp; Clean Your Phone Speaker',
      lead='Pick a mode, turn your volume up, point the speaker down and tap Start. Everything runs in your browser.',
      body=lambda: rd('home.frag').replace('<h2 id="limits">', rd('home_extra.frag') + '\n<h2 id="limits">'), faq='home_faq.json'),
 dict(path='/water-eject/', modes=['water', 'auto', 'sweep'], default='water', name='Water Eject',
      title='Water Eject – 165 Hz Sound to Remove Water from Your Phone Speaker',
      desc='Water eject tone online: play a 165 Hz sound or an auto clean cycle to push water out of a wet phone speaker. Left, right or both speakers. Free, no app.',
      h1='Water Eject Sound: 165 Hz Tone to Get Water Out of Your Speaker',
      lead='Point the wet speaker down, turn the volume up and tap Start to play the 165 Hz water eject tone.',
      body=lambda: rd('water-eject.frag'), faq='water-eject_faq.json'),
 dict(path='/dust-cleaner/', modes=['dust', 'sweep', 'water'], default='dust', name='Speaker Dust Cleaner',
      title='Speaker Dust Cleaner – Tone to Remove Dust & Lint from Phone Speaker',
      desc='Clean dust and lint from your phone speaker with a stepped 200–1500 Hz tone band, plus brushing tips and a monthly routine. Free online speaker dust cleaner.',
      h1='Speaker Dust Cleaner: 200–1500 Hz Tone for Dust &amp; Lint',
      lead='Brush the grille gently first, then tap Start to shake out remaining dust with stepped tones.',
      body=lambda: rd('dust-cleaner.frag'), faq='dust-cleaner_faq.json'),
 dict(path='/vibration-cleaner/', modes=['vibe', 'water', 'dust'], default='vibe', name='Vibration Speaker Cleaner',
      title='Vibration Cleaner – Speaker Cleaning Sound with Phone Vibration',
      desc='Combine low pulse tones with your phone\'s vibration motor to shake water and debris out of the speaker. Works on Android; tone-only on iPhone. Free online.',
      h1='Vibration Speaker Cleaner: Pulse Tones Plus Phone Vibration',
      lead='Take off the case, hold the phone loosely with the speaker down and tap Start.',
      body=lambda: rd('vibration-cleaner.frag'), faq='vibration-cleaner_faq.json'),
 dict(path='/speaker-test/', modes=['lrtest', 'fsweep'], default='lrtest', name='Speaker Test', note='start around 50% media volume, silent mode off. Pure tones can sound louder than music.',
      title='Speaker Test – Left / Right Stereo Check & Frequency Sweep Online',
      desc='Free online speaker test: check your left and right speakers and run a 50 Hz to 16 kHz frequency sweep to hear rattles or muffled sound after cleaning.',
      h1='Speaker Test: Left / Right Channel Check &amp; Frequency Sweep',
      lead='Set volume to about 50%, choose a test and tap Start. The display shows which channel is playing.',
      body=lambda: rd('speaker-test.frag'), faq='speaker-test_faq.json'),
]

def main():
    urls = []
    for p in TOOL_PAGES:
        items = faqs(p['faq'])
        body = p['body']()
        full = toc(body, [('more', 'More speaker tools'), ('faq', 'FAQ')]) + '\n' + body + '\n' + related(p['path']) + '\n' + faq_html(items)
        lds = [webapp(p['path'], p['name'], p['desc']), faq_ld(items)] + ([crumbs(p['path'], p['name'])] if p['path'] != '/' else [])
        write(p['path'], page(p['path'], p['title'], p['desc'], p['h1'], p['lead'], full, lds, tool(p['modes'], p['default'], *([p['note']] if 'note' in p else []))))
        urls.append(p['path'])
    for path, typ, name, title, desc, h1, lead, src in [
        ('/about/', 'AboutPage', 'About', 'About Speaker Cleaner – Free, Open-Source Speaker Cleaning Tones', 'About Speaker Cleaner: a free, open-source website that plays tones to help clear water and dust from phone speakers, with no app, ads or tracking.', 'About Speaker Cleaner', 'A free, private and open-source way to clean your phone speaker with sound.', 'about.frag'),
        ('/contact/', 'ContactPage', 'Contact', 'Contact – Speaker Cleaner', 'Contact Speaker Cleaner: report a bug, suggest a feature or correct a guide through the project\'s public GitHub issue tracker.', 'Contact', 'Questions, bug reports and ideas are handled through GitHub Issues.', 'contact.frag')]:
        body = rd(src)
        lds = [{"@context": "https://schema.org", "@type": typ, "name": title, "url": SITE + path, "description": desc}, crumbs(path, name)]
        write(path, page(path, title, desc, h1, lead, body, lds))
        urls.append(path)
    pv = rd('privacy.frag')
    write('/privacy.html', page('/privacy.html', 'Privacy Note – Speaker Cleaner', 'Privacy note for Speaker Cleaner: tones are generated locally in your browser and no personal data is collected.', 'Privacy note', 'Last updated: 26 October 2026', pv, [crumbs('/privacy.html', 'Privacy')]))
    urls.append('/privacy.html')
    pri = {'/': '1.0', '/about/': '0.4', '/contact/': '0.3', '/privacy.html': '0.2'}
    sm = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + ''.join(
        '  <url><loc>%s%s</loc><lastmod>2026-10-26</lastmod><priority>%s</priority></url>\n' % (SITE, u, pri.get(u, '0.8')) for u in urls) + '</urlset>\n'
    open(os.path.join(ROOT, 'sitemap.xml'), 'w').write(sm)
    print('\n'.join(urls))

if __name__ == '__main__':
    main()
