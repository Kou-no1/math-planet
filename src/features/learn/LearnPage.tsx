import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { AppShell } from '../../components/common/AppShell'
import { MathQuestion } from '../../components/game/MathValue'
import { KukucchiCharacter } from '../../components/character/KukucchiCharacter'
import { AnswerControls } from '../../components/game/AnswerControls'
import { GameFeedback } from '../../components/game/GameFeedback'
import { KukuReadingRuby } from '../../components/game/KukuReadingRuby'
import { ModeStartScreen } from '../../components/game/ModeStartScreen'
import { QuestionVisual } from '../../components/game/QuestionVisual'
import { CalculationHint } from '../../components/game/CalculationHint'
import {
  additionAreas,
  divisionAreas,
  getAdditionAreaById,
  getDivisionAreaById,
  getSubtractionAreaById,
  isAdditionAreaId,
  isDivisionAreaId,
  isSubtractionAreaId,
  subtractionAreas,
  type AdditionAreaId,
  type DivisionAreaId,
  type SubtractionAreaId,
} from '../../data/planets'
import { getKukuReading } from '../../data/kukuReadings'
import { formatAnswerValue, isCorrectAnswer } from '../../game-engine/questions/answer'
import {
  generateAdditionQuestion,
  generateAdaptiveAdditionQuestion,
  generateAdaptiveDivisionQuestion,
  generateAdaptiveSubtractionQuestion,
  generateAdvancedQuestion,
  generateDivisionQuestion,
  generateMultiplicationFactQuestion,
  generateSubtractionQuestion,
} from '../../game-engine/questions/questionGenerator'
import { buildSessionSummary } from '../../game-engine/rewards/rewards'
import { applyAnswerToScore } from '../../game-engine/scoring/score'
import { resultIncorrectStreak } from '../../game-engine/school/schoolMode2'
import { useDailyUsage } from '../../hooks/useDailyUsage'
import { useSaveData } from '../../hooks/useSaveData'
import { playCorrectSound, speakJapanese } from '../../services/audioService'
import { applySessionResult } from '../../services/resultService'
import type { AnswerMode, AnswerResult, AnswerValue, Question, ScoreState } from '../../types/game'
import { createId } from '../../utils/id'
import { factsWithResults } from '../../game-engine/mastery/mastery'
import { getNumericAreaById, isNumericPlanetId, numericAreasForPlanet, type NumericAreaId } from '../../data/numericAreas'
import { generateAdaptiveNumericQuestion, generateNumericQuestion } from '../../game-engine/questions/numeric'

const stages = [1, 2, 3, 4, 5, 6, 7, 8, 9]

type LearnPhase = 'ready' | 'running'
type LearnKind = 'kuku' | 'addition' | 'subtraction' | 'division' | 'decimal' | 'fraction' | 'square' | 'pi'
type LearnOrder = 'random' | 'ascending' | 'descending'
type VisualMode = 'groups' | 'line' | 'addition' | 'reading'

const learnKindLabels: Record<LearnKind, string> = {
  decimal: '小数',
  fraction: '分数',
  kuku: '九九',
  addition: 'たしざん',
  subtraction: 'ひきざん',
  division: 'わりざん',
  square: '平方数',
  pi: '円周率',
}

const learnOrderLabels: Record<LearnOrder, string> = {
  random: 'ランダム',
  ascending: '上がり 1→9',
  descending: '下がり 9→1',
}

function shuffleNumbers(values: number[]): number[] {
  const copy = [...values]
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const target = Math.floor(Math.random() * (index + 1))
    const current = copy[index]
    copy[index] = copy[target]
    copy[target] = current
  }
  return copy
}

function createLearnOrder(order: LearnOrder): number[] {
  const rights = [1, 2, 3, 4, 5, 6, 7, 8, 9]
  if (order === 'ascending') {
    return rights
  }
  if (order === 'descending') {
    return [...rights].reverse()
  }
  return shuffleNumbers(rights)
}

function createKukuQuestion(stage: number, answerMode: AnswerMode, right: number): Question {
  return generateMultiplicationFactQuestion(stage, right, { answerMode })
}

function createLearnQuestion({
  kind,
  stage,
  answerMode,
  right,
  additionAreaId,
  subtractionAreaId,
  divisionAreaId,
  numericAreaId,
  facts,
  schoolMode2Enabled,
  recentIncorrectCount,
}: {
  kind: LearnKind
  stage: number
  answerMode: AnswerMode
  right: number
  additionAreaId: AdditionAreaId
  subtractionAreaId: SubtractionAreaId
  divisionAreaId: DivisionAreaId
  numericAreaId: NumericAreaId
  facts: Parameters<typeof generateAdaptiveAdditionQuestion>[0]
  schoolMode2Enabled: boolean
  recentIncorrectCount: number
}): Question {
  if (isNumericPlanetId(kind)) return generateAdaptiveNumericQuestion(facts, numericAreaId, { schoolMode2Enabled, recentIncorrectCount })
  if (kind === 'addition') {
    return generateAdaptiveAdditionQuestion(facts, additionAreaId, {
      schoolMode2Enabled,
      recentIncorrectCount,
    })
  }
  if (kind === 'subtraction') {
    return generateAdaptiveSubtractionQuestion(facts, subtractionAreaId, {
      schoolMode2Enabled,
      recentIncorrectCount,
    })
  }
  if (kind === 'division') {
    return generateAdaptiveDivisionQuestion(facts, divisionAreaId, {
      schoolMode2Enabled,
      recentIncorrectCount,
    })
  }
  if (kind === 'square') {
    return generateAdvancedQuestion('square')
  }
  if (kind === 'pi') {
    return generateAdvancedQuestion('pi')
  }
  return createKukuQuestion(stage, answerMode, right)
}

export function LearnPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { saveData, setSaveData } = useSaveData()
  const goalQuestions = saveData.settings.practiceQuestionCount
  const { rewardBudgetReached } = useDailyUsage()
  const fromAdditionPlanet = searchParams.get('planet') === 'add'
  const fromSubtractionPlanet = searchParams.get('planet') === 'subtract'
  const fromDivisionPlanet = searchParams.get('planet') === 'divide'
  const numericPlanet = isNumericPlanetId(searchParams.get('planet')) ? searchParams.get('planet') as 'decimal' | 'fraction' : null
  const initialLearnKind: LearnKind = numericPlanet ?? (fromAdditionPlanet
    ? 'addition'
    : fromSubtractionPlanet
      ? 'subtraction'
      : fromDivisionPlanet
        ? 'division'
        : 'kuku')
  const requestedAreaId = searchParams.get('area')
  const initialAdditionAreaId: AdditionAreaId = isAdditionAreaId(requestedAreaId)
    ? requestedAreaId
    : 'add-within-9'
  const initialSubtractionAreaId: SubtractionAreaId = isSubtractionAreaId(requestedAreaId)
    ? requestedAreaId
    : 'sub-within-9'
  const initialDivisionAreaId: DivisionAreaId = isDivisionAreaId(requestedAreaId)
    ? requestedAreaId
    : 'divide-no-remainder'
  const [phase, setPhase] = useState<LearnPhase>('ready')
  const [learnKind, setLearnKind] = useState<LearnKind>(initialLearnKind)
  const [additionAreaId, setAdditionAreaId] = useState<AdditionAreaId>(initialAdditionAreaId)
  const [subtractionAreaId, setSubtractionAreaId] =
    useState<SubtractionAreaId>(initialSubtractionAreaId)
  const [divisionAreaId, setDivisionAreaId] = useState<DivisionAreaId>(initialDivisionAreaId)
  const initialNumericArea = numericAreasForPlanet(numericPlanet ?? 'decimal').find((area) => area.id === requestedAreaId)?.id ?? numericAreasForPlanet(numericPlanet ?? 'decimal')[0].id
  const [numericAreaId, setNumericAreaId] = useState<NumericAreaId>(initialNumericArea)
  const requestedStage = Number(searchParams.get('stage'))
  const initialStage = stages.includes(requestedStage) ? requestedStage : 2
  const [stage, setStage] = useState(initialStage)
  const [answerMode, setAnswerMode] = useState<AnswerMode>(saveData.settings.practiceAnswerMode)
  const [hintUsed, setHintUsed] = useState(false)
  const [learnOrder, setLearnOrder] = useState<LearnOrder>('random')
  const [questionOrder, setQuestionOrder] = useState<number[]>(() => createLearnOrder('ascending'))
  const [questionIndex, setQuestionIndex] = useState(0)
  const [visualMode, setVisualMode] = useState<VisualMode>('groups')
  const [showReading, setShowReading] = useState(true)
  const [question, setQuestion] = useState(() =>
    numericPlanet ? generateNumericQuestion(initialNumericArea) : initialLearnKind === 'addition'
      ? generateAdditionQuestion(initialAdditionAreaId)
      : initialLearnKind === 'subtraction'
        ? generateSubtractionQuestion(initialSubtractionAreaId)
        : initialLearnKind === 'division'
          ? generateDivisionQuestion(initialDivisionAreaId)
          : createKukuQuestion(initialStage, 'choice', 1),
  )
  const [inputValue, setInputValue] = useState('')
  const [feedback, setFeedback] = useState<'idle' | 'correct' | 'incorrect'>('idle')
  const [results, setResults] = useState<AnswerResult[]>([])
  const [scoreState, setScoreState] = useState<ScoreState>({
    score: 0,
    combo: 0,
    maxCombo: 0,
  })
  const startedAtRef = useRef(Date.now())
  const autoAdvanceTimeoutRef = useRef<number | null>(null)

  useEffect(() => {
    return () => {
      if (autoAdvanceTimeoutRef.current !== null) {
        window.clearTimeout(autoAdvanceTimeoutRef.current)
      }
    }
  }, [])

  function clearAutoAdvanceTimeout() {
    if (autoAdvanceTimeoutRef.current !== null) {
      window.clearTimeout(autoAdvanceTimeoutRef.current)
      autoAdvanceTimeoutRef.current = null
    }
  }

  const selectedAdditionArea = getAdditionAreaById(additionAreaId)
  const selectedSubtractionArea = getSubtractionAreaById(subtractionAreaId)
  const selectedDivisionArea = getDivisionAreaById(divisionAreaId)
  const selectedNumericArea = getNumericAreaById(numericAreaId)
  const choiceOnly = learnKind === 'pi' || learnKind === 'division' || isNumericPlanetId(learnKind)

  function createCurrentQuestion(nextIndex: number, completedResults: AnswerResult[]): Question {
    const activeAnswerMode = choiceOnly ? 'choice' : answerMode
    return createLearnQuestion({
      kind: learnKind,
      stage,
      answerMode: activeAnswerMode,
      right: questionOrder[nextIndex % questionOrder.length] ?? 1,
      additionAreaId,
      subtractionAreaId,
      divisionAreaId,
      numericAreaId,
      facts: factsWithResults(saveData.progress.facts, completedResults),
      schoolMode2Enabled: saveData.settings.schoolMode2Enabled,
      recentIncorrectCount: resultIncorrectStreak(completedResults),
    })
  }

  function resetQuestion(nextIndex = questionIndex, completedResults = results) {
    clearAutoAdvanceTimeout()
    setQuestion(createCurrentQuestion(nextIndex, completedResults))
    setQuestionIndex(nextIndex)
    setInputValue('')
    setHintUsed(false)
    setFeedback('idle')
    startedAtRef.current = Date.now()
  }

  function startLearn() {
    const nextOrder = createLearnOrder(learnOrder)
    clearAutoAdvanceTimeout()
    setQuestionOrder(nextOrder)
    setQuestionIndex(0)
    setQuestion(
      createLearnQuestion({
        kind: learnKind,
        stage,
        answerMode: choiceOnly ? 'choice' : answerMode,
        right: nextOrder[0] ?? 1,
        additionAreaId,
        subtractionAreaId,
        divisionAreaId,
        numericAreaId,
        facts: saveData.progress.facts,
        schoolMode2Enabled: saveData.settings.schoolMode2Enabled,
        recentIncorrectCount: 0,
      }),
    )
    setInputValue('')
    setHintUsed(false)
    setFeedback('idle')
    setResults([])
    setScoreState({ score: 0, combo: 0, maxCombo: 0 })
    setVisualMode('groups')
    startedAtRef.current = Date.now()
    setPhase('running')
  }

  function changeLearnKind(nextKind: LearnKind) {
    setLearnKind(nextKind)
    if (nextKind !== 'kuku') {
      setAnswerMode('choice')
    }
  }

  function advanceQuestion(completedResults = results) {
    const nextIndex = questionIndex + 1
    if (nextIndex >= goalQuestions) {
      return
    }
    resetQuestion(nextIndex, completedResults)
  }

  function handleAnswer(answer: AnswerValue) {
    if (phase !== 'running' || feedback !== 'idle') {
      return
    }
    const correct = isCorrectAnswer(question, answer)
    const responseTimeMs = Date.now() - startedAtRef.current
    const answeredAt = new Date().toISOString()
    const result: AnswerResult = {
      questionId: question.id,
      prompt: question.prompt,
      expectedAnswer: question.answer,
      givenAnswer: answer,
      correct,
      difficulty: question.difficulty,
      hintUsed,
      responseTimeMs,
      answeredAt,
    }
    const nextResults = [...results, result]
    setResults(nextResults)
    setScoreState((current) => applyAnswerToScore(current, correct, responseTimeMs))
    setFeedback(correct ? 'correct' : 'incorrect')
    if (correct) {
      playCorrectSound(saveData.settings.soundEnabled)
      if (learnKind === 'kuku') {
        const left = Number(question.metadata?.left ?? 2)
        const right = Number(question.metadata?.right ?? 1)
        speakJapanese(getKukuReading(left, right), saveData.settings.speechEnabled)
      }
      if (nextResults.length < goalQuestions) {
        clearAutoAdvanceTimeout()
        autoAdvanceTimeoutRef.current = window.setTimeout(() => {
          advanceQuestion(nextResults)
        }, 700)
      }
    }
  }

  function handleSpeak() {
    if (learnKind !== 'kuku') {
      speakJapanese(
        `${question.prompt}、こたえは ${formatAnswerValue(question.answer)}`,
        saveData.settings.speechEnabled,
      )
      return
    }
    const left = Number(question.metadata?.left ?? 2)
    const right = Number(question.metadata?.right ?? 1)
    speakJapanese(getKukuReading(left, right), saveData.settings.speechEnabled)
    setVisualMode('reading')
  }

  const left = Number(question.metadata?.left ?? 2)
  const right = Number(question.metadata?.right ?? 1)
  const revealReading = learnKind === 'kuku' && (feedback === 'correct' || visualMode === 'reading')
  const activeAnswerMode = choiceOnly ? 'choice' : answerMode
  const backToPlanet =
    isNumericPlanetId(learnKind) ? `/planet/${learnKind}` : learnKind === 'addition'
      ? '/planet/add'
      : learnKind === 'subtraction'
        ? '/planet/subtract'
        : learnKind === 'division'
          ? '/planet/divide'
          : '/planet/multiply'

  function finish() {
    const rawSummary = buildSessionSummary({
      id: createId('learn'),
      mode: 'learn',
      maxCombo: scoreState.maxCombo,
      score: scoreState.score,
      results,
      details: {
        answerMode: activeAnswerMode,
        questionCount: goalQuestions,
        stage: learnKind === 'kuku' ? stage : null,
        learnKind,
        planet:
          isNumericPlanetId(learnKind) ? learnKind : learnKind === 'addition'
            ? 'add'
            : learnKind === 'subtraction'
              ? 'subtract'
              : learnKind === 'division'
                ? 'divide'
                : 'multiply',
        areaId:
          isNumericPlanetId(learnKind) ? numericAreaId : learnKind === 'addition'
            ? additionAreaId
            : learnKind === 'subtraction'
              ? subtractionAreaId
              : learnKind === 'division'
                ? divisionAreaId
                : null,
        areaName:
          isNumericPlanetId(learnKind) ? selectedNumericArea.name : learnKind === 'addition'
            ? selectedAdditionArea.name
            : learnKind === 'subtraction'
              ? selectedSubtractionArea.name
              : learnKind === 'division'
                ? selectedDivisionArea.name
                : null,
      },
      finishedAt: new Date().toISOString(),
    })
    const applied = applySessionResult(saveData, rawSummary, {
      rewardBudgetPaused: rewardBudgetReached,
    })
    setSaveData(applied.save)
    navigate('/result', { state: { summary: applied.summary } })
  }

  return (
    <AppShell
      title="おぼえる"
      backTo={backToPlanet}
      className={
        phase === 'running' ? 'game-shell learn-game-shell' : 'mode-ready-shell learn-ready-shell'
      }
    >
      {phase === 'ready' ? (
        <ModeStartScreen
          title={
            <>
              <span>
                {learnKind === 'kuku'
                  ? `${stage}のだん`
                  : learnKind === 'addition'
                    ? selectedAdditionArea.name
                    : learnKind === 'subtraction'
                      ? selectedSubtractionArea.name
                      : learnKindLabels[learnKind]}
              </span>{' '}
              <span className="learn-practice-label">れんしゅう</span>
            </>
          }
          eyebrow={
            learnKind === 'addition' || learnKind === 'subtraction'
              ? `${goalQuestions}もんぜんぶちゃれんじ`
              : `${goalQuestions}もんぜんぶチャレンジ`
          }
          description="けいさんとこたえかたをえらんで、すたーとしよう！"
          level={saveData.player?.level ?? 1}
          backTo={backToPlanet}
          startLabel={
            learnKind === 'addition' || learnKind === 'subtraction' ? 'すたーと！' : undefined
          }
          onStart={startLearn}
        >
          {!fromAdditionPlanet && !fromSubtractionPlanet && !fromDivisionPlanet && !numericPlanet ? (
            <div className="duration-select-panel learn-kind-panel" aria-label="けいさんをえらぶ">
              <strong>けいさん</strong>
              <div className="segmented learn-start-segmented learn-kind-segmented">
                {(['kuku', 'addition', 'division', 'square', 'pi'] as const).map((kind) => (
                  <button
                    className={learnKind === kind ? 'selected' : ''}
                    key={kind}
                    type="button"
                    onClick={() => changeLearnKind(kind)}
                    aria-pressed={learnKind === kind}
                  >
                    {learnKindLabels[kind]}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {isNumericPlanetId(learnKind) ? (
            <div className="stage-select-panel addition-area-panel" aria-label="練習するエリア">
              <div className="start-option-header"><strong>練習するエリア</strong><span>{selectedNumericArea.shortName}</span></div>
              <div className="stage-chip-grid addition-area-grid">
                {numericAreasForPlanet(learnKind).map((area) => (
                  <button className={`stage-chip addition-area-chip ${numericAreaId === area.id ? 'selected' : ''}`} key={area.id} type="button" onClick={() => setNumericAreaId(area.id)} aria-pressed={numericAreaId === area.id}>
                    <strong>{area.name}</strong><span>{area.description}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : null}
          {learnKind === 'division' ? (
            <div className="stage-select-panel addition-area-panel" aria-label="練習するエリア">
              <div className="start-option-header">
                <strong>練習するエリア</strong>
                <span>{selectedDivisionArea.shortName}</span>
              </div>
              <div className="stage-chip-grid addition-area-grid">
                {divisionAreas.map((area) => (
                  <button
                    className={
                      divisionAreaId === area.id
                        ? 'stage-chip selected addition-area-chip'
                        : 'stage-chip addition-area-chip'
                    }
                    key={area.id}
                    type="button"
                    onClick={() => setDivisionAreaId(area.id)}
                    aria-pressed={divisionAreaId === area.id}
                  >
                    <strong>{area.name}</strong>
                    <span>{area.description}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {learnKind === 'kuku' ? (
            <div className="stage-select-panel" aria-label="れんしゅうするだん">
              <div className="start-option-header">
                <strong>れんしゅうするだん</strong>
                <span>{stage}のだん</span>
              </div>
              <div className="stage-chip-grid">
                {stages.map((value) => (
                  <button
                    className={stage === value ? 'stage-chip selected' : 'stage-chip'}
                    key={value}
                    type="button"
                    onClick={() => setStage(value)}
                    aria-pressed={stage === value}
                  >
                    <strong>{value}のだん</strong>
                    <span>{goalQuestions}もん</span>
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {learnKind === 'addition' ? (
            <div
              className="stage-select-panel addition-area-panel"
              aria-label="れんしゅうするえりあ"
            >
              <div className="start-option-header">
                <strong>れんしゅうするえりあ</strong>
                <span>{selectedAdditionArea.shortName}</span>
              </div>
              <div className="stage-chip-grid addition-area-grid">
                {additionAreas.map((area) => (
                  <button
                    className={
                      additionAreaId === area.id
                        ? 'stage-chip selected addition-area-chip'
                        : 'stage-chip addition-area-chip'
                    }
                    key={area.id}
                    type="button"
                    onClick={() => setAdditionAreaId(area.id)}
                    aria-pressed={additionAreaId === area.id}
                  >
                    <strong>{area.name}</strong>
                    <span>{area.description}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {learnKind === 'subtraction' ? (
            <div
              className="stage-select-panel addition-area-panel"
              aria-label="れんしゅうするえりあ"
            >
              <div className="start-option-header">
                <strong>れんしゅうするえりあ</strong>
                <span>{selectedSubtractionArea.shortName}</span>
              </div>
              <div className="stage-chip-grid addition-area-grid">
                {subtractionAreas.map((area) => (
                  <button
                    className={
                      subtractionAreaId === area.id
                        ? 'stage-chip selected addition-area-chip'
                        : 'stage-chip addition-area-chip'
                    }
                    key={area.id}
                    type="button"
                    onClick={() => setSubtractionAreaId(area.id)}
                    aria-pressed={subtractionAreaId === area.id}
                  >
                    <strong>{area.name}</strong>
                    <span>{area.description}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {learnKind === 'kuku' ? (
            <div className="duration-select-panel learn-order-panel" aria-label="じゅんばんをえらぶ">
              <strong>じゅんばん</strong>
              <div className="segmented learn-start-segmented">
                {(['random', 'ascending', 'descending'] as const).map((order) => (
                  <button
                    className={learnOrder === order ? 'selected' : ''}
                    key={order}
                    type="button"
                    onClick={() => setLearnOrder(order)}
                    aria-pressed={learnOrder === order}
                  >
                    {learnOrderLabels[order]}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          <div
            className="duration-select-panel learn-answer-mode-panel"
            aria-label="こたえかたをえらぶ"
          >
            <strong>こたえかた</strong>
            <div className="segmented learn-start-segmented">
              <button
                className={activeAnswerMode === 'choice' ? 'selected' : ''}
                type="button"
                onClick={() => setAnswerMode('choice')}
                aria-pressed={activeAnswerMode === 'choice'}
              >
                4たく
              </button>
              <button
                className={activeAnswerMode === 'input' ? 'selected' : ''}
                type="button"
                onClick={() => setAnswerMode('input')}
                aria-pressed={activeAnswerMode === 'input'}
                disabled={choiceOnly}
                aria-disabled={choiceOnly}
              >
                {learnKind === 'addition' || learnKind === 'subtraction' || learnKind === 'division'
                  ? 'にゅうりょく'
                  : '入力'}
              </button>
            </div>
          </div>
        </ModeStartScreen>
      ) : (
        <>
          <section className="learn-console learn-run-console" aria-label="れんしゅうせってい">
            <div className="learn-run-status">
              <span>
                {learnKind === 'kuku'
                  ? `${stage}のだん`
                  : learnKind === 'addition'
                    ? 'たしざんのほし'
                    : learnKind === 'subtraction'
                      ? 'ひきざんのほし'
                      : learnKindLabels[learnKind]}
              </span>
              <strong>
                {learnKind === 'kuku'
                  ? learnOrderLabels[learnOrder]
                  : learnKind === 'addition'
                    ? selectedAdditionArea.name
                    : learnKind === 'subtraction'
                      ? selectedSubtractionArea.name
                      : `${goalQuestions}もんチャレンジ`}
              </strong>
              <small>{goalQuestions}もんぜんぶ</small>
            </div>

            <aside className="character-window" aria-label="うちゅうぼうけん">
              <KukucchiCharacter level={saveData.player?.level ?? 1} mood="cheer" />
              <div className="character-window-copy">
                <p className="welcome">くくっちごう、しゅっぱつ！</p>
                <h2>
                  {learnKind === 'kuku'
                    ? `${stage}のだんステーション`
                    : learnKind === 'subtraction'
                      ? 'ひきざんすてーしょん'
                      : `${learnKindLabels[learnKind]}ステーション`}
                </h2>
              </div>
            </aside>
          </section>

          <section
            className={`game-panel${learnKind === 'kuku' ? '' : ' arithmetic-practice-panel'}`}
            aria-labelledby="question-title"
          >
            <div className="question-header">
              <span>
                {results.length}/{goalQuestions}
              </span>
              <CalculationHint
                key={question.id + questionIndex}
                question={question}
                onOpen={() => setHintUsed(true)}
              />
              <button type="button" onClick={handleSpeak}>
                きく
              </button>
            </div>
            <h2 id="question-title" className="question-prompt">
              {learnKind === 'kuku' ? (
                <KukuReadingRuby
                  left={left}
                  right={right}
                  revealAnswer={revealReading}
                  visible={showReading}
                />
              ) : null}
              <MathQuestion question={question}/>
            </h2>
            {learnKind === 'kuku' ? (
              <>
                <QuestionVisual
                  question={question}
                  mode={visualMode}
                  hideAnswer={feedback === 'idle'}
                  revealReading={revealReading}
                />
                <div className="visual-switches" aria-label="表示を変える">
                  {(['groups', 'line', 'addition', 'reading'] as const).map((mode) => (
                    <button
                      className={visualMode === mode ? 'selected' : ''}
                      key={mode}
                      type="button"
                      onClick={() => setVisualMode(mode)}
                    >
                      {mode === 'groups'
                        ? 'まとまり'
                        : mode === 'line'
                          ? '数直線'
                          : mode === 'addition'
                            ? 'たし算'
                            : '読み'}
                    </button>
                  ))}
                  <label className="mini-toggle">
                    <input
                      type="checkbox"
                      checked={showReading}
                      onChange={(event) => setShowReading(event.target.checked)}
                    />
                    九九の読み方
                  </label>
                </div>
              </>
            ) : feedback !== 'idle' && question.explanation ? (
              <p className="quiet-text">{question.explanation}</p>
            ) : null}
            <GameFeedback state={feedback} correctAnswer={question.answer} />
            <AnswerControls
              question={question}
              answerMode={activeAnswerMode}
              inputValue={inputValue}
              onInputChange={setInputValue}
              onAnswer={handleAnswer}
              disabled={feedback !== 'idle'}
            />
            <div className="game-actions">
              {feedback === 'incorrect' && results.length < goalQuestions ? (
                <button
                  className="primary-action"
                  type="button"
                  onClick={() => advanceQuestion(results)}
                >
                  つぎへ
                </button>
              ) : null}
              {results.length >= goalQuestions ? (
                <button className="primary-action" type="button" onClick={finish}>
                  けっかへ
                </button>
              ) : null}
            </div>
          </section>
        </>
      )}
    </AppShell>
  )
}
