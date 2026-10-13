# Lägga till en sida på Elpriskollen (se-elpris)

Notice pour les agents qui écrivent ou prolongent le site. À lire en entier avant d'écrire une ligne, avec
`~/Documents/GitHub/RECETTE-SITE.md` (§0, §6, §6.5, §7, §9.3, §11, §17.4, §21, §26) et le brief
`~/Documents/GitHub/reports/BRIEF-NOUVEAUX-SITES-2026-10-12.md`.

Site : le **prix final de l'électricité en Suède** (elpris idag), en suédois (`/sv/`) et en anglais (`/en/`, pour
un expatrié qui vit en Suède). Éditeur : Radif Partners (jamais de nom de personne). Aucun lien vers un autre
site du portefeuille (`_trame/domaines-ovh.txt`), en particulier lonkalkylator.se et se-bidrag.

## La règle des données (non négociable)

- **Aucun prix spot n'est affiché, téléchargé ni appelé**, ni au build ni dans le navigateur. Les prix day-ahead
  ne figurent pas dans la liste CC BY 4.0 d'ENTSO-E (« List of data available for free re-use », art. 12.1.d
  absent, conditions de 2023) ; leur republication publique demande l'accord de Nord Pool, qui la vend
  (`reports/niches-2026-10-12/rpm/verif-13-14.md`). Energi Data Service (Energinet) ne couvre que SE3 et SE4,
  n'envoie pas d'en-tête CORS, et ses conditions ne disent pas qu'Energinet détient les droits sur des prix
  produits par la bourse. L'API de elprisetjustnu.se reprend ENTSO-E sans licence documentée. Nord Pool : jamais.
- L'utilisateur **saisit** son spot ou **colle** la liste des 96 quarts d'heure (depuis l'application de son
  fournisseur ou la plateforme ENTSO-E, qu'il consulte lui-même). Le site le dit sur l'accueil et dans la méthode.
- Ce que le site publie, et sous quel droit :
  - **SCB, Elpriser och elavtal (EN0301A)** : licence **CC0** (« Vi använder licensen CC0 », scb.se/vara-tjanster/oppna-data,
    lu le 2026-10-12). Prix mensuels facturés par avtalstyp × elområde × kundkategori depuis 2013 (öre/kWh, hors
    elskatt, moms et nät, påslag compris), prix total semestriel des ménages, prix de réseau au 1er janvier.
    Script : `node scripts/data/build-scb.mjs` → `src/data/scb-elpriser.json`.
  - **Energimarknadsinspektionen (Ei), Nätavgifter elnät, Hushållskunder** : « Ei:s öppna data kan som vem som
    helst kan nyttja, återanvända och dela med sig av » (ei.se/om-oss/statistik-och-oppna-data/oppna-data, lu le
    2026-10-12). Fichier : https://www.ei.se/download/18.71c90939186a1c167f0131a5/1778570543830/Hush%C3%A5llskunder-eln%C3%A4tsf%C3%B6retagens-eln%C3%A4tsavgifter.xlsx
    (copie dans `research/ei-natavgifter/`). Script : `python3 scripts/data/build-ei.py <xlsx>` → `src/data/ei-nat.json`.
    Ei avertit que, pour 2026, certains réseaux ont déclaré les anciennes myndighetsavgifter (105,45 kr) : le moteur
    les remplace par 139,89 kr (`params-2026.json > nat`).
  - **Nätområden.se** (Svenska kraftnät et Lantmäteriet) : propriétaire et elområde de chaque réseau local, relevé
    par `python3 scripts/data/build-natomraden.py` → `research/natomraden.json` (278 zones). On cite la zone d'une
    ville d'après ce relevé, jamais de mémoire.
  - Lois et administrations (Skatteverket, riksdagen.se, Försäkringskassan, Energimyndigheten, Energimarknadsbyrån) :
    faits relus le 2026-10-12 dans `research/faits-taxes.md`. **Tout ce qui y est marqué NON CONFIRMÉ ne se publie pas**
    (heure exacte de publication des prix, liste des villes par zone hors relevé Nätområden, consommation du four,
    de la bouilloire, de la pompe à chaleur, de la voiture électrique, montants des elstöd 2022–2023, taux 2027).

## Principe : une page = un fichier

- Une page outil = `src/content/outils/<id>.ts` (champ `tool` + `toolProps`), un guide = `src/content/guides/<id>.ts`
  (champ `mini`). Le fichier porte tout dans les deux langues ; le cœur (routes, menus, pied de page, sitemap,
  hreflang, schémas) le lit seul. **Ne modifiez aucun fichier du cœur** (`src/components`, `src/lib/*.ts`,
  `src/lib/engine`, `src/i18n`, `src/data/params-2026.json`).
- Plan des pages (id, groupe, slugs) : `tests/plan.json`. Un lien `h.a(id, …)` ou `related` vise un id du plan.
- Modèle de page outil : `src/content/outils/elpris-stockholm.ts` (structure seulement, jamais les phrases).
- Nouveau mini-simulateur : `src/lib/minis/<kind>.ts` (modèle `energiskatt.ts`, outils `_kit.ts`). Il appelle le
  moteur (`../engine/…`), jamais un calcul refait à côté, et chaque libellé existe en sv et en en.
- Nouvelles sources : **ne touchez pas `params-2026.json`**. Créez `src/data/sources/<votre-famille>.json` au même
  format (`{ "cle": { "url": "https://…", "label": { "sv": "…", "en": "…" } } }`) ; une clé n'existe qu'une fois sur
  tout le site. Seulement des sources officielles, lues, avec l'URL exacte.

## Les outils (`tool` et `toolProps`)

| tool | Composant | toolProps |
|---|---|---|
| `pris` | `PrisCalc` : spot saisi → prix final, facture du mois, liste collée | `nat: 'Entreprise|groupe'` (recherche dans le relevé Ei), `zon: 'SE1'…'SE4'`, `fall: 'L16'|'V16'|'V20'|'V25'`, `skatt: 1` (taux réduit), `mode: 'idag'|'imorgon'|'rakning'` |
| `apparat` | `ApparatCalc` | `apparat: 'tvattmaskin'|'torktumlare'|'diskmaskin'|'dusch'|'frys'|'bastu'` (données `params-2026.json > apparater`), plus `nat`, `zon`, `fall`, `skatt` |
| `elbil` | `ElbilCalc` | `nat`, `zon`, `fall`, `skatt` |
| `historik` / `avtal` | `HistorikCalc` (SCB) | `zon` |
| `nat` | `NatCalc` (classement Ei) | `nat`, `fall` |

`nat` doit exister dans `src/data/ei-nat.json` avec un tarif 2026 pour le `fall` choisi, sinon le build échoue
(`lib/verktyg.ts`). Noms exacts : `python3 -c "import json;[print(e['foretag'],'|',e['grupp']) for e in json.load(open('src/data/ei-nat.json'))['enheter']]"`.
Pièges connus : Ellevio, Göteborg Energi, Karlstads Elnät, Jönköping Energinät, Tekniska verken Linköping et Växjö
Energi n'ont en 2026 que le cas lägenhet (villas en effektavgift) ; Eskilstuna n'a pas le cas lägenhet ; Mälarenergi
n'a aucun cas 2026 ; « Tekniska verken » seul trouve Katrineholm : écrire `Tekniska verken Linköping`.

## Le moteur (exposé dans les textes par `h.M`, paramètres par `h.P`)

| Fonction | Rôle |
|---|---|
| `totalpris({ spot, paslag, natOverforing, energiskatt, momsSats })` | prix variable TTC par kWh et ses parts |
| `manadskostnad({ kwh, prisTotalOre, natFastKrPerAr })` | facture du mois (fixe TTC à passer) |
| `laddning({ batteriKwh, franPct, tillPct, laddeffektKw, forlustPct })` | énergie réseau et durée d'une recharge |
| `hittaEnhet(foretag, grupp?)`, `natTariff(e, fall, ar?)`, `rangordna(fall)`, `placering(e, fall)`, `median` | relevé Ei (montants HORS moms) |
| `varde(avtal, zon, kat, manad?)`, `serie`, `senaste`, `arssnitt`, `jamforAvtal`, `husPris`, `natSnitt`, `SENASTE_MANAD`, `manadDelar` | SCB (öre/kWh HORS moms) |
| `lasSerie`, `tillOre`, `statistik`, `billigasteFonster`, `klockslag` | liste de prix collée |

Paramètres : `h.P.skatt` (energiskatt 36,0 ; réduit 26,4 ; avdrag 9,6 ; 2025 43,9 ; moms 0,25 ; liste des
kommuner), `h.P.nat` (myndighetsavgifter), `h.P.elstod`, `h.P.marknad`, `h.P.forbrukning`, `h.P.apparater`.
**Une valeur réglementaire ne s'écrit jamais en dur** : `${h.ore(h.P.skatt.energiskatt_ore)}`, pas « 36 öre ».
Les montants Ei et SCB sont hors moms : multipliez par `(1 + h.P.skatt.moms)` quand vous écrivez « inkl. moms ».

## Les champs d'une page (`src/lib/guide-types.ts`)

| Champ | Règle |
|---|---|
| `id` | = nom du fichier, = id du plan. |
| `group` | `pris`, `omrade`, `stad`, `nat`, `apparat`, `guide` (celui du plan). |
| `order` | place dans le groupe, par pas de 10. |
| `tool` + `toolProps` ou `mini` | outil pour une page outil, mini-simulateur obligatoire pour un guide. |
| `related` | 3 à 6 ids du plan. |
| `sources` | 2 clés au moins (params ou `data/sources/*.json`). |
| `sv`, `en` | le texte. |

| Champ texte | Règle |
|---|---|
| `slug` | celui du plan. |
| `title` | **50 à 60 caractères**, année 2026, terme-clé d'abord (« Elpris Göteborg 2026: … », « Energiskatt el 2026: … ») ; jamais « Sverige/Sweden/Swedish », un mot d'outil (Kalkylator, Räknare, Calculator), une question ni une rubrique en tête. Tout nombre ≥ 13 du titre ou de la description doit se retrouver dans le texte rendu (test). Pas de tiret cadratin. |
| `description` | **150 à 160 caractères**, année 2026, un fait chiffré. |
| `h1` | sans année. |
| `intro` | une phrase. |
| `resume` | `(h) => string` : **UN** paragraphe d'au moins **120 mots** (viser 125–160), texte brut sans lien, chiffres via `h.ore`, `h.kr`, `h.num`. Sur une page outil il est replié après sa première phrase : la première phrase doit dire le chiffre. |
| `faqs` | `(h) => FAQ[]` : page outil 3 à 6, guide 4 à 8 vraies questions ; réponses de **40 à 90 mots** (viser 45–85) avec chiffre, condition et source. Une question n'existe qu'une fois sur tout le site, langues comprises (test). |
| `body` | `(h) => string` HTML (`h2`, `h3`, `p`, `ul`, `ol`, `h.table(...)`). Total (corps + bloc citable + FAQ) : **≥ 470 mots pour une page outil** (viser 550–750), **≥ 1 150 pour un guide** (viser 1 250–1 500). `<!--mini:<kind>-->` insère un mini-simulateur de plus. |

Outils `h` : `h.a(id, texte)`, `h.kr(n, d?)`, `h.ore(n, d?)` (« 86,9 öre/kWh »), `h.num(n, d?)`, `h.pct(x, d?)`,
`h.date(iso)`, `h.table(entêtes, lignes, légende, align)`, `h.src(clé, texte)`, `h.P`, `h.M`.

## Ton, langue, unicité

- **Suédois** : voix humaine, phrases de longueur variable, le chiffre d'abord ; vocabulaire de la facture
  (elhandel, elnät, överföringsavgift, fast avgift, säkring, påslag, rörligt, kvartspris, elområde).
- **Anglais** : pour un expatrié en Suède, chaque terme suédois expliqué à sa première apparition (elnätsföretag,
  överföringsavgift, anvisat avtal, BankID si utile) ; montants en kronor et öre. Pas une traduction mot à mot.
- **Interdits** : tiret cadratin «, », « det är viktigt att notera », « it's important to note », « dive into »,
  « whether you're… », triplets systématiques, conclusions-résumés, émojis, liens vers des sites non officiels.
- **Unicité** (§6) : `check-unique` compare toutes les pages d'une langue (seuil 30 %, chiffres neutralisés, tableaux
  retirés, fenêtre de 12 000 caractères en tête). Les pages d'une même famille (villes, zones, appareils) doivent
  différer par le **vocabulaire**, pas seulement les chiffres : chaque ville a son angle (son réseau, son historique de
  tarif 2025→2026, sa place au classement, le taux réduit au nord, le cas lägenhet seul, la zone frontière…), chaque
  appareil son usage. Ne reprenez aucune tournure d'une autre page, ni de l'accueil.
- **Vérité** : aucun chiffre sans source lue ; rien sur les fournisseurs (Tibber, Greenely…) ; aucune affirmation sur
  une commune ou un quartier qui ne vient pas du relevé Nätområden ou d'Ei ; pas de prix spot.

## Contrôles (tous à 0)

```bash
cd ~/Documents/GitHub/a-publier/Mottalib-10M/se-elpris
export NODE_PATH=$(npm root -g):$PWD/node_modules
PAGE_FILES=<id> npx vitest run tests/pages.test.ts            # une page seule
PAGE_FILES=<id1>,<id2> npx vitest run tests/lint.test.ts --silent=false   # longueurs hors règle d'un coup
PLAN_COMPLET=1 npx vitest run                                # toutes les pages du plan existent
npm run build                                                # typo-nbsp + check-snippets (bloquant)
S=scripts
python3 $S/check-seo.py . && python3 $S/check-trame.py . && python3 $S/check-unique.py dist
python3 $S/check-simulateurs.py . && python3 $S/check-hreflang.py . && python3 $S/check-anglais.py .
python3 $S/check-regles.py . && python3 $S/check-portefeuille.py . && python3 $S/check-liens.py dist
node $S/check-sources.mjs . && node $S/check-legal.mjs . && node $S/typo-nbsp.mjs dist --check
node $S/check-contraste.mjs dist && node $S/check-saisie.mjs dist --max=60 && node $S/check-nombres.mjs dist
node $S/check-url-propre.mjs dist && node $S/check-premier-ecran.mjs . && python3 $S/check-snippets.py .
node $S/check-layout.mjs dist > /tmp/layout-se-elpris.log 2>&1 &   # long, en arrière-plan
```

Serveur local : port **4448** (`npx astro preview --port 4448`). Arrêt : `lsof -ti tcp:4448 | xargs kill`, jamais `pkill -f`.

## Mise à jour

- Chaque mois (après la publication SCB, vers le 23) : `node scripts/data/build-scb.mjs`, tests, build.
- Chaque année (fichier Ei publié au printemps) : nouveau xlsx dans `research/ei-natavgifter/`, `build-ei.py`,
  `params-2027.json` (energiskatt 2027 : la loi l'indexe, une promemoria de mars 2026 propose 36,0 öre ; à relire
  après le vote du budget), tests.
- Domaine définitif : l'URL `https://totalelpris.se` est provisoire (`astro.config.mjs`, `site-config.ts`).
