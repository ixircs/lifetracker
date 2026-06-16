import React, { useState, useEffect, useCallback } from "react";
import {
  BookOpen, Code2, Clapperboard, Radio, Gamepad2, Dumbbell,
  Plus, Trash2, RefreshCw, Settings as SettingsIcon, CalendarDays,
  Sun, Flame, Target, Utensils, X, Check, Clock, ListChecks, Sparkles
} from "lucide-react";
import { BarChart, Bar, XAxis, ResponsiveContainer, Cell, Tooltip } from "recharts";
import { storage } from "./storage";

/* ----------------------------- config ----------------------------- */

const CATEGORIES = [
  { id: "belajar",  label: "Belajar",  Icon: BookOpen,     color: "#5b8def" },
  { id: "project",  label: "Project",  Icon: Code2,        color: "#3ec6c0" },
  { id: "ngonten",  label: "Ngonten",  Icon: Clapperboard, color: "#e0a93b" },
  { id: "live",     label: "Live",     Icon: Radio,        color: "#e85c7a" },
  { id: "valorant", label: "Valorant", Icon: Gamepad2,     color: "#ff4655" },
  { id: "olahraga", label: "Gym",      Icon: Dumbbell,     color: "#5cc97a" },
];
const CAT = Object.fromEntries(CATEGORIES.map(c => [c.id, c]));
const DEFAULTS = { calTarget: 2000, proteinTarget: 150, gymGoal: 3 };

const WEEKDAYS = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"];
const DAY_SHORT = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];
const MONTHS = ["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"];

const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

function exampleSchedule() {
  const s = [[], [], [], [], [], [], []];
  const add = (day, cat, label, time) => s[day].push({ id: uid(), cat, label, time });
  [0,1,2,3,4,5,6].forEach(d => add(d, "belajar", "Belajar / review materi", "19:00"));
  [0,2,4].forEach(d => add(d, "project", "Garap portfolio project", "16:00"));
  [1,3,5].forEach(d => add(d, "olahraga", "Gym", "07:00"));
  [1,3,6].forEach(d => add(d, "live", "Live TikTok Valorant", "20:30"));
  add(5, "valorant", "Grind rank", "21:00");
  add(6, "ngonten", "Batch bikin konten", "13:00");
  return s;
}

/* ----------------------------- date utils ------------------------- */

const dKey = (d) => {
  const y = d.getFullYear(), m = String(d.getMonth() + 1).padStart(2, "0"), day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};
const wdIndex = (d) => (d.getDay() + 6) % 7;
function mondayOf(d) { const x = new Date(d); x.setDate(x.getDate() - wdIndex(x)); x.setHours(0,0,0,0); return x; }
function weekDates(ref) {
  const mon = mondayOf(ref);
  return Array.from({ length: 7 }, (_, i) => { const d = new Date(mon); d.setDate(mon.getDate() + i); return d; });
}
const byTime = (a, b) => (a.time || "99:99").localeCompare(b.time || "99:99");

/* ----------------------------- storage ---------------------------- */

const emptyDay = () => ({ done: {}, extra: [], meals: [] });

async function loadDay(key) {
  try {
    const r = await storage.get(`day:${key}`);
    if (!r || !r.value) return emptyDay();
    const v = JSON.parse(r.value);
    return { done: v.done || {}, extra: v.extra || [], meals: v.meals || [] };
  } catch { return emptyDay(); }
}
async function saveDay(key, data) { try { await storage.set(`day:${key}`, JSON.stringify(data)); } catch (e) { console.error(e); } }

async function loadSchedule() {
  try {
    const r = await storage.get("schedule");
    if (!r || !r.value) return null;
    const v = JSON.parse(r.value);
    return Array.isArray(v) && v.length === 7 ? v : null;
  } catch { return null; }
}
async function saveSchedule(s) { try { await storage.set("schedule", JSON.stringify(s)); } catch (e) { console.error(e); } }

async function loadSettings() {
  try { const r = await storage.get("settings"); return r && r.value ? { ...DEFAULTS, ...JSON.parse(r.value) } : { ...DEFAULTS }; }
  catch { return { ...DEFAULTS }; }
}
async function saveSettings(s) { try { await storage.set("settings", JSON.stringify(s)); } catch (e) { console.error(e); } }

/* ----------------------------- UI atoms --------------------------- */

function Ring({ value, target, color, label }) {
  const pct = target > 0 ? Math.min(value / target, 1) : 0;
  const R = 34, C = 2 * Math.PI * R, over = target > 0 && value > target;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
      <div style={{ position: "relative", width: 86, height: 86 }}>
        <svg width="86" height="86" style={{ transform: "rotate(-90deg)" }}>
          <circle cx="43" cy="43" r={R} fill="none" stroke="#26262c" strokeWidth="7" />
          <circle cx="43" cy="43" r={R} fill="none" stroke={over ? "#e85c7a" : color} strokeWidth="7"
            strokeLinecap="round" strokeDasharray={C} strokeDashoffset={C * (1 - pct)}
            style={{ transition: "stroke-dashoffset .5s ease" }} />
        </svg>
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          <span style={{ fontFamily: "var(--mono)", fontSize: 17, fontWeight: 700 }}>{Math.round(value)}</span>
          <span style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--muted)" }}>/{target}</span>
        </div>
      </div>
      <span style={{ fontSize: 12, color: "var(--muted)" }}>{label}</span>
    </div>
  );
}
const Card = ({ children, style }) => (
  <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 18, padding: 18, ...style }}>{children}</div>
);
const SectionTitle = ({ children, right }) => (
  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
    <h2 style={{ margin: 0, fontFamily: "var(--display)", fontSize: 15, fontWeight: 700, color: "var(--silver)", letterSpacing: ".04em", textTransform: "uppercase" }}>{children}</h2>
    {right}
  </div>
);

/* ----------------------------- app -------------------------------- */

export default function App() {
  const [tab, setTab] = useState("today");
  const [settings, setSettings] = useState({ ...DEFAULTS });
  const [schedule, setSchedule] = useState([[], [], [], [], [], [], []]);
  const [hasSchedule, setHasSchedule] = useState(false);
  const [today, setToday] = useState(emptyDay());
  const [week, setWeek] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showSched, setShowSched] = useState(false);
  const [showExtra, setShowExtra] = useState(false);
  const [showMeal, setShowMeal] = useState(false);

  const todayKey = dKey(new Date());
  const tWd = wdIndex(new Date());

  const refresh = useCallback(async () => {
    const [s, sch, t] = await Promise.all([loadSettings(), loadSchedule(), loadDay(todayKey)]);
    setSettings(s); setToday(t);
    if (sch) { setSchedule(sch); setHasSchedule(true); } else { setHasSchedule(false); }
    const dates = weekDates(new Date());
    const datas = await Promise.all(dates.map(d => loadDay(dKey(d))));
    setWeek(dates.map((d, i) => ({ date: d, data: datas[i] })));
    setLoading(false);
  }, [todayKey]);

  useEffect(() => { refresh(); }, [refresh]);
  useEffect(() => {
    const onVis = () => { if (document.visibilityState === "visible") refresh(); };
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("focus", onVis);
    return () => { document.removeEventListener("visibilitychange", onVis); window.removeEventListener("focus", onVis); };
  }, [refresh]);

  async function persistToday(next) {
    setToday(next);
    setWeek(w => w.map(c => dKey(c.date) === todayKey ? { ...c, data: next } : c));
    await saveDay(todayKey, next);
  }
  async function commitSchedule(next) { setSchedule(next); setHasSchedule(true); await saveSchedule(next); }

  async function toggleDone(id) { await persistToday({ ...today, done: { ...today.done, [id]: !today.done[id] } }); }
  async function addExtra(cat, label, time) { await persistToday({ ...today, extra: [...today.extra, { id: uid(), cat, label, time }] }); }
  async function removeExtra(id) {
    const done = { ...today.done }; delete done[id];
    await persistToday({ ...today, extra: today.extra.filter(e => e.id !== id), done });
  }
  async function addMeal(name, cal, protein) { await persistToday({ ...today, meals: [...today.meals, { id: uid(), name, cal, protein }] }); }
  async function removeMeal(id) { await persistToday({ ...today, meals: today.meals.filter(m => m.id !== id) }); }

  async function addSchedItem(days, cat, label, time) {
    const next = schedule.map((arr, i) => days.includes(i) ? [...arr, { id: uid(), cat, label, time }] : arr);
    await commitSchedule(next);
  }
  async function removeSchedItem(day, id) {
    await commitSchedule(schedule.map((arr, i) => i === day ? arr.filter(it => it.id !== id) : arr));
  }

  const greetH = new Date().getHours();
  const greet = greetH < 11 ? "Pagi" : greetH < 15 ? "Siang" : greetH < 18 ? "Sore" : "Malam";

  return (
    <div style={{ minHeight: "100vh", color: "var(--text)", fontFamily: "var(--body)", display: "flex", justifyContent: "center" }}>
      <div style={{ width: "100%", maxWidth: 480, minHeight: "100vh", position: "relative",
        background: "radial-gradient(120% 60% at 50% -10%, #17171f 0%, var(--bg) 55%)", paddingBottom: 92 }}>

        <header style={{ padding: "calc(26px + env(safe-area-inset-top)) 20px 10px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={{ fontFamily: "var(--mono)", fontSize: 12, color: "var(--silver-dim)", letterSpacing: ".08em" }}>
                {DAY_SHORT[tWd].toUpperCase()} · {new Date().getDate()} {MONTHS[new Date().getMonth()].toUpperCase()}
              </div>
              <h1 style={{ margin: "4px 0 0", fontFamily: "var(--display)", fontSize: 30, fontWeight: 800, letterSpacing: "-.02em", lineHeight: 1 }}>
                Selamat {greet}
              </h1>
            </div>
            <button onClick={refresh} title="Muat ulang" style={{ width: 40, height: 40, borderRadius: 12, background: "var(--surface)", border: "1px solid var(--border)", display: "grid", placeItems: "center" }}>
              <RefreshCw size={17} color="var(--silver)" />
            </button>
          </div>
        </header>

        <main style={{ padding: "8px 20px 0", display: "flex", flexDirection: "column", gap: 16 }}>
          {loading ? (
            <div style={{ textAlign: "center", color: "var(--muted)", padding: 60, fontFamily: "var(--mono)" }}>memuat data…</div>
          ) : tab === "today" ? (
            <TodayView {...{ schedule, tWd, today, toggleDone, removeExtra, settings, removeMeal, setShowExtra, setShowMeal }} />
          ) : tab === "schedule" ? (
            <ScheduleView {...{ schedule, hasSchedule, setShowSched, removeSchedItem, applyExample: () => commitSchedule(exampleSchedule()) }} />
          ) : tab === "week" ? (
            <WeekView {...{ week, schedule, settings }} />
          ) : (
            <SettingsView settings={settings} onSave={async (s) => { setSettings(s); await saveSettings(s); }} />
          )}
        </main>

        <nav style={{ position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 480,
          display: "flex", justifyContent: "space-around", padding: "10px 16px calc(10px + env(safe-area-inset-bottom))",
          background: "rgba(12,12,15,.86)", backdropFilter: "blur(14px)", WebkitBackdropFilter: "blur(14px)", borderTop: "1px solid var(--border)" }}>
          {[
            { id: "today", label: "Hari Ini", Icon: Sun },
            { id: "schedule", label: "Jadwal", Icon: ListChecks },
            { id: "week", label: "Minggu", Icon: CalendarDays },
            { id: "settings", label: "Atur", Icon: SettingsIcon },
          ].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
              color: tab === t.id ? "var(--silver)" : "var(--muted)", padding: "4px 10px" }}>
              <t.Icon size={21} />
              <span style={{ fontSize: 11, fontWeight: 600 }}>{t.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {showSched && <SchedModal onClose={() => setShowSched(false)} defaultDay={tWd} onAdd={async (d, c, l, t) => { await addSchedItem(d, c, l, t); setShowSched(false); }} />}
      {showExtra && <ExtraModal onClose={() => setShowExtra(false)} onAdd={async (c, l, t) => { await addExtra(c, l, t); setShowExtra(false); }} />}
      {showMeal && <MealModal onClose={() => setShowMeal(false)} onAdd={async (n, c, p) => { await addMeal(n, c, p); setShowMeal(false); }} />}
    </div>
  );
}

/* --------------------- checklist row ------------------------------ */

function ChecklistRow({ item, done, onToggle, onRemove }) {
  const c = CAT[item.cat];
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 11, padding: "11px 0" }}>
      <button onClick={onToggle} style={{ width: 26, height: 26, borderRadius: 9, flexShrink: 0, display: "grid", placeItems: "center",
        background: done ? c.color : "transparent", border: `2px solid ${done ? c.color : "var(--border)"}`, transition: "all .15s" }}>
        {done && <Check size={15} color="#0a0a0c" strokeWidth={3} />}
      </button>
      <c.Icon size={17} color={c.color} style={{ flexShrink: 0, opacity: done ? .5 : 1 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 500, color: done ? "var(--muted)" : "var(--text)",
          textDecoration: done ? "line-through" : "none", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {item.label || c.label}
        </div>
      </div>
      {item.time && (
        <span style={{ display: "flex", alignItems: "center", gap: 3, fontFamily: "var(--mono)", fontSize: 12, color: "var(--silver-dim)", flexShrink: 0 }}>
          <Clock size={11} /> {item.time}
        </span>
      )}
      {onRemove && (
        <button onClick={onRemove} style={{ display: "grid", placeItems: "center", color: "var(--muted)", flexShrink: 0 }}><Trash2 size={14} /></button>
      )}
    </div>
  );
}

/* ----------------------------- today ------------------------------ */

function TodayView({ schedule, tWd, today, toggleDone, removeExtra, settings, removeMeal, setShowExtra, setShowMeal }) {
  const recurring = (schedule[tWd] || []).map(it => ({ ...it, source: "sch" }));
  const extra = (today.extra || []).map(it => ({ ...it, source: "extra" }));
  const items = [...recurring, ...extra].sort(byTime);
  const doneCount = items.filter(it => today.done[it.id]).length;
  const pct = items.length ? (doneCount / items.length) * 100 : 0;

  const cals = today.meals.reduce((s, m) => s + (m.cal || 0), 0);
  const prot = today.meals.reduce((s, m) => s + (m.protein || 0), 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, animation: "fadeUp .3s ease" }}>
      <Card>
        <SectionTitle right={
          <span style={{ fontFamily: "var(--mono)", fontSize: 13, color: doneCount === items.length && items.length ? "#5cc97a" : "var(--silver)" }}>{doneCount}/{items.length}</span>
        }>Checklist Hari Ini</SectionTitle>

        {items.length === 0 ? (
          <p style={{ color: "var(--muted)", fontSize: 13, margin: "4px 0 0", lineHeight: 1.6 }}>
            Belum ada jadwal untuk hari ini. Atur rutinitas di tab <b style={{ color: "var(--silver)" }}>Jadwal</b>, atau tambah tugas dadakan di bawah.
          </p>
        ) : (
          <>
            <div style={{ height: 8, background: "var(--surface2)", borderRadius: 99, marginBottom: 4 }}>
              <div style={{ width: `${pct}%`, height: "100%", background: "#5cc97a", borderRadius: 99, transition: "width .4s" }} />
            </div>
            <div>
              {items.map((it, i) => (
                <div key={it.id} style={{ borderTop: i ? "1px solid var(--border)" : "none" }}>
                  <ChecklistRow item={it} done={!!today.done[it.id]} onToggle={() => toggleDone(it.id)} onRemove={it.source === "extra" ? () => removeExtra(it.id) : null} />
                </div>
              ))}
            </div>
          </>
        )}
        <button onClick={() => setShowExtra(true)} style={{ width: "100%", marginTop: 12, padding: 11, borderRadius: 12, fontSize: 13, fontWeight: 600,
          color: "var(--silver-dim)", border: "1px dashed var(--border)", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
          <Plus size={15} /> Tugas dadakan (cuma hari ini)
        </button>
      </Card>

      <Card>
        <SectionTitle right={
          <button onClick={() => setShowMeal(true)} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12.5, fontWeight: 600,
            color: "#0a0a0c", background: "var(--silver)", padding: "6px 11px", borderRadius: 10 }}><Plus size={14} /> Makan</button>
        }>Asupan Makan</SectionTitle>
        <div style={{ display: "flex", justifyContent: "space-around", margin: "8px 0 4px" }}>
          <Ring value={cals} target={settings.calTarget} color="#e0a93b" label="Kalori" />
          <Ring value={prot} target={settings.proteinTarget} color="#5cc97a" label="Protein (g)" />
        </div>
        {today.meals.length > 0 && (
          <div style={{ marginTop: 12, borderTop: "1px solid var(--border)", paddingTop: 12, display: "flex", flexDirection: "column", gap: 7 }}>
            {[...today.meals].reverse().map(m => (
              <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
                <Utensils size={13} color="var(--silver-dim)" />
                <span style={{ flex: 1 }}>{m.name}</span>
                <span style={{ fontFamily: "var(--mono)", fontSize: 12, color: "#e0a93b" }}>{m.cal}kal</span>
                <span style={{ fontFamily: "var(--mono)", fontSize: 12, color: "#5cc97a" }}>{m.protein}g</span>
                <button onClick={() => removeMeal(m.id)} style={{ display: "grid", placeItems: "center", color: "var(--muted)" }}><Trash2 size={13} /></button>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

/* ----------------------------- schedule --------------------------- */

function ScheduleView({ schedule, hasSchedule, setShowSched, removeSchedItem, applyExample }) {
  const tWd = wdIndex(new Date());
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, animation: "fadeUp .3s ease" }}>
      <Card>
        <SectionTitle right={
          <button onClick={() => setShowSched(true)} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12.5, fontWeight: 600,
            color: "#0a0a0c", background: "var(--silver)", padding: "6px 11px", borderRadius: 10 }}><Plus size={14} /> Item</button>
        }>Jadwal Mingguan</SectionTitle>
        <p style={{ margin: "0 0 4px", fontSize: 12.5, color: "var(--muted)", lineHeight: 1.6 }}>
          Rutinitas yang kamu set di sini otomatis muncul jadi checklist tiap hari sesuai harinya.
        </p>
        {!hasSchedule && (
          <button onClick={applyExample} style={{ width: "100%", marginTop: 10, padding: 12, borderRadius: 12, fontSize: 13, fontWeight: 600,
            color: "var(--silver)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", gap: 7 }}>
            <Sparkles size={15} /> Pakai contoh jadwal (bisa diedit)
          </button>
        )}
      </Card>

      {WEEKDAYS.map((name, d) => {
        const items = [...(schedule[d] || [])].sort(byTime);
        const isToday = d === tWd;
        return (
          <Card key={d} style={isToday ? { borderColor: "var(--silver-dim)" } : undefined}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: items.length ? 10 : 0 }}>
              <span style={{ fontFamily: "var(--display)", fontSize: 15, fontWeight: 700 }}>{name}</span>
              {isToday && <span style={{ fontSize: 10, fontWeight: 700, color: "#0a0a0c", background: "var(--silver)", padding: "2px 7px", borderRadius: 99 }}>HARI INI</span>}
              <span style={{ marginLeft: "auto", fontFamily: "var(--mono)", fontSize: 12, color: "var(--muted)" }}>{items.length} item</span>
            </div>
            {items.length === 0 ? (
              <p style={{ margin: 0, fontSize: 12.5, color: "var(--muted)" }}>Kosong</p>
            ) : items.map((it, i) => {
              const c = CAT[it.cat];
              return (
                <div key={it.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 0", borderTop: i ? "1px solid var(--border)" : "none" }}>
                  <c.Icon size={16} color={c.color} style={{ flexShrink: 0 }} />
                  <span style={{ flex: 1, fontSize: 13.5, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{it.label || c.label}</span>
                  {it.time && <span style={{ fontFamily: "var(--mono)", fontSize: 12, color: "var(--silver-dim)" }}>{it.time}</span>}
                  <button onClick={() => removeSchedItem(d, it.id)} style={{ display: "grid", placeItems: "center", color: "var(--muted)" }}><Trash2 size={13} /></button>
                </div>
              );
            })}
          </Card>
        );
      })}
    </div>
  );
}

/* ----------------------------- week ------------------------------- */

function WeekView({ week, schedule, settings }) {
  const catDone = {}; CATEGORIES.forEach(c => catDone[c.id] = 0);
  let totalDone = 0, totalItems = 0, gymDone = 0, activeDays = 0;

  const chart = week.map(({ date, data }) => {
    const wd = wdIndex(date);
    const items = [...(schedule[wd] || []), ...(data.extra || [])];
    let dd = 0;
    items.forEach(it => {
      totalItems += 1;
      if (data.done[it.id]) { dd += 1; totalDone += 1; catDone[it.cat] = (catDone[it.cat] || 0) + 1; if (it.cat === "olahraga") gymDone += 1; }
    });
    if (dd > 0) activeDays += 1;
    return { day: DAY_SHORT[wd], done: dd, total: items.length, isToday: dKey(date) === dKey(new Date()) };
  });

  const rate = totalItems ? Math.round((totalDone / totalItems) * 100) : 0;
  const gymPct = Math.min(gymDone / settings.gymGoal, 1) * 100;
  const maxCat = Math.max(...Object.values(catDone), 1);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, animation: "fadeUp .3s ease" }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Card style={{ padding: 16 }}>
          <Flame size={18} color="#e0a93b" />
          <div style={{ fontFamily: "var(--mono)", fontSize: 26, fontWeight: 700, marginTop: 6 }}>{rate}%</div>
          <div style={{ fontSize: 12, color: "var(--muted)" }}>Tingkat penyelesaian</div>
        </Card>
        <Card style={{ padding: 16 }}>
          <CalendarDays size={18} color="#5b8def" />
          <div style={{ fontFamily: "var(--mono)", fontSize: 26, fontWeight: 700, marginTop: 6 }}>{activeDays}/7</div>
          <div style={{ fontSize: 12, color: "var(--muted)" }}>Hari produktif</div>
        </Card>
      </div>

      <Card>
        <SectionTitle right={
          <span style={{ fontFamily: "var(--mono)", fontSize: 13, color: gymDone >= settings.gymGoal ? "#5cc97a" : "var(--silver)" }}>{gymDone}/{settings.gymGoal}</span>
        }><span style={{ display: "flex", alignItems: "center", gap: 7 }}><Dumbbell size={15} /> Target Gym</span></SectionTitle>
        <div style={{ height: 10, background: "var(--surface2)", borderRadius: 99 }}>
          <div style={{ width: `${gymPct}%`, height: "100%", background: "#5cc97a", borderRadius: 99, transition: "width .5s" }} />
        </div>
        <p style={{ margin: "10px 0 0", fontSize: 12.5, color: "var(--muted)" }}>
          {gymDone >= settings.gymGoal ? "Target tercapai. Konsisten." : `Kurang ${settings.gymGoal - gymDone} sesi lagi minggu ini.`}
        </p>
      </Card>

      <Card>
        <SectionTitle>Tugas Selesai / Hari</SectionTitle>
        <div style={{ height: 150 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chart} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
              <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: "#83838f", fontSize: 11, fontFamily: "JetBrains Mono" }} />
              <Tooltip cursor={{ fill: "#ffffff08" }} contentStyle={{ background: "#1c1c22", border: "1px solid #26262d", borderRadius: 10, fontSize: 12 }}
                labelStyle={{ color: "#c6cad6" }} formatter={(v, n, p) => [`${v}/${p.payload.total} selesai`, "Tugas"]} />
              <Bar dataKey="done" radius={[6, 6, 0, 0]}>
                {chart.map((d, i) => <Cell key={i} fill={d.isToday ? "#c6cad6" : "#3a3a44"} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card>
        <SectionTitle>Selesai per Kategori</SectionTitle>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {CATEGORIES.map(c => (
            <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <c.Icon size={16} color={c.color} style={{ flexShrink: 0 }} />
              <span style={{ fontSize: 13, width: 66, flexShrink: 0 }}>{c.label}</span>
              <div style={{ flex: 1, height: 7, background: "var(--surface2)", borderRadius: 99 }}>
                <div style={{ width: `${(catDone[c.id] / maxCat) * 100}%`, height: "100%", background: c.color, borderRadius: 99, transition: "width .4s" }} />
              </div>
              <span style={{ fontFamily: "var(--mono)", fontSize: 12, color: "var(--muted)", width: 28, textAlign: "right" }}>{catDone[c.id]}x</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

/* ----------------------------- settings --------------------------- */

function SettingsView({ settings, onSave }) {
  const [cal, setCal] = useState(settings.calTarget);
  const [prot, setProt] = useState(settings.proteinTarget);
  const [gym, setGym] = useState(settings.gymGoal);
  const [saved, setSaved] = useState(false);
  async function save() {
    await onSave({ calTarget: +cal || 0, proteinTarget: +prot || 0, gymGoal: +gym || 1 });
    setSaved(true); setTimeout(() => setSaved(false), 1500);
  }
  const field = (label, val, set, suffix) => (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 0", borderBottom: "1px solid var(--border)" }}>
      <span style={{ fontSize: 14 }}>{label}</span>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <input type="number" value={val} onChange={e => set(e.target.value)} style={{ width: 80, textAlign: "right", background: "var(--surface2)",
          border: "1px solid var(--border)", borderRadius: 9, padding: "8px 10px", color: "var(--text)", fontFamily: "var(--mono)", fontSize: 15 }} />
        <span style={{ fontSize: 12, color: "var(--muted)", width: 32 }}>{suffix}</span>
      </div>
    </div>
  );
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, animation: "fadeUp .3s ease" }}>
      <Card>
        <SectionTitle><span style={{ display: "flex", alignItems: "center", gap: 7 }}><Target size={15} /> Target Kamu</span></SectionTitle>
        {field("Target kalori", cal, setCal, "kal")}
        {field("Target protein", prot, setProt, "g")}
        {field("Target gym / minggu", gym, setGym, "x")}
        <button onClick={save} style={{ width: "100%", marginTop: 16, padding: 13, borderRadius: 12, fontWeight: 700, fontSize: 14,
          background: saved ? "#5cc97a" : "var(--silver)", color: "#0a0a0c", display: "flex", alignItems: "center", justifyContent: "center", gap: 7 }}>
          {saved ? <><Check size={16} /> Tersimpan</> : "Simpan Target"}
        </button>
      </Card>
      <Card>
        <SectionTitle>Tentang Data</SectionTitle>
        <p style={{ fontSize: 13, color: "var(--silver-dim)", lineHeight: 1.6, margin: 0 }}>
          Data tersimpan lokal di perangkat ini (localStorage). Tidak ada server, tidak dikirim ke mana pun.
        </p>
      </Card>
    </div>
  );
}

/* ----------------------------- modals ----------------------------- */

function Modal({ children, onClose, title }) {
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.6)", backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)",
      display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 50 }}>
      <div onClick={e => e.stopPropagation()} style={{ width: "100%", maxWidth: 480, background: "var(--surface)", borderTopLeftRadius: 22, borderTopRightRadius: 22,
        border: "1px solid var(--border)", padding: 22, paddingBottom: "calc(22px + env(safe-area-inset-bottom))", animation: "fadeUp .25s ease" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
          <h3 style={{ margin: 0, fontFamily: "var(--display)", fontSize: 19, fontWeight: 700 }}>{title}</h3>
          <button onClick={onClose} style={{ color: "var(--muted)" }}><X size={22} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}
const inputStyle = { width: "100%", background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 11, padding: "13px 14px", color: "var(--text)", fontSize: 15, marginBottom: 12 };
const btnStyle = { width: "100%", padding: 14, borderRadius: 12, fontWeight: 700, fontSize: 15, background: "var(--silver)", color: "#0a0a0c", marginTop: 4 };

function CatPicker({ cat, setCat }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 14 }}>
      {CATEGORIES.map(c => {
        const on = c.id === cat;
        return (
          <button key={c.id} onClick={() => setCat(c.id)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 12px", borderRadius: 11,
            fontSize: 13, fontWeight: 600, background: on ? c.color : "var(--surface2)", color: on ? "#0a0a0c" : "var(--silver-dim)", border: `1px solid ${on ? c.color : "var(--border)"}` }}>
            <c.Icon size={15} /> {c.label}
          </button>
        );
      })}
    </div>
  );
}

function SchedModal({ onClose, onAdd, defaultDay }) {
  const [days, setDays] = useState([defaultDay]);
  const [cat, setCat] = useState("belajar");
  const [label, setLabel] = useState("");
  const [time, setTime] = useState("");
  const toggle = (d) => setDays(p => p.includes(d) ? p.filter(x => x !== d) : [...p, d]);
  return (
    <Modal onClose={onClose} title="Tambah ke Jadwal">
      <label style={{ fontSize: 12, color: "var(--muted)", display: "block", marginBottom: 8 }}>Hari (boleh pilih banyak)</label>
      <div style={{ display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap" }}>
        {DAY_SHORT.map((d, i) => {
          const on = days.includes(i);
          return (
            <button key={i} onClick={() => toggle(i)} style={{ width: 42, height: 38, borderRadius: 10, fontSize: 12.5, fontWeight: 600,
              background: on ? "var(--silver)" : "var(--surface2)", color: on ? "#0a0a0c" : "var(--silver-dim)", border: `1px solid ${on ? "var(--silver)" : "var(--border)"}` }}>{d}</button>
          );
        })}
      </div>
      <CatPicker cat={cat} setCat={setCat} />
      <input placeholder="Nama kegiatan — misal: Belajar SQL" value={label} onChange={e => setLabel(e.target.value)} style={inputStyle} />
      <label style={{ fontSize: 12, color: "var(--muted)", display: "block", marginBottom: 6 }}>Jam (opsional)</label>
      <input type="time" value={time} onChange={e => setTime(e.target.value)} style={inputStyle} />
      <button disabled={!days.length} onClick={() => onAdd(days, cat, label.trim(), time)} style={{ ...btnStyle, opacity: days.length ? 1 : .4 }}>
        Tambah ke {days.length} hari
      </button>
    </Modal>
  );
}

function ExtraModal({ onClose, onAdd }) {
  const [cat, setCat] = useState("project");
  const [label, setLabel] = useState("");
  const [time, setTime] = useState("");
  return (
    <Modal onClose={onClose} title="Tugas Dadakan">
      <CatPicker cat={cat} setCat={setCat} />
      <input placeholder="Nama tugas — misal: Fix bug deployment" value={label} onChange={e => setLabel(e.target.value)} style={inputStyle} />
      <label style={{ fontSize: 12, color: "var(--muted)", display: "block", marginBottom: 6 }}>Jam (opsional)</label>
      <input type="time" value={time} onChange={e => setTime(e.target.value)} style={inputStyle} />
      <button onClick={() => onAdd(cat, label.trim(), time)} style={btnStyle}>Tambah untuk Hari Ini</button>
    </Modal>
  );
}

function MealModal({ onClose, onAdd }) {
  const [name, setName] = useState("");
  const [cal, setCal] = useState("");
  const [prot, setProt] = useState("");
  return (
    <Modal onClose={onClose} title="Tambah Makan">
      <input placeholder="Nama makanan — misal: Ayam + nasi" value={name} onChange={e => setName(e.target.value)} style={inputStyle} />
      <div style={{ display: "flex", gap: 12 }}>
        <input type="number" placeholder="Kalori" value={cal} onChange={e => setCal(e.target.value)} style={inputStyle} />
        <input type="number" placeholder="Protein (g)" value={prot} onChange={e => setProt(e.target.value)} style={inputStyle} />
      </div>
      <button disabled={!name} onClick={() => onAdd(name.trim(), Math.round(+cal) || 0, Math.round(+prot) || 0)} style={{ ...btnStyle, opacity: name ? 1 : .4 }}>Simpan</button>
    </Modal>
  );
}
