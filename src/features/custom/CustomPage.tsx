import { useMemo, useState } from 'react'
import { AppShell } from '../../components/common/AppShell'
import { BuddySprite } from '../../components/collection/BuddySprite'
import { AdditionMonsterSprite } from '../../components/collection/AdditionMonsterSprite'
import { LevelIconBadge } from '../../components/collection/LevelIconBadge'
import { MonsterSprite } from '../../components/collection/MonsterSprite'
import { PlayerIconBadge } from '../../components/collection/PlayerIconBadge'
import { SubtractionMonsterSprite } from '../../components/collection/SubtractionMonsterSprite'
import { DivisionMonsterSprite } from '../../components/collection/DivisionMonsterSprite'
import { TitleEmblem } from '../../components/collection/TitleEmblem'
import { UfoBadge } from '../../components/collection/UfoBadge'
import { KukucchiCharacter } from '../../components/character/KukucchiCharacter'
import { getLevelIconById, getUnlockedLevelIcons } from '../../data/levelIcons'
import { getAdditionMonsterById } from '../../data/additionMonsters'
import { getSubtractionMonsterById } from '../../data/subtractionMonsters'
import { getDivisionMonsterById } from '../../data/divisionMonsters'
import { playerIcons } from '../../data/playerIcons'
import { defaultCharacterName } from '../../data/shipName'
import { equipShopItem, getHomeShipPreviewVisuals } from '../../data/shopItems'
import { getUfoById } from '../../data/ufos'
import {
  buildCustomInventory,
  customStarFilterLabels,
  customStarFilterOrder,
  type CustomInventoryEntry,
  type CustomStarFilter,
  type CustomTabId,
} from '../../game-engine/custom/customInventory'
import {
  parseDedicatedBuddySelectionId,
  parseMonsterBuddySelectionId,
} from '../../game-engine/collection/buddies'
import { useSaveData } from '../../hooks/useSaveData'
import { getNumericMonsterById } from '../../data/numericRewards'
import { NumericMonsterSprite } from '../../components/collection/NumericMonsterSprite'

function renderBuddy(selectionId: string | null, className = 'custom-preview-buddy') {
  const numericMonster = selectionId?.startsWith('numeric-monster:') ? getNumericMonsterById(selectionId.slice('numeric-monster:'.length)) : undefined
  if (numericMonster) return <NumericMonsterSprite monster={numericMonster} className={className}/>
  const additionMonster = selectionId?.startsWith('addition-monster:')
    ? getAdditionMonsterById(selectionId.replace(/^addition-monster:/, ''))
    : undefined
  if (additionMonster) {
    return <AdditionMonsterSprite monster={additionMonster} className={className} />
  }
  const subtractionMonster = selectionId?.startsWith('subtraction-monster:')
    ? getSubtractionMonsterById(selectionId.replace(/^subtraction-monster:/, ''))
    : undefined
  if (subtractionMonster) {
    return <SubtractionMonsterSprite monster={subtractionMonster} className={className} />
  }
  const divisionMonster = selectionId?.startsWith('division-monster:')
    ? getDivisionMonsterById(selectionId.replace(/^division-monster:/, ''))
    : undefined
  if (divisionMonster) {
    return <DivisionMonsterSprite monster={divisionMonster} className={className} />
  }
  const monster = parseMonsterBuddySelectionId(selectionId)
  if (monster) {
    return <MonsterSprite left={monster.left} right={monster.right} className={className} />
  }
  const buddyId = parseDedicatedBuddySelectionId(selectionId)
  return buddyId ? <BuddySprite buddyId={buddyId} className={className} /> : null
}

function EntryIcon({ entry }: { entry: CustomInventoryEntry }) {
  const locked = !entry.owned
  if (entry.numericMonster) return <NumericMonsterSprite monster={entry.numericMonster} locked={locked} className="custom-item-sprite"/>
  if (entry.kind === 'ufo') {
    return <UfoBadge ufo={entry.ufo} locked={locked} compact />
  }
  if (entry.kind === 'monster-buddy' && entry.monsterFact) {
    return (
      <MonsterSprite
        left={entry.monsterFact.left}
        right={entry.monsterFact.right}
        locked={locked}
        className="custom-item-sprite"
      />
    )
  }
  if (entry.kind === 'addition-monster-buddy' && entry.additionMonster) {
    return (
      <AdditionMonsterSprite
        monster={entry.additionMonster}
        locked={locked}
        className="custom-item-sprite"
      />
    )
  }
  if (entry.kind === 'subtraction-monster-buddy' && entry.subtractionMonster) {
    return (
      <SubtractionMonsterSprite
        monster={entry.subtractionMonster}
        locked={locked}
        className="custom-item-sprite"
      />
    )
  }
  if (entry.kind === 'division-monster-buddy' && entry.divisionMonster) {
    return (
      <DivisionMonsterSprite
        monster={entry.divisionMonster}
        locked={locked}
        className="custom-item-sprite"
      />
    )
  }
  if (entry.kind === 'dedicated-buddy' && entry.buddy) {
    return <BuddySprite buddyId={entry.buddy.id} locked={locked} className="custom-item-sprite" />
  }
  if (entry.kind === 'title') {
    return <TitleEmblem title={entry.label} locked={locked} className="custom-title-emblem" />
  }
  return (
    <span className={locked ? 'custom-item-emoji locked' : 'custom-item-emoji'} aria-hidden="true">
      {locked ? '◆' : (entry.item?.emoji ?? '◇')}
    </span>
  )
}

function entrySourceLabel(entry: CustomInventoryEntry): string {
  if (entry.owned && entry.selected) {
    return 'そうびちゅう'
  }
  if (entry.owned) {
    return entry.method
  }
  if (entry.kind === 'ufo') {
    return 'ボスげきムズ'
  }
  if (entry.kind === 'title') {
    return 'チャレンジで入手'
  }
  return entry.method
}

export function CustomPage() {
  const { saveData, updateSaveData } = useSaveData()
  const [activeTabId, setActiveTabId] = useState<CustomTabId>('window')
  const [activeStarFilter, setActiveStarFilter] = useState<CustomStarFilter>('all')
  const inventory = useMemo(
    () => buildCustomInventory(saveData, activeStarFilter),
    [activeStarFilter, saveData],
  )
  const requestedTab = inventory.find((tab) => tab.id === activeTabId)
  const activeTab =
    requestedTab && requestedTab.totalCount > 0
      ? requestedTab
      : (inventory.find((tab) => tab.totalCount > 0) ?? requestedTab ?? inventory[0])

  const equippedUfo = getUfoById(saveData.progress.equippedUfoId)
  const visual = getHomeShipPreviewVisuals(saveData.progress.equippedItems, equippedUfo?.variant)
  const buddyContent = renderBuddy(saveData.progress.equippedBuddyId)
  const characterName = saveData.player?.characterName ?? defaultCharacterName
  const unlockedLevelIcons = getUnlockedLevelIcons(saveData.player?.level ?? 1)
  const selectedLevelIcon = getLevelIconById(saveData.player?.icon)

  function equipEntry(entry: CustomInventoryEntry) {
    if (!entry.owned) {
      return
    }
    updateSaveData((current) => {
      if (entry.kind === 'shop' && entry.item) {
        return {
          ...current,
          progress: {
            ...current.progress,
            equippedItems: equipShopItem(current.progress.equippedItems, entry.item.id),
          },
        }
      }
      if (entry.kind === 'ufo' && entry.ufo) {
        return {
          ...current,
          progress: {
            ...current.progress,
            equippedUfoId: entry.ufo.id,
          },
        }
      }
      if (
        entry.kind === 'monster-buddy' ||
        entry.kind === 'addition-monster-buddy' ||
        entry.kind === 'subtraction-monster-buddy' ||
        entry.kind === 'division-monster-buddy' ||
        entry.kind === 'numeric-monster-buddy' ||
        entry.kind === 'dedicated-buddy'
      ) {
        return {
          ...current,
          progress: {
            ...current.progress,
            equippedBuddyId: entry.id,
          },
        }
      }
      if (entry.kind === 'title') {
        return {
          ...current,
          player: current.player
            ? {
                ...current.player,
                currentTitle: entry.id,
              }
            : current.player,
        }
      }
      return current
    })
  }

  function clearBuddy() {
    updateSaveData((current) => ({
      ...current,
      progress: {
        ...current.progress,
        equippedBuddyId: null,
      },
    }))
  }

  function choosePlayerIcon(iconId: string) {
    updateSaveData((current) => ({
      ...current,
      player: current.player
        ? {
            ...current.player,
            icon: iconId,
          }
        : current.player,
    }))
  }

  return (
    <AppShell title="もちもの" backTo="/home">
      <section className="custom-hub">
        <section className="custom-preview-panel" aria-labelledby="custom-preview-heading">
          <div className="preview-customizer-heading">
            <p className="welcome">くくっちごう</p>
            <h2 id="custom-preview-heading">カスタム</h2>
          </div>
          <aside className="character-window custom-character-window" aria-label="装備プレビュー">
            <KukucchiCharacter
              level={saveData.player?.level ?? 1}
              mood="happy"
              visual={visual}
              buddyContent={buddyContent}
              label={characterName}
            />
            <TitleEmblem title={saveData.player?.currentTitle} className="ship-title-badge" />
          </aside>
          <section className="level-icon-picker" aria-labelledby="level-icon-title">
            <h3 id="level-icon-title">なまえアイコン</h3>
            <div className="level-icon-row">
              {playerIcons.map((icon) => (
                <button
                  className={saveData.player?.icon === icon.id ? 'level-icon-choice selected' : 'level-icon-choice'}
                  type="button"
                  key={icon.id}
                  onClick={() => choosePlayerIcon(icon.id)}
                  aria-pressed={saveData.player?.icon === icon.id}
                >
                  <PlayerIconBadge icon={icon} className="level-icon-choice-svg" />
                  <small>{icon.label}</small>
                </button>
              ))}
              {unlockedLevelIcons.map((icon) => (
                <button
                  className={saveData.player?.icon === icon.id ? 'level-icon-choice selected' : 'level-icon-choice'}
                  type="button"
                  key={icon.id}
                  onClick={() => choosePlayerIcon(icon.id)}
                  aria-pressed={saveData.player?.icon === icon.id}
                >
                  <LevelIconBadge icon={icon} className="level-icon-choice-svg" />
                  <small>{icon.label}</small>
                </button>
              ))}
            </div>
            {selectedLevelIcon ? (
              <p className="quiet-text">Lv{selectedLevelIcon.unlockLevel}でふえたアイコンです</p>
            ) : null}
          </section>
        </section>

        <section className="custom-inventory-panel" aria-labelledby="custom-inventory-heading">
          <div className="custom-star-filter" aria-label="星フィルタ">
            {customStarFilterOrder.map((filter) => (
              <button
                className={activeStarFilter === filter ? 'selected' : ''}
                key={filter}
                type="button"
                onClick={() => setActiveStarFilter(filter)}
                aria-pressed={activeStarFilter === filter}
              >
                {customStarFilterLabels[filter]}
              </button>
            ))}
          </div>
          <div className="custom-tab-bar" role="tablist" aria-label="もちものタブ">
            {inventory.map((tab) => (
              <button
                className={tab.id === activeTab.id ? 'custom-tab selected' : 'custom-tab'}
                type="button"
                key={tab.id}
                onClick={() => setActiveTabId(tab.id)}
                aria-selected={tab.id === activeTab.id}
                role="tab"
              >
                <strong>{tab.label}</strong>
                <small>
                  {tab.ownedCount}/{tab.totalCount}
                </small>
              </button>
            ))}
          </div>
          <div className="custom-tab-heading">
            <h2 id="custom-inventory-heading">{activeTab.label}</h2>
            <span>
              {activeTab.ownedCount}/{activeTab.totalCount}こ
            </span>
          </div>
          {activeTab.id === 'buddy' ? (
            <button
              className={saveData.progress.equippedBuddyId === null ? 'custom-item-card selected' : 'custom-item-card'}
              type="button"
              onClick={clearBuddy}
              aria-pressed={saveData.progress.equippedBuddyId === null}
            >
              <span className="custom-item-emoji" aria-hidden="true">◇</span>
              <strong>なし</strong>
              <small>なかまをしまう</small>
            </button>
          ) : null}
          <div className="custom-item-grid">
            {activeTab.entries.map((entry) => (
              <button
                className={[
                  'custom-item-card',
                  entry.owned ? 'owned' : 'locked',
                  entry.selected ? 'selected' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                type="button"
                key={`${entry.kind}-${entry.id}`}
                onClick={() => equipEntry(entry)}
                disabled={!entry.owned}
                aria-pressed={entry.selected}
              >
                <EntryIcon entry={entry} />
                <strong>{entry.label}</strong>
                <small>{entry.owned ? entry.description : '？？？'}</small>
                <span>{entrySourceLabel(entry)}</span>
              </button>
            ))}
          </div>
        </section>
      </section>
    </AppShell>
  )
}
