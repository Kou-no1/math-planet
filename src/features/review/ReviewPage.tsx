import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { AppShell } from '../../components/common/AppShell'
import { MathQuestion } from '../../components/game/MathValue'
import { MonsterSprite } from '../../components/collection/MonsterSprite'
import { AnswerControls } from '../../components/game/AnswerControls'
import { GameFeedback } from '../../components/game/GameFeedback'
import { isCorrectAnswer } from '../../game-engine/questions/answer'
import { formatFactLabel } from '../../game-engine/questions/factIds'
import {
  getWeakFacts,
  getMonsterOvercomeProgress,
  getReviewQueue,
} from '../../game-engine/review/weakFacts'
import { buildSessionSummary } from '../../game-engine/rewards/rewards'
import { applyAnswerToScore } from '../../game-engine/scoring/score'
import { isTokuiFact, resultIncorrectStreak } from '../../game-engine/school/schoolMode2'
import { useDailyUsage } from '../../hooks/useDailyUsage'
import { useSaveData } from '../../hooks/useSaveData'
import { playCorrectSound } from '../../services/audioService'
import { applySessionResult } from '../../services/resultService'
import type { AnswerResult, AnswerValue, Question, ScoreState } from '../../types/game'
import { CalculationHint } from '../../components/game/CalculationHint'
import { createId } from '../../utils/id'
import { createPlanetReviewQuestion } from '../../game-engine/review/planetReview'
import { factsWithResults } from '../../game-engine/mastery/mastery'
import { planetOperations } from '../../game-engine/learning/planetLearning'
import type { PlanetId } from '../../data/planets'

const reviewGoal = 6

export function ReviewPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const requestedPlanet = searchParams.get('planet')
  const planet: PlanetId =
    requestedPlanet === 'add' || requestedPlanet === 'subtract' || requestedPlanet === 'divide' || requestedPlanet === 'decimal' || requestedPlanet === 'fraction'
      ? requestedPlanet
      : 'multiply'
  const operation = planetOperations[planet]
  const { saveData, setSaveData } = useSaveData()
  const { rewardBudgetReached } = useDailyUsage()
  const reviewQueue = useMemo(
    () =>
      getReviewQueue(saveData.progress.facts, new Date(), reviewGoal, {
        operation,
      }),
    [saveData.progress.facts, operation],
  )
  const monsters = useMemo(
    () => getWeakFacts(saveData.progress.facts, 6, { operation }),
    [saveData.progress.facts, operation],
  )
  const [started, setStarted] = useState(false)
  const [hintUsed, setHintUsed] = useState(false)
  const [question, setQuestion] = useState(() =>
    createPlanetReviewQuestion({
      planet,
      facts: saveData.progress.facts,
      queue: reviewQueue,
      index: 0,
      schoolMode2Enabled: saveData.settings.schoolMode2Enabled,
      recentIncorrectCount: 0,
    }),
  )
  const [feedback, setFeedback] = useState<'idle' | 'correct' | 'incorrect'>('idle')
  const [results, setResults] = useState<AnswerResult[]>([])
  const [scoreState, setScoreState] = useState<ScoreState>({
    score: 0,
    combo: 0,
    maxCombo: 0,
  })
  const startedAtRef = useRef(Date.now())
  const timeoutRef = useRef<number | null>(null)
  useEffect(
    () => () => {
      if (timeoutRef.current !== null) window.clearTimeout(timeoutRef.current)
    },
    [],
  )

  function createReviewQuestion(index: number, completedResults = results): Question {
    return createPlanetReviewQuestion({
      planet,
      facts: factsWithResults(saveData.progress.facts, completedResults),
      queue: reviewQueue,
      index,
      schoolMode2Enabled: saveData.settings.schoolMode2Enabled,
      recentIncorrectCount: resultIncorrectStreak(completedResults),
    })
  }

  function startReview() {
    setStarted(true)
    setResults([])
    setScoreState({ score: 0, combo: 0, maxCombo: 0 })
    setFeedback('idle')
    setHintUsed(false)
    setQuestion(createReviewQuestion(0))
    startedAtRef.current = Date.now()
  }

  function finish(nextResults = results, nextScoreState = scoreState) {
    const rawSummary = buildSessionSummary({
      id: createId('review'),
      mode: 'review',
      maxCombo: nextScoreState.maxCombo,
      score: nextScoreState.score,
      results: nextResults,
      finishedAt: new Date().toISOString(),
      details: { planet, answerMode: 'choice', questionCount: reviewGoal },
    })
    const applied = applySessionResult(saveData, rawSummary, {
      rewardBudgetPaused: rewardBudgetReached,
    })
    setSaveData(applied.save)
    navigate('/result', { state: { summary: applied.summary } })
  }

  function handleAnswer(answer: AnswerValue) {
    if (feedback !== 'idle') {
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
      hintUsed,
      responseTimeMs,
      answeredAt: new Date().toISOString(),
    }
    const nextResults = [...results, result]
    const nextScoreState = applyAnswerToScore(scoreState, correct, responseTimeMs)
    setResults(nextResults)
    setScoreState(nextScoreState)
    setFeedback(correct ? 'correct' : 'incorrect')
    if (correct) {
      playCorrectSound(saveData.settings.soundEnabled)
    }
    timeoutRef.current = window.setTimeout(() => {
      if (nextResults.length >= reviewGoal) {
        finish(nextResults, nextScoreState)
      } else {
        setQuestion(createReviewQuestion(nextResults.length, nextResults))
        setFeedback('idle')
        setHintUsed(false)
        startedAtRef.current = Date.now()
      }
    }, 700)
  }

  return (
    <AppShell
      title={planet === 'multiply' ? 'にがてモンスター' : 'ふくしゅう'}
      backTo={`/planet/${planet}`}
      className={started ? 'game-shell' : ''}
    >
      {!started ? (
        <section className="review-start" aria-labelledby="review-title">
          <p className="welcome">もういちど やってみよう</p>
          <h2 id="review-title">
            {planet === 'multiply' ? 'モンスターをなかまにしよう' : 'できるを ふやそう'}
          </h2>
          <p className="title-line">
            まちがえたもんだいと、ふくしゅうのひがきたもんだいを とこう。
          </p>
          <div className="monster-grid" aria-label="出現中のモンスター">
            {(monsters.length > 0 ? monsters : reviewQueue).slice(0, 6).map((fact) => {
              const showOvercomeProgress =
                monsters.includes(fact) && !saveData.progress.monsterBook.includes(fact.id)
              const overcomeProgress = showOvercomeProgress
                ? getMonsterOvercomeProgress(fact)
                : null
              return (
                <span className="monster-chip" key={fact.id}>
                  {planet === 'multiply' ? (
                    <MonsterSprite
                      left={fact.left}
                      right={fact.right}
                      className="monster-chip-sprite"
                    />
                  ) : (
                    <span className="review-operation-symbol" aria-hidden="true">
                      {planet === 'decimal' ? '0.1' : planet === 'fraction' ? '1/2' : planet === 'add' ? '+' : planet === 'subtract' ? '-' : '÷'}
                    </span>
                  )}
                  <span>
                    {formatFactLabel(fact)}
                    <small>Lv {fact.masteryLevel}</small>
                    {isTokuiFact(fact) ? <small className="tokui-mark">★ とくい</small> : null}
                    {overcomeProgress?.message ? (
                      <small className="monster-overcome-progress">
                        {overcomeProgress.message}
                      </small>
                    ) : null}
                  </span>
                </span>
              )
            })}
            {monsters.length === 0 && reviewQueue.length === 0 ? (
              <span className="monster-chip">
                まだありません
                <small>まずは おぼえるで といてみよう</small>
              </span>
            ) : null}
          </div>
          <button className="primary-action wide" type="button" onClick={startReview}>
            {planet === 'multiply' ? '復習スタート' : 'ふくしゅうすたーと'}
          </button>
        </section>
      ) : (
        <section className="game-panel" aria-labelledby="review-question">
          <div className="question-header">
            <span>
              {results.length}/{reviewGoal}
            </span>
            <span>{scoreState.combo} れんぞく</span>
            <CalculationHint
              key={question.id + results.length}
              question={question}
              onOpen={() => setHintUsed(true)}
            />
          </div>
          <h2 id="review-question" className="question-prompt">
              <MathQuestion question={question}/>
          </h2>
          <GameFeedback state={feedback} correctAnswer={question.answer} />
          <AnswerControls
            question={question}
            answerMode="choice"
            inputValue=""
            onInputChange={() => undefined}
            onAnswer={handleAnswer}
            disabled={feedback !== 'idle'}
          />
        </section>
      )}
    </AppShell>
  )
}
