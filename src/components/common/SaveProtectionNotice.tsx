import { useEffect, useRef, useState } from 'react'
import { useSaveData } from '../../hooks/useSaveData'
import { BackupPanel } from './BackupPanel'

export function SaveProtectionNotice() {
  const { saveError, flushSave } = useSaveData()
  const [open, setOpen] = useState(false)
  const dialog = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    if (open) dialog.current?.showModal()
  }, [open])
  if (!saveError) return null
  return (
    <aside className="save-protection-notice" role="alert">
      <p>
        きろくを ほぞんできていません。{saveError} もとのきろくは
        けしていません。
      </p>
      <button
        type="button"
        className="secondary-action"
        onClick={() => setOpen(true)}
      >
        バックアップ・ひきつぎ
      </button>
      <button
        type="button"
        className="secondary-action"
        onClick={() => flushSave()}
      >
        ほぞんをためす
      </button>
      {open ? (
        <dialog
          ref={dialog}
          className="pwa-dialog"
          aria-labelledby="recovery-title"
          onClose={() => setOpen(false)}
        >
          <h2 id="recovery-title">きろくをまもる</h2>
          <button
            className="secondary-action"
            type="button"
            onClick={() => dialog.current?.close()}
          >
            とじる
          </button>
          <BackupPanel onRestored={() => setOpen(false)} />
        </dialog>
      ) : null}
    </aside>
  )
}
