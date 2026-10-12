#!/usr/bin/env python3
"""Convertit le relevé Ei « Elnätsföretagens avgifter för hushållskunder 2022–2026 » (xlsx publié par
Energimarknadsinspektionen) en src/data/ei-nat.json, lu par le moteur (lib/engine/nat.ts).

Une ligne = une redovisningsenhet (zone de concession d'un réseau, identifiant REL…). Pour chaque cas type
d'Ei (lägenhet 16 A 2 000 kWh, villa 16 A 5 000 kWh, villa 20 A 10 000 et 20 000 kWh, villa 25 A 20 000
et 30 000 kWh) : redevances d'autorités, abonnement fixe, prix variable (1 ou 2 prix), total annuel, tous
HORS moms, et nombre de points de soutirage. Années 2026 et 2025.
Usage : python3 scripts/data/build-ei.py research/ei-natavgifter/ei-hushallskunder-2022-2026.xlsx
"""
import json, sys, openpyxl

src = sys.argv[1] if len(sys.argv) > 1 else 'research/ei-natavgifter/ei-hushallskunder-2022-2026.xlsx'
ws = openpyxl.load_workbook(src, read_only=True, data_only=True).worksheets[0]
rows = list(ws.iter_rows(values_only=True))
codes = rows[1]
# Colonne de départ (année 2026) de chaque code ; l'année 2025 est la colonne suivante.
col = {}
for i, c in enumerate(codes):
    if c and c not in col:
        col[c] = i
CAS = {
    'L16': ('NT1610', 'NT1620', ['NT1630'], 'NT1600', 'NT1660', 2000),
    'V16': ('NT2010', 'NT2020', ['NT2030'], 'NT2000', 'NT2070', 5000),
    'V20a': ('NT3010', 'NT3020', ['NT3030', 'NT3040'], 'NT3000', 'NT3070', 10000),
    'V20': ('NT4010', 'NT4020', ['NT4030', 'NT4040'], 'NT4000', 'NT4070', 20000),
    'V25': ('NT5010', 'NT5020', ['NT5030', 'NT5040'], 'NT5000', 'NT5050', 20000),
    'V25b': ('NT6010', 'NT6020', ['NT6030', 'NT6040'], 'NT6000', 'NT6070', 30000),
}
def val(r, code, off):
    if code not in col: return None
    v = r[col[code] + off]
    return None if v in (None, '') else float(v)
out = []
for r in rows[4:]:
    if not r[0] or not str(r[0]).startswith('REL'):
        continue
    e = {'rel': r[0], 'foretag': r[1].strip(), 'grupp': (r[2] or '').strip(), 'cas': {}}
    for k, (myn, fast, rorl, tot, upk, kwh) in CAS.items():
        for off, ar in ((0, 2026), (1, 2025)):
            t = val(r, tot, off)
            if t is None: continue
            rl = [val(r, x, off) for x in rorl]
            e['cas'].setdefault(k, {})[str(ar)] = {
                'myndighet': val(r, myn, off), 'fast': val(r, fast, off),
                'rorlig': [x for x in rl if x is not None], 'total': t, 'punkter': val(r, upk, off)}
    if e['cas']:
        out.append(e)
json.dump({'source': 'Energimarknadsinspektionen (Ei), Elnätsföretagens avgifter för hushållskunder 2022–2026', 'kwh': {k: v[5] for k, v in CAS.items()}, 'enheter': out},
          open('src/data/ei-nat.json', 'w'), ensure_ascii=False, separators=(',', ':'))
n26 = sum(1 for e in out if any('2026' in c for c in e['cas'].values()))
print(len(out), 'enheter,', n26, 'avec 2026')
