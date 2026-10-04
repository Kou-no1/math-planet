import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { useSaveData } from '../hooks/useSaveData'
import {
  applyPwaUpdate,
  getPwaState,
  requestInstall,
  safeUpdateLocation,
  subscribePwa,
} from './client'
import { appLaunchUrl } from './config'
import { dismissInstallReminder, installReminderAllowed } from './preferences'

function usePwa() {
  return useSyncExternalStore(subscribePwa, getPwaState, getPwaState)
}

export function InstallHelp({ onClose }: { onClose?: () => void }) {
  const pwa = usePwa()
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const url = appLaunchUrl(window.location.origin)
  const urlField = useRef<HTMLInputElement>(null)
  async function install() {
    setBusy(true)
    const result = await requestInstall()
    setBusy(false)
    if (result === 'accepted') {
      dismissInstallReminder()
      setMessage('追加をおねがいしました。ホーム画面をかくにんしてね。')
    } else if (result === 'dismissed') {
      dismissInstallReminder()
      setMessage('今回は追加しません。ブラウザでもあそべます。')
    } else setMessage('追加ボタンは使えません。下のブラウザの手順を見てね。')
  }
  async function copy() {
    try {
      await navigator.clipboard.writeText(url)
      setMessage('URLをコピーしました。使いたいブラウザにはりつけてね。')
    } catch {
      urlField.current?.focus()
      urlField.current?.select()
      setMessage('コピーできませんでした。URLをえらんでコピーしてね。')
    }
  }
  return (
    <div className="pwa-install-help">
      <h2 id="install-help-title">ホーム画面に追加</h2>
      {onClose ? (
        <button className="secondary-action" type="button" onClick={onClose}>
          とじる
        </button>
      ) : null}
      {pwa.standalone ? (
        <p>いまは ホーム画面のアプリで ひらいています。</p>
      ) : null}
      {pwa.installAvailable && !pwa.standalone ? (
        <button
          className="primary-action wide"
          type="button"
          disabled={busy}
          onClick={() => {
            void install()
          }}
        >
          ホーム画面に追加する
        </button>
      ) : null}
      <details
        open={
          !pwa.installAvailable && /iPad|iPhone|iPod/.test(navigator.userAgent)
        }
      >
        <summary>iPhone・iPad の Safari</summary>
        <ol>
          <li>Safariでこのページをひらきます。</li>
          <li>
            「共有」から「ホーム画面に追加」をえらびます。見つからないときは共有のメニューをスクロールして探してください。
          </li>
          <li>
            「ウェブアプリとして開く」が出たらオンにして、「追加」を押します。項目の位置はiOSのバージョンで変わります。
          </li>
        </ol>
      </details>
      <details>
        <summary>Android・パソコンのブラウザ</summary>
        <p>
          追加ボタンが出ている場合は押してください。出ていない場合は、ブラウザのメニューで「インストール」や「ホーム画面に追加」を探してください。ブラウザ・端末により利用できないことがあります。
        </p>
      </details>
      <details>
        <summary>SNSの中のブラウザ・追加できないとき</summary>
        <p>
          URLをコピーして、SafariやChromeなど使いたいブラウザにはりつけてください。下のリンクは通常のリンクです。外部ブラウザへ必ず切り替わるものではありません。
        </p>
        <label>
          アプリのURL
          <input
            ref={urlField}
            className="pwa-url"
            value={url}
            readOnly
            onFocus={(event) => event.currentTarget.select()}
          />
        </label>
        <button
          className="secondary-action"
          type="button"
          onClick={() => {
            void copy()
          }}
        >
          URLをコピー
        </button>
        <a className="secondary-action" href={url}>
          このURLをひらく
        </a>
      </details>
      <p>
        記録は端末・ブラウザごとです。別のブラウザやホーム画面のアプリに自動で引き継がれるとは限りません。先に「せってい
        → データ」でJSONを保存し、移動先でひきついでください。
      </p>
      <p>
        通信してオフラインの準備ができた後は、基本の九九練習をオフラインでも使えます。初めての起動には通信が必要です。音声は端末により使えないことがあります。
      </p>
      <p role="status">{message}</p>
    </div>
  )
}

export function PwaSettingsPanel() {
  const pwa = usePwa()
  return (
    <section
      className="settings-section pwa-settings"
      aria-label="ホーム画面とオフライン"
    >
      <InstallHelp />
      <p role="status">
        {pwa.offlineReady
          ? '基本の九九のオフライン準備ができています。'
          : 'オフラインの準備は まだ確認できていません。通信できる状態でひらいてください。'}
      </p>
      {pwa.error ? <p>{pwa.error}</p> : null}
      {pwa.updateAvailable ? (
        <p>新しい版があります。練習をおわり、ホームにもどると更新できます。</p>
      ) : null}
    </section>
  )
}

export function PwaHomePanel({ safe }: { safe: boolean }) {
  const pwa = usePwa()
  const { saveData, saveError, flushSave } = useSaveData()
  const [reminderAllowed, setReminderAllowed] = useState(installReminderAllowed)
  const [helpOpen, setHelpOpen] = useState(false)
  const [later, setLater] = useState(false)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const dialog = useRef<HTMLDialogElement>(null)
  const gate = useRef(false)
  useEffect(() => {
    gate.current = safe && !helpOpen && !saveError
    return () => {
      gate.current = false
    }
  }, [safe, helpOpen, saveError])
  useEffect(() => {
    if (helpOpen) dialog.current?.showModal()
  }, [helpOpen])
  const completedPractice = saveData.progress.history.some(
    (entry) => entry.mode === 'learn' && entry.totalQuestions > 0,
  )
  const showReminder =
    safe &&
    !pwa.standalone &&
    !pwa.installed &&
    reminderAllowed &&
    completedPractice
  function dismiss() {
    dismissInstallReminder()
    setReminderAllowed(false)
  }
  async function update() {
    setBusy(true)
    const canUpdate = () =>
      gate.current &&
      safeUpdateLocation(
        window.location.hash.slice(1).split('?')[0],
        saveError,
        false,
      ) &&
      document.visibilityState === 'visible' &&
      !document.querySelector('dialog[open], [aria-modal="true"]') &&
      !document.activeElement?.matches(
        'input, textarea, select, [contenteditable="true"]',
      )
    setMessage((await applyPwaUpdate(canUpdate, flushSave)) ?? '')
    setBusy(false)
  }
  return (
    <section className="pwa-home-panel" aria-label="ホーム画面と更新">
      <button
        className="secondary-action"
        type="button"
        onClick={() => setHelpOpen(true)}
        disabled={busy}
      >
        ホーム画面に追加・オフライン
      </button>
      {showReminder ? (
        <div className="pwa-reminder" data-testid="install-reminder">
          <p>また あそぶときは、ホーム画面からひらけます。</p>
          <button
            className="secondary-action"
            type="button"
            onClick={() => setHelpOpen(true)}
          >
            追加のしかた
          </button>
          <button className="secondary-action" type="button" onClick={dismiss}>
            今はしない
          </button>
        </div>
      ) : null}
      {pwa.updateAvailable && safe && !saveError && !later ? (
        <div className="pwa-update" data-testid="pwa-update">
          <p>新しい版があります。記録をほぞんしてから更新します。</p>
          <button
            className="primary-action"
            type="button"
            disabled={busy || helpOpen}
            onClick={() => {
              void update()
            }}
          >
            {busy ? 'かくにんちゅう...' : 'ほぞんして更新'}
          </button>
          <button
            className="secondary-action"
            type="button"
            disabled={busy}
            onClick={() => setLater(true)}
          >
            あとで
          </button>
        </div>
      ) : null}
      <p className="quiet-text" role="status">
        {message ||
          pwa.error ||
          (pwa.offlineReady
            ? '基本の九九のオフライン準備ができています。'
            : '')}
      </p>
      {helpOpen ? (
        <dialog
          ref={dialog}
          className="pwa-dialog"
          aria-labelledby="install-help-title"
          onClose={() => setHelpOpen(false)}
        >
          <InstallHelp onClose={() => dialog.current?.close()} />
        </dialog>
      ) : null}
    </section>
  )
}
