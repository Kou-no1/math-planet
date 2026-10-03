import { useEffect, useState } from 'react'
import type { CSSProperties } from 'react'
import { useSaveData } from '../../hooks/useSaveData'

type SparkStar = {
  id: number
  left: number
  top: number
  size: number
  delay: number
}

type ShootingStar = {
  id: number
  left: number
  top: number
  distance: number
  duration: number
}

function randomBetween(min: number, max: number) {
  return min + Math.random() * (max - min)
}

function createSparkStars(seed: number): SparkStar[] {
  return Array.from({ length: 12 }, (_, index) => ({
    id: seed + index,
    left: randomBetween(3, 97),
    top: randomBetween(4, 96),
    size: randomBetween(2, 5),
    delay: randomBetween(0, 0.7),
  }))
}

function createShootingStar(id: number): ShootingStar {
  return {
    id,
    left: randomBetween(48, 96),
    top: randomBetween(4, 38),
    distance: randomBetween(220, 460),
    duration: randomBetween(1.1, 1.7),
  }
}

export function SpaceBackgroundEffects() {
  const { saveData } = useSaveData()
  const reduceMotion = saveData.settings.reduceMotion
  const [sparkStars, setSparkStars] = useState<SparkStar[]>(() => createSparkStars(Date.now()))
  const [shootingStar, setShootingStar] = useState<ShootingStar | null>(null)

  useEffect(() => {
    if (reduceMotion) return undefined
    const interval = window.setInterval(() => {
      setSparkStars(createSparkStars(Date.now()))
    }, 3000)
    return () => window.clearInterval(interval)
  }, [reduceMotion])

  useEffect(() => {
    if (reduceMotion) return undefined
    let timeoutId: number
    let clearStarTimeoutId: number

    function scheduleNextStar() {
      timeoutId = window.setTimeout(
        () => {
          const star = createShootingStar(Date.now())
          setShootingStar(star)
          clearStarTimeoutId = window.setTimeout(
            () => setShootingStar(null),
            star.duration * 1000 + 160,
          )
          scheduleNextStar()
        },
        randomBetween(2600, 6800),
      )
    }

    scheduleNextStar()
    return () => {
      window.clearTimeout(timeoutId)
      window.clearTimeout(clearStarTimeoutId)
    }
  }, [reduceMotion])

  if (reduceMotion) return null

  return (
    <div className="space-effects" aria-hidden="true">
      {sparkStars.map((star) => (
        <span
          className="spark-star"
          key={star.id}
          style={{
            animationDelay: `${star.delay}s`,
            height: `${star.size}px`,
            left: `${star.left}%`,
            top: `${star.top}%`,
            width: `${star.size}px`,
          }}
        />
      ))}
      {shootingStar ? (
        <span
          className="shooting-star"
          key={shootingStar.id}
          style={
            {
              '--shoot-distance': `${shootingStar.distance}px`,
              animationDuration: `${shootingStar.duration}s`,
              left: `${shootingStar.left}%`,
              top: `${shootingStar.top}%`,
            } as CSSProperties
          }
        />
      ) : null}
    </div>
  )
}
