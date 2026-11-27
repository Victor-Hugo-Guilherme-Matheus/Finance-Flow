import { useEffect, useRef, useState, type ReactNode } from "react";

interface ScreenHeaderProps {
  title: string;
  subtitle?: ReactNode;
  /** Texto pequeno acima do título (ex.: "Bem-vindo de volta") */
  overline?: ReactNode;
  /** Botão ou avatar à direita */
  action?: ReactNode;
}

const supportsScrollTimeline =
  typeof CSS !== "undefined" && CSS.supports?.("animation-timeline: scroll()");

/**
 * Título grande que, ao rolar, dá lugar a uma barra compacta fixa no topo
 * (padrão "large title" do iOS). Onde o navegador suporta, o efeito é 100% CSS
 * (scroll-driven animation). Nos demais, um IntersectionObserver só alterna a
 * barra quando o título sai da tela, sem ouvir cada evento de scroll.
 */
export function ScreenHeader({ title, subtitle, overline, action }: ScreenHeaderProps) {
  const titleRef = useRef<HTMLDivElement>(null);
  const [compactVisible, setCompactVisible] = useState(false);

  useEffect(() => {
    const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (supportsScrollTimeline && !reduceMotion) return;
    const el = titleRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setCompactVisible(!entry.isIntersecting),
      { rootMargin: "-52px 0px 0px 0px", threshold: 0 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <div className="ff-compact-bar" data-visible={compactVisible} aria-hidden="true">
        <span className="ff-heading text-base">{title}</span>
      </div>
      <header className="flex items-end justify-between gap-4 mb-6 pt-2">
        <div ref={titleRef} className="ff-large-title min-w-0">
          {overline && <p className="ff-text-muted text-sm">{overline}</p>}
          <h1 className="ff-heading text-[1.75rem] leading-tight tracking-[-0.02em] truncate">
            {title}
          </h1>
          {subtitle && <p className="ff-text-muted text-sm mt-0.5">{subtitle}</p>}
        </div>
        {action && <div className="flex-shrink-0">{action}</div>}
      </header>
    </>
  );
}
