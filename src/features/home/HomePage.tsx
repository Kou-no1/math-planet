import type { CSSProperties } from 'react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { AppShell } from '../../components/common/AppShell'
import { TutorialModal } from '../../components/common/TutorialModal'
import { planets } from '../../data/planets'
import { useSaveData } from '../../hooks/useSaveData'
import { HomePlayerStrip } from './HomePanels'
import { PwaHomePanel } from '../../pwa/PwaPanel'

function planetSymbol(planetId: string) {
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

export function HomePage() {
  const { saveData, updateSaveData } = useSaveData()
  const [tutorialOpen, setTutorialOpen] = useState(!saveData.tutorial.homeSeen)

  function closeTutorial() {
    setTutorialOpen(false)
    updateSaveData((current) => ({
      ...current,
      tutorial: {
        ...current.tutorial,
        homeSeen: true,
      },
    }))
  }

  return (
    <AppShell
      title="ホーム"
      rightAction={
        <button className="top-help-button" type="button" onClick={() => setTutorialOpen(true)}>
          あそびかた
        </button>
      }
    >
      <HomePlayerStrip />

      <section className="home-star-select" aria-labelledby="home-star-title">
        <div className="home-star-heading">
          <p className="welcome">けいさんのほし</p>
          <h2 id="home-star-title">ほしをえらぶ</h2>
          <p className="title-line">さいしょに ほしをえらんでから、あそびかたをえらぼう。</p>
        </div>

        <div className="planet-grid home-planet-grid">
          {planets.map((planet) => {
            const style = {
              '--planet-primary': planet.theme.primary,
              '--planet-accent': planet.theme.accent,
              '--planet-surface': planet.theme.surface,
              '--planet-text': planet.theme.text,
            } as CSSProperties
            const content = (
              <>
                <span className="planet-orb home-planet-orb" aria-hidden="true">
                  {planetSymbol(planet.id)}
                </span>
                <span className="planet-copy">
                  <strong>{planet.name}</strong>
                  <small>{planet.theme.motif}</small>
                </span>
                <span className="planet-status">
                  {planet.status === 'live' ? 'あそべる' : 'じゅんびちゅう'}
                </span>
              </>
            )
            return planet.status === 'live' ? (
              <Link
                className="planet-card live home-planet-card"
                key={planet.id}
                style={style}
                to={`/planet/${planet.id}`}
              >
                {content}
              </Link>
            ) : (
              <div
                className="planet-card planned home-planet-card"
                key={planet.id}
                style={style}
                aria-disabled="true"
              >
                {content}
              </div>
            )
          })}
        </div>
      </section>

      <section className="home-card-grid home-common-actions" aria-label="きょうつうメニュー">
        <Link className="home-menu-card" to="/custom" aria-label="カスタム">
          <span className="home-card-emoji" aria-hidden="true">
            ✨
          </span>
          <strong>カスタム</strong>
          <small>もちもの・きせかえ</small>
        </Link>
        <Link className="home-menu-card" to="/book" aria-label="図かん">
          <span className="home-card-emoji" aria-hidden="true">
            📘
          </span>
          <strong>図かん</strong>
          <small>モンスター</small>
        </Link>
        <Link className="home-menu-card" to="/shop" aria-label="ショップ">
          <span className="home-card-emoji" aria-hidden="true">
            🛸
          </span>
          <strong>ショップ</strong>
          <small>コインでかう</small>
        </Link>
        <Link className="home-menu-card" to="/settings" aria-label="せってい">
          <span className="home-card-emoji" aria-hidden="true">
            ⚙️
          </span>
          <strong>せってい</strong>
          <small>音と表示</small>
        </Link>
      </section>

      <PwaHomePanel safe={!tutorialOpen} />
      {tutorialOpen ? <TutorialModal onClose={closeTutorial} /> : null}
    </AppShell>
  )
}
