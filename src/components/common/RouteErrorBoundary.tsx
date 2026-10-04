import { Component, useState, type ReactNode } from 'react'
import { useSaveData } from '../../hooks/useSaveData'
import { BackupPanel } from './BackupPanel'
import { appLaunchUrl } from '../../pwa/config'

class Boundary extends Component<
  { children: ReactNode; fallback: ReactNode },
  { failed: boolean }
> {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children
  }
}
export function RouteErrorBoundary({ children }: { children: ReactNode }) {
  const { flushSave } = useSaveData()
  const [message, setMessage] = useState('')
  return (
    <Boundary
      fallback={
        <main className="route-recovery">
          <h1>がめんを よみこめませんでした</h1>
          <p>
            きろくは けしていません。ネットにつないで ためすか、さきに
            バックアップしてね。
          </p>
          <BackupPanel />
          <button
            className="primary-action"
            type="button"
            onClick={() => {
              if (flushSave()) {
                window.history.replaceState(
                  null,
                  '',
                  `${appLaunchUrl(window.location.origin)}#/home`,
                )
                window.location.reload()
              } else
                setMessage(
                  'ほぞんできません。バックアップを とってから とじてね。',
                )
            }}
          >
            ほぞんして ホームをひらきなおす
          </button>
          <p role="status">{message}</p>
        </main>
      }
    >
      {children}
    </Boundary>
  )
}
