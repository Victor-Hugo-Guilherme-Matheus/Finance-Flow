import { useId, useMemo } from "react";
import { formatCurrency } from "../../utils/format";
import { useLanguage } from "../../i18n/LanguageContext";

interface BalanceHeroProps {
  balance: number;
  /** Receitas − despesas do mês atual */
  monthNet: number;
  /** Saldo de cada mês, do mais antigo ao mais recente */
  trend: number[];
}

const W = 400;
const H = 220;
const FALLBACK = [0.32, 0.46, 0.4, 0.58, 0.52, 0.7];

/** Normaliza para 0..1; com poucos dados usa uma curva neutra */
function normalize(values: number[]): number[] {
  if (values.length < 2) return FALLBACK;
  const min = Math.min(...values);
  const max = Math.max(...values);
  if (max - min < 1e-6) return values.map(() => 0.5);
  return values.map((v) => (v - min) / (max - min));
}

/** Curva suave (Catmull-Rom → Bézier) passando pelos pontos */
function smoothPath(points: [number, number][]): string {
  if (points.length < 2) return "";
  let d = `M${points[0][0].toFixed(1)},${points[0][1].toFixed(1)}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] ?? points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] ?? p2;
    const c1x = p1[0] + (p2[0] - p0[0]) / 6;
    const c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6;
    const c2y = p2[1] - (p3[1] - p1[1]) / 6;
    d += ` C${c1x.toFixed(1)},${c1y.toFixed(1)} ${c2x.toFixed(1)},${c2y.toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`;
  }
  return d;
}

function toPoints(norm: number[], top: number, bottom: number): [number, number][] {
  const step = W / (norm.length - 1);
  return norm.map((v, i) => [i * step, bottom - v * (bottom - top)]);
}

/** Separa "R$", parte inteira e centavos para dar hierarquia ao número */
function splitCurrency(value: number) {
  const parts = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).formatToParts(
    value
  );
  const symbol = parts.find((p) => p.type === "currency")?.value ?? "R$";
  const sign = parts.find((p) => p.type === "minusSign")?.value ?? "";
  const integer = parts
    .filter((p) => p.type === "integer" || p.type === "group")
    .map((p) => p.value)
    .join("");
  const fraction = parts.find((p) => p.type === "fraction")?.value ?? "00";
  const decimal = parts.find((p) => p.type === "decimal")?.value ?? ",";
  return { symbol, sign, integer, cents: `${decimal}${fraction}` };
}

/**
 * Cartão de saldo. A linha do fundo é o histórico real de saldo mensal,
 * em três profundidades que se deslocam em velocidades diferentes ao rolar
 * (paralaxe em CSS, ver .ff-hero-layer em motion.css).
 */
export default function BalanceHero({ balance, monthNet, trend }: BalanceHeroProps) {
  const { t } = useLanguage();
  const id = useId().replace(/:/g, "");
  const { symbol, sign, integer, cents } = splitCurrency(balance);

  const paths = useMemo(() => {
    const norm = normalize(trend);
    const main = toPoints(norm, 138, 204);
    const echo = toPoints(
      norm.map((v, i) => Math.min(1, v * 0.7 + 0.18 + (i % 2 ? 0.05 : -0.03))),
      118,
      200
    );
    const deep = toPoints(
      norm.map((v) => v * 0.45 + 0.35),
      100,
      214
    );
    const mainD = smoothPath(main);
    return {
      main: mainD,
      area: `${mainD} L${W},${H} L0,${H} Z`,
      echo: smoothPath(echo),
      deep: `${smoothPath(deep)} L${W},${H} L0,${H} Z`,
      end: main[main.length - 1],
    };
  }, [trend]);

  const positive = monthNet >= 0;

  return (
    <section className="ff-hero p-6 pb-24 mb-6" aria-label={t("home.totalBalance")}>
      <svg
        className="ff-hero-art"
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="xMidYMax slice"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id={`area-${id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#fff" stopOpacity="0.22" />
            <stop offset="1" stopColor="#fff" stopOpacity="0" />
          </linearGradient>
          <radialGradient id={`glow-${id}`}>
            <stop offset="0" stopColor="#fff" stopOpacity="0.9" />
            <stop offset="1" stopColor="#fff" stopOpacity="0" />
          </radialGradient>
        </defs>

        <g className="ff-hero-layer" data-depth="1">
          <path d={paths.deep} fill="#fff" opacity="0.06" />
        </g>
        <g className="ff-hero-layer" data-depth="2">
          <path
            d={paths.echo}
            fill="none"
            stroke="#fff"
            strokeOpacity="0.2"
            strokeWidth="1.25"
            strokeDasharray="2 5"
            strokeLinecap="round"
          />
        </g>
        <g className="ff-hero-layer" data-depth="3">
          <path d={paths.area} fill={`url(#area-${id})`} />
          <path
            className="ff-hero-line"
            d={paths.main}
            pathLength={1}
            fill="none"
            stroke="#fff"
            strokeOpacity="0.85"
            strokeWidth="2.25"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx={paths.end[0] - 2} cy={paths.end[1]} r="14" fill={`url(#glow-${id})`} opacity="0.5" />
          <circle cx={paths.end[0] - 2} cy={paths.end[1]} r="3.5" fill="#fff" />
        </g>
      </svg>

      <div className="ff-hero-content relative">
        <p className="text-sm font-medium opacity-80">{t("home.totalBalance")}</p>
        <p className="ff-num mt-1 flex items-baseline gap-1 tracking-[-0.03em]">
          <span className="text-lg font-semibold opacity-80">
            {sign}
            {symbol}
          </span>
          <span className="text-[2.6rem] leading-none font-bold">{integer}</span>
          <span className="text-xl font-semibold opacity-70">{cents}</span>
        </p>
        <p className="ff-num mt-4 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm bg-black/15">
          <span
            className="w-1.5 h-1.5 rounded-full"
            style={{ background: positive ? "#b6ffe9" : "#ffd0df" }}
            aria-hidden="true"
          />
          {t("home.thisMonth")} {positive ? "+" : "−"}
          {formatCurrency(Math.abs(monthNet))}
        </p>
      </div>
    </section>
  );
}
