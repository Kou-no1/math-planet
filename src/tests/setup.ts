import '@testing-library/jest-dom/vitest'
import { cleanup, configure } from '@testing-library/react'
import { afterEach } from 'vitest'

configure({ asyncUtilTimeout: 20000 })

afterEach(() => {
  cleanup()
})

Object.defineProperty(window, 'speechSynthesis', {
  value: {
    cancel: () => undefined,
    speak: () => undefined,
  },
  writable: true,
})

class MockAudioContext {
  state = 'running'
  currentTime = 0
  destination = {}

  resume() {
    return Promise.resolve()
  }

  createOscillator() {
    return {
      frequency: { value: 0 },
      connect: () => undefined,
      start: () => undefined,
      stop: () => undefined,
    }
  }

  createGain() {
    return {
      gain: { value: 0 },
      connect: () => undefined,
    }
  }
}

Object.defineProperty(window, 'AudioContext', {
  value: MockAudioContext,
  writable: true,
})

Object.defineProperty(window, 'confirm', {
  value: () => true,
  writable: true,
})

Object.defineProperty(window, 'alert', {
  value: () => undefined,
  writable: true,
})

Object.defineProperty(window, 'scrollTo', {
  value: () => undefined,
  writable: true,
})
