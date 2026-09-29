/**
 * Sintetizador Procedural Web Audio API para o System: Solo Leveling.
 * Gera áudios holográficos e recompensas dopaminérgicas sem depender de arquivos externos.
 */

class SoundEffectsService {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private volume: number = 0.5;

  constructor() {
    // Carrega preferência salva
    try {
      const savedMute = localStorage.getItem('solo_system_muted');
      if (savedMute !== null) {
        this.isMuted = savedMute === 'true';
      }
      const savedVol = localStorage.getItem('solo_system_volume');
      if (savedVol !== null) {
        this.volume = parseFloat(savedVol);
      }
    } catch {
      // Ignora erro de storage
    }
  }

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    try {
      localStorage.setItem('solo_system_muted', String(this.isMuted));
    } catch {}
    if (!this.isMuted) {
      this.playSystemBeep();
    }
    return this.isMuted;
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
    try {
      localStorage.setItem('solo_system_volume', String(this.volume));
    } catch {}
  }

  public getVolume(): number {
    return this.volume;
  }

  /**
   * Bip tátil da Janela do Sistema Holográfico (abertura / clique)
   */
  public playSystemBeep() {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    const now = ctx.currentTime;
    osc.frequency.setValueAtTime(880, now); // A5
    osc.frequency.exponentialRampToValueAtTime(1760, now + 0.05); // A6

    gain.gain.setValueAtTime(this.volume * 0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.08);
  }

  /**
   * Som de conclusão de Missão do Pilar (Disparo de dopamina imediata)
   */
  public playQuestComplete() {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6 (Acorde Maior Cristalino)

    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.06);

      gain.gain.setValueAtTime(0.001, now + idx * 0.06);
      gain.gain.linearRampToValueAtTime(this.volume * 0.2, now + idx * 0.06 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.06 + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + idx * 0.06);
      osc.stop(now + idx * 0.06 + 0.35);
    });
  }

  /**
   * Fanfarra Épica do Level Up de Solo Leveling [VOCÊ SUBIU DE NÍVEL!]
   */
  public playLevelUp() {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    // Sub-bass impact
    const subOsc = ctx.createOscillator();
    const subGain = ctx.createGain();
    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(120, now);
    subOsc.frequency.exponentialRampToValueAtTime(45, now + 0.5);
    subGain.gain.setValueAtTime(this.volume * 0.4, now);
    subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
    subOsc.connect(subGain);
    subGain.connect(ctx.destination);
    subOsc.start(now);
    subOsc.stop(now + 0.8);

    // Ascending arpeggio fanfare
    const chords = [
      { time: 0.0, freq: 523.25 }, // C5
      { time: 0.1, freq: 659.25 }, // E5
      { time: 0.2, freq: 783.99 }, // G5
      { time: 0.3, freq: 1046.50 }, // C6
      { time: 0.45, freq: 1318.51 }, // E6
      { time: 0.6, freq: 1567.98 }, // G6
      { time: 0.75, freq: 2093.00 }, // C7 (Clímax heroico)
    ];

    chords.forEach(({ time, freq }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + time);

      gain.gain.setValueAtTime(0.001, now + time);
      gain.gain.linearRampToValueAtTime(this.volume * 0.25, now + time + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, now + time + 0.6);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + time);
      osc.stop(now + time + 0.6);
    });
  }

  /**
   * Alerta suave da Dungeon de Redenção (sem pânico, aviso do Sistema)
   */
  public playAlertNotice() {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.setValueAtTime(350, now + 0.15);

    gain.gain.setValueAtTime(this.volume * 0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.35);
  }

  /**
   * Abertura misteriosa do Baú de Suprimento do Sistema
   */
  public playLootOpen() {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    // Shimmering chime sweep
    for (let i = 0; i < 6; i++) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const freq = 800 + i * 250;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + i * 0.05);

      gain.gain.setValueAtTime(0.001, now + i * 0.05);
      gain.gain.linearRampToValueAtTime(this.volume * 0.18, now + i * 0.05 + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.05 + 0.4);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + i * 0.05);
      osc.stop(now + i * 0.05 + 0.4);
    }
  }

  /**
   * Atribuição de ponto de atributo (Level Up / Stat upgrade)
   */
  public playStatUpgrade() {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, now);
    osc.frequency.exponentialRampToValueAtTime(1200, now + 0.12);

    gain.gain.setValueAtTime(this.volume * 0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.18);
  }
}

export const soundEffects = new SoundEffectsService();
