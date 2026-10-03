import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { AppShell } from '../../components/common/AppShell'
import { BuddySprite } from '../../components/collection/BuddySprite'
import { KeyIcon } from '../../components/collection/KeyIcon'
import { LevelIconBadge } from '../../components/collection/LevelIconBadge'
import { TreasureIcon } from '../../components/collection/TreasureIcon'
import { DailyBudgetNoticeModal } from '../../components/common/DailyBudgetNoticeModal'
import { StatPill } from '../../components/common/StatPill'
import { allGekimuzuTitle } from '../../data/bosses'
import { getLevelIconUnlocksBetween } from '../../data/levelIcons'
import { getKeyTypeById } from '../../data/keys'
import { getShopItemById } from '../../data/shopItems'
import { getTreasureItemById } from '../../data/treasureItems'
import {
  buildExpProgressAnimationSteps,
  expProgressToNextLevel,
  expToLevel,
} from '../../game-engine/rewards/rewards'
import { formatFactLabel } from '../../game-engine/questions/factIds'
import { useDailyUsage } from '../../hooks/useDailyUsage'
import { useSaveData } from '../../hooks/useSaveData'
import type { GameSessionSummary } from '../../types/game'

export function replayPath(mode: GameSessionSummary['mode']): string {
  if (mode === 'speed') {
    return '/speed'
  }
  if (mode === 'review') {
    return '/review'
  }
  if (mode === 'battle') {
    return '/monster-battle'
  }
  if (mode === 'boss') {
    return '/battle'
  }
  if (mode === 'treasure') {
    return '/treasure'
  }
  if (mode === 'rocket') {
    return '/rocket'
  }
  if (mode === 'advanced') {
    return '/advanced'
  }
  return '/learn'
}

function replayPathForSummary(summary: GameSessionSummary): string {
  const basePath = replayPath(summary.mode)
  if (summary.details?.planet === 'decimal' || summary.details?.planet === 'fraction') return `${basePath}?planet=${summary.details.planet}${typeof summary.details.areaId === 'string' ? `&area=${summary.details.areaId}` : ''}`
  if (summary.details?.planet === 'add') {
    return `${basePath}?planet=add`
  }
  if (summary.details?.planet === 'subtract') {
    return `${basePath}?planet=subtract`
  }
  if (summary.details?.planet === 'divide') {
    return `${basePath}?planet=divide`
  }
  return basePath
}

function detailNumber(summary: GameSessionSummary, key: string): number | null {
  const value = summary.details?.[key]
  return typeof value === 'number' ? value : null
}

function detailString(summary: GameSessionSummary, key: string): string | null {
  const value = summary.details?.[key]
  return typeof value === 'string' ? value : null
}

function detailStrings(summary: GameSessionSummary, key: string): string[] {
  const value = summary.details?.[key]
  return Array.isArray(value) ? value : []
}

function ModeResultDetails({ summary }: { summary: GameSessionSummary }) {
  if (summary.mode === 'speed') {
    return (
      <section className="mode-result-card" aria-labelledby="mode-result-title">
        <h2 id="mode-result-title">すぴーど</h2>
        <div className="stats-row compact-stats">
          <StatPill label="せいかい" value={`${summary.correctCount}/${summary.totalQuestions}`} />
          <StatPill label="スコア" value={summary.score} />
          <StatPill label="コンボ" value={summary.maxCombo} />
        </div>
      </section>
    )
  }

  if (summary.mode === 'learn') {
    return (
      <section className="mode-result-card" aria-labelledby="mode-result-title">
        <h2 id="mode-result-title">できるようになったもんだい</h2>
        <p className="title-line">{summary.masteredFacts.length}こ ふえました</p>
      </section>
    )
  }

  if (summary.mode === 'rocket') {
    const distance = detailNumber(summary, 'rocketDistance') ?? summary.score
    const nextBadgeName = detailString(summary, 'nextRocketBadgeName')
    const nextBadgeDistance = detailNumber(summary, 'nextRocketBadgeDistance')
    const remaining = nextBadgeDistance === null ? 0 : Math.max(0, nextBadgeDistance - distance)
    const badges = detailStrings(summary, 'rocketBadges')
    return (
      <section className="mode-result-card" aria-labelledby="mode-result-title">
        <h2 id="mode-result-title">ろけっと</h2>
        <div className="stats-row compact-stats">
          <StatPill label="きょり" value={`${distance}m`} />
          <StatPill
            label={badges.length > 0 ? 'とったばっじ' : 'つぎのばっじ'}
            value={badges.length > 0 ? badges.join('、') : nextBadgeName ?? 'ぜんぶたっせい'}
          />
        </div>
        <p className="title-line">
          {nextBadgeName ? `${nextBadgeName}まで あと${remaining}m！` : 'ばっじを ぜんぶ たっせい！'}
        </p>
      </section>
    )
  }

  if (summary.mode === 'battle') {
    return (
      <section className="mode-result-card" aria-labelledby="mode-result-title">
        <h2 id="mode-result-title">もんすたーばとる</h2>
        <div className="stats-row compact-stats">
          <StatPill label="はーと" value={detailNumber(summary, 'heartsLeft') ?? 0} />
          <StatPill label="ひっさつ" value={detailNumber(summary, 'specialUses') ?? 0} />
          <StatPill label="コイン" value={`+${summary.earnedCoins}`} />
        </div>
      </section>
    )
  }

  if (summary.mode === 'treasure') {
    const chests = detailStrings(summary, 'chestLabels')
    const keyNames = detailStrings(summary, 'treasureKeyNames')
    const keyIds = detailStrings(summary, 'treasureKeyIds')
    const treasureItemId = detailString(summary, 'treasureItemId')
    const treasureBuddyId = detailString(summary, 'treasureBuddyId')
    const treasureEffectId = detailString(summary, 'treasureEffectId')
    const treasureItem = treasureItemId ? getTreasureItemById(treasureItemId) : undefined
    const treasureEffect = treasureEffectId ? getShopItemById(treasureEffectId) : undefined
    const itemName = detailString(summary, 'treasureItemName')
    const duplicate = summary.details?.treasureDuplicate === true
    const poolExhausted = summary.details?.treasurePoolExhausted === true
    const treasureBonusCoins = detailNumber(summary, 'treasureBonusCoins') ?? 0
    return (
      <section className="mode-result-card" aria-labelledby="mode-result-title">
        <h2 id="mode-result-title">たからばこ</h2>
        <div className="stats-row compact-stats">
          <StatPill label="かぎ" value={detailNumber(summary, 'keys') ?? 0} />
          <StatPill label="あけた" value={detailNumber(summary, 'openedChests') ?? 0} />
          <StatPill label="コイン" value={`+${summary.earnedCoins}`} />
        </div>
        {keyIds.length > 0 || treasureItem || treasureBuddyId || treasureEffect ? (
          <div className="treasure-result-visuals" aria-label="たからばこのけっか">
            {keyIds.map((keyId) => {
              const keyType = getKeyTypeById(keyId)
              return keyType ? (
                <figure className="treasure-result-figure" key={keyId}>
                  <KeyIcon keyType={keyType} className="treasure-result-icon wide" />
                  <figcaption>{keyType.name}</figcaption>
                </figure>
              ) : null
            })}
            {treasureItem ? (
              <figure className="treasure-result-figure">
                <TreasureIcon item={treasureItem} className="treasure-result-icon" />
                <figcaption>{treasureItem.name}</figcaption>
              </figure>
            ) : null}
            {treasureBuddyId ? (
              <figure className="treasure-result-figure">
                <BuddySprite buddyId={treasureBuddyId} className="treasure-result-icon" />
                <figcaption>{itemName}</figcaption>
              </figure>
            ) : null}
            {treasureEffect ? (
              <figure className="treasure-result-figure">
                <span className="treasure-result-icon effect-result-icon" aria-hidden="true">
                  {treasureEffect.emoji}
                </span>
                <figcaption>{treasureEffect.name}</figcaption>
              </figure>
            ) : null}
          </div>
        ) : null}
        {keyNames.length > 0 ? <p className="title-line">カギ: {keyNames.join('、')}</p> : null}
        {poolExhausted ? (
          <p className="title-line">ぜんぶ あつめた！ {treasureBonusCoins}コインに なったよ</p>
        ) : itemName ? (
          <p className="title-line">
            {duplicate ? `ダブった！ ${itemName} が コインになったよ` : `${itemName} をみつけたよ`}
          </p>
        ) : null}
        {chests.length > 0 ? <p className="title-line">{chests.join('、')} をあけたよ</p> : null}
      </section>
    )
  }

  if (summary.mode === 'advanced') {
    const rates = detailStrings(summary, 'advancedCategoryRates')
    return (
      <section className="mode-result-card" aria-labelledby="mode-result-title">
        <h2 id="mode-result-title">スーパー計算</h2>
        <div className="fact-list">
          {(rates.length > 0 ? rates : ['けいさん 0%']).map((rate) => (
            <span key={rate}>{rate}</span>
          ))}
        </div>
      </section>
    )
  }

  return null
}

export function ResultPage() {
  const location = useLocation()
  const { saveData } = useSaveData()
  const { budgetMinutes, shouldShowNotice } = useDailyUsage()
  const summary = (location.state as { summary?: GameSessionSummary } | null)?.summary
  const planetMenuPath =
    summary?.details?.planet === 'decimal' || summary?.details?.planet === 'fraction' ? `/planet/${summary.details.planet}` : summary?.details?.planet === 'add'
      ? '/planet/add'
      : summary?.details?.planet === 'subtract'
        ? '/planet/subtract'
        : summary?.details?.planet === 'divide'
          ? '/planet/divide'
        : '/planet/multiply'
  const rewardBudgetPaused = summary?.details?.rewardBudgetPaused === true
  const schoolRewardScalePercent = summary ? detailNumber(summary, 'schoolRewardScalePercent') : null
  const [budgetNoticeDismissed, setBudgetNoticeDismissed] = useState(false)
  const [iconNoticeDismissed, setIconNoticeDismissed] = useState(false)
  const budgetNoticeOpen = rewardBudgetPaused && shouldShowNotice && !budgetNoticeDismissed
  const playerExp = saveData.player?.exp ?? summary?.earnedExp ?? 0
  const earnedExp = summary?.earnedExp ?? 0
  const previousExp = Math.max(0, playerExp - earnedExp)
  const expAnimationSteps = useMemo(
    () => buildExpProgressAnimationSteps(previousExp, earnedExp),
    [earnedExp, previousExp],
  )
  const [expStepIndex, setExpStepIndex] = useState(0)
  const [animatedExpPercent, setAnimatedExpPercent] = useState(
    expAnimationSteps[0]?.fromPercent ?? 0,
  )
  const [expAnimationDone, setExpAnimationDone] = useState(false)
  const currentExpStep =
    expAnimationSteps[Math.min(expStepIndex, Math.max(0, expAnimationSteps.length - 1))]

  function closeBudgetNotice() {
    setBudgetNoticeDismissed(true)
  }

  function skipExpAnimation() {
    const lastStep = expAnimationSteps.at(-1)
    if (!lastStep) {
      return
    }
    setExpStepIndex(Math.max(0, expAnimationSteps.length - 1))
    setAnimatedExpPercent(lastStep.toPercent)
    setExpAnimationDone(true)
  }

  useEffect(() => {
    const step = expAnimationSteps[expStepIndex]
    if (!step || expAnimationDone) {
      return undefined
    }

    const animationFrame = window.requestAnimationFrame(() => {
      setAnimatedExpPercent(step.toPercent)
    })
    const durationMs = step.leveledUp ? 980 : 760
    const timer = window.setTimeout(() => {
      if (expStepIndex < expAnimationSteps.length - 1) {
        setExpStepIndex((current) => current + 1)
        setAnimatedExpPercent(expAnimationSteps[expStepIndex + 1]?.fromPercent ?? 0)
      } else {
        setExpAnimationDone(true)
      }
    }, durationMs)

    return () => {
      window.cancelAnimationFrame(animationFrame)
      window.clearTimeout(timer)
    }
  }, [expAnimationDone, expAnimationSteps, expStepIndex])

  if (!summary) {
    return (
      <AppShell title="けっか">
        <section className="empty-state">
          <p>けっかが見つかりませんでした</p>
          <Link className="primary-action" to="/home">
            ホームへ
          </Link>
        </section>
      </AppShell>
    )
  }

  const previousLevel = expToLevel(previousExp)
  const currentProgress = expProgressToNextLevel(playerExp)
  const unlockedLevelIcons = getLevelIconUnlocksBetween(previousLevel, currentProgress.level)
  const levelSpan = currentProgress.nextLevelExp - currentProgress.currentLevelExp
  const levelUp = currentProgress.level > previousLevel
  const displayedLevel = expAnimationDone ? currentProgress.level : currentExpStep?.level ?? currentProgress.level
  const displayedGainedExp = expAnimationDone
    ? currentProgress.gainedInLevel
    : currentExpStep?.toExp ?? currentProgress.gainedInLevel
  const displayedLevelSpan = currentExpStep?.levelSpan ?? levelSpan

  return (
    <AppShell title="けっか">
      <section className="result-hero">
        <p className="welcome">よくできました</p>
        <h2>
          {summary.correctCount}/{summary.totalQuestions} もん
        </h2>
        <div className="result-badges">
          {summary.bestUpdated ? <strong className="best-badge">じこベスト</strong> : null}
          {levelUp ? <strong className="best-badge">レベルアップ！</strong> : null}
        </div>
      </section>

      {rewardBudgetPaused ? (
        <section className="reward-paused-card" aria-live="polite">
          <strong>{budgetMinutes}分 たったよ</strong>
          <span>このあとは コインとけいけんちは たまらないよ</span>
        </section>
      ) : null}

      {!rewardBudgetPaused && schoolRewardScalePercent !== null && schoolRewardScalePercent < 100 ? (
        <section className="reward-paused-card school-reward-card" aria-live="polite">
          <strong>マスター！すごい！</strong>
          <span>とくいな式は ごほうび少なめ（{schoolRewardScalePercent}%）</span>
        </section>
      ) : null}

      <section className="stats-row result-stats" aria-label="結果">
        <StatPill label="正答率" value={`${summary.accuracy}%`} />
        <StatPill label="平均" value={`${(summary.averageResponseTimeMs / 1000).toFixed(1)}秒`} />
        <StatPill label="最大コンボ" value={summary.maxCombo} />
        <StatPill label="コイン" value={`+${summary.earnedCoins}`} />
        <StatPill label="EXP" value={`+${summary.earnedExp}`} />
      </section>

      <section className="exp-progress-card" aria-label="つぎのレベル">
        <div>
          <h2>つぎのレベルまで あと{currentProgress.remainingExp}EXP</h2>
          <span>Lv {displayedLevel}</span>
        </div>
        <div
          className={levelUp ? 'exp-progress-track level-up' : 'exp-progress-track'}
          aria-hidden="true"
          onClick={skipExpAnimation}
        >
          <span style={{ width: `${animatedExpPercent}%` }} />
        </div>
        {levelUp && !expAnimationDone ? (
          <strong className="level-up-burst" aria-live="polite">
            レベルアップ！
          </strong>
        ) : null}
        <p className="quiet-text">
          {displayedGainedExp}/{displayedLevelSpan} EXP
        </p>
        {!expAnimationDone && earnedExp > 0 ? (
          <button className="secondary-action exp-skip-button" type="button" onClick={skipExpAnimation}>
            スキップ
          </button>
        ) : null}
      </section>

      {unlockedLevelIcons.length > 0 && !iconNoticeDismissed ? (
        <section className="level-icon-unlock-card" aria-live="polite">
          <div>
            <strong>あたらしい アイコンが ふえたよ！</strong>
            <p>{unlockedLevelIcons.map((icon) => icon.label).join('、')}</p>
          </div>
          <div className="level-icon-unlock-row">
            {unlockedLevelIcons.map((icon) => (
              <LevelIconBadge icon={icon} key={icon.id} className="level-icon-unlock-svg" />
            ))}
          </div>
          <button
            className="secondary-action compact-action"
            type="button"
            onClick={() => setIconNoticeDismissed(true)}
          >
            とじる
          </button>
        </section>
      ) : null}

      <ModeResultDetails summary={summary} />

      {summary.newTitles.includes(allGekimuzuTitle) ? (
        <section className="final-title-celebration" role="status" aria-live="polite">
          <strong>すべてをしるもの！</strong>
          <span>ぜんぶ あつめた さいごのしょうごうだよ</span>
        </section>
      ) : null}

      {summary.newTitles.length > 0 ? (
        <section className="mission-section" aria-labelledby="title-earned">
          <h2 id="title-earned">あたらしいしょうごう</h2>
          <div className="fact-list">
            {summary.newTitles.map((title) => (
              <span key={title}>{title}</span>
            ))}
          </div>
        </section>
      ) : null}

      <section className="weak-section" aria-labelledby="result-weak">
        <h2 id="result-weak">まちがえたもんすたー</h2>
        {summary.weakFacts.length === 0 ? (
          <p className="quiet-text">いまはありません</p>
        ) : (
          <div className="fact-list">
            {summary.weakFacts.map((fact) => (
              <span key={fact.id}>{formatFactLabel(fact)}</span>
            ))}
          </div>
        )}
      </section>

      <section className="weak-section" aria-labelledby="result-mastered">
        <h2 id="result-mastered">習得した問題</h2>
        {summary.masteredFacts.length === 0 ? (
          <p className="quiet-text">これから増えます</p>
        ) : (
          <div className="fact-list">
            {summary.masteredFacts.slice(0, 6).map((fact) => (
              <span key={fact.id}>{formatFactLabel(fact)}</span>
            ))}
          </div>
        )}
      </section>

      <section className="action-band">
        <Link className="primary-action" to={replayPathForSummary(summary)}>
          もう一回
        </Link>
        <Link className="secondary-action" to={planetMenuPath}>
          あそぶへ
        </Link>
        <Link className="secondary-action" to="/home">
          ホームへ
        </Link>
      </section>
      <DailyBudgetNoticeModal open={budgetNoticeOpen} onDismiss={closeBudgetNotice} />
    </AppShell>
  )
}
