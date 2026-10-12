#!/usr/bin/env python3
"""Relève sur Nätområden.se (carte de Svenska kraftnät et Lantmäteriet) le propriétaire et l'elområde de
chaque nätområde (réseau local), par son code. Écrit research/natomraden.json. Une requête par code,
espacées d'une demi-seconde. Usage : python3 scripts/data/build-natomraden.py"""
import json, re, time, urllib.request, urllib.parse
UA = {'User-Agent': 'Mozilla/5.0 (Macintosh) Elpriskollen-research'}
home = urllib.request.urlopen(urllib.request.Request('https://www.natomraden.se/', headers=UA)).read().decode('utf-8')
sel = home[home.index('id="natomradeKod"'):]
sel = sel[:sel.index('</select>')]
codes = [c for c in re.findall(r'<option value="([A-Z0-9]{2,4})"', sel)]
out = []
for c in codes:
    body = urllib.parse.urlencode({'snitt': '%', 'natomradeKod': c, 'natomradeNamn': '0', 'natbolag': '0', 'kommunNamn': '0'}).encode()
    try:
        h = urllib.request.urlopen(urllib.request.Request('https://www.natomraden.se/', data=body, headers=UA), timeout=30).read().decode('utf-8')
        m = re.search(r'var data = eval\((\[.*?\])\);', h, re.S)
        for f in json.loads(m.group(1)):
            p = f['properties']
            if p.get('omr') == c:
                out.append({'kod': c, 'namn': p['namn'], 'bolag': p['bolag'], 'elomrade': f"SE{p['snitt']}"})
                break
    except Exception as e:
        print('fel', c, e)
    time.sleep(0.5)
json.dump({'source': 'Nätområden.se (Svenska kraftnät), relevé du ' + time.strftime('%Y-%m-%d'), 'omraden': out}, open('research/natomraden.json', 'w'), ensure_ascii=False, indent=0)
print(len(codes), 'koder,', len(out), 'lästa')
