import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { AppShell } from '../../components/common/AppShell'
import { TutorialModal } from '../../components/common/TutorialModal'
import { LevelIconBadge } from '../../components/collection/LevelIconBadge'
import { PlayerIconBadge } from '../../components/collection/PlayerIconBadge'
import { getUnlockedLevelIcons } from '../../data/levelIcons'
import { playerIcons } from '../../data/playerIcons'
import {
  defaultCharacterName,
  defaultShipName,
  normalizeCharacterNameInput,
  normalizeShipNameInput,
} from '../../data/shipName'
import {
  addAllDebugKeys,
  addDebugCoins,
  fullOpenDebugSaveData,
  isDebugPasswordValid,
  nextDebugTapState,
  setDebugLevel,
} from '../../game-engine/debug/debugTools'
import { DAILY_BUDGET_OPTIONS, type DailyBudgetMinutes } from '../../game-engine/school/dailyUsage'
import {
  canChangeName,
  formatNameCooldownMessage,
  readNameCooldownState,
  recordNameChange,
  writeNameCooldownState,
  type NameChangeTarget,
} from '../../game-engine/settings/nameCooldown'
import { useSaveData } from '../../hooks/useSaveData'
import { SAVE_DATA_VERSION } from '../../storage/saveData'
import { validateShipName } from '../../utils/bannedWords'
import { titleLabel } from '../../game-engine/rewards/titles'
import {
  applyLearningPreset,
  applyQuietPreset,
} from '../../game-engine/settings/learningPreferences'
import { BackupPanel } from '../../components/common/BackupPanel'
import { PwaSettingsPanel } from '../../pwa/PwaPanel'

const teacherSettingsCode = '9631'

export function SettingsPage() {
  const { saveData, updateSaveData, resetSaveData } = useSaveData()
  const [tutorialOpen, setTutorialOpen] = useState(false)
  const [nameCooldown, setNameCooldown] = useState(readNameCooldownState)
  const [shipNameInput, setShipNameInput] = useState(saveData.player?.shipName ?? defaultShipName)
  const [shipNameMessage, setShipNameMessage] = useState(
    () => formatNameCooldownMessage(nameCooldown, 'ship') ?? 'かな5もじまで',
  )
  const [characterNameInput, setCharacterNameInput] = useState(
    saveData.player?.characterName ?? defaultCharacterName,
  )
  const [characterNameMessage, setCharacterNameMessage] = useState(
    () => formatNameCooldownMessage(nameCooldown, 'character') ?? 'かな5もじまで',
  )
  const [teacherUnlocked, setTeacherUnlocked] = useState(false)
  const [teacherCodeInput, setTeacherCodeInput] = useState('')
  const [teacherMessage, setTeacherMessage] = useState('せんせいコードがひつようです')
  const [debugTapCount, setDebugTapCount] = useState(0)
  const [debugOpen, setDebugOpen] = useState(false)
  const [debugPasswordOpen, setDebugPasswordOpen] = useState(false)
  const [debugPasswordInput, setDebugPasswordInput] = useState('')
  const [debugMessage, setDebugMessage] = useState('')
  const [debugLevelInput, setDebugLevelInput] = useState(String(saveData.player?.level ?? 1))
  const backupText = useMemo(() => JSON.stringify(saveData, null, 2), [saveData])
  const ownedTitles = saveData.player?.titles.length ? saveData.player.titles : ['はじめのいっぽ']
  const unlockedLevelIcons = getUnlockedLevelIcons(saveData.player?.level ?? 1)

  function updateSetting(
    key: 'soundEnabled' | 'speechEnabled' | 'reduceMotion' | 'schoolMode2Enabled',
  ) {
    updateSaveData((current) => ({
      ...current,
      settings: {
        ...current.settings,
        [key]: !current.settings[key],
      },
    }))
  }

  function updateDailyBudget(dailyBudgetMinutes: DailyBudgetMinutes) {
    updateSaveData((current) => ({
      ...current,
      settings: {
        ...current.settings,
        dailyBudgetMinutes,
      },
    }))
  }

  function unlockTeacherSettings() {
    if (teacherCodeInput === teacherSettingsCode) {
      setTeacherUnlocked(true)
      setTeacherMessage('ひらきました')
      setTeacherCodeInput('')
      return
    }
    setTeacherMessage('せんせいに きいてね')
    setTeacherCodeInput('')
  }

  function updateIcon(icon: string) {
    updateSaveData((current) => ({
      ...current,
      player: current.player
        ? {
            ...current.player,
            icon,
          }
        : current.player,
    }))
  }

  function cooldownMessage(target: NameChangeTarget): string {
    return formatNameCooldownMessage(nameCooldown, target) ?? 'かな5もじまで'
  }

  function saveNameChange(target: NameChangeTarget) {
    const nextValue =
      target === 'ship'
        ? normalizeShipNameInput(shipNameInput)
        : normalizeCharacterNameInput(characterNameInput)
    const error = validateShipName(nextValue)
    const setMessage = target === 'ship' ? setShipNameMessage : setCharacterNameMessage
    if (target === 'ship') {
      setShipNameInput(nextValue)
    } else {
      setCharacterNameInput(nextValue)
    }
    if (error) {
      setMessage(error)
      return
    }
    const currentValue =
      target === 'ship'
        ? (saveData.player?.shipName ?? defaultShipName)
        : (saveData.player?.characterName ?? defaultCharacterName)
    if (nextValue === currentValue) {
      setMessage('ほぞんしました')
      return
    }
    if (!canChangeName(nameCooldown, target)) {
      setMessage(formatNameCooldownMessage(nameCooldown, target) ?? 'かな5もじまで')
      return
    }
    const nextCooldown = recordNameChange(nameCooldown, target)
    setNameCooldown(nextCooldown)
    writeNameCooldownState(nextCooldown)
    setMessage('ほぞんしました')
    updateSaveData((current) => ({
      ...current,
      player: current.player
        ? {
            ...current.player,
            ...(target === 'ship' ? { shipName: nextValue } : { characterName: nextValue }),
          }
        : current.player,
    }))
  }

  function updateShipNameInput(value: string) {
    setShipNameInput(normalizeShipNameInput(value))
    setShipNameMessage(cooldownMessage('ship'))
  }

  function updateCharacterNameInput(value: string) {
    setCharacterNameInput(normalizeCharacterNameInput(value))
    setCharacterNameMessage(cooldownMessage('character'))
  }

  function updateCurrentTitle(title: string) {
    updateSaveData((current) => ({
      ...current,
      player: current.player
        ? {
            ...current.player,
            currentTitle: title,
          }
        : current.player,
    }))
  }

  function handleVersionTap() {
    const next = nextDebugTapState(debugTapCount)
    setDebugTapCount(next.count)
    if (next.opened) {
      setDebugPasswordOpen(true)
      setDebugMessage('')
    }
  }

  function submitDebugPassword() {
    if (!isDebugPasswordValid(debugPasswordInput)) {
      setDebugPasswordInput('')
      setDebugMessage('パスワードが ちがいます')
      return
    }
    setDebugPasswordInput('')
    setDebugPasswordOpen(false)
    setDebugOpen(true)
    setDebugMessage('かいはつしゃメニューを ひらきました')
  }

  function resetFromDebugMenu() {
    if (!window.confirm('けしますか？')) {
      return
    }
    if (!window.confirm('ほんとうに けしますか？')) {
      return
    }
    resetSaveData()
    setDebugMessage('SaveDataを リセットしました')
  }

  function setLevelFromDebugInput() {
    const nextLevel = Number(debugLevelInput)
    if (!Number.isFinite(nextLevel) || nextLevel < 1) {
      setDebugMessage('レベルは 1いじょうで いれてね')
      return
    }
    updateSaveData((current) => setDebugLevel(current, nextLevel))
    setDebugMessage(`レベルを ${Math.floor(nextLevel)} にしました`)
  }

  return (
    <AppShell title="せってい" backTo="/home">
      <section className="settings-section" aria-labelledby="icon-title">
        <h2 id="icon-title">アイコン</h2>
        <div className="segmented icon-picker">
          {playerIcons.map((icon) => (
            <button
              className={saveData.player?.icon === icon.id ? 'selected' : ''}
              type="button"
              key={icon.id}
              onClick={() => updateIcon(icon.id)}
              aria-pressed={saveData.player?.icon === icon.id}
            >
              <PlayerIconBadge icon={icon} className="settings-level-icon" />
              {icon.label}
            </button>
          ))}
          {unlockedLevelIcons.map((icon) => (
            <button
              className={saveData.player?.icon === icon.id ? 'selected' : ''}
              type="button"
              key={icon.id}
              onClick={() => updateIcon(icon.id)}
              aria-pressed={saveData.player?.icon === icon.id}
            >
              <LevelIconBadge icon={icon} className="settings-level-icon" />
              {icon.label}
            </button>
          ))}
        </div>
      </section>

      <section className="settings-section" aria-labelledby="ship-title">
        <h2 id="ship-title">うちゅうせん</h2>
        <label>
          キャラのなまえ
          <input
            value={characterNameInput}
            maxLength={5}
            onChange={(event) => updateCharacterNameInput(event.target.value)}
            placeholder={defaultCharacterName}
            aria-describedby="character-name-help"
          />
        </label>
        <button
          className="secondary-action compact-action equip-action"
          type="button"
          onClick={() => saveNameChange('character')}
        >
          ほぞん
        </button>
        <p
          className={characterNameMessage === 'ほぞんしました' ? 'quiet-text' : 'form-help'}
          id="character-name-help"
        >
          {characterNameMessage}
        </p>
        <label>
          ふねのなまえ
          <input
            value={shipNameInput}
            maxLength={5}
            onChange={(event) => updateShipNameInput(event.target.value)}
            placeholder={defaultShipName}
            aria-describedby="ship-name-help"
          />
        </label>
        <button
          className="secondary-action compact-action equip-action"
          type="button"
          onClick={() => saveNameChange('ship')}
        >
          ほぞん
        </button>
        <p
          className={shipNameMessage === 'ほぞんしました' ? 'quiet-text' : 'form-help'}
          id="ship-name-help"
        >
          {shipNameMessage}
        </p>
        <label>
          ホームのしょうごう
          <select
            value={saveData.player?.currentTitle ?? ownedTitles[0]}
            onChange={(event) => updateCurrentTitle(event.target.value)}
          >
            {ownedTitles.map((title) => (
              <option key={title} value={title}>
                {titleLabel(title)}
              </option>
            ))}
          </select>
        </label>
      </section>

      <section className="settings-section" aria-labelledby="sound-title">
        <h2 id="sound-title">音と動き</h2>
        <button
          className="secondary-action wide"
          type="button"
          onClick={() =>
            updateSaveData((current) => ({
              ...current,
              settings: applyQuietPreset(current.settings),
            }))
          }
        >
          しずかにあそぶ
        </button>
        <button
          className="secondary-action wide"
          type="button"
          onClick={() => setTutorialOpen(true)}
        >
          あそびかた
        </button>
        <label className="switch-row">
          <input
            type="checkbox"
            checked={saveData.settings.soundEnabled}
            onChange={() => updateSetting('soundEnabled')}
          />
          効果音
        </label>
        <label className="switch-row">
          <input
            type="checkbox"
            checked={saveData.settings.speechEnabled}
            onChange={() => updateSetting('speechEnabled')}
          />
          読み上げ
        </label>
        <label className="switch-row">
          <input
            type="checkbox"
            checked={saveData.settings.reduceMotion}
            onChange={() => updateSetting('reduceMotion')}
          />
          アニメーション軽減
        </label>
      </section>

      <details className="settings-section">
        <summary>せんせい・ほごしゃ</summary>
        <div className="teacher-settings-panel">
          {!teacherUnlocked ? (
            <div className="teacher-lock-panel">
              <p className="quiet-text">ここは せんせい・ほごしゃが つかいます。</p>
              <label>
                せんせいコード
                <input
                  value={teacherCodeInput}
                  inputMode="numeric"
                  maxLength={4}
                  onChange={(event) =>
                    setTeacherCodeInput(event.target.value.replace(/\D/g, '').slice(0, 4))
                  }
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      unlockTeacherSettings()
                    }
                  }}
                  aria-describedby="teacher-code-help"
                />
              </label>
              <p className="form-help" id="teacher-code-help">
                {teacherMessage}
              </p>
              <button
                className="secondary-action wide"
                type="button"
                onClick={unlockTeacherSettings}
              >
                ひらく
              </button>
            </div>
          ) : (
            <div className="teacher-budget-panel">
              <h2>れんしゅうのせってい</h2>
              <div
                className="segmented learning-preset-controls"
                aria-label="れんしゅうのぷりせっと"
              >
                {(
                  [
                    { id: 'relaxed', label: 'じっくり' },
                    { id: 'standard', label: 'いつもどおり' },
                    { id: 'challenge', label: 'ちゃれんじ' },
                  ] as const
                ).map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() =>
                      updateSaveData((current) => ({
                        ...current,
                        settings: applyLearningPreset(current.settings, preset.id),
                      }))
                    }
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
              <fieldset className="learning-preference-field">
                <legend>おぼえるの もんだいすう</legend>
                <div className="segmented">
                  {([5, 9, 15] as const).map((count) => (
                    <button
                      key={count}
                      className={
                        saveData.settings.practiceQuestionCount === count ? 'selected' : ''
                      }
                      aria-pressed={saveData.settings.practiceQuestionCount === count}
                      type="button"
                      onClick={() =>
                        updateSaveData((current) => ({
                          ...current,
                          settings: {
                            ...current.settings,
                            practiceQuestionCount: count,
                          },
                        }))
                      }
                    >
                      {count}もん
                    </button>
                  ))}
                </div>
              </fieldset>
              <label>
                はじめの こたえかた
                <select
                  value={saveData.settings.practiceAnswerMode}
                  onChange={(event) =>
                    updateSaveData((current) => ({
                      ...current,
                      settings: {
                        ...current.settings,
                        practiceAnswerMode: event.target.value === 'input' ? 'input' : 'choice',
                      },
                    }))
                  }
                >
                  <option value="choice">4たく</option>
                  <option value="input">にゅうりょく</option>
                </select>
              </label>
              <h2>1日のじかん</h2>
              <p className="quiet-text">
                じかんをすぎても あそべます。コインとEXPだけ とまります。
              </p>
              <div className="segmented budget-segmented" aria-label="1日のじかん">
                {DAILY_BUDGET_OPTIONS.map((minutes) => (
                  <button
                    className={saveData.settings.dailyBudgetMinutes === minutes ? 'selected' : ''}
                    key={minutes}
                    type="button"
                    onClick={() => updateDailyBudget(minutes)}
                    aria-pressed={saveData.settings.dailyBudgetMinutes === minutes}
                  >
                    {minutes === 0 ? 'オフ' : `${minutes}分`}
                  </button>
                ))}
              </div>
              <label className="switch-row">
                <input
                  type="checkbox"
                  checked={saveData.settings.schoolMode2Enabled}
                  onChange={() => updateSetting('schoolMode2Enabled')}
                />
                がっこうモード2：とくいな式のごほうびを少なめにする
              </label>
              <p className="quiet-text">
                オフにすると、すべての式でこれまでどおりのコインとEXPになります。
              </p>
            </div>
          )}
        </div>
      </details>

      <section className="settings-section" aria-labelledby="backup-title">
        <h2 id="backup-title">データ</h2>
        <BackupPanel onRestored={(next) => {
          setShipNameInput(next.player?.shipName ?? defaultShipName)
          setCharacterNameInput(next.player?.characterName ?? defaultCharacterName)
        }} />
      </section>

      <PwaSettingsPanel />

      <section className="settings-section version-section" aria-label="バージョン">
        <button className="version-tap-target" type="button" onClick={handleVersionTap}>
          バージョン 18 / SaveData v{SAVE_DATA_VERSION}
        </button>
        {debugPasswordOpen && !debugOpen ? (
          <form
            className="debug-password-form"
            onSubmit={(event) => {
              event.preventDefault()
              submitDebugPassword()
            }}
          >
            <label>
              パスワード
              <input
                type="password"
                value={debugPasswordInput}
                onChange={(event) => setDebugPasswordInput(event.target.value)}
                autoComplete="off"
              />
            </label>
            <button type="submit">ひらく</button>
          </form>
        ) : null}
        {debugOpen || debugMessage ? (
          <p className="quiet-text">{debugOpen ? 'かいはつしゃメニュー' : debugMessage}</p>
        ) : null}
      </section>

      {debugOpen ? (
        <section className="settings-section debug-menu-panel" aria-labelledby="debug-menu-title">
          <h2 id="debug-menu-title">かいはつしゃメニュー</h2>
          <p className="form-help">{debugMessage}</p>
          <div className="dev-actions debug-actions">
            <button
              type="button"
              onClick={() => {
                updateSaveData((current) => fullOpenDebugSaveData(current))
                setDebugMessage('フルオープンしました')
              }}
            >
              フルオープン
            </button>
            {[100, 500, 1000].map((amount) => (
              <button
                type="button"
                key={amount}
                onClick={() => {
                  updateSaveData((current) => addDebugCoins(current, amount))
                  setDebugMessage(`${amount}コインを たしました`)
                }}
              >
                {amount}コイン追加
              </button>
            ))}
            <label className="debug-level-control">
              レベル設定
              <input
                value={debugLevelInput}
                type="number"
                min={1}
                onChange={(event) => setDebugLevelInput(event.target.value)}
              />
            </label>
            <button type="button" onClick={setLevelFromDebugInput}>
              レベルをかえる
            </button>
            <button
              type="button"
              onClick={() => {
                updateSaveData((current) => addAllDebugKeys(current))
                setDebugMessage('カギを ぜんぶ 5こずつ たしました')
              }}
            >
              カギ全種追加
            </button>
            <button className="danger-action" type="button" onClick={resetFromDebugMenu}>
              SaveDataリセット
            </button>
          </div>
          <details className="debug-save-json">
            <summary>現在のSaveData表示</summary>
            <textarea value={backupText} readOnly aria-label="現在のSaveData JSON" />
          </details>
        </section>
      ) : null}

      <Link className="primary-action wide" to="/home">
        ホームへ
      </Link>
      {tutorialOpen ? <TutorialModal onClose={() => setTutorialOpen(false)} /> : null}
    </AppShell>
  )
}
