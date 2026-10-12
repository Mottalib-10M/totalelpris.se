/**
 * Courbe en barres des prix finaux collés par l'utilisateur (SVG, aucune bibliothèque). Une barre par
 * créneau ; la fenêtre la moins chère est surlignée. Rien n'est affiché tant qu'aucune liste n'est collée.
 */
import { klockslag } from '../../lib/engine/kvart';
import { formatNumber } from '../../lib/format';

interface Props { priser: number[]; minuter: number; markStart?: number; markLen?: number; lang: 'sv' | 'en'; aria: string }

export default function Kurva({ priser, minuter, markStart = -1, markLen = 0, lang, aria }: Props) {
  if (!priser.length) return null;
  const W = 640, Hh = 180, pad = 28;
  const max = Math.max(...priser, 1), min = Math.min(0, ...priser);
  const span = max - min || 1;
  const bw = (W - pad) / priser.length;
  const y = (v: number) => 8 + ((max - v) / span) * (Hh - 30);
  const y0 = y(0);
  const tick = minuter === 15 ? 16 : 4;
  return (
    <figure className="mt-4">
      <svg viewBox={`0 0 ${W} ${Hh}`} role="img" aria-label={aria} className="h-auto w-full">
        <line x1={pad} x2={W} y1={y0} y2={y0} stroke="#94a3b8" strokeWidth="1" />
        {priser.map((v, i) => {
          const inMark = markStart >= 0 && i >= markStart && i < markStart + markLen;
          const top = Math.min(y(v), y0), h = Math.max(1, Math.abs(y(v) - y0));
          return <rect key={i} x={pad + i * bw} y={top} width={Math.max(1, bw - (minuter === 15 ? 0.6 : 2))} height={h} fill={inMark ? '#b45309' : '#006AA7'} opacity={inMark ? 1 : 0.85} />;
        })}
        {priser.map((_, i) => (i % tick === 0 ? <text key={`t${i}`} x={pad + i * bw} y={Hh - 4} fontSize="11" fill="#334155">{klockslag(i, minuter)}</text> : null))}
        <text x="0" y="14" fontSize="11" fill="#334155">{formatNumber(max, 0, lang)}</text>
        <text x="0" y={y0 + 4} fontSize="11" fill="#334155">0</text>
      </svg>
      <figcaption className="mt-1 text-xs text-navy-700">{lang === 'sv' ? 'Totalpris i öre/kWh inkl. moms per tidsperiod. Brun stapel: billigaste perioden för den längd du valt.' : 'All-in price in öre/kWh incl. VAT per time slot. Brown bars: the cheapest window for the length you chose.'}</figcaption>
    </figure>
  );
}
