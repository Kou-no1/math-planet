import { useRef, useState, type ChangeEvent } from 'react'
import { useSaveData } from '../../hooks/useSaveData'
import { parseSaveData } from '../../storage/saveData'
import {
  PRE_RESTORE_BACKUP_KEY,
  readPreMigrationBackup,
} from '../../repositories/saveRepository'
import type { SaveData } from '../../types/save'

export function downloadBackup(text: string, suffix = ''): boolean {
  try {
    const url = URL.createObjectURL(
      new Blob([text], { type: 'application/json' }),
    )
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `kukucchi-save${suffix}-${new Date().toISOString().slice(0, 10)}.json`
    document.body.append(anchor)
    anchor.click()
    anchor.remove()
    window.setTimeout(() => URL.revokeObjectURL(url), 1000)
    return true
  } catch {
    return false
  }
}

export function BackupPanel({
  onRestored,
}: {
  onRestored?: (save: SaveData) => void
}) {
  const { saveData, originalSave, restoreSaveData } = useSaveData()
  const [importText, setImportText] = useState('')
  const [message, setMessage] = useState('')
  const copyField = useRef<HTMLTextAreaElement>(null)
  const text = JSON.stringify(saveData, null, 2)
  const migration = readPreMigrationBackup()
  let beforeRestore: string | null = null
  try {
    beforeRestore = window.localStorage.getItem(PRE_RESTORE_BACKUP_KEY)
  } catch {
    /* Optional recovery file. */
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(text)
      setMessage('コピーしました。べつのところに はりつけて、ほぞんしてね。')
    } catch {
      copyField.current?.focus()
      copyField.current?.select()
      setMessage(
        'コピーできませんでした。したのデータを えらんでコピーしてね。',
      )
    }
  }
  function exportFile(value = text, suffix = '') {
    setMessage(
      downloadBackup(value, suffix)
        ? 'ファイルのほぞんを おねがいしました。ほぞんさきを かくにんしてね。'
        : 'ファイルにできませんでした。したのデータを コピーしてね。',
    )
  }
  function restore(value: string) {
    try {
      const next = parseSaveData(value)
      if (
        !window.confirm(
          'データをひきつぎます。今のデータは上書きされます。先にバックアップを保存してください。',
        )
      )
        return
      if (restoreSaveData(next)) {
        onRestored?.(next)
        setImportText('')
        setMessage('ひきつぎました。')
      } else setMessage('ほぞんできませんでした。もとのデータは そのままです。')
    } catch {
      setMessage(
        'データを読みこめませんでした。形式とバージョンを確認してください。もとのデータは変えていません。',
      )
    }
  }
  async function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget
    try {
      const file = input.files?.[0]
      if (file) restore(await file.text())
    } catch {
      setMessage(
        'ファイルを読みこめませんでした。もとのデータは変えていません。',
      )
    } finally {
      input.value = ''
    }
  }
  return (
    <div className="backup-panel">
      <p className="quiet-text">
        保護者・先生向け:
        記録はこの端末・ブラウザに保存されます。別のブラウザやホーム画面のアプリへ自動では移りません。削除・機種変更の前にバックアップしてください。
      </p>
      <button
        className="secondary-action wide"
        type="button"
        onClick={() => exportFile()}
      >
        データをほぞんする
      </button>
      <button
        className="secondary-action wide"
        type="button"
        onClick={() => {
          void copy()
        }}
      >
        データをコピーする
      </button>
      {migration ? (
        <button
          className="secondary-action wide"
          type="button"
          onClick={() => exportFile(migration, '-before-migration')}
        >
          いこうまえのデータをほぞんする
        </button>
      ) : null}
      {beforeRestore ? (
        <button
          className="secondary-action wide"
          type="button"
          onClick={() => exportFile(beforeRestore!, '-before-restore')}
        >
          ひきつぎまえのデータをほぞんする
        </button>
      ) : null}
      {originalSave !== null ? (
        <details>
          <summary>よみこめなかった もとのきろく</summary>
          <button
            className="secondary-action wide"
            type="button"
            onClick={() => exportFile(originalSave, '-original')}
          >
            もとのきろくをほぞんする
          </button>
          <textarea
            value={originalSave}
            readOnly
            aria-label="元のセーブデータ"
            onFocus={(event) => event.currentTarget.select()}
          />
        </details>
      ) : null}
      <textarea
        ref={copyField}
        value={text}
        readOnly
        aria-label="コピー用セーブデータ"
        onFocus={(event) => event.currentTarget.select()}
      />
      <label className="file-button">
        ファイルからひきつぐ
        <input
          type="file"
          accept="application/json,.json"
          onChange={(event) => {
            void handleFile(event)
          }}
        />
      </label>
      <textarea
        value={importText}
        onChange={(event) => setImportText(event.target.value)}
        placeholder="ここにデータを貼り付け"
        aria-label="貼り付け用セーブデータ"
      />
      <button
        className="secondary-action wide"
        type="button"
        onClick={() => restore(importText)}
      >
        データをひきつぐ
      </button>
      <p role="status" className="form-help">
        {message}
      </p>
    </div>
  )
}
