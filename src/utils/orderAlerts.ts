import { Order } from '../types';

let sharedAudioCtx: AudioContext | null = null;
let isAudioUnlocked = false;

/**
 * Gets or initializes a shared singleton AudioContext.
 */

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;

  if (!sharedAudioCtx) {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioCtx) {
      sharedAudioCtx = new AudioCtx();
    }
  }

  return sharedAudioCtx;
}

/**
 * Attaches user gesture listeners to unlock AudioContext on first interaction.
 */
export function initAudioUnlockListener() {
  if (typeof window === 'undefined') return;

  const unlock = () => {
    const ctx = getAudioContext();
    if (ctx) {
      if (ctx.state === 'suspended') {
        ctx.resume().then(() => {
          isAudioUnlocked = true;
        }).catch(() => {});
      } else {
        isAudioUnlocked = true;
      }
    }

    // Play brief silent sample to unlock HTML Audio element
    try {
      const silentAudio = new Audio('data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQQAAAAAAA==');
      silentAudio.volume = 0.01;
      silentAudio.play().then(() => {
        isAudioUnlocked = true;
      }).catch(() => {});
    } catch {}
  };

  window.addEventListener('click', unlock, { capture: true, once: true });
  window.addEventListener('touchstart', unlock, { capture: true, once: true });
  window.addEventListener('keydown', unlock, { capture: true, once: true });
}

// Auto initialize on module load
if (typeof window !== 'undefined') {
  initAudioUnlockListener();
}

/**
 * Plays a loud multi-tone siren audio alert via Web Audio API.
 */
export function playSirenSound() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const runSiren = () => {
      const duration = 3.2; // seconds
      const startTime = ctx.currentTime;

      // Primary Siren Oscillator (sawtooth for penetrating timbre)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sawtooth';

      // Secondary Harmonic Oscillator (square wave for rich tone)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'square';

      // Envelope
      gain1.gain.setValueAtTime(0.01, startTime);
      gain1.gain.linearRampToValueAtTime(0.5, startTime + 0.05);
      gain1.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

      gain2.gain.setValueAtTime(0.01, startTime);
      gain2.gain.linearRampToValueAtTime(0.2, startTime + 0.05);
      gain2.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

      // Pitch sweeps: 3 distinct rapid siren cycles (650Hz <-> 1450Hz)
      const cycles = 8;
      for (let i = 0; i < cycles; i++) {
        const cycleDuration = duration / cycles;
        const t = startTime + i * cycleDuration;
        osc1.frequency.setValueAtTime(650, t);
        osc1.frequency.linearRampToValueAtTime(1450, t + cycleDuration / 2);
        osc1.frequency.linearRampToValueAtTime(650, t + cycleDuration);

        osc2.frequency.setValueAtTime(1300, t);
        osc2.frequency.linearRampToValueAtTime(2900, t + cycleDuration / 2);
        osc2.frequency.linearRampToValueAtTime(1300, t + cycleDuration);
      }

      osc1.connect(gain1);
      gain1.connect(ctx.destination);

      osc2.connect(gain2);
      gain2.connect(ctx.destination);

      osc1.start(startTime);
      osc1.stop(startTime + duration);

      osc2.start(startTime);
      osc2.stop(startTime + duration);
    };

    if (ctx.state === 'suspended') {
      ctx.resume().then(() => {
        runSiren();
      }).catch((e) => {
        console.warn('AudioContext resume falhou:', e);
      });
    } else {
      runSiren();
    }
  } catch (err) {
    console.error('Erro ao tocar som de sirene:', err);
  }
}

/**
 * Plays a siren audio alert via Web Audio API and HTML Audio object fallback.
 */
export function playAudioSiren() {
  playSirenSound();

  try {
    const sirenUri = createSirenDataUri();
    if (sirenUri) {
      const audio = new Audio(sirenUri);
      audio.volume = 0.9;
      audio.play().catch((err) => {
        console.warn('Audio play auto-policy info:', err);
      });
    }
  } catch (e) {
    console.warn('HTML Audio instance info:', e);
  }
}

/**
 * Creates a siren WAV audio data URI for HTML Audio object.
 */
function createSirenDataUri(): string | null {
  try {
    const sampleRate = 8000;
    const duration = 2.0; // seconds
    const numSamples = Math.floor(sampleRate * duration);
    const buffer = new Uint8Array(44 + numSamples);

    const writeString = (offset: number, str: string) => {
      for (let i = 0; i < str.length; i++) {
        buffer[offset + i] = str.charCodeAt(i);
      }
    };

    writeString(0, 'RIFF');
    const fileSize = 36 + numSamples;
    buffer[4] = fileSize & 0xff;
    buffer[5] = (fileSize >> 8) & 0xff;
    buffer[6] = (fileSize >> 16) & 0xff;
    buffer[7] = (fileSize >> 24) & 0xff;
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    buffer[16] = 16;
    buffer[20] = 1;
    buffer[22] = 1;
    buffer[24] = sampleRate & 0xff;
    buffer[25] = (sampleRate >> 8) & 0xff;
    buffer[26] = (sampleRate >> 16) & 0xff;
    buffer[27] = (sampleRate >> 24) & 0xff;
    buffer[28] = sampleRate & 0xff;
    buffer[29] = (sampleRate >> 8) & 0xff;
    buffer[32] = 1;
    buffer[34] = 8;
    writeString(36, 'data');
    buffer[40] = numSamples & 0xff;
    buffer[41] = (numSamples >> 8) & 0xff;
    buffer[42] = (numSamples >> 16) & 0xff;
    buffer[43] = (numSamples >> 24) & 0xff;

    for (let i = 0; i < numSamples; i++) {
      const t = i / sampleRate;
      const freq = 600 + 650 * Math.sin(2 * Math.PI * 2 * t);
      const sample = Math.sin(2 * Math.PI * freq * t);
      buffer[44 + i] = Math.floor((sample * 0.45 + 1) * 127.5);
    }

    let binary = '';
    for (let i = 0; i < buffer.byteLength; i++) {
      binary += String.fromCharCode(buffer[i]);
    }
    return 'data:audio/wav;base64,' + btoa(binary);
  } catch (e) {
    return null;
  }
}

/**
 * Persistent storage key for orders that have already triggered siren / notifications / printing
 */
const ALERTED_ORDERS_STORAGE_KEY = 'fzp_alerted_orders';

/**
 * Returns set of all order IDs and codes that have already been alerted or known historically
 */
export function getAlertedOrderIds(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = localStorage.getItem(ALERTED_ORDERS_STORAGE_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return new Set(parsed.map((item) => String(item).trim()).filter(Boolean));
    }
  } catch {}
  return new Set();
}

/**
 * Marks a single order ID or code as alerted in persistent storage
 */
export function markOrderAsAlerted(orderIdOrCode: string | number): void {
  if (!orderIdOrCode || typeof window === 'undefined') return;
  try {
    const key = String(orderIdOrCode).trim();
    if (!key) return;
    const set = getAlertedOrderIds();
    set.add(key);
    const arr = Array.from(set).slice(-500);
    localStorage.setItem(ALERTED_ORDERS_STORAGE_KEY, JSON.stringify(arr));
  } catch {}
}

/**
 * Marks multiple order IDs or codes as alerted in persistent storage
 */
export function markOrdersAsAlerted(orderIdsOrCodes: (string | number | undefined | null)[]): void {
  if (!orderIdsOrCodes || !orderIdsOrCodes.length || typeof window === 'undefined') return;
  try {
    const set = getAlertedOrderIds();
    orderIdsOrCodes.forEach((id) => {
      if (id !== undefined && id !== null) {
        const key = String(id).trim();
        if (key) set.add(key);
      }
    });
    const arr = Array.from(set).slice(-500);
    localStorage.setItem(ALERTED_ORDERS_STORAGE_KEY, JSON.stringify(arr));
  } catch {}
}

/**
 * Marks an entire Order object (both id and code) as alerted
 */
export function markOrderObjectAlerted(order: Partial<Order>): void {
  if (!order || typeof window === 'undefined') return;
  const keysToMark: string[] = [];
  if (order.id) keysToMark.push(String(order.id).trim());
  if (order.code) keysToMark.push(String(order.code).trim());
  if (keysToMark.length > 0) {
    markOrdersAsAlerted(keysToMark);
  }
}

/**
 * Checks whether an order ID or code has already been alerted
 */
export function isOrderAlerted(orderIdOrCode: string | number | undefined | null): boolean {
  if (!orderIdOrCode || typeof window === 'undefined') return false;
  const key = String(orderIdOrCode).trim();
  if (!key) return false;
  return getAlertedOrderIds().has(key);
}

/**
 * Checks whether an order (by id OR code) has already been alerted
 */
export function isOrderObjectAlerted(order: Partial<Order>): boolean {
  if (!order || typeof window === 'undefined') return false;
  const alertedSet = getAlertedOrderIds();
  if (order.id && alertedSet.has(String(order.id).trim())) return true;
  if (order.code && alertedSet.has(String(order.code).trim())) return true;
  return false;
}

/**
 * Executes automatic actions for digital menu orders:
 * 1. Plays loud siren audio alert
 * 2. Opens receipt modal and triggers auto-print for kitchen preparation
 */
export function handleDigitalMenuOrderAlerts(
  order: Order,
  setSelectedReceiptOrder?: (order: Order) => void
) {
  // Do not play siren on finalized sales/orders or PDV sales
  if (order.status === 'entregue' || order.status === 'cancelado' || order.type === 'pdv') {
    return;
  }

  // 1. Loud Siren Audio Alert via Audio object & Web Audio
  playAudioSiren();

  // 2. Auto Print Ticket for Kitchen Preparation
  if (setSelectedReceiptOrder) {
    setSelectedReceiptOrder(order);
    setTimeout(() => {
      try {
        window.print();
      } catch (e) {
        console.error('Erro na impressão automática:', e);
      }
    }, 500);
  }
}

