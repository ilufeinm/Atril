import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, CalendarDays, Music2, MapPin, Clock } from 'lucide-react';

const WEEKDAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

// Devuelve el día de la semana en formato 0=Lun..6=Dom
const weekdayMon = (d) => (d.getDay() + 6) % 7;

export default function SetlistCalendar({ sets, demoSets = [], onOpen }) {
  const today = new Date();
  const [cursor, setCursor] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDay, setSelectedDay] = useState(null);

  const allSets = useMemo(() => [...sets, ...demoSets], [sets, demoSets]);

  // Mapa fecha -> setlists (clave YYYY-MM-DD)
  const byDate = useMemo(() => {
    const map = {};
    for (const s of allSets) {
      if (!s.date) continue;
      const key = s.date.slice(0, 10);
      (map[key] = map[key] || []).push(s);
    }
    return map;
  }, [allSets]);

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const firstDay = new Date(year, month, 1);
  const startOffset = weekdayMon(firstDay);
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Próximos eventos (fecha >= hoy), ordenados
  const upcoming = useMemo(() => {
    const todayStr = today.toISOString().slice(0, 10);
    return allSets
      .filter((s) => s.date && s.date.slice(0, 10) >= todayStr)
      .sort((a, b) => (a.date || '').localeCompare(b.date || ''));
  }, [allSets]);

  const cells = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const isToday = (d) =>
    d === today.getDate() && month === today.getMonth() && year === today.getFullYear();

  const dateKey = (d) =>
    `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

  const daySets = (d) => (d ? byDate[dateKey(d)] || [] : []);

  const prevMonth = () => setCursor(new Date(year, month - 1, 1));
  const nextMonth = () => setCursor(new Date(year, month + 1, 1));
  const goToday = () => {
    setCursor(new Date(today.getFullYear(), today.getMonth(), 1));
    setSelectedDay(null);
  };

  // Eventos del día seleccionado, o próximos si no hay selección
  const shownEvents = selectedDay
    ? daySets(selectedDay)
    : upcoming;

  return (
    <div className="space-y-6">
      {/* Calendario */}
      <div className="rounded-2xl bg-[#1e1e22] border border-[#2b2b30] p-4 sm:p-6">
        <div className="flex items-center justify-between mb-5">
          <button onClick={prevMonth} className="w-9 h-9 rounded-lg bg-[#262629] flex items-center justify-center text-white/70 hover:text-white transition-colors" aria-label="Mes anterior">
            <ChevronLeft size={18} />
          </button>
          <div className="text-center">
            <div className="font-bold text-base sm:text-lg">{MONTHS[month]} {year}</div>
            <button onClick={goToday} className="text-[11px] text-[#8e9aaf] hover:underline mt-0.5">Hoy</button>
          </div>
          <button onClick={nextMonth} className="w-9 h-9 rounded-lg bg-[#262629] flex items-center justify-center text-white/70 hover:text-white transition-colors" aria-label="Mes siguiente">
            <ChevronRight size={18} />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1 mb-2">
          {WEEKDAYS.map((w) => (
            <div key={w} className="text-center text-[10px] sm:text-xs font-semibold text-white/40 uppercase tracking-wide py-1">{w}</div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {cells.map((d, i) => {
            if (!d) return <div key={`e${i}`} />;
            const events = daySets(d);
            const hasEvents = events.length > 0;
            const selected = selectedDay === d;
            const todayCls = isToday(d);
            return (
              <button
                key={d}
                onClick={() => setSelectedDay(selected ? null : d)}
                className={`relative aspect-square rounded-lg flex flex-col items-center justify-center text-sm transition-colors select-none
                  ${selected ? 'bg-[#8e9aaf] text-[#121212] font-bold' :
                    hasEvents ? 'bg-[#8e9aaf]/12 text-white hover:bg-[#8e9aaf]/20' :
                    'text-white/55 hover:bg-[#262629]'}
                  ${todayCls && !selected ? 'ring-1 ring-[#8e9aaf]' : ''}`}
              >
                <span className={todayCls && !selected ? 'text-[#8e9aaf] font-bold' : ''}>{d}</span>
                {hasEvents && (
                  <span className="absolute bottom-1 flex gap-0.5">
                    {events.slice(0, 3).map((_, idx) => (
                      <span key={idx} className={`w-1 h-1 rounded-full ${selected ? 'bg-[#121212]' : 'bg-[#8e9aaf]'}`} />
                    ))}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Eventos del día seleccionado o próximos */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <CalendarDays size={16} className="text-[#8e9aaf]" />
          <h3 className="font-semibold text-sm">
            {selectedDay
              ? `${selectedDay} de ${MONTHS[month]} — ${shownEvents.length} evento${shownEvents.length === 1 ? '' : 's'}`
              : `Próximas presentaciones · ${shownEvents.length}`}
          </h3>
          {selectedDay && (
            <button onClick={() => setSelectedDay(null)} className="text-xs text-[#8e9aaf] hover:underline ml-auto">
              Ver próximas
            </button>
          )}
        </div>

        {shownEvents.length === 0 ? (
          <div className="p-8 text-center border border-dashed border-white/15 rounded-2xl text-white/40 text-sm">
            {selectedDay ? 'No hay eventos este día.' : 'Sin presentaciones programadas.'}
          </div>
        ) : (
          <div className="space-y-2.5">
            {shownEvents.map((s) => {
              const isDemo = !!s.is_demo;
              return (
                <button
                  key={s.id}
                  onClick={() => onOpen(s.id)}
                  className="w-full text-left rounded-xl bg-[#1e1e22] border border-[#2b2b30] p-4 hover:bg-[#262629] transition-colors flex items-center gap-3"
                >
                  <span className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${isDemo ? 'bg-white/10 text-white/60' : 'bg-[#8e9aaf]/12 text-[#8e9aaf]'}`}>
                    <Music2 size={20} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold truncate flex items-center gap-2">
                      {s.name}
                      {isDemo && <span className="text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded bg-white/10 text-white/55">Demo</span>}
                    </div>
                    <div className="text-xs text-white/45 flex items-center gap-3 mt-1 flex-wrap">
                      {s.venue && <span className="flex items-center gap-1"><MapPin size={12} />{s.venue}</span>}
                      {s.date && <span className="flex items-center gap-1"><CalendarDays size={12} />{new Date(s.date + 'T12:00:00').toLocaleDateString('es', { day: 'numeric', month: 'short', year: 'numeric' })}</span>}
                      {s.time && <span className="flex items-center gap-1"><Clock size={12} />{s.time}</span>}
                      <span>{s.song_ids?.length || 0} canciones</span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}