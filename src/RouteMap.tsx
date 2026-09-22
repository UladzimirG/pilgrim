import { useMemo } from 'react';
import { MapPin } from 'lucide-react';
import { ROUTE_WAYPOINTS } from './routeData';

const MAP_W = 340;
const MAP_H = 440;
const PAD_X = 30;
const PAD_TOP = 30;
const PAD_BOTTOM = 40;

type Pt = { x: number; y: number };

function distanceToY(distKm: number, totalKm: number): number {
  const t = distKm / totalKm;
  return PAD_TOP + t * (MAP_H - PAD_TOP - PAD_BOTTOM);
}

function buildPath(points: Pt[]): string {
  if (points.length === 0) return '';
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;

  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const midX = (prev.x + curr.x) / 2;
    const midY = (prev.y + curr.y) / 2;
    d += ` Q ${prev.x} ${prev.y} ${midX} ${midY}`;
  }
  const last = points[points.length - 1];
  d += ` T ${last.x} ${last.y}`;
  return d;
}

export function RouteMap({
  progress,
  totalDistKm,
  onProgressChange,
}: {
  progress: number;
  totalDistKm: number;
  onProgressChange: (v: number) => void;
}) {
  const waypoints = useMemo(() => {
    return ROUTE_WAYPOINTS.map((w, i) => {
      const y = distanceToY(w.distanceKm, totalDistKm);
      const waveSeed = i * 1.3;
      const x = MAP_W / 2 + Math.sin(waveSeed) * 55 + Math.cos(waveSeed * 0.7) * 25;
      return { ...w, x, y };
    });
  }, [totalDistKm]);

  const pathPoints: Pt[] = waypoints.map((w) => ({ x: w.x, y: w.y }));
  const fullPath = buildPath(pathPoints);

  const pilgrimY = distanceToY(progress * totalDistKm, totalDistKm);

  const pilgrimX = useMemo(() => {
    if (waypoints.length === 0) return MAP_W / 2;
    const distKm = progress * totalDistKm;
    let prev = waypoints[0];
    for (let i = 1; i < waypoints.length; i++) {
      if (waypoints[i].distanceKm >= distKm) {
        const next = waypoints[i];
        const segT =
          next.distanceKm === prev.distanceKm
            ? 0
            : (distKm - prev.distanceKm) / (next.distanceKm - prev.distanceKm);
        return prev.x + (next.x - prev.x) * segT;
      }
      prev = waypoints[i];
    }
    return waypoints[waypoints.length - 1].x;
  }, [progress, waypoints]);

  const passedPath = useMemo(() => {
    const distKm = progress * totalDistKm;
    const passed: Pt[] = [];
    let prev = waypoints[0];
    passed.push({ x: prev.x, y: prev.y });

    for (let i = 1; i < waypoints.length; i++) {
      const wp = waypoints[i];
      if (wp.distanceKm <= distKm) {
        passed.push({ x: wp.x, y: wp.y });
        prev = wp;
      } else {
        const segT =
          wp.distanceKm === prev.distanceKm
            ? 0
            : (distKm - prev.distanceKm) / (wp.distanceKm - prev.distanceKm);
        const px = prev.x + (wp.x - prev.x) * segT;
        const py = prev.y + (wp.y - prev.y) * segT;
        passed.push({ x: px, y: py });
        break;
      }
    }
    return buildPath(passed);
  }, [progress, waypoints]);

  const handleClick = (e: React.MouseEvent<SVGSVGElement>) => {
    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    const scaleY = MAP_H / rect.height;
    const clickY = (e.clientY - rect.top) * scaleY;
    const clampedY = Math.max(PAD_TOP, Math.min(MAP_H - PAD_BOTTOM, clickY));
    const t = (clampedY - PAD_TOP) / (MAP_H - PAD_TOP - PAD_BOTTOM);
    onProgressChange(Math.max(0, Math.min(1, t)));
  };

  return (
    <div className="mt-4 rounded-[24px] bg-gradient-to-br from-[#4a3528] to-[#3a2a1e] p-4 shadow-[0_6px_20px_rgba(42,29,20,0.4)]">
      <div className="flex items-center justify-between mb-3 px-1">
        <span className="text-sm font-serif font-semibold text-[#e8d9b8] flex items-center gap-2">
          <MapPin size={15} /> Карта пути
        </span>
        <span className="text-sm font-serif font-bold text-[#f4d03f]">
          {Math.round(progress * 100)}%
        </span>
      </div>

      <div className="relative rounded-2xl overflow-hidden bg-[#2a1d14] ring-1 ring-[#5a3f2e]">
        <svg
          viewBox={`0 0 ${MAP_W} ${MAP_H}`}
          className="w-full h-auto block touch-none cursor-pointer"
          onClick={handleClick}
        >
          <defs>
            <pattern id="mapTexture" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
              <rect width="40" height="40" fill="#2a1d14" />
              <circle cx="10" cy="10" r="0.5" fill="#3a2a1e" opacity="0.6" />
              <circle cx="30" cy="25" r="0.5" fill="#3a2a1e" opacity="0.6" />
              <circle cx="20" cy="35" r="0.3" fill="#3a2a1e" opacity="0.4" />
            </pattern>
            <filter id="pathGlow">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          <rect width={MAP_W} height={MAP_H} fill="url(#mapTexture)" />

          {/* Декоративные горы на фоне */}
          <g opacity="0.15" fill="#5a3f2e">
            <path d="M 0 120 L 50 80 L 90 120 Z" />
            <path d="M 60 140 L 110 90 L 160 140 Z" />
            <path d="M 200 100 L 250 60 L 300 100 Z" />
            <path d="M 250 130 L 300 85 L 340 130 Z" />
            <path d="M 0 300 L 60 260 L 120 300 Z" />
            <path d="M 180 320 L 240 280 L 300 320 Z" />
          </g>

          {/* Тёмная тропа (фон) */}
          <path
            d={fullPath}
            fill="none"
            stroke="#1a120a"
            strokeWidth="7"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Пройденная часть тропы */}
          <path
            d={passedPath}
            fill="none"
            stroke="#c9971a"
            strokeWidth="4.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            filter="url(#pathGlow)"
          />

          {/* Оставшаяся часть тропы */}
          <path
            d={fullPath}
            fill="none"
            stroke="#6b4423"
            strokeWidth="4.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray="6 4"
            opacity="0.5"
          />

          {/* Точки маршрута */}
          {waypoints.map((w, i) => {
            const isPassed = w.distanceKm <= progress * totalDistKm;
            const isStart = i === 0;
            const isEnd = i === waypoints.length - 1;
            return (
              <g key={w.id}>
                <circle
                  cx={w.x}
                  cy={w.y}
                  r={isStart || isEnd ? 8 : 5}
                  fill={isPassed ? '#f4d03f' : '#8b5a2b'}
                  stroke={isPassed ? '#c9971a' : '#5a3f2e'}
                  strokeWidth="2"
                />
                {(isStart || isEnd) && (
                  <circle
                    cx={w.x}
                    cy={w.y}
                    r={isStart || isEnd ? 12 : 9}
                    fill="none"
                    stroke={isPassed ? '#f4d03f' : '#8b5a2b'}
                    strokeWidth="1.5"
                    opacity="0.4"
                  />
                )}
                <text
                  x={w.x + (w.x > MAP_W / 2 ? -14 : 14)}
                  y={w.y + 4}
                  textAnchor={w.x > MAP_W / 2 ? 'end' : 'start'}
                  fill={isPassed ? '#e8d9b8' : '#6b5642'}
                  fontSize="9"
                  fontFamily="Cormorant Garamond, Georgia, serif"
                  fontWeight="600"
                >
                  {w.name.length > 18 ? w.name.substring(0, 16) + '…' : w.name}
                </text>
                <text
                  x={w.x + (w.x > MAP_W / 2 ? -14 : 14)}
                  y={w.y + 15}
                  textAnchor={w.x > MAP_W / 2 ? 'end' : 'start'}
                  fill={isPassed ? '#c9971a' : '#5a3f2e'}
                  fontSize="7"
                  fontFamily="Lora, Georgia, serif"
                  fontStyle="italic"
                >
                  {w.distanceKm} км
                </text>
              </g>
            );
          })}

          {/* Маркер пилигрима */}
          <g>
            <circle
              cx={pilgrimX}
              cy={pilgrimY}
              r="14"
              fill="#c9971a"
              opacity="0.2"
              className="animate-ping"
              style={{ transformOrigin: `${pilgrimX}px ${pilgrimY}px` }}
            />
            <circle
              cx={pilgrimX}
              cy={pilgrimY}
              r="9"
              fill="#f4d03f"
              stroke="#8b5a2b"
              strokeWidth="2.5"
            />
            <text
              x={pilgrimX}
              y={pilgrimY + 4}
              textAnchor="middle"
              fill="#2a1d14"
              fontSize="10"
              fontWeight="700"
            >
              ✦
            </text>
          </g>
        </svg>
      </div>

      {/* Метки начала и конца */}
      <div className="flex justify-between text-[11px] text-[#a08868] font-serif italic mt-2 px-1">
        <span>{ROUTE_WAYPOINTS[0].name}</span>
        <span>{ROUTE_WAYPOINTS[ROUTE_WAYPOINTS.length - 1].name}</span>
      </div>

      {/* Мини-ползунок для точной настройки */}
      <div className="mt-3">
        <input
          type="range"
          min={0}
          max={1000}
          value={Math.round(progress * 1000)}
          onChange={(e) => onProgressChange(Number(e.target.value) / 1000)}
          className="pilgrim-range w-full"
          style={{
            background: `linear-gradient(to right, #c9971a ${progress * 100}%, #6b4423 ${progress * 100}%)`,
          }}
        />
      </div>
    </div>
  );
}
