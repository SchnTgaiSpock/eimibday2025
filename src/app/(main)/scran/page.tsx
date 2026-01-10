"use client"

import { scrans, scranGames, Score, getFeedback, getPrice, getPercent, getCountry, getName, getSubmittedBy, getCopyText, ScranGame, preloadImages } from "@/data/scran";
import { useEffect, useState } from "react";
import { ScranDisplay } from "./scranDisplay";
import { sleep } from "@/util/sleep";
import { shuffle } from "@/util/shuffle";
import { getHistoryFromStorage, ScranHistory } from "@/util/scranHistory";

export default function Messages() {
  // Get current game
  const [currentGame, setCurrentGame] = useState<number>()
  const [gameHistory, setGameHistory] = useState<ScranHistory>()
  useEffect(() => {
    const lastCompleted = localStorage.getItem("last-completed")
    if (lastCompleted && +lastCompleted >= 0 && +lastCompleted < scranGames.length - 1) {
      setCurrentGame(+lastCompleted + 1)
    } else {
      setCurrentGame(0)
    }
    setGameHistory(getHistoryFromStorage())
  }, [])
  const [scranMatches, setScranMatches] = useState<ScranGame>()
  const [isRandom, setIsRandom] = useState(false)
  // Game state
  const [stage, setStage] = useState<'menu' | 'round-select' | 'game' | 'results'>('menu')
  const [scores, setScores] = useState<Score[]>(Array(10).fill(null))
  const [round, setRound] = useState(0)
  const [animationStage, setAnimationStage] = useState<'percent' | 'hidden' | 'shown'>('shown')
  const [feedback, setFeedback] = useState("")
  const [selectedReview, setSelectedReview] = useState<number>()

  const renderMenu = () => {
    return <div className="scran-menu">
      <h1 className="scran-title">SCRHAMDLE</h1>
      <p className="scran-subtitle">THE THRILLING <s>DAILY</s> GAME OF FOOD COMPARISON</p>
      <hr />
      <div className="scran-play-buttons-wrapper">
        <div className="scran-play-buttons">
          <button className="scran-menu-play top blue" onClick={() => {
            if (currentGame === undefined) return
            setStage('game')
            setScranMatches(scranGames[currentGame])
            preloadImages(scranGames[currentGame])
            setScores(Array(10).fill(null))
            setRound(0)
            setIsRandom(false)
          }}>
            <p className="scran-menu-play-title">Play</p>
            <p>Round {(currentGame ?? 0) + 1}/{scranGames.length}</p>
          </button>
          <button className="scran-menu-play bottom grey" onClick={() => {
            if (currentGame === undefined) return
            const randomMatches: ScranGame = new Array(10)
            // Get 20 random scrans, excluding 0
            const randomScrans = shuffle(new Array(scrans.length-1).fill(0).map((_, i) => i+1)).slice(0, Math.min(20, scrans.length))
            // Pair them up
            for (let i = 0; i < 10; i++) {
              randomMatches[i] = [randomScrans[i % randomScrans.length], randomScrans[(i + 10) % randomScrans.length]]
            }
            setStage('game')
            setScranMatches(randomMatches)
            preloadImages(randomMatches)
            setScores(Array(10).fill(null))
            setRound(0)
            setIsRandom(true)
          }}>
            <p className="scran-menu-play-title">Practice</p>
            <p>Unlimited, random</p>
          </button>
        </div>
        {gameHistory?.[scranGames.length - 1] && <div className="scran-play-buttons">
          <button className="scran-menu-play full black" onClick={() => {
            if (currentGame === undefined) return
            setStage('round-select')
          }}>
            <p className="scran-menu-play-title">Select Round</p>
            <p>Replay a previous round</p>
          </button>
        </div>}
      </div>
    </div>
  }

  const renderRoundSelect = () => {
    if (!gameHistory) return
    return <div className="scran-menu">
      <div className="scran-menu-replay-buttons">
      {Object.entries(gameHistory).map(([game, scores]) => <>
        <button className="scran-menu-replay-button" onClick={() => {
          if (currentGame === undefined) return
          setStage('game')
          setCurrentGame(+game)
          setScranMatches(scranGames[+game])
          preloadImages(scranGames[+game])
          setScores(Array(10).fill(null))
          setRound(0)
          setIsRandom(false)
        }}>
          <p className="scran-menu-replay-num">{+game+1}</p>
          <p className="scran-menu-replay-score">{scores?.reduce((acc, curr) => (curr ? 1 : 0) + acc, 0)}/10</p>
        </button>
      </>)}
      </div>
      <hr />
      <div className="scran-results-footer">
        <button className="scran-menu-box gray left" onClick={() => {
          setStage("menu")
        }}>Back</button>
      </div>
    </div>
  }

  const renderGame = () => {
    if (!scranMatches) return;
    const scranLeft = scrans[scranMatches[round][0]];
    const scranRight = scrans[scranMatches[round][1]];

    const onClick = (outcome: Exclude<Score, null>) => {
      if (animationStage !== 'shown' || currentGame === undefined) return;
      setScores(scores => {
        scores[round] = outcome;
        return scores.slice();
      });
      setAnimationStage('percent')
      sleep(2000).then(() => {
        setAnimationStage('hidden')
        sleep(1000).then(() => {
          if (round >= scores.length - 1) {
            setRound(0);
            setStage('results');
            if (!isRandom) {
              setCurrentGame((currentGame + 1) % scranGames.length)
              localStorage.setItem("last-completed", currentGame.toString())
              const newHistory: ScranHistory = {
                [currentGame.toString()]: scores,
                ...gameHistory, // Always keep the first scores for each round
              }
              localStorage.setItem("round-history", JSON.stringify(newHistory))
              setGameHistory(newHistory)
            }
            setFeedback(getFeedback(scores.reduce((acc, curr) => (curr ? 1 : 0) + acc, 0)))
          } else {
            setRound(r => ++r);
          }
          setAnimationStage('shown');
        })
      })
    }

    return <>
      <div className="scran-top">
        <div className="scran-scores">
          {Array(10).fill(null).map((_, i) => {
            return <div key={i} className={scores[i] === null ? 'in-progress' : scores[i] ? 'right' : 'wrong'} />
          })}
        </div>
      </div>
      <div className="scran-boxes" style={{
        opacity: animationStage === "hidden" ? 0 : 1
      }}>
        <ScranDisplay
          scran={scranLeft}
          side="left"
          outcome={(getPercent(scranLeft) > getPercent(scranRight)) || (getPercent(scranLeft) === getPercent(scranRight) && 'l')}
          showPercent={animationStage !== 'shown'}
          onClick={onClick}
        />
        <ScranDisplay
          scran={scranRight}
          side="right"
          outcome={(getPercent(scranLeft) < getPercent(scranRight)) || (getPercent(scranLeft) === getPercent(scranRight) && 'r')}
          showPercent={animationStage !== 'shown'}
          onClick={onClick}
        />
      </div>
    </>
  }

  const renderResults = () => {
    if (!scranMatches) return;
    const score = scores.reduce((acc, curr) => (curr ? 1 : 0) + acc, 0)
    const left = selectedReview === undefined ? undefined : scrans[scranMatches[selectedReview][0]];
    const right = selectedReview === undefined ? undefined : scrans[scranMatches[selectedReview][1]];
    return <div className="scran-menu">
      <p className="scran-results-header">Scrhamdle</p>
      <hr />
      <div className="scran-results">
        <button
          className="scran-clipboard scran-menu-box gray"
          onClick={() => {
            navigator.clipboard.writeText(getCopyText(scores, isRandom ? "Practice" : `Round ${+(localStorage.getItem("last-completed") ?? 0) + 1}/${scranGames.length}`))
            setFeedback("Copied result to clipboard")
          }}
        >
          <i className="bi bi-clipboard-fill"></i>
        </button>
        {scores.map((score, i) => <button
          key={i}
          className={`scran-menu-box ${score ? "green" : "red"}`}
          style={{ fontWeight: selectedReview === i ? "bold" : "normal" }}
          onClick={() => setSelectedReview(i)}
        >
          {i + 1}
        </button>
        )}
      </div>
      <p className={`scran-results-score ${score >= 7 ? 'green' : 'red'}`}>{score}/{scores.length}</p>
      <p className={`scran-results-feedback ${score >= 7 ? 'green' : 'red'}`}>{feedback}</p>
      <hr />
      {selectedReview !== undefined && !!left && !!right && <>
        <div className="scran-review">
          <div className="scran-review-side">
            <img src={left?.imageUrl} />
            <div className="scran-review-info">
              <p className="scran-review-name">{getName(left)}</p>
              <p className="scran-review-country-price">{getCountry(left)} • {getPrice(left)}</p>
              <p className="scran-review-country-price">Submitted by {getSubmittedBy(left)}</p>
              <p className={`scran-review-percent ${getPercent(left) >= getPercent(right) ? "green" : "red"}`}>{getPercent(left)}%</p>
              {(scores[selectedReview] === 'l' || getPercent(left) > getPercent(right) === !!scores[selectedReview]) && <p className="scran-review-subtitle">YOU PICKED THIS</p>}
            </div>
          </div>
          <div className="scran-review-side">
            <img src={right?.imageUrl} />
            <div className="scran-review-info">
              <p className="scran-review-name">{getName(right)}</p>
              <p className="scran-review-country-price">{getCountry(right)} • {getPrice(right)}</p>
              <p className="scran-review-country-price">Submitted by {getSubmittedBy(right)}</p>
              <p className={`scran-review-percent ${getPercent(left) <= getPercent(right) ? "green" : "red"}`}>{getPercent(right)}%</p>
              {(scores[selectedReview] === 'r' || getPercent(left) < getPercent(right) === !!scores[selectedReview]) && <p className="scran-review-subtitle">YOU PICKED THIS</p>}
            </div>
          </div>
        </div>
        <hr />
      </>}
      <div className="scran-results-footer">
        <button className="scran-menu-box blue" onClick={() => {
          setStage("menu")
        }}>Done</button>
      </div>
    </div>
  }

  return <div className="scran" style={{
    backgroundImage: 'url(/bg.png)',
    backgroundPosition: '50% 50%',
    backgroundSize: 'cover',
  }}>
    <div className="scran-blur">
      {stage === 'menu' && renderMenu()}
      {stage === 'round-select' && renderRoundSelect()}
      {stage === 'game' && renderGame()}
      {stage === 'results' && renderResults()}
    </div>
  </div>
}