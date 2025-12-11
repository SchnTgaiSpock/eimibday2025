"use client"

import { scrans, scranMatches, Score, getFeedback, getPrice, getCountry, getName, getSubmittedBy } from "@/data/scran";
import { useState } from "react";
import { ScranDisplay } from "./scranDisplay";
import { sleep } from "@/util/sleep";

export default function Messages() {
  // Game state
  const [stage, setStage] = useState<'menu' | 'game' | 'results'>('menu')
  const [scores, setScores] = useState<Score[]>(Array(10).fill(null))
  const [round, setRound] = useState(0)
  const [animationStage, setAnimationStage] = useState<'percent' | 'hidden' | 'shown'>('shown')
  const [feedback, setFeedback] = useState("")
  const [selectedReview, setSelectedReview] = useState<number>()

  const renderMenu = () => {
    return <div className="scran-menu">
      <h1 className="scran-title">SCRHAMDLE<sup>TM</sup></h1>
      <p className="scran-subtitle">THE THRILLING <s>DAILY</s> GAME OF FOOD COMPARISON</p>
      <hr />
      <button className="scran-menu-play" onClick={() => {
        setStage('game')
        setScores(Array(10).fill(null))
        setRound(0)
      }}>
        <p className="scran-menu-play-title">Play</p>
        <p>Unlimited, random</p>
      </button>
    </div>
  }

  const renderGame = () => {
    const scranLeft = scrans[scranMatches[round][0]];
    const scranRight = scrans[scranMatches[round][1]];

    const onClick = (isWinner: boolean) => {
      if (animationStage !== 'shown') return;
      setScores(scores => {
        scores[round] = isWinner;
        return scores.slice();
      });
      setAnimationStage('percent')
      sleep(2000).then(() => {
        setAnimationStage('hidden')
        sleep(1000).then(() => {
          if (round >= scores.length - 1) {
            setRound(0);
            setStage('results');
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
          isWinner={scranLeft.percent > scranRight.percent}
          showPercent={animationStage !== 'shown'}
          onClick={onClick}
        />
        <ScranDisplay
          scran={scranRight}
          side="right"
          isWinner={scranRight.percent > scranLeft.percent}
          showPercent={animationStage !== 'shown'}
          onClick={onClick}
        />
      </div>
    </>
  }

  const renderResults = () => {
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
              <p className={`scran-review-percent ${left.percent > right.percent ? "green" : "red"}`}>{left.percent}%</p>
              {left.percent > right.percent === !!scores[selectedReview] && <p className="scran-review-subtitle">YOU PICKED THIS</p>}
            </div>
          </div>
          <div className="scran-review-side">
            <img src={right?.imageUrl} />
            <div className="scran-review-info">
              <p className="scran-review-name">{getName(right)}</p>
              <p className="scran-review-country-price">{getCountry(right)} • {getPrice(right)}</p>
              <p className="scran-review-country-price">Submitted by {getSubmittedBy(right)}</p>
              <p className={`scran-review-percent ${right.percent > left.percent ? "green" : "red"}`}>{right.percent}%</p>
              {right.percent > left.percent === !!scores[selectedReview] && <p className="scran-review-subtitle">YOU PICKED THIS</p>}
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
      {stage === 'game' && renderGame()}
      {stage === 'results' && renderResults()}
    </div>
  </div>
}