import type { CSSProperties, ReactNode } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { AppShell } from '../../components/common/AppShell'
import { AdditionBossSprite } from '../../components/collection/AdditionBossSprite'
import { DivisionBossSprite } from '../../components/collection/DivisionBossSprite'
import { SubtractionBossSprite } from '../../components/collection/SubtractionBossSprite'
import { bosses } from '../../data/bosses'
import {
  additionAreas,
  divisionAreas,
  getPlanetById,
  subtractionAreas,
  type PlanetId,
} from '../../data/planets'
import {
  getClearedStars,
  isBossUnlocked,
  remainingQuestionsToUnlockBoss,
} from '../../game-engine/bosses/bossEngine'
import { useSaveData } from '../../hooks/useSaveData'
import { PlayerCommandPanel, WeakFactsPanel } from '../home/HomePanels'
import { planetExpeditions } from '../../data/planetExpeditions'
import { expeditionProgress } from '../../game-engine/learning/expeditions'
import { getPlanetLearningTarget } from '../../game-engine/learning/planetLearning'
import { isNumericPlanetId, numericAreasForPlanet } from '../../data/numericAreas'
import { NumericBossSprite } from '../../components/collection/NumericMonsterSprite'
import { planets } from '../../data/planets'

type PlanetMode = {
  label: string
  href?: string
  ready: boolean
  icon: string
  badge: string
  subtitle: string
  callToAction?: string
}

const planetIds: PlanetId[] = planets.map((planet) => planet.id)

const multiplyModes: PlanetMode[] = [
  {
    label: 'あそぶ',
    href: '/monster-battle',
    ready: true,
    icon: 'VS',
    badge: '01',
    subtitle: 'もんすたーばとる',
  },
  {
    label: 'おぼえる',
    href: '/learn?planet=multiply',
    ready: true,
    icon: '×',
    badge: '02',
    subtitle: 'だんをれんしゅう',
  },
  {
    label: 'スピード',
    href: '/speed',
    ready: true,
    icon: '30',
    badge: '03',
    subtitle: '30びょうチャレンジ',
  },
  {
    label: '高学年',
    href: '/advanced',
    ready: true,
    icon: 'abc',
    badge: '04',
    subtitle: '平方数・円周率',
  },
  {
    label: 'にがてもんすたー',
    href: '/review',
    ready: true,
    icon: 'Mx',
    badge: '05',
    subtitle: 'にがてをなかまに',
  },
  {
    label: 'ぼすばとる',
    href: '/battle',
    ready: true,
    icon: '盾',
    badge: '06',
    subtitle: 'だんぼすにちょうせん',
  },
  {
    label: 'ろけっと',
    href: '/rocket',
    ready: true,
    icon: '🚀',
    badge: '07',
    subtitle: 'はやさでうちゅうへ',
  },
  {
    label: 'たからばこ',
    href: '/treasure',
    ready: true,
    icon: '鍵',
    badge: '08',
    subtitle: 'ゆっくりおたから',
  },
]

const additionModes: PlanetMode[] = [
  {
    label: 'おぼえる',
    href: '/learn?planet=add',
    ready: true,
    icon: '+',
    badge: '01',
    subtitle: '6えりあをれんしゅう',
  },
  {
    label: 'あそぶ',
    href: '/rocket?planet=add',
    ready: true,
    icon: 'VS',
    badge: '02',
    subtitle: 'たしざんろけっと',
  },
  {
    label: 'すぴーど',
    href: '/speed?planet=add',
    ready: true,
    icon: '30',
    badge: '03',
    subtitle: 'たしざんたいむ',
  },
]

const subtractionModes: PlanetMode[] = [
  {
    label: 'おぼえる',
    href: '/learn?planet=subtract',
    ready: true,
    icon: '-',
    badge: '01',
    subtitle: '6えりあをれんしゅう',
  },
  {
    label: 'あそぶ',
    href: '/rocket?planet=subtract',
    ready: true,
    icon: 'VS',
    badge: '02',
    subtitle: 'ひきざんろけっと',
  },
  {
    label: 'すぴーど',
    href: '/speed?planet=subtract',
    ready: true,
    icon: '30',
    badge: '03',
    subtitle: 'ひきざんたいむ',
  },
]

const divisionModes: PlanetMode[] = [
  {
    label: 'おぼえる',
    href: '/learn?planet=divide',
    ready: true,
    icon: '÷',
    badge: '01',
    subtitle: '3エリアを練習',
  },
  {
    label: 'あそぶ',
    href: '/rocket?planet=divide',
    ready: true,
    icon: 'VS',
    badge: '02',
    subtitle: 'わりざんロケット',
  },
  {
    label: 'スピード',
    href: '/speed?planet=divide',
    ready: true,
    icon: '30',
    badge: '03',
    subtitle: 'わりざんタイム',
  },
]

function modesForPlanet(planetId: PlanetId): PlanetMode[] {
  if (isNumericPlanetId(planetId)) return [
    { label: 'おぼえる', href: `/learn?planet=${planetId}`, ready: true, icon: planetId === 'decimal' ? '0.1' : '1/2', badge: '01', subtitle: `${numericAreasForPlanet(planetId).length}エリアを練習` },
    { label: 'あそぶ', href: `/rocket?planet=${planetId}`, ready: true, icon: 'VS', badge: '02', subtitle: `${planetId === 'decimal' ? '小数' : '分数'}ロケット` },
    { label: 'スピード', href: `/speed?planet=${planetId}`, ready: true, icon: '30', badge: '03', subtitle: 'タイムチャレンジ' },
  ]
  if (planetId === 'add') {
    return additionModes
  }
  if (planetId === 'subtract') {
    return subtractionModes
  }
  if (planetId === 'divide') {
    return divisionModes
  }
  return multiplyModes
}

function isPlanetId(value: string | undefined): value is PlanetId {
  return planetIds.some((id) => id === value)
}

function planetSymbol(planetId: PlanetId) {
  if (planetId === 'decimal') return '0.1'
  if (planetId === 'fraction') return '1/2'
  if (planetId === 'multiply') {
    return '×'
  }
  if (planetId === 'add') {
    return '+'
  }
  if (planetId === 'divide') {
    return '÷'
  }
  return '-'
}

function modeCard(mode: PlanetMode): ReactNode {
  const content = (
    <>
      <span className="mode-icon" aria-hidden="true">
        {mode.icon}
      </span>
      <span className="mode-badge" aria-hidden="true">
        {mode.badge}
      </span>
      <strong>{mode.label}</strong>
      <small>{mode.subtitle}</small>
      <span>{mode.callToAction ?? (mode.ready ? 'すたーと' : 'じゅんびちゅう')}</span>
    </>
  )

  if (mode.ready && mode.href) {
    return (
      <Link className="mode-card planet-mode-card" key={mode.label} to={mode.href}>
        {content}
      </Link>
    )
  }

  return (
    <div className="mode-card planet-mode-card locked" key={mode.label} aria-disabled="true">
      {content}
    </div>
  )
}

export function PlanetMenuPage() {
  const { planetId } = useParams()
  const { saveData } = useSaveData()
  if (!isPlanetId(planetId)) {
    return <Navigate to="/home" replace />
  }

  const planet = getPlanetById(planetId)
  const style = {
    '--planet-primary': planet.theme.primary,
    '--planet-accent': planet.theme.accent,
    '--planet-surface': planet.theme.surface,
    '--planet-text': planet.theme.text,
  } as CSSProperties
  const modes = modesForPlanet(planet.id)
  const additionBosses = bosses.filter((boss) => boss.group === 'addition')
  const subtractionBosses = bosses.filter((boss) => boss.group === 'subtraction')
  const divisionBosses = bosses.filter((boss) => boss.group === 'division')
  const lowGradePlanet = planet.id === 'add' || planet.id === 'subtract'
  const expedition = planetExpeditions[planet.id]
  const milestones = expeditionProgress(saveData, planet.id)
  const completedMilestones = milestones.filter((milestone) => milestone.completed).length
  const learningTarget = getPlanetLearningTarget(saveData, planet.id)

  return (
    <AppShell title={planet.shortName} backTo="/home" className="planet-menu-shell">
      <section className="planet-menu-hero" style={style} aria-labelledby="planet-menu-title">
        <span className="planet-orb planet-menu-orb" aria-hidden="true">
          {planetSymbol(planet.id)}
        </span>
        <div className="planet-menu-copy">
          <p className="welcome">{lowGradePlanet ? 'ほしのめにゅー' : 'ほしのメニュー'}</p>
          <h2 id="planet-menu-title">{planet.name}</h2>
          <p className="title-line">
            {planet.status === 'live'
              ? 'このほしで あそびかたをえらぼう。'
              : 'このほしは じゅんびちゅうです。'}
          </p>
        </div>
        <span className="planet-status planet-menu-status">
          {planet.status === 'live' ? 'あそべる' : 'じゅんびちゅう'}
        </span>
      </section>

      {planet.status === 'live' ? (
        <>
          <PlayerCommandPanel className="planet-command-panel" planet={planet.id} />

          <section className="planet-expedition" style={style} aria-labelledby="expedition-title">
            <div className="expedition-heading">
              <div>
                <p className="welcome">ほしのおてつだい</p>
                <h2 id="expedition-title">{expedition.place}</h2>
              </div>
              <strong>
                {completedMilestones}/{milestones.length}
              </strong>
            </div>
            <p>
              {completedMilestones === milestones.length ? expedition.complete : expedition.request}
            </p>
            <ol className="expedition-milestones" aria-label={`${expedition.milestone}のようす`}>
              {milestones.map((milestone, index) => (
                <li key={milestone.id} className={milestone.completed ? 'completed' : ''}>
                  <span aria-hidden="true">{milestone.completed ? '✓' : String(index + 1)}</span>
                  <span>{milestone.label}</span>
                  <small>
                    {Math.min(milestone.correct, milestone.target)}/{milestone.target}
                  </small>
                </li>
              ))}
            </ol>
            <div className="expedition-actions">
              <Link className="primary-action" to={learningTarget.href}>
                つぎのいっぽ
              </Link>
              <Link className="secondary-action" to={`/review?planet=${planet.id}`}>
                ふくしゅう
              </Link>
              <span>{learningTarget.label}</span>
            </div>
          </section>

          <section className="mode-grid planet-mode-grid" aria-label={`${planet.name}のメニュー`}>
            {modes.map(modeCard)}
          </section>

          {planet.id === 'add' ? (
            <>
              <section className="planet-area-list" aria-labelledby="addition-area-menu-title">
                <div className="section-heading-row">
                  <div>
                    <p className="welcome">たしざん</p>
                    <h2 id="addition-area-menu-title">えりあれんしゅう</h2>
                  </div>
                </div>
                <div className="stage-chip-grid addition-area-grid">
                  {additionAreas.map((area) => (
                    <Link
                      className="stage-chip addition-area-chip"
                      key={area.id}
                      to={`/learn?planet=add&area=${area.id}`}
                    >
                      <strong>{area.name}</strong>
                      <span>{area.description}</span>
                    </Link>
                  ))}
                </div>
              </section>
              <section
                className="planet-area-list addition-boss-list"
                aria-labelledby="addition-boss-menu-title"
              >
                <div className="section-heading-row">
                  <div>
                    <p className="welcome">B2</p>
                    <h2 id="addition-boss-menu-title">たしざんぼす</h2>
                  </div>
                </div>
                <div className="stage-chip-grid addition-area-grid">
                  {additionBosses.map((boss) => {
                    const unlocked = isBossUnlocked(boss, saveData)
                    const remaining = remainingQuestionsToUnlockBoss(boss, saveData)
                    return (
                      <Link
                        className={
                          unlocked
                            ? 'stage-chip addition-area-chip'
                            : 'stage-chip addition-area-chip locked'
                        }
                        key={boss.id}
                        to={`/boss/${boss.id}`}
                      >
                        <AdditionBossSprite
                          boss={boss}
                          locked={!unlocked}
                          compact
                          className="planet-boss-chip-sprite"
                        />
                        <strong>{unlocked ? boss.label : '？？？'}</strong>
                        <span>
                          {'★'.repeat(getClearedStars(saveData, boss.id)) ||
                            (remaining !== null ? `あと${remaining}もん` : boss.shortLabel)}
                        </span>
                      </Link>
                    )
                  })}
                </div>
              </section>
            </>
          ) : null}

          {planet.id === 'subtract' ? (
            <>
              <section className="planet-area-list" aria-labelledby="subtraction-area-menu-title">
                <div className="section-heading-row">
                  <div>
                    <p className="welcome">ひきざん</p>
                    <h2 id="subtraction-area-menu-title">えりあれんしゅう</h2>
                  </div>
                </div>
                <div className="stage-chip-grid addition-area-grid">
                  {subtractionAreas.map((area) => (
                    <Link
                      className="stage-chip addition-area-chip"
                      key={area.id}
                      to={`/learn?planet=subtract&area=${area.id}`}
                    >
                      <strong>{area.name}</strong>
                      <span>{area.description}</span>
                    </Link>
                  ))}
                </div>
              </section>
              <section
                className="planet-area-list addition-boss-list"
                aria-labelledby="subtraction-boss-menu-title"
              >
                <div className="section-heading-row">
                  <div>
                    <p className="welcome">B3</p>
                    <h2 id="subtraction-boss-menu-title">ひきざんぼす</h2>
                  </div>
                </div>
                <div className="stage-chip-grid addition-area-grid">
                  {subtractionBosses.map((boss) => {
                    const unlocked = isBossUnlocked(boss, saveData)
                    const remaining = remainingQuestionsToUnlockBoss(boss, saveData)
                    return (
                      <Link
                        className={
                          unlocked
                            ? 'stage-chip addition-area-chip'
                            : 'stage-chip addition-area-chip locked'
                        }
                        key={boss.id}
                        to={`/boss/${boss.id}`}
                      >
                        <SubtractionBossSprite
                          boss={boss}
                          locked={!unlocked}
                          compact
                          className="planet-boss-chip-sprite"
                        />
                        <strong>{unlocked ? boss.label : '？？？'}</strong>
                        <span>
                          {'★'.repeat(getClearedStars(saveData, boss.id)) ||
                            (remaining !== null ? `あと${remaining}もん` : boss.shortLabel)}
                        </span>
                      </Link>
                    )
                  })}
                </div>
              </section>
            </>
          ) : null}

          {planet.id === 'divide' ? (
            <>
              <section className="planet-area-list" aria-labelledby="division-area-menu-title">
                <div className="section-heading-row">
                  <div>
                    <p className="welcome">わりざん</p>
                    <h2 id="division-area-menu-title">エリア練習</h2>
                  </div>
                </div>
                <div className="stage-chip-grid addition-area-grid">
                  {divisionAreas.map((area) => (
                    <Link
                      className="stage-chip addition-area-chip"
                      key={area.id}
                      to={`/learn?planet=divide&area=${area.id}`}
                    >
                      <strong>{area.name}</strong>
                      <span>{area.description}</span>
                    </Link>
                  ))}
                </div>
              </section>
              <section
                className="planet-area-list addition-boss-list"
                aria-labelledby="division-boss-menu-title"
              >
                <div className="section-heading-row">
                  <div>
                    <p className="welcome">B4</p>
                    <h2 id="division-boss-menu-title">わりざんボス</h2>
                  </div>
                </div>
                <div className="stage-chip-grid addition-area-grid">
                  {divisionBosses.map((boss) => {
                    const unlocked = isBossUnlocked(boss, saveData)
                    const remaining = remainingQuestionsToUnlockBoss(boss, saveData)
                    return (
                      <Link
                        className={
                          unlocked
                            ? 'stage-chip addition-area-chip'
                            : 'stage-chip addition-area-chip locked'
                        }
                        key={boss.id}
                        to={`/boss/${boss.id}`}
                      >
                        <DivisionBossSprite
                          boss={boss}
                          locked={!unlocked}
                          compact
                          className="planet-boss-chip-sprite"
                        />
                        <strong>{unlocked ? boss.label : '？？？'}</strong>
                        <span>
                          {'★'.repeat(getClearedStars(saveData, boss.id)) ||
                            (remaining !== null ? `あと${remaining}問` : boss.shortLabel)}
                        </span>
                      </Link>
                    )
                  })}
                </div>
              </section>
            </>
          ) : null}

          {isNumericPlanetId(planet.id) ? <>
            <section className="planet-area-list" aria-label={`${planet.shortName}のエリア練習`}>
              <h2>エリア練習</h2>
              <div className="stage-chip-grid addition-area-grid">
                {numericAreasForPlanet(planet.id).map((area) => <Link className="stage-chip addition-area-chip" key={area.id} to={`/learn?planet=${planet.id}&area=${area.id}`}><strong>{area.name}</strong><span>{area.description}</span></Link>)}
              </div>
            </section>
            <section className="planet-area-list addition-boss-list" aria-label={`${planet.shortName}のボス`}>
              <h2>{planet.shortName}のボス</h2>
              <div className="stage-chip-grid addition-area-grid">
                {bosses.filter((boss) => boss.group === planet.id).map((boss) => {
                  const unlocked = isBossUnlocked(boss, saveData)
                  return <Link className={`stage-chip addition-area-chip ${unlocked ? '' : 'locked'}`} key={boss.id} to={`/boss/${boss.id}`}>
                    <NumericBossSprite boss={boss} locked={!unlocked} compact className="planet-boss-chip-sprite"/>
                    <strong>{unlocked ? boss.label : '？？？'}</strong><span>{'★'.repeat(getClearedStars(saveData, boss.id)) || `あと${remainingQuestionsToUnlockBoss(boss, saveData)}問`}</span>
                  </Link>
                })}
              </div>
            </section>
          </> : null}
          <WeakFactsPanel className="planet-weak-panel" planet={planet.id} />
        </>
      ) : (
        <section className="mode-grid planet-mode-grid" aria-label={`${planet.name}のメニュー`}>
          <div className="mode-card planet-mode-card locked" aria-disabled="true">
            <span className="mode-icon" aria-hidden="true">
              {planetSymbol(planet.id)}
            </span>
            <span className="mode-badge" aria-hidden="true">
              00
            </span>
            <strong>じゅんびちゅう</strong>
            <small>べつのほしをえらんでね</small>
            <span>またあとで</span>
          </div>
        </section>
      )}
    </AppShell>
  )
}
