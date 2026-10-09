let ctx: AudioContext | null = null

function audio(): AudioContext | null {
  try {
    ctx ??= new AudioContext()
    if (ctx.state === 'suspended') void ctx.resume()
    return ctx
  } catch {
    return null
  }
}

function tone(freq: number, durationMs: number, type: OscillatorType, volume: number, slideTo?: number) {
  const ac = audio()
  if (!ac) return
  const osc = ac.createOscillator()
  const gain = ac.createGain()
  const now = ac.currentTime
  const end = now + durationMs / 1000
  osc.type = type
  osc.frequency.setValueAtTime(freq, now)
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, end)
  gain.gain.setValueAtTime(volume, now)
  gain.gain.exponentialRampToValueAtTime(0.001, end)
  osc.connect(gain).connect(ac.destination)
  osc.start(now)
  osc.stop(end)
}

export type SoundName = 'zap' | 'hit' | 'ouch' | 'vitamin' | 'escape' | 'start' | 'over'

export function playSound(name: SoundName, volume: number): void {
  if (volume <= 0) return
  const v = (volume / 100) * 0.25
  switch (name) {
    case 'zap':
      return tone(880, 90, 'square', v, 1400)
    case 'hit':
      return tone(520, 70, 'square', v)
    case 'ouch':
      return tone(220, 250, 'sawtooth', v, 110)
    case 'vitamin':
      tone(660, 100, 'sine', v)
      return void setTimeout(() => tone(990, 140, 'sine', v), 100)
    case 'escape':
      return tone(300, 200, 'triangle', v, 150)
    case 'start':
      return tone(440, 150, 'sine', v, 880)
    case 'over':
      return tone(440, 500, 'triangle', v, 110)
  }
}
