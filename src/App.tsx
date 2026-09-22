import { useEffect, useMemo, useState } from 'react';
import {
  MapPin,
  Navigation,
  Footprints,
  Clock,
  Mountain,
  Compass,
  Feather,
  BookOpen,
  User,
  Map as MapIcon,
} from 'lucide-react';
import { ROUTE_WAYPOINTS, type RouteWaypoint } from './routeData';

const TOTAL_DISTANCE_KM = ROUTE_WAYPOINTS[ROUTE_WAYPOINTS.length - 1].distanceKm;
const TOTAL_STEPS = 100000;
const TOTAL_MIN = 9600;

type Tab = 'map' | 'journal' | 'profile';

function nearestWaypoint(distKm: number): { waypoint: RouteWaypoint; index: number } {
  let best = ROUTE_WAYPOINTS[0];
  let bestIndex = 0;
  let minDiff = Infinity;
  for (let i = 0; i < ROUTE_WAYPOINTS.length; i++) {
    const diff = Math.abs(ROUTE_WAYPOINTS[i].distanceKm - distKm);
    if (diff < minDiff) {
      minDiff = diff;
      best = ROUTE_WAYPOINTS[i];
      bestIndex = i;
    }
  }
  return { waypoint: best, index: bestIndex };
}

const STORAGE_KEY = 'pilgrim-progress';
const TAB_KEY = 'pilgrim-tab';

function loadProgress(): number {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    const n = v !== null ? parseFloat(v) : NaN;
    return Number.isFinite(n) && n >= 0 && n <= 1 ? n : 0;
  } catch {
    return 0;
  }
}

function loadTab(): Tab {
  try {
    const v = localStorage.getItem(TAB_KEY);
    if (v === 'map' || v === 'journal' || v === 'profile') return v;
  } catch {
    /* ignore */
  }
  return 'map';
}

export default function App() {
  const [progress, setProgress] = useState(loadProgress);
  const [tab, setTab] = useState<Tab>(loadTab);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, String(progress));
    } catch {
      /* ignore */
    }
  }, [progress]);

  useEffect(() => {
    try {
      localStorage.setItem(TAB_KEY, tab);
    } catch {
      /* ignore */
    }
  }, [tab]);

  const distDoneKm = progress * TOTAL_DISTANCE_KM;
  const distDone = distDoneKm.toFixed(1);
  const stepsDone = Math.round(progress * TOTAL_STEPS);
  const minDone = Math.round(progress * TOTAL_MIN);

  const { waypoint: current, index } = useMemo(
    () => nearestWaypoint(distDoneKm),
    [distDoneKm],
  );

  return (
    <div className="min-h-screen bg-[#3d2b1f] flex items-center justify-center p-4 font-body">
      {/* Phone frame */}
      <div className="relative w-full max-w-[400px] h-[820px] bg-[#2a1d14] rounded-[44px] shadow-2xl overflow-hidden border-[10px] border-[#2a1d14]">
        {/* notch */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-[#2a1d14] rounded-b-2xl z-30" />

        <div className="absolute inset-0 flex flex-col parchment-bg">
          {/* status bar */}
          <div className="h-9 px-6 flex items-center justify-between text-[11px] font-medium text-[#6b4423] pt-1 shrink-0">
            <span className="font-serif font-semibold">IX · XX</span>
            <span className="flex items-center gap-1">
              <span className="w-4 h-2 rounded-sm border border-[#a08060] relative">
                <span className="absolute inset-0.5 bg-[#8b5a2b] rounded-[1px]" />
              </span>
            </span>
          </div>

          {/* screen content */}
          <div className="flex-1 overflow-y-auto">
            {tab === 'map' && (
              <MapScreen
                current={current}
                index={index}
                progress={progress}
                setProgress={setProgress}
                distDone={distDone}
                totalDist={TOTAL_DISTANCE_KM}
                stepsDone={stepsDone}
                minDone={minDone}
              />
            )}
            {tab === 'journal' && (
              <JournalScreen
                progress={progress}
                stepsDone={stepsDone}
                minDone={minDone}
                distDone={distDone}
              />
            )}
            {tab === 'profile' && (
              <ProfileScreen stepsDone={stepsDone} distDone={distDone} minDone={minDone} />
            )}
          </div>

          {/* bottom tab bar */}
          <div className="shrink-0 bg-gradient-to-b from-[#3a2a1e] to-[#2a1d14] border-t border-[#5a3f2e] px-2 pt-2 pb-5 shadow-[0_-4px_16px_rgba(0,0,0,0.3)]">
            <div className="flex items-center justify-around">
              <TabButton
                active={tab === 'map'}
                onClick={() => setTab('map')}
                icon={<MapIcon size={20} />}
                label="Карта"
              />
              <TabButton
                active={tab === 'journal'}
                onClick={() => setTab('journal')}
                icon={<BookOpen size={20} />}
                label="Дневник"
              />
              <TabButton
                active={tab === 'profile'}
                onClick={() => setTab('profile')}
                icon={<User size={20} />}
                label="Профиль"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Tab Button ── */
function TabButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-1 px-4 py-1.5 rounded-2xl transition-all duration-200 ${
        active
          ? 'text-[#f4d03f] bg-[#4a3528]/50'
          : 'text-[#a08868] hover:text-[#c9b896]'
      }`}
    >
      <span className={`transition-transform duration-200 ${active ? 'scale-110' : ''}`}>
        {icon}
      </span>
      <span className="text-[11px] font-serif font-semibold tracking-wide">{label}</span>
    </button>
  );
}

/* ── Map Screen ── */
function MapScreen({
  current,
  index,
  progress,
  setProgress,
  distDone,
  totalDist,
  stepsDone,
  minDone,
}: {
  current: RouteWaypoint;
  index: number;
  progress: number;
  setProgress: (v: number) => void;
  distDone: string;
  totalDist: number;
  stepsDone: number;
  minDone: number;
}) {
  return (
    <div className="px-3 pt-2 pb-4">
      {/* header */}
      <div className="px-2 pt-1 pb-3 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-serif font-bold text-[#4a2f1c] tracking-tight leading-none">
            Путь паломника
          </h1>
          <p className="text-xs text-[#8b6f47] font-body italic flex items-center gap-1.5 mt-1">
            <Mountain size={12} /> {totalDist} км &middot; Камино-де-Сантьяго
          </p>
        </div>
        <button className="w-10 h-10 rounded-full bg-[#f0e4c8] shadow-md flex items-center justify-center text-[#8b5a2b] active:scale-95 transition border border-[#d4c4a0]">
          <Compass size={18} />
        </button>
      </div>

      {/* location card with image */}
      <div
        key={index}
        className="rounded-[24px] overflow-hidden bg-[#fdf6e3] shadow-[0_8px_24px_rgba(74,47,28,0.18)] ring-1 ring-[#e0d0b0] animate-fade-in-up"
      >
        {/* image */}
        <div className="relative h-40 overflow-hidden">
          <img
            src={current.image}
            alt={current.name}
            className="w-full h-full object-cover"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#2a1d14]/80 via-transparent to-transparent" />
          <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between">
            <div className="min-w-0">
              <span className="text-[10px] font-serif font-semibold text-[#f5ead0] bg-[#8b5a2b]/90 px-2 py-0.5 rounded-full">
                Точка {index + 1} / {ROUTE_WAYPOINTS.length}
              </span>
              <h2 className="text-xl font-serif font-bold text-[#f5ead0] truncate leading-tight mt-1 drop-shadow-md">
                {current.name}
              </h2>
            </div>
            <div className="shrink-0 text-right">
              <span className="text-2xl font-serif font-bold text-[#f4d03f] leading-none drop-shadow-md">
                {current.distanceKm}
              </span>
              <span className="text-xs text-[#e8d9b8] font-body block leading-none">км</span>
            </div>
          </div>
        </div>

        {/* card body */}
        <div className="p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[#c9b896] to-transparent" />
            <Feather size={14} className="text-[#8b6f47]" />
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[#c9b896] to-transparent" />
          </div>

          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#e8d9b8] flex items-center justify-center shrink-0 shadow-inner border border-[#d4c4a0]">
              <MapPin size={20} className="text-[#8b5a2b]" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[13px] text-[#6b5642] font-body italic leading-relaxed">
                {current.description}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2.5 mt-4">
            <Stat icon={<Footprints size={15} />} label="Шагов" value={stepsDone.toLocaleString()} />
            <Stat icon={<Clock size={15} />} label="В пути" value={`${minDone} мин`} />
            <Stat icon={<Navigation size={15} />} label="Пройдено" value={`${distDone} км`} />
          </div>
        </div>
      </div>

      {/* slider */}
      <div className="mt-3 rounded-[24px] bg-gradient-to-br from-[#4a3528] to-[#3a2a1e] p-5 shadow-[0_6px_20px_rgba(42,29,20,0.4)]">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-serif font-semibold text-[#e8d9b8] flex items-center gap-2">
            <Footprints size={15} /> Прогресс пути
          </span>
          <span className="text-sm font-serif font-bold text-[#f4d03f]">
            {Math.round(progress * 100)}%
          </span>
        </div>
        <input
          type="range"
          min={0}
          max={1000}
          value={Math.round(progress * 1000)}
          onChange={(e) => setProgress(Number(e.target.value) / 1000)}
          className="pilgrim-range w-full"
          style={{
            background: `linear-gradient(to right, #c9971a ${progress * 100}%, #6b4423 ${progress * 100}%)`,
          }}
        />
        <div className="flex justify-between text-[11px] text-[#a08868] font-serif italic mt-2">
          <span>{ROUTE_WAYPOINTS[0].name}</span>
          <span>{ROUTE_WAYPOINTS[ROUTE_WAYPOINTS.length - 1].name}</span>
        </div>
      </div>
    </div>
  );
}

/* ── Journal Screen ── */
function JournalScreen({
  progress,
  stepsDone,
  minDone,
  distDone,
}: {
  progress: number;
  stepsDone: number;
  minDone: number;
  distDone: string;
}) {
  const distKm = progress * TOTAL_DISTANCE_KM;
  const entries = ROUTE_WAYPOINTS.filter((w) => w.distanceKm <= distKm + 0.5);

  return (
    <div className="px-5 pt-3 pb-4">
      <div className="text-center mb-5">
        <div className="inline-flex items-center gap-2 mb-2">
          <div className="h-px w-12 bg-gradient-to-r from-transparent to-[#c9b896]" />
          <BookOpen size={18} className="text-[#8b6f47]" />
          <div className="h-px w-12 bg-gradient-to-l from-transparent to-[#c9b896]" />
        </div>
        <h1 className="text-3xl font-serif font-bold text-[#4a2f1c] tracking-tight">
          Дневник пути
        </h1>
        <p className="text-sm text-[#8b6f47] font-body italic mt-1">
          Записи паломника, собранные в дороге
        </p>
      </div>

      {/* summary card */}
      <div className="rounded-[24px] bg-[#fdf6e3] shadow-[0_8px_24px_rgba(74,47,28,0.18)] ring-1 ring-[#e0d0b0] p-5 mb-4">
        <div className="grid grid-cols-3 gap-2.5">
          <Stat icon={<Footprints size={15} />} label="Шагов" value={stepsDone.toLocaleString()} />
          <Stat icon={<Navigation size={15} />} label="Пройдено" value={`${distDone} км`} />
          <Stat icon={<Clock size={15} />} label="В пути" value={`${minDone} мин`} />
        </div>
      </div>

      {/* journal entries */}
      <div className="space-y-3">
        {entries.length === 0 ? (
          <div className="text-center py-12">
            <Feather size={32} className="text-[#c9b896] mx-auto mb-3" />
            <p className="text-[#8b6f47] font-body italic text-sm">
              Дневник пока пуст. Начните свой путь на вкладке «Карта».
            </p>
          </div>
        ) : (
          entries.map((w, i) => (
            <div
              key={w.id}
              className="rounded-[20px] overflow-hidden bg-[#fdf6e3] shadow-[0_4px_16px_rgba(74,47,28,0.12)] ring-1 ring-[#e0d0b0] animate-fade-in-up"
            >
              <div className="relative h-28 overflow-hidden">
                <img
                  src={w.image}
                  alt={w.name}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#2a1d14]/70 to-transparent" />
                <div className="absolute bottom-2 left-3 flex items-center gap-2">
                  <span className="text-[10px] font-serif font-bold text-[#f5ead0] bg-[#8b5a2b] px-2.5 py-1 rounded-full">
                    Запись {i + 1}
                  </span>
                  <span className="text-[11px] text-[#e8d9b8] font-body italic">
                    {w.distanceKm} км
                  </span>
                </div>
              </div>
              <div className="p-4">
                <h3 className="text-lg font-serif font-bold text-[#4a2f1c] leading-tight">
                  {w.name}
                </h3>
                <p className="text-[13px] text-[#6b5642] font-body italic leading-relaxed mt-1">
                  {w.description}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

/* ── Profile Screen ── */
function ProfileScreen({
  stepsDone,
  distDone,
  minDone,
}: {
  stepsDone: number;
  distDone: string;
  minDone: number;
}) {
  const reachedCount = ROUTE_WAYPOINTS.filter(
    (w) => w.distanceKm <= parseFloat(distDone),
  ).length;

  return (
    <div className="px-5 pt-3 pb-4">
      <div className="text-center mb-5">
        <div className="inline-flex items-center gap-2 mb-2">
          <div className="h-px w-12 bg-gradient-to-r from-transparent to-[#c9b896]" />
          <User size={18} className="text-[#8b6f47]" />
          <div className="h-px w-12 bg-gradient-to-l from-transparent to-[#c9b896]" />
        </div>
        <h1 className="text-3xl font-serif font-bold text-[#4a2f1c] tracking-tight">
          Профиль
        </h1>
        <p className="text-sm text-[#8b6f47] font-body italic mt-1">
          Странник и его скитания
        </p>
      </div>

      {/* avatar */}
      <div className="flex flex-col items-center mb-5">
        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#e8d9b8] to-[#d4a96a] shadow-[0_8px_24px_rgba(74,47,28,0.25)] ring-2 ring-[#c9971a] flex items-center justify-center">
          <User size={44} className="text-[#6b4423]" />
        </div>
        <h2 className="text-xl font-serif font-bold text-[#4a2f1c] mt-3">Странник</h2>
        <p className="text-xs text-[#8b6f47] font-body italic mt-0.5">Пилигрим первого пути</p>
      </div>

      {/* stats */}
      <div className="rounded-[24px] bg-[#fdf6e3] shadow-[0_8px_24px_rgba(74,47,28,0.18)] ring-1 ring-[#e0d0b0] p-5 mb-4">
        <div className="flex items-center gap-2 mb-4">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[#c9b896] to-transparent" />
          <span className="text-xs font-serif font-semibold text-[#8b6f47] tracking-wide">Текущий путь</span>
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[#c9b896] to-transparent" />
        </div>
        <div className="grid grid-cols-3 gap-2.5">
          <Stat icon={<Footprints size={15} />} label="Шагов" value={stepsDone.toLocaleString()} />
          <Stat icon={<Navigation size={15} />} label="Пройдено" value={`${distDone} км`} />
          <Stat icon={<Clock size={15} />} label="В пути" value={`${minDone} мин`} />
        </div>
      </div>

      {/* progress on route */}
      <div className="rounded-[24px] bg-[#fdf6e3] shadow-[0_8px_24px_rgba(74,47,28,0.18)] ring-1 ring-[#e0d0b0] p-5 mb-4">
        <div className="flex items-center gap-2 mb-4">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[#c9b896] to-transparent" />
          <span className="text-xs font-serif font-semibold text-[#8b6f47] tracking-wide">Пройдено точек</span>
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[#c9b896] to-transparent" />
        </div>
        <div className="flex items-center justify-center gap-3">
          <span className="text-4xl font-serif font-bold text-[#c9971a]">{reachedCount}</span>
          <span className="text-2xl font-serif text-[#a08868]">/ {ROUTE_WAYPOINTS.length}</span>
        </div>
        <div className="mt-3 h-2 rounded-full bg-[#e8d9b8] overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#c9971a] to-[#8b5a2b] rounded-full transition-all duration-300"
            style={{ width: `${(reachedCount / ROUTE_WAYPOINTS.length) * 100}%` }}
          />
        </div>
      </div>

      {/* achievements */}
      <div className="rounded-[24px] bg-[#fdf6e3] shadow-[0_8px_24px_rgba(74,47,28,0.18)] ring-1 ring-[#e0d0b0] p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[#c9b896] to-transparent" />
          <span className="text-xs font-serif font-semibold text-[#8b6f47] tracking-wide">Знаки отличия</span>
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[#c9b896] to-transparent" />
        </div>
        <div className="space-y-3">
          <Achievement icon={<Mountain size={18} />} title="Первый шаг" desc="Вступить на тропу" unlocked={stepsDone > 0} />
          <Achievement icon={<Compass size={18} />} title="Искатель путей" desc="Достичь первой точки маршрута" unlocked={reachedCount >= 1} />
          <Achievement icon={<Feather size={18} />} title="Летописец" desc="Записать первую заметку в дневник" unlocked={reachedCount >= 1} />
          <Achievement icon={<MapPin size={18} />} title="Вершина" desc="Достичь Сантьяго-де-Компостела" unlocked={reachedCount >= ROUTE_WAYPOINTS.length} />
        </div>
      </div>
    </div>
  );
}

/* ── Achievement Row ── */
function Achievement({
  icon,
  title,
  desc,
  unlocked,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  unlocked: boolean;
}) {
  return (
    <div className={`flex items-center gap-3 ${unlocked ? '' : 'opacity-50'}`}>
      <div
        className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 border ${
          unlocked
            ? 'bg-[#f0e4c8] border-[#c9971a] text-[#8b5a2b] shadow-md'
            : 'bg-[#e8d9b8] border-[#d4c4a0] text-[#a08868]'
        }`}
      >
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-serif font-bold text-[#4a2f1c] leading-tight">{title}</h4>
        <p className="text-[12px] text-[#8b6f47] font-body italic">{desc}</p>
      </div>
      {unlocked && (
        <span className="text-[10px] font-serif font-bold text-[#c9971a] bg-[#f0e4c8] px-2 py-1 rounded-full border border-[#d4c4a0] whitespace-nowrap">
          открыт
        </span>
      )}
    </div>
  );
}

/* ── Stat ── */
function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-[#f0e4c8] px-2.5 py-2.5 text-center border border-[#e0d0b0] shadow-sm">
      <div className="flex items-center justify-center text-[#8b5a2b] mb-1">{icon}</div>
      <div className="text-base font-serif font-bold text-[#4a2f1c] leading-none">{value}</div>
      <div className="text-[10px] text-[#8b6f47] font-body mt-0.5">{label}</div>
    </div>
  );
}
