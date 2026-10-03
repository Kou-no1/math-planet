import { numericAreasForPlanet, type NumericPlanetId } from './numericAreas'

export type NumericRocketDifficultyId = 'easy' | 'normal' | 'hard'

export function numericRocketDifficulties(planet: NumericPlanetId) {
  const areas = numericAreasForPlanet(planet)
  const groups =
    planet === 'decimal'
      ? [areas.slice(0, 2), areas.slice(0, 4), areas]
      : [areas.slice(0, 2), areas.slice(2), areas]
  return (['easy', 'normal', 'hard'] as const).map((id, index) => ({
    id,
    label: ['やさしい', 'ふつう', 'むずかしい'][index],
    description:
      planet === 'decimal'
        ? ['0.1のたしひき', '0.01までのたしひき', 'かけわりもミックス'][index]
        : ['同分母', '異分母', 'すべてミックス'][index],
    areaIds: groups[index].map((area) => area.id),
    title: `${planet === 'decimal' ? '小数' : '分数'}ロケット${['ビギナー', 'パイロット', 'キャプテン'][index]}`,
  }))
}
