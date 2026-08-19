import { DaySchedule, StoreSettings, TimeSlot } from '../types';

export const TIMEZONE_OPTIONS = [
  { value: 'America/Sao_Paulo', label: 'Brasília / São Paulo (GMT-3)' },
  { value: 'America/Manaus', label: 'Manaus (GMT-4)' },
  { value: 'America/Noronha', label: 'Fernando de Noronha (GMT-2)' },
  { value: 'America/Rio_Branco', label: 'Rio Branco / Acre (GMT-5)' },
  { value: 'America/Bahia', label: 'Salvador / Bahia (GMT-3)' },
  { value: 'America/Cuiaba', label: 'Cuiabá / MT (GMT-4)' },
];

export const DEFAULT_WEEKLY_SCHEDULE: DaySchedule[] = [
  { dayId: 'segunda', dayName: 'Segunda', active: false, slots: [{ open: '11:30', close: '17:00' }] },
  { dayId: 'terca', dayName: 'Terça', active: true, slots: [{ open: '11:30', close: '17:00' }] },
  { dayId: 'quarta', dayName: 'Quarta', active: true, slots: [{ open: '11:30', close: '17:00' }] },
  { dayId: 'quinta', dayName: 'Quinta', active: true, slots: [{ open: '11:30', close: '17:00' }] },
  { dayId: 'sexta', dayName: 'Sexta', active: true, slots: [{ open: '11:30', close: '17:00' }] },
  { dayId: 'sabado', dayName: 'Sábado', active: true, slots: [{ open: '10:00', close: '18:00' }] },
  { dayId: 'domingo', dayName: 'Domingo', active: true, slots: [{ open: '10:00', close: '18:00' }] },
];

const DAY_ORDER: DaySchedule['dayId'][] = ['segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado', 'domingo'];

const FULL_DAY_NAMES: Record<DaySchedule['dayId'], string> = {
  segunda: 'Segunda-feira',
  terca: 'Terça-feira',
  quarta: 'Quarta-feira',
  quinta: 'Quinta-feira',
  sexta: 'Sexta-feira',
  sabado: 'Sábado',
  domingo: 'Domingo',
};

/**
 * Gets the current day and time in the store's timezone.
 */
export function getStoreCurrentTime(timezone: string = 'America/Sao_Paulo') {
  try {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('pt-BR', {
      timeZone: timezone,
      weekday: 'long',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });

    const parts = formatter.formatToParts(now);
    const hour = parts.find((p) => p.type === 'hour')?.value || '00';
    const minute = parts.find((p) => p.type === 'minute')?.value || '00';
    const timeStr = `${hour}:${minute}`;

    const weekdayStr = (parts.find((p) => p.type === 'weekday')?.value || '').toLowerCase();

    let dayId: DaySchedule['dayId'] = 'segunda';
    if (weekdayStr.includes('segunda')) dayId = 'segunda';
    else if (weekdayStr.includes('terça') || weekdayStr.includes('terca')) dayId = 'terca';
    else if (weekdayStr.includes('quarta')) dayId = 'quarta';
    else if (weekdayStr.includes('quinta')) dayId = 'quinta';
    else if (weekdayStr.includes('sexta')) dayId = 'sexta';
    else if (weekdayStr.includes('sábado') || weekdayStr.includes('sabado')) dayId = 'sabado';
    else if (weekdayStr.includes('domingo')) dayId = 'domingo';
    else {
      const dayNum = now.getDay();
      const map: DaySchedule['dayId'][] = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'];
      dayId = map[dayNum];
    }

    return {
      dayId,
      fullDayName: FULL_DAY_NAMES[dayId],
      shortDayName: DEFAULT_WEEKLY_SCHEDULE.find((d) => d.dayId === dayId)?.dayName || 'Hoje',
      timeStr,
    };
  } catch {
    const now = new Date();
    const map: DaySchedule['dayId'][] = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'];
    const dayId = map[now.getDay()];
    const hours = String(now.getHours()).padStart(2, '0');
    const mins = String(now.getMinutes()).padStart(2, '0');
    return {
      dayId,
      fullDayName: FULL_DAY_NAMES[dayId],
      shortDayName: DEFAULT_WEEKLY_SCHEDULE.find((d) => d.dayId === dayId)?.dayName || 'Hoje',
      timeStr: `${hours}:${mins}`,
    };
  }
}

/**
 * Returns formatted string for a day's time slots, e.g. "11:30 às 17:00" or "Fechado"
 */
export function formatDayScheduleText(schedule?: DaySchedule): string {
  if (!schedule || !schedule.active || !schedule.slots || schedule.slots.length === 0) {
    return 'Fechado';
  }

  return schedule.slots.map((s) => `${s.open} às ${s.close}`).join(', ');
}

/**
 * Checks if a time "HH:MM" falls inside [open, close].
 * Handles overnight schedules (e.g. 18:00 to 02:00).
 */
export function isTimeInSlot(currentTimeStr: string, open: string, close: string): boolean {
  if (close < open) {
    // Overnight slot: e.g. 18:00 to 02:00
    return currentTimeStr >= open || currentTimeStr < close;
  }
  return currentTimeStr >= open && currentTimeStr <= close;
}

/**
 * Evaluates whether the store is currently open based on weekly schedule, current time & timezone, and store active toggle.
 */
export function getStoreOperatingStatus(settings: StoreSettings) {
  const timezone = settings.storeTimezone || 'America/Sao_Paulo';
  const { dayId, fullDayName, shortDayName, timeStr } = getStoreCurrentTime(timezone);

  const isLojaAtiva = settings.isStoreActive !== undefined ? settings.isStoreActive : settings.isOpen;
  const allowOrdersWhenClosed = settings.allowOrdersWhenClosed ?? true;

  const scheduleList = settings.weeklySchedule && settings.weeklySchedule.length > 0
    ? settings.weeklySchedule
    : DEFAULT_WEEKLY_SCHEDULE;

  const todaySchedule = scheduleList.find((s) => s.dayId === dayId) || {
    dayId,
    dayName: shortDayName,
    active: false,
    slots: [],
  };

  const todayFormattedHours = formatDayScheduleText(todaySchedule);

  if (!isLojaAtiva) {
    return {
      isOpen: false,
      isLojaAtiva: false,
      allowOrdersWhenClosed,
      dayId,
      fullDayName,
      shortDayName,
      timeStr,
      todaySchedule,
      todayFormattedHours,
      statusLabel: 'Loja Pausada',
      reason: 'O estabelecimento desativou temporariamente o recebimento de pedidos.',
    };
  }

  if (!todaySchedule.active || !todaySchedule.slots || todaySchedule.slots.length === 0) {
    return {
      isOpen: false,
      isLojaAtiva: true,
      allowOrdersWhenClosed,
      dayId,
      fullDayName,
      shortDayName,
      timeStr,
      todaySchedule,
      todayFormattedHours,
      statusLabel: 'Fechado Hoje',
      reason: `Não há atendimento cadastrado para hoje (${fullDayName}).`,
    };
  }

  const matchesSlot = todaySchedule.slots.some((slot) => isTimeInSlot(timeStr, slot.open, slot.close));

  if (matchesSlot) {
    return {
      isOpen: true,
      isLojaAtiva: true,
      allowOrdersWhenClosed,
      dayId,
      fullDayName,
      shortDayName,
      timeStr,
      todaySchedule,
      todayFormattedHours,
      statusLabel: 'Aberto Agora',
      reason: `Em funcionamento no horário das ${todayFormattedHours}.`,
    };
  }

  return {
    isOpen: false,
    isLojaAtiva: true,
    allowOrdersWhenClosed,
    dayId,
    fullDayName,
    shortDayName,
    timeStr,
    todaySchedule,
    todayFormattedHours,
    statusLabel: 'Loja Fechada',
    reason: `Fora do horário de hoje (${todayFormattedHours}). Horário atual da loja: ${timeStr}.`,
  };
}
