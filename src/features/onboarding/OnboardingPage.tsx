import { useState } from 'react'
import type { FormEvent } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { PlayerIconBadge } from '../../components/collection/PlayerIconBadge'
import { playerIcons } from '../../data/playerIcons'
import { initializeAudio } from '../../services/audioService'
import { createPlayerFromOnboarding } from '../../storage/saveData'
import { useSaveData } from '../../hooks/useSaveData'
import { APP_ICONS, APP_NAME } from '../../pwa/config'

export function OnboardingPage() {
  const navigate = useNavigate()
  const { saveData, setSaveData } = useSaveData()
  const [nickname, setNickname] = useState('')
  const [icon, setIcon] = useState(playerIcons[0].id)
  const [soundEnabled, setSoundEnabled] = useState(true)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    await initializeAudio()
    setSaveData(
      createPlayerFromOnboarding({
        nickname,
        icon,
        learningLevel: 'first',
        soundEnabled,
      }),
    )
    navigate('/home')
  }

  if (saveData.player) {
    return <Navigate to="/home" replace />
  }

  return (
    <main className="onboarding-page">
      <section className="onboarding-panel" aria-labelledby="onboarding-title">
        <img
          className="brand-mark big"
          src={`${import.meta.env.BASE_URL}${APP_ICONS.favicon}`}
          alt=""
          width="78"
          height="78"
        />
        <h1 id="onboarding-title">{APP_NAME}</h1>
        <form onSubmit={handleSubmit} className="setup-form">
          <label>
            よびな
            <input
              value={nickname}
              onChange={(event) => setNickname(event.target.value)}
              maxLength={12}
              placeholder="くくとも"
            />
          </label>

          <fieldset>
            <legend>アイコン</legend>
            <div className="segmented">
              {playerIcons.map((option) => (
                <button
                  className={option.id === icon ? 'selected' : ''}
                  key={option.id}
                  type="button"
                  onClick={() => setIcon(option.id)}
                  aria-pressed={option.id === icon}
                >
                  <PlayerIconBadge
                    icon={option}
                    className="settings-level-icon"
                  />
                  {option.label}
                </button>
              ))}
            </div>
          </fieldset>

          <label className="switch-row">
            <input
              type="checkbox"
              checked={soundEnabled}
              onChange={(event) => setSoundEnabled(event.target.checked)}
            />
            音をならす
          </label>

          <button className="primary-action" type="submit">
            はじめる
          </button>
        </form>
      </section>
    </main>
  )
}
