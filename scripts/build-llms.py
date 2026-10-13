#!/usr/bin/env python3
"""Skapar public/llms.txt från bygget (RECETTE §21). Aufruf: npm run build && python3 scripts/build-llms.py && npm run build"""
import glob, html, os, re
SITE = re.search(r'SITE_URL = "([^"]+)"', open('src/data/site-config.ts').read()).group(1)
rows = {'sv': [], 'en': []}
for f in sorted(glob.glob('dist/*/**/index.html', recursive=True)):
    d = open(f, encoding='utf-8').read()
    if 'noindex' in d[:3000] or '/embed/' in f: continue
    path = '/' + os.path.relpath(os.path.dirname(f), 'dist').replace(os.sep, '/') + '/'
    lang = path.split('/')[1]
    if lang not in rows: continue
    t = html.unescape(re.search(r'<title>(.*?)</title>', d, re.S).group(1))
    m = re.search(r'name="description" content="(.*?)"', d, re.S)
    rows[lang].append((path, t, html.unescape(m.group(1)) if m else ''))
out = ['# Elpriskollen', '',
       '> Oberoende sajt av Radif Partners på svenska och engelska om det totala elpriset i Sverige 2026: spotpris i elområde SE1–SE4, energiskatt, moms, elnätsavgifter och effektavgifter, jämförelse av rörligt, fast och timprisavtal samt kostnad för apparater och laddning av elbil.', '',
       'Alla beräkningar körs i webbläsaren; ingen datainsamling, ingen förmedling till elbolag. Resultaten är uppskattningar.', '']
for lang, titel in (('sv', '## Sidor på svenska'), ('en', '## Pages in English')):
    out.append(titel); out.append('')
    for p, t, d in rows[lang]: out.append(f'- [{t}]({SITE}{p}): {d}')
    out.append('')
open('public/llms.txt', 'w', encoding='utf-8').write('\n'.join(out))
print('llms.txt:', sum(len(v) for v in rows.values()), 'sidor')
