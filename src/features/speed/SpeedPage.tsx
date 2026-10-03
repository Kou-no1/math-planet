import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { AppShell } from '../../components/common/AppShell'
import { MathQuestion } from '../../components/game/MathValue'
import { KukucchiCharacter } from '../../components/character/KukucchiCharacter'
import { AnswerControls } from '../../components/game/AnswerControls'
import { GameFeedback } from '../../components/game/GameFeedback'
import { ModeStartScreen } from '../../components/game/ModeStartScreen'
import { defaultSpeedStages, speedDurations } from '../../data/factDifficulty'
import {
  additionAreas,
  divisionAreas,
  subtractionAreas,
  type AdditionAreaId,
  type DivisionAreaId,
  type SubtractionAreaId,
} from '../../data/planets'
import { isCorrectAnswer } from '../../game-engine/questions/answer'
import { averageStageDifficulty } from '../../game-engine/questions/factDifficulty'
import {
  generateAdditionQuestion,
  generateDivisionQuestion,
  generateMultiplicationQuestion,
  generateSubtractionQuestion,
} from '../../game-engine/questions/questionGenerator'
import { buildSessionSummary } from '../../game-engine/rewards/rewards'
import { applyAnswerToScore } from '../../game-engine/scoring/score'
import { useDailyUsage } from '../../hooks/useDailyUsage'
import { useSaveData } from '../../hooks/useSaveData'
import { playCorrectSound } from '../../services/audioService'
import { applySessionResult } from '../../services/resultService'
import type { AnswerResult, AnswerValue, Question, ScoreState } from '../../types/game'
import { createId } from '../../utils/id'
import { isNumericPlanetId, numericAreasForPlanet, type NumericAreaId, type NumericPlanetId } from '../../data/numericAreas'
import { generateAdaptiveNumericQuestion } from '../../game-engine/questions/numeric'
import { factsWithResults } from '../../game-engine/mastery/mastery'
import { resultIncorrectStreak } from '../../game-engine/school/schoolMode2'

type SpeedPhase = 'ready' | 'running'

const allStages = [1, 2, 3, 4, 5, 6, 7, 8, 9]

export type SpeedQuestionSource =
  | { planet: 'multiply'; selectedStages: number[] }
  | { planet: 'add'; selectedAreas: AdditionAreaId[] }
  | { planet: 'subtract'; selectedAreas: SubtractionAreaId[] }
  | { planet: 'divide'; selectedAreas: DivisionAreaId[] }
  | { planet: NumericPlanetId; selectedAreas: NumericAreaId[]; facts?: Parameters<typeof generateAdaptiveNumericQuestion>[0]; schoolMode2Enabled?: boolean; recentIncorrectCount?: number }

export function createSpeedQuestion(source: SpeedQuestionSource): Question {
  if (source.planet === 'decimal' || source.planet === 'fraction') {
    const validAreas = numericAreasForPlanet(source.planet).filter((area) => source.selectedAreas.includes(area.id))
    const areas = validAreas.length ? validAreas : numericAreasForPlanet(source.planet)
    return generateAdaptiveNumericQuestion(source.facts ?? {}, areas[Math.floor(Math.random() * areas.length)].id, source)
  }
  if (source.planet === 'add') {
    const areas =
      source.selectedAreas.length > 0 ? source.selectedAreas : additionAreas.map((area) => area.id)
    const areaId = areas[Math.floor(Math.random() * areas.length)] ?? additionAreas[0].id
    return generateAdditionQuestion(areaId)
  }
  if (source.planet === 'subtract') {
    const areas =
      source.selectedAreas.length > 0
        ? source.selectedAreas
        : subtractionAreas.map((area) => area.id)
    const areaId = areas[Math.floor(Math.random() * areas.length)] ?? subtractionAreas[0].id
    return generateSubtractionQuestion(areaId)
  }
  if (source.planet === 'divide') {
    const areas =
      source.selectedAreas.length > 0 ? source.selectedAreas : divisionAreas.map((area) => area.id)
    const areaId = areas[Math.floor(Math.random() * areas.length)] ?? divisionAreas[0].id
    return generateDivisionQuestion(areaId)
  }
  return generateMultiplicationQuestion({
    answerMode: 'choice',
    stages: 'selectedStages' in source ? source.selectedStages : allStages,
    minDifficulty: 1,
  })
}

function stageStars(stage: number): string {
  return '★'.repeat(Math.max(1, Math.round(averageStageDifficulty(stage))))
}

export function SpeedPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { saveData, setSaveData, updateSaveData } = useSaveData()
  const { rewardBudgetReached } = useDailyUsage()
  const isAdditionPlanet = searchParams.get('planet') === 'add'
  const isSubtractionPlanet = searchParams.get('planet') === 'subtract'
  const isDivisionPlanet = searchParams.get('planet') === 'divide'
  const numericPlanet = isNumericPlanetId(searchParams.get('planet')) ? searchParams.get('planet') as NumericPlanetId : null
  const operationPlanet = isAdditionPlanet || isSubtractionPlanet || isDivisionPlanet || Boolean(numericPlanet)
  const backTo = numericPlanet ? `/planet/${numericPlanet}` : isAdditionPlanet
    ? '/planet/add'
    : isSubtractionPlanet
      ? '/planet/subtract'
      : isDivisionPlanet
        ? '/planet/divide'
        : '/planet/multiply'
  const savedSpeedSettings = saveData.progress.speedSettings
  const initialStages =
    savedSpeedSettings.selectedStages.length > 0
      ? savedSpeedSettings.selectedStages
      : [...defaultSpeedStages]
  const [phase, setPhase] = useState<SpeedPhase>('ready')
  const [selectedNumericAreas, setSelectedNumericAreas] = useState<NumericAreaId[]>(numericAreasForPlanet(numericPlanet ?? 'decimal').map((area) => area.id))
  const [selectedStages, setSelectedStages] = useState<number[]>(initialStages)
  const [selectedAreas, setSelectedAreas] = useState<AdditionAreaId[]>(
    additionAreas.map((area) => area.id),
  )
  const [selectedSubtractionAreas, setSelectedSubtractionAreas] = useState<SubtractionAreaId[]>(
    subtractionAreas.map((area) => area.id),
  )
  const [selectedDivisionAreas, setSelectedDivisionAreas] = useState<DivisionAreaId[]>(
    divisionAreas.map((area) => area.id),
  )
  const [durationSeconds, setDurationSeconds] = useState(savedSpeedSettings.durationSeconds)
  const [timeLeft, setTimeLeft] = useState(durationSeconds)
  const [question, setQuestion] = useState(() =>
    createSpeedQuestion(
      numericPlanet ? { planet: numericPlanet, selectedAreas: selectedNumericAreas } : isAdditionPlanet
        ? { planet: 'add', selectedAreas: additionAreas.map((area) => area.id) }
        : isSubtractionPlanet
          ? {
              planet: 'subtract',
              selectedAreas: subtractionAreas.map((area) => area.id),
            }
          : isDivisionPlanet
            ? {
                planet: 'divide',
                selectedAreas: divisionAreas.map((area) => area.id),
              }
            : { planet: 'multiply', selectedStages: initialStages },
    ),
  )
  const [feedback, setFeedback] = useState<'idle' | 'correct' | 'incorrect'>('idle')
  const [results, setResults] = useState<AnswerResult[]>([])
  const [scoreState, setScoreState] = useState<ScoreState>({
    score: 0,
    combo: 0,
    maxCombo: 0,
  })
  const startedAtRef = useRef(Date.now())
  const finishedRef = useRef(false)

  const sortedStages = useMemo(
    () => [...selectedStages].sort((left, right) => left - right),
    [selectedStages],
  )

  const createQuestion = useCallback(
    (completedResults = results) =>
      createSpeedQuestion(
        numericPlanet ? { planet: numericPlanet, selectedAreas: selectedNumericAreas, facts: factsWithResults(saveData.progress.facts, completedResults), schoolMode2Enabled: saveData.settings.schoolMode2Enabled, recentIncorrectCount: resultIncorrectStreak(completedResults) } : isAdditionPlanet
          ? { planet: 'add', selectedAreas }
          : isSubtractionPlanet
            ? { planet: 'subtract', selectedAreas: selectedSubtractionAreas }
            : isDivisionPlanet
              ? { planet: 'divide', selectedAreas: selectedDivisionAreas }
              : { planet: 'multiply', selectedStages: sortedStages },
      ),
    [
      numericPlanet, selectedNumericAreas, saveData.progress.facts, saveData.settings.schoolMode2Enabled, results,
      isAdditionPlanet,
      isSubtractionPlanet,
      isDivisionPlanet,
      selectedAreas,
      selectedSubtractionAreas,
      selectedDivisionAreas,
      sortedStages,
    ],
  )

  const saveSpeedSettings = useCallback(
    (nextStages: number[], nextDuration = durationSeconds) => {
      updateSaveData((current) => ({
        ...current,
        progress: {
          ...current.progress,
          speedSettings: {
            selectedStages: nextStages,
            durationSeconds: nextDuration,
          },
        },
      }))
    },
    [durationSeconds, updateSaveData],
  )

  const finish = useCallback(() => {
    if (finishedRef.current || phase !== 'running') {
      return
    }
    finishedRef.current = true
    const rawSummary = buildSessionSummary({
      id: createId('speed'),
      mode: 'speed',
      maxCombo: scoreState.maxCombo,
      score: scoreState.score,
      results,
      finishedAt: new Date().toISOString(),
      details: {
        planet: numericPlanet ?? (isAdditionPlanet ? 'add' : isSubtractionPlanet ? 'subtract' : isDivisionPlanet ? 'divide' : 'multiply'),
        selectedStages: sortedStages.map(String),
        durationSeconds,
        answerMode: 'choice',
      },
    })
    const summary = operationPlanet
      ? {
          ...rawSummary,
          details: {
            ...rawSummary.details,
            planet: numericPlanet ?? (isAdditionPlanet ? 'add' : isSubtractionPlanet ? 'subtract' : 'divide'),
            selectedAreas: numericPlanet ? selectedNumericAreas : isAdditionPlanet
              ? selectedAreas
              : isSubtractionPlanet
                ? selectedSubtractionAreas
                : selectedDivisionAreas,
          },
        }
      : rawSummary
    const applied = applySessionResult(saveData, summary, {
      rewardBudgetPaused: rewardBudgetReached,
    })
    setSaveData(applied.save)
    navigate('/result', { state: { summary: applied.summary } })
  }, [
    numericPlanet, selectedNumericAreas,
    isAdditionPlanet,
    isSubtractionPlanet,
    navigate,
    isDivisionPlanet,
    operationPlanet,
    phase,
    results,
    rewardBudgetReached,
    saveData,
    scoreState.maxCombo,
    scoreState.score,
    selectedAreas,
    selectedSubtractionAreas,
    selectedDivisionAreas,
    setSaveData,
    sortedStages,
    durationSeconds,
  ])

  useEffect(() => {
    if (phase !== 'running') {
      return undefined
    }
    const interval = window.setInterval(() => {
      setTimeLeft((current) => Math.max(0, current - 1))
    }, 1000)
    return () => window.clearInterval(interval)
  }, [phase])

  useEffect(() => {
    if (phase === 'running' && timeLeft === 0) {
      finish()
    }
  }, [finish, phase, timeLeft])

  function toggleStage(stage: number) {
    const exists = selectedStages.includes(stage)
    const nextStages = exists
      ? selectedStages.filter((candidate) => candidate !== stage)
      : [...selectedStages, stage]
    if (nextStages.length === 0) {
      return
    }
    const sorted = nextStages.sort((left, right) => left - right)
    setSelectedStages(sorted)
    saveSpeedSettings(sorted)
  }

  function toggleAllStages() {
    const nextStages = selectedStages.length === allStages.length ? [2] : [...allStages]
    setSelectedStages(nextStages)
    saveSpeedSettings(nextStages)
  }

  function toggleArea(areaId: AdditionAreaId) {
    const exists = selectedAreas.includes(areaId)
    const nextAreas = exists
      ? selectedAreas.filter((candidate) => candidate !== areaId)
      : [...selectedAreas, areaId]
    if (nextAreas.length === 0) {
      return
    }
    setSelectedAreas(nextAreas)
  }

  function toggleAllAreas() {
    setSelectedAreas(
      selectedAreas.length === additionAreas.length
        ? [additionAreas[0].id]
        : additionAreas.map((area) => area.id),
    )
  }

  function toggleSubtractionArea(areaId: SubtractionAreaId) {
    const exists = selectedSubtractionAreas.includes(areaId)
    const nextAreas = exists
      ? selectedSubtractionAreas.filter((candidate) => candidate !== areaId)
      : [...selectedSubtractionAreas, areaId]
    if (nextAreas.length === 0) {
      return
    }
    setSelectedSubtractionAreas(nextAreas)
  }

  function toggleAllSubtractionAreas() {
    setSelectedSubtractionAreas(
      selectedSubtractionAreas.length === subtractionAreas.length
        ? [subtractionAreas[0].id]
        : subtractionAreas.map((area) => area.id),
    )
  }

  function toggleDivisionArea(areaId: DivisionAreaId) {
    const exists = selectedDivisionAreas.includes(areaId)
    const nextAreas = exists
      ? selectedDivisionAreas.filter((candidate) => candidate !== areaId)
      : [...selectedDivisionAreas, areaId]
    if (nextAreas.length === 0) {
      return
    }
    setSelectedDivisionAreas(nextAreas)
  }

  function toggleAllDivisionAreas() {
    setSelectedDivisionAreas(
      selectedDivisionAreas.length === divisionAreas.length
        ? [divisionAreas[0].id]
        : divisionAreas.map((area) => area.id),
    )
  }

  function changeDuration(nextDuration: number) {
    setDurationSeconds(nextDuration)
    saveSpeedSettings(selectedStages, nextDuration)
  }

  function startGame() {
    finishedRef.current = false
    setPhase('running')
    setTimeLeft(durationSeconds)
    setQuestion(createQuestion([]))
    setFeedback('idle')
    setResults([])
    setScoreState({
      score: 0,
      combo: 0,
      maxCombo: 0,
    })
    startedAtRef.current = Date.now()
  }

  function nextQuestion(completedResults = results) {
    setQuestion(createQuestion(completedResults))
    setFeedback('idle')
    startedAtRef.current = Date.now()
  }

  function handleAnswer(answer: AnswerValue) {
    if (phase !== 'running' || feedback !== 'idle' || timeLeft <= 0) {
      return
    }
    const correct = isCorrectAnswer(question, answer)
    const responseTimeMs = Date.now() - startedAtRef.current
    const result: AnswerResult = {
      questionId: question.id,
      prompt: question.prompt,
      expectedAnswer: question.answer,
      givenAnswer: answer,
      correct,
      difficulty: question.difficulty,
      responseTimeMs,
      answeredAt: new Date().toISOString(),
    }
    const nextResults = [...results, result]
    setResults(nextResults)
    setScoreState((current) => applyAnswerToScore(current, correct, responseTimeMs))
    setFeedback(correct ? 'correct' : 'incorrect')
    if (correct) {
      playCorrectSound(saveData.settings.soundEnabled)
    }
    window.setTimeout(() => nextQuestion(nextResults), 550)
  }

  return (
    <AppShell
      title="すぴーど"
      backTo={backTo}
      className={phase === 'running' ? 'game-shell' : 'mode-ready-shell speed-ready-shell'}
    >
      {phase === 'ready' ? (
        <ModeStartScreen
          title={`${durationSeconds}びょうちゃれんじ`}
          eyebrow="わーぷじゅんびOK"
          description={
            operationPlanet
              ? 'えりあをえらんで、じぶんのきろくにちょうせん！'
              : 'だんをえらんで、じぶんのきろくにちょうせん！'
          }
          level={saveData.player?.level ?? 1}
          backTo={backTo}
          startLabel={operationPlanet ? 'すたーと！' : undefined}
          onStart={startGame}
        >
          {operationPlanet ? (
            <div className="stage-select-panel" aria-label="えりあをえらぶ">
              <div className="start-option-header">
                <strong>えりあをえらぶ</strong>
                <button
                  className="secondary-action compact-action"
                  type="button"
                  onClick={
                    numericPlanet ? () => setSelectedNumericAreas(selectedNumericAreas.length === numericAreasForPlanet(numericPlanet).length ? [numericAreasForPlanet(numericPlanet)[0].id] : numericAreasForPlanet(numericPlanet).map((area) => area.id)) : isAdditionPlanet
                      ? toggleAllAreas
                      : isSubtractionPlanet
                        ? toggleAllSubtractionAreas
                        : toggleAllDivisionAreas
                  }
                >
                  ぜんぶ
                </button>
              </div>
              <div className="stage-chip-grid">
                {(numericPlanet ? numericAreasForPlanet(numericPlanet) : isAdditionPlanet
                  ? additionAreas
                  : isSubtractionPlanet
                    ? subtractionAreas
                    : divisionAreas
                ).map((area) => {
                  const selected = numericPlanet ? selectedNumericAreas.includes(area.id as NumericAreaId) : isAdditionPlanet
                    ? selectedAreas.includes(area.id as AdditionAreaId)
                    : isSubtractionPlanet
                      ? selectedSubtractionAreas.includes(area.id as SubtractionAreaId)
                      : selectedDivisionAreas.includes(area.id as DivisionAreaId)
                  return (
                    <button
                      className={selected ? 'stage-chip selected' : 'stage-chip'}
                      key={area.id}
                      type="button"
                      onClick={() =>
                        numericPlanet ? setSelectedNumericAreas((current) => current.includes(area.id as NumericAreaId) ? current.length > 1 ? current.filter((id) => id !== area.id) : current : [...current, area.id as NumericAreaId]) : isAdditionPlanet
                          ? toggleArea(area.id as AdditionAreaId)
                          : isSubtractionPlanet
                            ? toggleSubtractionArea(area.id as SubtractionAreaId)
                            : toggleDivisionArea(area.id as DivisionAreaId)
                      }
                      aria-pressed={selected}
                    >
                      <strong>{area.shortName}</strong>
                      <span>{area.name}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          ) : (
            <div className="stage-select-panel" aria-label="だんをえらぶ">
              <div className="start-option-header">
                <strong>だんをえらぶ</strong>
                <button
                  className="secondary-action compact-action"
                  type="button"
                  onClick={toggleAllStages}
                >
                  ぜんぶ
                </button>
              </div>
              <div className="stage-chip-grid">
                {allStages.map((stage) => {
                  const selected = selectedStages.includes(stage)
                  const stars = stageStars(stage)
                  return (
                    <button
                      className={selected ? 'stage-chip selected' : 'stage-chip'}
                      key={stage}
                      type="button"
                      onClick={() => toggleStage(stage)}
                      aria-pressed={selected}
                    >
                      <strong>{stage}のだん</strong>
                      <span>{stars}</span>
                      {stars.length >= 4 ? <small>けいけんちアップ！</small> : null}
                    </button>
                  )
                })}
              </div>
            </div>
          )}
          <div className="duration-select-panel" aria-label="ちゃれんじじかん">
            <strong>ちゃれんじ</strong>
            <div className="segmented">
              {speedDurations.map((duration) => (
                <button
                  className={durationSeconds === duration ? 'selected' : ''}
                  key={duration}
                  type="button"
                  onClick={() => changeDuration(duration)}
                >
                  {duration}びょう
                </button>
              ))}
            </div>
          </div>
        </ModeStartScreen>
      ) : (
        <>
          <section className="speed-command" aria-label="すぴーどじょうほう">
            <div className="speed-summary">
              <div>
                <span>のこり</span>
                <strong>{timeLeft}</strong>
              </div>
              <div>
                <span>スコア</span>
                <strong>{scoreState.score}</strong>
              </div>
              <div>
                <span>れんぞく</span>
                <strong>{scoreState.combo}</strong>
              </div>
            </div>

            <aside className="mission-companion speed-companion" aria-label="うちゅうぼうけん">
              <KukucchiCharacter level={saveData.player?.level ?? 1} mood="cheer" />
              <div>
                <p className="welcome">たいむわーぷちゅう</p>
                <h2>{durationSeconds}びょうちゃれんじ</h2>
                <p className="title-line">
                  {numericPlanet ? `${selectedNumericAreas.length}エリアから出題中` : isAdditionPlanet
                    ? `${selectedAreas.length}エリアからしゅつだいちゅう`
                    : isSubtractionPlanet
                      ? `${selectedSubtractionAreas.length}えりあからしゅつだいちゅう`
                      : `${sortedStages.join('・')}のだんからしゅつだいちゅう`}
                </p>
              </div>
            </aside>
          </section>

          <section className="game-panel" aria-labelledby="speed-question">
            <h2 id="speed-question" className="question-prompt">
              <MathQuestion question={question}/>
            </h2>
            <GameFeedback state={feedback} correctAnswer={question.answer} />
            <AnswerControls
              question={question}
              answerMode="choice"
              inputValue=""
              onInputChange={() => undefined}
              onAnswer={handleAnswer}
              disabled={feedback !== 'idle' || timeLeft <= 0}
            />
            <button className="secondary-action wide" type="button" onClick={finish}>
              けっかへ
            </button>
          </section>
        </>
      )}
    </AppShell>
  )
}
