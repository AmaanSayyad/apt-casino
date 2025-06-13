'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Minus, Plus, RefreshCw } from 'lucide-react';

function normalizeSvgDimensions(input) {
  const match = input.match(/viewBox="([\d.\s-]+)"/i);
  if (!match) return input;
  const parts = match[1].trim().split(/\s+/).map(Number);
  if (parts.length !== 4 || parts.some((n) => Number.isNaN(n))) return input;
  const vbWidth = Math.max(1, Math.round(parts[2]));
  const vbHeight = Math.max(1, Math.round(parts[3]));

  return input.replace(/<svg([^>]*?)>/i, (_m, attrs) => {
    const cleaned = attrs.replace(/\swidth="[^"]*"/i, '').replace(/\sheight="[^"]*"/i, '');
    return `<svg${cleaned} width="${vbWidth}" height="${vbHeight}">`;
  });
}

export default function MermaidDiagram({ chart, theme = 'dark', compact = false, layout = 'default' }) {
  const [svg, setSvg] = useState('');
  const [error, setError] = useState('');
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef(null);
  const viewportRef = useRef(null);
  const canvasRef = useRef(null);

  const STEP = 48;
  const MIN_SCALE = 0.4;
  const MAX_SCALE = 3;

  useEffect(() => {
    let mounted = true;

    async function renderChart() {
      try {
        const mermaid = (await import('mermaid')).default;
        mermaid.initialize({
          startOnLoad: false,
          theme,
          securityLevel: 'loose',
          suppressErrorRendering: true,
        });

        const id = `mermaid-${Math.random().toString(36).slice(2, 10)}`;
        const { svg: rendered } = await mermaid.render(id, chart);
        if (mounted) {
          setSvg(normalizeSvgDimensions(rendered));
          setError('');
        }
      } catch (e) {
        if (mounted) {
          setError(e instanceof Error ? e.message : 'Failed to render Mermaid diagram');
        }
      }
    }

    renderChart();
    return () => {
      mounted = false;
    };
  }, [chart, theme]);

  useEffect(() => {
    if (!svg) return;
    const vp = viewportRef.current;
    const canvas = canvasRef.current;
    if (!vp || !canvas) return;
    const t = setTimeout(() => {
      const vpRect = vp.getBoundingClientRect();
      const contentRect = canvas.getBoundingClientRect();
      if (!vpRect.width || !vpRect.height || !contentRect.width || !contentRect.height) return;
      const fitScale = Math.min(vpRect.width / contentRect.width, vpRect.height / contentRect.height);
      const clamped = Math.max(MIN_SCALE, Math.min(MAX_SCALE, fitScale * 0.95));
      setScale(clamped);
      setOffset({ x: 0, y: 0 });
    }, 0);
    return () => clearTimeout(t);
  }, [svg]);

  const controls = useMemo(
    () => [
      { label: 'Up', icon: ArrowUp, onClick: () => setOffset((o) => ({ ...o, y: o.y + STEP })) },
      { label: 'Zoom In', icon: Plus, onClick: () => setScale((s) => Math.min(MAX_SCALE, +(s + 0.1).toFixed(2))) },
      { label: 'Left', icon: ArrowLeft, onClick: () => setOffset((o) => ({ ...o, x: o.x + STEP })) },
      {
        label: 'Reset',
        icon: RefreshCw,
        onClick: () => {
          setScale(1);
          setOffset({ x: 0, y: 0 });
        },
      },
      { label: 'Right', icon: ArrowRight, onClick: () => setOffset((o) => ({ ...o, x: o.x - STEP })) },
      { label: 'Down', icon: ArrowDown, onClick: () => setOffset((o) => ({ ...o, y: o.y - STEP })) },
      { label: 'Zoom Out', icon: Minus, onClick: () => setScale((s) => Math.max(MIN_SCALE, +(s - 0.1).toFixed(2))) },
    ],
    [],
  );

  if (error) {
    return (
      <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-4 text-xs text-rose-300">
        Mermaid render error: {error}
      </div>
    );
  }

  if (!svg) {
    return <div className="text-xs text-white/40">Rendering diagram…</div>;
  }

  return (
    <div className="space-y-3">
      <div
        ref={viewportRef}
        className={`relative overflow-hidden rounded-xl border border-white/10 bg-black/30 ${
          layout === 'wide'
            ? 'h-[280px] sm:h-[320px]'
            : compact
              ? 'h-[340px] sm:h-[380px]'
              : 'h-[480px]'
        }`}
        onMouseDown={(e) => {
          setDragging(true);
          dragStart.current = { x: e.clientX, y: e.clientY };
        }}
        onMouseMove={(e) => {
          if (!dragging || !dragStart.current) return;
          const dx = e.clientX - dragStart.current.x;
          const dy = e.clientY - dragStart.current.y;
          dragStart.current = { x: e.clientX, y: e.clientY };
          setOffset((o) => ({ x: o.x + dx, y: o.y + dy }));
        }}
        onMouseUp={() => {
          setDragging(false);
          dragStart.current = null;
        }}
        onMouseLeave={() => {
          setDragging(false);
          dragStart.current = null;
        }}
        onWheel={(e) => {
          e.preventDefault();
          const delta = e.deltaY < 0 ? 0.08 : -0.08;
          setScale((s) => Math.max(MIN_SCALE, Math.min(MAX_SCALE, +(s + delta).toFixed(2))));
        }}
      >
        <div className="absolute inset-0 grid place-items-center">
          <div
            ref={canvasRef}
            style={{
              transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
              transformOrigin: 'center center',
              transition: dragging ? 'none' : 'transform 120ms ease',
              cursor: dragging ? 'grabbing' : 'grab',
            }}
            className="mermaid-diagram select-none [&_svg]:h-auto [&_svg]:w-auto [&_svg]:max-w-none"
            dangerouslySetInnerHTML={{ __html: svg }}
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {controls.map(({ label, icon: Icon, onClick }) => (
          <button
            key={label}
            type="button"
            onClick={onClick}
            className="rounded-lg border border-white/15 bg-white/5 p-2.5 text-white/80 hover:bg-white/10"
            aria-label={label}
            title={label}
          >
            <Icon className="h-4 w-4" />
          </button>
        ))}
        <span className="ml-1 text-xs font-mono text-white/50">{Math.round(scale * 100)}%</span>
      </div>
    </div>
  );
}
