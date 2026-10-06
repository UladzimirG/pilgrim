import { useEffect, useMemo, useRef, useState } from 'react';
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
  Lock,
  ChevronLeft,
  Scroll,
  Sparkles,
  CheckCircle2,
  Footprints as FootprintsIcon,
  Activity,
  Play,
  Square,
  Plus,
  Minus,
  ShieldAlert,
} from 'lucide-react';
import { ROUTE_WAYPOINTS, type RouteWaypoint } from './routeData';
import { CHECKPOINTS, type Checkpoint } from './checkpoints';
import { usePedometer, type PedometerState } from './usePedometer';
import { RouteMap } from './RouteMap';

const TOTAL_DISTANCE_KM = ROUTE_WAYPOINTS[ROUTE_WAYPOINTS.length - 1].distanceKm;
const TOTAL_STEPS = 100000;
const TOTAL_MIN = 9600;

type Tab = 'map' | 'journal' | 'profile';

const STORAGE_KEY = 'pilgrim-progress';
const TAB_KEY = 'pilgrim-tab';
const UNLOCKED_KEY = 'pilgrim-unlocked-checkpoints';

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

function loadUnlocked(): Record<string, string> {
  try {
    const v = localStorage.getItem(UNLOCKED_KEY);
    if (v) return JSON.parse(v);
  } catch {
    /* ignore */
  }
  return {};
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
}

export default function App() {
  const [progress, setProgress] = useState(loadProgress);
  const [tab, setTab] = useState<Tab>(loadTab);
  const [unlockedMap, setUnlockedMap] = useState<Record<string, string>>(loadUnlocked);
  const [openCheckpoint, setOpenCheckpoint] = useState<Checkpoint | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevUnlocked = useRef<Set<string>>(new Set(Object.keys(unlockedMap)));
  const pedometer = usePedometer();

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

  // Разблокировка чекпоинтов при достижении дистанции
  useEffect(() => {
    const newUnlocked = { ...unlockedMap };
    let changed = false;
    for (const cp of CHECKPOINTS) {
      if (distDoneKm >= cp.distanceKm && !newUnlocked[cp.id]) {
        newUnlocked[cp.id] = new Date().toISOString();
        changed = true;
      }
    }
    if (changed) {
      setUnlockedMap(newUnlocked);
      try {
        localStorage.setItem(UNLOCKED_KEY, JSON.stringify(newUnlocked));
      } catch {
        /* ignore */
      }
    }
  }, [distDoneKm, unlockedMap]);

  // Тост при новой разблокировке
  useEffect(() => {
    const currentIds = new Set(Object.keys(unlockedMap));
    for (const id of currentIds) {
      if (!prevUnlocked.current.has(id)) {
        const cp = CHECKPOINTS.find((c) => c.id === id);
        if (cp) {
          setToast(cp.title);
          if (toastTimer.current) clearTimeout(toastTimer.current);
          toastTimer.current = setTimeout(() => setToast(null), 6000);
        }
      }
    }
    prevUnlocked.current = currentIds;
  }, [unlockedMap]);

  // Чекпоинты с состоянием разблокировки
  const checkpoints: Checkpoint[] = useMemo(
    () =>
      CHECKPOINTS.map((cp) => {
        const unlockedAt = unlockedMap[cp.id] ?? null;
        return {
          ...cp,
          isUnlocked: unlockedAt !== null,
          unlockedAt,
        };
      }),
    [unlockedMap],
  );

  const toastCheckpoint = toast
    ? checkpoints.find((c) => c.title === toast) ?? null
    : null;

  return (
    <div className="min-h-screen bg-[#3d2b1f] flex items-center justify-center p-4 font-body">
      {/* Phone frame */}
      <div className="relative w-full max-w-[400px] h-[820px] bg-[#2a1d14] rounded-[44px] shadow-2xl overflow-hidden border-[10px] border-[#2a1d14]">
        {/* notch */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-[#2a1d14] rounded-b-2xl z-30" />

        <div className="absolute inset-0 flex flex-col parchment-bg">
          {/* status bar */}
          <div className="h-9 px-6 flex items-center justify-between text-[11px] font-medium text-[#6b4423] pt-1 shrink-0">
            <span className="font-serif font-semibold">IX · XXII</span>
            <span className="flex items-center gap-1">
              <span className="w-4 h-2 rounded-sm border border-[#a08060] relative">
                <span className="absolute inset-0.5 bg-[#8b5a2b] rounded-[1px]" />
              </span>
            </span>
          </div>

          {/* screen content */}
          <div className="flex-1 overflow-y-auto relative">
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
                checkpoints={checkpoints}
                onOpenCheckpoint={setOpenCheckpoint}
                pedometer={pedometer}
              />
            )}
            {tab === 'journal' && (
              <JournalScreen
                progress={progress}
                stepsDone={stepsDone}
                minDone={minDone}
                distDone={distDone}
                checkpoints={checkpoints}
                onOpenCheckpoint={setOpenCheckpoint}
              />
            )}
            {tab === 'profile' && (
              <ProfileScreen
                stepsDone={stepsDone}
                distDone={distDone}
                minDone={minDone}
                checkpoints={checkpoints}
                onOpenCheckpoint={setOpenCheckpoint}
              />
            )}

            {/* Тост-уведомление */}
            {toastCheckpoint && (
              <button
                onClick={() => {
                  setOpenCheckpoint(toastCheckpoint);
                  setToast(null);
                }}
                className="absolute bottom-4 left-3 right-3 z-20 rounded-2xl bg-gradient-to-r from-[#c9971a] to-[#8b5a2b] px-4 py-3 shadow-[0_8px_24px_rgba(0,0,0,0.4)] flex items-center gap-3 text-left animate-fade-in-up"
              >
                <div className="w-10 h-10 rounded-xl bg-[#f4d03f]/30 flex items-center justify-center shrink-0">
                  <Sparkles size={20} className="text-[#f4d03f]" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] text-[#f5ead0]/80 font-body">
                    Открыта новая точка
                  </p>
                  <p className="text-sm font-serif font-bold text-[#f5ead0] truncate">
                    {toastCheckpoint.title}! Нажмите, чтобы прочитать дневник
                  </p>
                </div>
                <BookOpen size={18} className="text-[#f5ead0] shrink-0" />
              </button>
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

      {/* Модальное окно дневника чекпоинта */}
      {openCheckpoint && (
        <CheckpointJournalSheet
          checkpoint={openCheckpoint}
          totalDist={TOTAL_DISTANCE_KM}
          onClose={() => setOpenCheckpoint(null)}
        />
      )}
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

/* ── Checkpoint List Card ── */
function CheckpointListCard({
  checkpoint,
  totalDist,
  onOpen,
}: {
  checkpoint: Checkpoint;
  totalDist: number;
  onOpen: (cp: Checkpoint) => void;
}) {
  if (checkpoint.isUnlocked) {
    return (
      <button
        onClick={() => onOpen(checkpoint)}
        className="w-full text-left rounded-[20px] overflow-hidden bg-[#fdf6e3] shadow-[0_4px_16px_rgba(74,47,28,0.12)] ring-1 ring-[#e0d0b0] animate-fade-in-up active:scale-[0.98] transition-transform"
      >
        <div className="relative h-28 overflow-hidden">
          <img
            src={checkpoint.imageUrl}
            alt={checkpoint.title}
            className="w-full h-full object-cover"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#2a1d14]/70 to-transparent" />
          <div className="absolute top-2 right-2 flex items-center gap-1 bg-[#c9971a] px-2 py-0.5 rounded-full shadow-md">
            <CheckCircle2 size={11} className="text-[#f5ead0]" />
            <span className="text-[10px] font-serif font-bold text-[#f5ead0]">Открыто</span>
          </div>
          <div className="absolute bottom-2 left-3 flex items-center gap-2">
            <span className="text-[11px] text-[#e8d9b8] font-body italic">
              {checkpoint.distanceKm} км
            </span>
          </div>
        </div>
        <div className="p-4">
          <h3 className="text-lg font-serif font-bold text-[#4a2f1c] leading-tight">
            {checkpoint.title}
          </h3>
          <p className="text-[13px] text-[#6b5642] font-body italic leading-relaxed mt-1">
            {checkpoint.summary}
          </p>
          <div className="flex items-center gap-1.5 mt-3 text-[#8b5a2b]">
            <BookOpen size={13} />
            <span className="text-[12px] font-serif font-semibold">Читать дневник</span>
          </div>
        </div>
      </button>
    );
  }

  return (
    <div className="rounded-[20px] overflow-hidden bg-[#e8d9b8]/60 shadow-[0_2px_8px_rgba(74,47,28,0.08)] ring-1 ring-[#d4c4a0] opacity-60">
      <div className="relative h-28 overflow-hidden">
        <img
          src={checkpoint.imageUrl}
          alt={checkpoint.title}
          className="w-full h-full object-cover grayscale"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-[#2a1d14]/50" />
        <div className="absolute top-2 right-2 flex items-center gap-1 bg-[#3a2a1e] px-2 py-0.5 rounded-full">
          <Lock size={11} className="text-[#a08868]" />
          <span className="text-[10px] font-serif font-bold text-[#a08868]">Закрыто</span>
        </div>
      </div>
      <div className="p-4">
        <h3 className="text-lg font-serif font-bold text-[#6b5642] leading-tight">
          {checkpoint.title}
        </h3>
        <p className="text-[13px] text-[#8b6f47] font-body italic leading-relaxed mt-1">
          Откроется на {checkpoint.distanceKm} км
        </p>
      </div>
    </div>
  );
}

/* ── Checkpoint Journal Sheet Modal ── */
function CheckpointJournalSheet({
  checkpoint,
  totalDist,
  onClose,
}: {
  checkpoint: Checkpoint;
  totalDist: number;
  onClose: () => void;
}) {
  const [detailTab, setDetailTab] = useState<'history' | 'legend'>('history');

  const historyParagraphs = checkpoint.history.split('\n\n');

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-[400px] h-[92%] bg-[#fdf6e3] rounded-t-[36px] shadow-2xl overflow-hidden animate-slide-up flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Hero image */}
        <div className="relative h-52 shrink-0">
          <img
            src={checkpoint.imageUrl}
            alt={checkpoint.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#2a1d14] via-[#2a1d14]/40 to-transparent" />

          {/* Back button */}
          <button
            onClick={onClose}
            className="absolute top-3 left-3 w-10 h-10 rounded-full bg-[#2a1d14]/60 backdrop-blur flex items-center justify-center text-[#f5ead0] active:scale-90 transition border border-[#f5ead0]/20"
          >
            <ChevronLeft size={22} />
          </button>

          {/* Title overlay */}
          <div className="absolute bottom-4 left-5 right-5">
            <h2 className="text-2xl font-serif font-bold text-[#f5ead0] leading-tight drop-shadow-lg">
              {checkpoint.title}
            </h2>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-[11px] font-serif font-semibold text-[#f5ead0] bg-[#c9971a]/90 px-2.5 py-1 rounded-full">
                Км {checkpoint.distanceKm} из {totalDist}
              </span>
              {checkpoint.unlockedAt && (
                <span className="text-[11px] font-serif font-semibold text-[#f5ead0] bg-[#8b5a2b]/80 px-2.5 py-1 rounded-full flex items-center gap-1">
                  <CheckCircle2 size={11} /> {formatDate(checkpoint.unlockedAt)}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex shrink-0 px-5 pt-4 gap-2">
          <button
            onClick={() => setDetailTab('history')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-serif font-semibold transition-all ${
              detailTab === 'history'
                ? 'bg-[#c9971a] text-[#f5ead0] shadow-md'
                : 'bg-[#e8d9b8] text-[#8b6f47]'
            }`}
          >
            <Scroll size={15} /> История
          </button>
          <button
            onClick={() => setDetailTab('legend')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-serif font-semibold transition-all ${
              detailTab === 'legend'
                ? 'bg-[#c9971a] text-[#f5ead0] shadow-md'
                : 'bg-[#e8d9b8] text-[#8b6f47]'
            }`}
          >
            <Sparkles size={15} /> Легенды
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 pt-4 pb-24">
          {detailTab === 'history' ? (
            <div className="space-y-4">
              {historyParagraphs.map((para, i) => (
                <p
                  key={i}
                  className="text-[14px] text-[#4a2f1c] font-body leading-[1.8] first-letter:font-serif first-letter:text-3xl first-letter:font-bold first-letter:text-[#c9971a] first-letter:mr-1 first-letter:float-left first-letter:leading-[0.9]"
                >
                  {para}
                </p>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl bg-gradient-to-br from-[#f0e4c8] to-[#e8d9b8] p-5 ring-1 ring-[#d4c4a0]">
              <div className="flex items-center gap-2 mb-3">
                <Feather size={16} className="text-[#8b5a2b]" />
                <span className="text-xs font-serif font-semibold text-[#8b6f47] tracking-wide uppercase">
                  Местное предание
                </span>
              </div>
              <p className="text-[14px] text-[#4a2f1c] font-body leading-[1.8] italic">
                {checkpoint.legend}
              </p>
            </div>
          )}
        </div>

        {/* Floating action button */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-[#fdf6e3] via-[#fdf6e3]/95 to-transparent pt-8">
          <button
            onClick={onClose}
            className="w-full rounded-2xl bg-gradient-to-r from-[#c9971a] to-[#8b5a2b] py-3.5 text-[#f5ead0] font-serif font-bold text-base shadow-[0_6px_20px_rgba(139,90,43,0.4)] active:scale-[0.97] transition flex items-center justify-center gap-2"
          >
            <FootprintsIcon size={18} /> Продолжить путь
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Карточка шагомера ── */
function PedometerCard({
  pedometer,
}: {
  pedometer: ReturnType<typeof usePedometer>;
}) {
  const { steps, state, distanceKm, start, stop, addDistance } = pedometer;

  const stateLabel: Record<PedometerState, string> = {
    idle: 'Остановлен',
    requesting: 'Запрос разрешений…',
    active: 'Активен',
    denied: 'Доступ запрещён',
    unsupported: 'Не поддерживается',
  };

  return (
    <div className="mt-4 rounded-[24px] bg-gradient-to-br from-[#4a3528] to-[#3a2a1e] p-5 shadow-[0_6px_20px_rgba(42,29,20,0.4)]">
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-serif font-semibold text-[#e8d9b8] flex items-center gap-2">
          <Activity size={15} /> Шагомер
        </span>
        <span
          className={`text-[11px] font-serif font-semibold px-2 py-0.5 rounded-full ${
            state === 'active'
              ? 'text-[#f4d03f] bg-[#f4d03f]/15'
              : state === 'denied' || state === 'unsupported'
                ? 'text-[#e07a5f] bg-[#e07a5f]/15'
                : 'text-[#a08868] bg-[#a08868]/15'
          }`}
        >
          {stateLabel[state]}
        </span>
      </div>

      {/* Живой счётчик шагов */}
      <div className="flex items-center justify-center gap-6 mb-4">
        <div className="text-center">
          <div className="text-4xl font-serif font-bold text-[#f4d03f] leading-none tabular-nums">
            {steps.toLocaleString()}
          </div>
          <div className="text-[11px] text-[#a08868] font-body mt-1">шагов</div>
        </div>
        <div className="w-px h-10 bg-[#5a3f2e]" />
        <div className="text-center">
          <div className="text-4xl font-serif font-bold text-[#e8d9b8] leading-none tabular-nums">
            {distanceKm.toFixed(2)}
          </div>
          <div className="text-[11px] text-[#a08868] font-body mt-1">км</div>
        </div>
      </div>

      {/* Кнопка запуска / остановки */}
      {(state === 'idle' || state === 'denied' || state === 'unsupported') ? (
        <button
          onClick={start}
          className="w-full rounded-2xl bg-gradient-to-r from-[#c9971a] to-[#8b5a2b] py-3 text-[#f5ead0] font-serif font-bold text-sm shadow-[0_4px_16px_rgba(139,90,43,0.3)] active:scale-[0.97] transition flex items-center justify-center gap-2"
        >
          {state === 'unsupported' ? (
            <>
              <ShieldAlert size={18} /> Датчики недоступны
            </>
          ) : (
            <>
              <Play size={18} /> {state === 'idle' ? 'Начать ходьбу' : 'Запросить доступ к сенсорам'}
            </>
          )}
        </button>
      ) : state === 'requesting' ? (
        <div className="w-full rounded-2xl bg-[#5a3f2e] py-3 text-[#a08868] font-serif font-bold text-sm flex items-center justify-center gap-2">
          <Activity size={18} className="animate-pulse" /> Ожидание разрешения…
        </div>
      ) : (
        <button
          onClick={stop}
          className="w-full rounded-2xl bg-[#5a3f2e] py-3 text-[#e8d9b8] font-serif font-bold text-sm active:scale-[0.97] transition flex items-center justify-center gap-2"
        >
          <Square size={18} /> Остановить
        </button>
      )}

      {/* Дебаг-кнопки для десктопа */}
      <div className="mt-4 pt-4 border-t border-[#5a3f2e]/50">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] text-[#a08868] font-body italic">
            Отладка: изменить расстояние
          </span>
          <span className="text-[11px] text-[#a08868] font-serif">для теста на ПК</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => addDistance(-1)}
            className="w-9 h-9 rounded-xl bg-[#5a3f2e] flex items-center justify-center text-[#e8d9b8] active:scale-90 transition shrink-0"
          >
            <Minus size={16} />
          </button>
          <button
            onClick={() => addDistance(1)}
            className="flex-1 rounded-xl bg-[#5a3f2e] py-2 text-[#e8d9b8] font-serif font-semibold text-sm active:scale-[0.97] transition flex items-center justify-center gap-1.5"
          >
            <Plus size={16} /> +1 км
          </button>
          <button
            onClick={() => addDistance(10)}
            className="flex-1 rounded-xl bg-[#5a3f2e] py-2 text-[#e8d9b8] font-serif font-semibold text-sm active:scale-[0.97] transition flex items-center justify-center gap-1.5"
          >
            <Plus size={16} /> +10 км
          </button>
        </div>
      </div>
    </div>
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
  checkpoints,
  onOpenCheckpoint,
  pedometer,
}: {
  current: RouteWaypoint;
  index: number;
  progress: number;
  setProgress: (v: number) => void;
  distDone: string;
  totalDist: number;
  stepsDone: number;
  minDone: number;
  checkpoints: Checkpoint[];
  onOpenCheckpoint: (cp: Checkpoint) => void;
  pedometer: ReturnType<typeof usePedometer>;
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

      {/* Текущая точка — компактная плашка */}
      <div
        key={index}
        className="rounded-[20px] overflow-hidden bg-[#fdf6e3] shadow-[0_4px_16px_rgba(74,47,28,0.12)] ring-1 ring-[#e0d0b0] animate-fade-in-up"
      >
        <div className="flex items-center gap-3 p-3">
          <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0">
            <img
              src={current.image}
              alt={current.name}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[10px] font-serif font-semibold text-[#8b5a2b]">
              Точка {index + 1} / {ROUTE_WAYPOINTS.length}
            </span>
            <h2 className="text-base font-serif font-bold text-[#4a2f1c] truncate leading-tight">
              {current.name}
            </h2>
          </div>
          <div className="shrink-0 text-right">
            <span className="text-lg font-serif font-bold text-[#c9971a] leading-none">
              {current.distanceKm}
            </span>
            <span className="text-[10px] text-[#8b6f47] font-body block leading-none">км</span>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2 px-3 pb-3">
          <Stat icon={<Footprints size={13} />} label="Шагов" value={stepsDone.toLocaleString()} />
          <Stat icon={<Clock size={13} />} label="В пути" value={`${minDone} мин`} />
          <Stat icon={<Navigation size={13} />} label="Пройдено" value={`${distDone} км`} />
        </div>
      </div>

      {/* Интерактивная карта пути */}
      <RouteMap
        progress={progress}
        totalDistKm={totalDist}
        onProgressChange={setProgress}
        checkpoints={checkpoints}
        onOpenCheckpoint={onOpenCheckpoint}
      />

      {/* Шагомер */}
      <PedometerCard pedometer={pedometer} />
    </div>
  );
}

/* ── Journal Screen ── */
function JournalScreen({
  progress,
  stepsDone,
  minDone,
  distDone,
  checkpoints,
  onOpenCheckpoint,
}: {
  progress: number;
  stepsDone: number;
  minDone: number;
  distDone: string;
  checkpoints: Checkpoint[];
  onOpenCheckpoint: (cp: Checkpoint) => void;
}) {
  const distKm = progress * TOTAL_DISTANCE_KM;
  const entries = ROUTE_WAYPOINTS.filter((w) => w.distanceKm <= distKm + 0.5);
  const unlockedCount = checkpoints.filter((c) => c.isUnlocked).length;

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

      {/* Checkpoint journals */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent to-[#c9b896]" />
          <span className="text-xs font-serif font-semibold text-[#8b6f47] tracking-wide uppercase">
            Дневники точек ({unlockedCount}/{checkpoints.length})
          </span>
          <div className="h-px flex-1 bg-gradient-to-l from-transparent to-[#c9b896]" />
        </div>
        <div className="space-y-3">
          {checkpoints.map((cp) => (
            <CheckpointListCard
              key={cp.id}
              checkpoint={cp}
              totalDist={TOTAL_DISTANCE_KM}
              onOpen={onOpenCheckpoint}
            />
          ))}
        </div>
      </div>

      {/* route journal entries */}
      <div className="flex items-center gap-2 mb-3">
        <div className="h-px flex-1 bg-gradient-to-r from-transparent to-[#c9b896]" />
        <span className="text-xs font-serif font-semibold text-[#8b6f47] tracking-wide uppercase">
          Записи маршрута
        </span>
        <div className="h-px flex-1 bg-gradient-to-l from-transparent to-[#c9b896]" />
      </div>
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
  checkpoints,
  onOpenCheckpoint,
}: {
  stepsDone: number;
  distDone: string;
  minDone: number;
  checkpoints: Checkpoint[];
  onOpenCheckpoint: (cp: Checkpoint) => void;
}) {
  const reachedCount = ROUTE_WAYPOINTS.filter(
    (w) => w.distanceKm <= parseFloat(distDone),
  ).length;
  const unlockedCount = checkpoints.filter((c) => c.isUnlocked).length;

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

      {/* Checkpoint progress */}
      <div className="rounded-[24px] bg-[#fdf6e3] shadow-[0_8px_24px_rgba(74,47,28,0.18)] ring-1 ring-[#e0d0b0] p-5 mb-4">
        <div className="flex items-center gap-2 mb-4">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[#c9b896] to-transparent" />
          <span className="text-xs font-serif font-semibold text-[#8b6f47] tracking-wide">Дневники точек</span>
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[#c9b896] to-transparent" />
        </div>
        <div className="flex items-center justify-center gap-3">
          <span className="text-4xl font-serif font-bold text-[#c9971a]">{unlockedCount}</span>
          <span className="text-2xl font-serif text-[#a08868]">/ {checkpoints.length}</span>
        </div>
        <div className="mt-3 h-2 rounded-full bg-[#e8d9b8] overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#c9971a] to-[#8b5a2b] rounded-full transition-all duration-300"
            style={{ width: `${(unlockedCount / checkpoints.length) * 100}%` }}
          />
        </div>
        <div className="mt-3 space-y-2">
          {checkpoints.map((cp) => (
            <button
              key={cp.id}
              onClick={() => cp.isUnlocked && onOpenCheckpoint(cp)}
              disabled={!cp.isUnlocked}
              className={`w-full flex items-center gap-3 rounded-xl px-3 py-2 text-left transition ${
                cp.isUnlocked
                  ? 'bg-[#f0e4c8] hover:bg-[#e8d9b8] active:scale-[0.98]'
                  : 'bg-[#e8d9b8]/50 opacity-60'
              }`}
            >
              {cp.isUnlocked ? (
                <CheckCircle2 size={16} className="text-[#c9971a] shrink-0" />
              ) : (
                <Lock size={16} className="text-[#a08868] shrink-0" />
              )}
              <span className={`text-sm font-serif font-semibold flex-1 truncate ${
                cp.isUnlocked ? 'text-[#4a2f1c]' : 'text-[#8b6f47]'
              }`}>
                {cp.title}
              </span>
              <span className="text-[11px] text-[#8b6f47] font-body italic shrink-0">
                {cp.distanceKm} км
              </span>
            </button>
          ))}
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
          <Achievement icon={<Feather size={18} />} title="Летописец" desc="Открыть первый дневник точки" unlocked={unlockedCount >= 1} />
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
