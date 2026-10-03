import { StatPill } from '../../components/common/StatPill'
import { BuddySprite } from '../../components/collection/BuddySprite'
import { LevelIconBadge } from '../../components/collection/LevelIconBadge'
import { MonsterSprite } from '../../components/collection/MonsterSprite'
import { PlayerIconBadge } from '../../components/collection/PlayerIconBadge'
import { AdditionMonsterSprite } from '../../components/collection/AdditionMonsterSprite'
import { SubtractionMonsterSprite } from '../../components/collection/SubtractionMonsterSprite'
import { DivisionMonsterSprite } from '../../components/collection/DivisionMonsterSprite'
import { TitleEmblem } from '../../components/collection/TitleEmblem'
import { KukucchiCharacter } from '../../components/character/KukucchiCharacter'
import { getAdditionMonsterById } from '../../data/additionMonsters'
import { getDivisionMonsterById } from '../../data/divisionMonsters'
import { getLevelIconById } from '../../data/levelIcons'
import { getPlayerIcon } from '../../data/playerIcons'
import { getSubtractionMonsterById } from '../../data/subtractionMonsters'
import {
  equipmentSlots,
  getEquippedItemForSlot,
  getHomeShipPreviewVisuals,
} from '../../data/shopItems'
import { defaultCharacterName, defaultShipName } from '../../data/shipName'
import { getUfoById } from '../../data/ufos'
import {
  coerceEquippedBuddyId,
  parseDedicatedBuddySelectionId,
  parseMonsterBuddySelectionId,
} from '../../game-engine/collection/buddies'
import { formatFactLabel } from '../../game-engine/questions/factIds'
import { getWeakFacts, weakFactHintText } from '../../game-engine/review/weakFacts'
import { useSaveData } from '../../hooks/useSaveData'
import { titleLabel } from '../../game-engine/rewards/titles'
import type { PlanetId } from '../../data/planets'
import { planetOperations } from '../../game-engine/learning/planetLearning'

function renderSelectedBuddy(selectionId: string | null) {
  const additionMonster = selectionId?.startsWith('addition-monster:')
    ? getAdditionMonsterById(selectionId.replace(/^addition-monster:/, ''))
    : undefined
  if (additionMonster) {
    return <AdditionMonsterSprite monster={additionMonster} className="home-buddy-sprite" />
  }
  const subtractionMonster = selectionId?.startsWith('subtraction-monster:')
    ? getSubtractionMonsterById(selectionId.replace(/^subtraction-monster:/, ''))
    : undefined
  if (subtractionMonster) {
    return <SubtractionMonsterSprite monster={subtractionMonster} className="home-buddy-sprite" />
  }
  const divisionMonster = selectionId?.startsWith('division-monster:')
    ? getDivisionMonsterById(selectionId.replace(/^division-monster:/, ''))
    : undefined
  if (divisionMonster) {
    return <DivisionMonsterSprite monster={divisionMonster} className="home-buddy-sprite" />
  }
  const monster = parseMonsterBuddySelectionId(selectionId)
  if (monster) {
    return <MonsterSprite left={monster.left} right={monster.right} className="home-buddy-sprite" />
  }
  const buddyId = parseDedicatedBuddySelectionId(selectionId)
  return buddyId ? <BuddySprite buddyId={buddyId} className="home-buddy-sprite" /> : null
}

export function HomePlayerStrip() {
  const { saveData } = useSaveData()
  const player = saveData.player
  const playerIcon = getPlayerIcon(player?.icon)
  const levelIcon = getLevelIconById(player?.icon)

  return (
    <section className="home-player-strip" aria-label="プレイヤー情報">
      <div className="home-name-row">
        <span className="player-icon-badge" aria-label={`${playerIcon.label}アイコン`}>
          {levelIcon ? (
            <LevelIconBadge icon={levelIcon} className="home-level-icon" />
          ) : (
            <PlayerIconBadge icon={playerIcon} className="home-level-icon" />
          )}
        </span>
        <div>
          <p className="welcome">ようこそ</p>
          <h2>{player?.nickname ?? 'くくとも'}</h2>
        </div>
      </div>
      <div className="home-strip-stats">
        <StatPill label="Lv" value={player?.level ?? 1} icon="01" />
        <StatPill label="EXP" value={player?.exp ?? 0} icon="★" />
        <StatPill label="コイン" value={player?.coins ?? 0} icon="●" />
      </div>
    </section>
  )
}

export function PlayerCommandPanel({
  className = '',
  planet,
}: {
  className?: string
  planet?: PlanetId
}) {
  const { saveData } = useSaveData()
  const player = saveData.player
  const equippedUfo = getUfoById(saveData.progress.equippedUfoId)
  const characterVisuals = getHomeShipPreviewVisuals(
    saveData.progress.equippedItems,
    equippedUfo?.variant,
  )
  const equippedBuddyId = coerceEquippedBuddyId(saveData)
  const buddyContent = renderSelectedBuddy(equippedBuddyId)
  const playerIcon = getPlayerIcon(player?.icon)
  const levelIcon = getLevelIconById(player?.icon)
  const crewTitle = titleLabel(player?.currentTitle)
  const shipName = player?.shipName ?? defaultShipName
  const characterName = player?.characterName ?? defaultCharacterName

  return (
    <section className={['home-command', className].filter(Boolean).join(' ')}>
      <div className="home-profile">
        <div className="home-title-block">
          <div className="home-name-row">
            <span className="player-icon-badge" aria-label={`${playerIcon.label}アイコン`}>
              {levelIcon ? (
                <LevelIconBadge icon={levelIcon} className="home-level-icon" />
              ) : (
                <PlayerIconBadge icon={playerIcon} className="home-level-icon" />
              )}
            </span>
            <h2>{player?.nickname ?? 'くくとも'}</h2>
          </div>
          <div className="home-current-title">
            <TitleEmblem
              title={player?.currentTitle ?? 'はじめのいっぽ'}
              className="home-title-emblem"
            />
            <p className="title-line">{titleLabel(player?.currentTitle)}</p>
          </div>
        </div>

        <section className="home-mission-compact" aria-labelledby="mission-title">
          <h2 id="mission-title">きょうのめあて</h2>
          <div className="mission-list">
            {saveData.progress.missions
              .filter((mission) => !planet || mission.operation === planetOperations[planet])
              .slice(0, 3)
              .map((mission) => (
                <div className="mission-item" key={mission.id}>
                  <span>{mission.label}</span>
                  <strong>
                    {mission.progress}/{mission.target}
                  </strong>
                </div>
              ))}
          </div>
        </section>

        <section className="home-stats-mini" aria-label="プレイヤー情報">
          <StatPill label="Lv" value={player?.level ?? 1} icon="01" />
          <StatPill label="EXP" value={player?.exp ?? 0} icon="★" />
          <StatPill label="コイン" value={player?.coins ?? 0} icon="●" />
        </section>

        <section className="home-equipment-slots" aria-label="そうび">
          {equipmentSlots.map((slot) => {
            const item = getEquippedItemForSlot(saveData.progress.equippedItems, slot.id)
            return (
              <div className={item ? 'equipment-slot equipped' : 'equipment-slot'} key={slot.id}>
                <span aria-hidden="true">{item?.emoji ?? '◇'}</span>
                <small>{slot.label}</small>
                <strong>{item?.name ?? slot.emptyLabel}</strong>
              </div>
            )
          })}
        </section>
      </div>

      <aside className="character-window home-character-window" aria-label="くくっち">
        <KukucchiCharacter
          level={player?.level ?? 1}
          mood="happy"
          visual={characterVisuals}
          buddyContent={buddyContent}
          label={characterName}
        />
        <TitleEmblem title={crewTitle} className="ship-title-badge" />
        <div className="character-window-copy ship-name-only">
          <strong className="character-name-line">{characterName}</strong>
          <h2>{shipName}ごう</h2>
        </div>
      </aside>
    </section>
  )
}

export function WeakFactsPanel({
  className = '',
  planet,
}: {
  className?: string
  planet?: PlanetId
}) {
  const { saveData } = useSaveData()
  const weakFacts = getWeakFacts(
    saveData.progress.facts,
    3,
    planet ? { operation: planetOperations[planet] } : {},
  )

  return (
    <section
      className={['weak-section', className].filter(Boolean).join(' ')}
      aria-labelledby="weak-title"
    >
      <h2 id="weak-title">にがて</h2>
      <p className="weak-hint">{weakFactHintText}</p>
      {weakFacts.length === 0 ? (
        <p className="quiet-text">まだありません</p>
      ) : (
        <div className="fact-list">
          {weakFacts.map((fact) => (
            <span key={fact.id}>{formatFactLabel(fact)}</span>
          ))}
        </div>
      )}
    </section>
  )
}
