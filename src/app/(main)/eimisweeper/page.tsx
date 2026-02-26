"use client"

import { Pos, Cell, BoardGeometry, BoardInfo, EimisweeperGame, puzzles, generatePuzzle, serializeBoard, recreateBoard, sprites, range } from "@/data/eimisweeper";
import { EditorButtons } from "./editor"
import { useEffect, useState, useCallback } from "react";

/// Global game settings
/// Flagging and Chording can be disabled
type EimisweeperSettings = {
  allowFlagging: boolean,
  allowChording: boolean,
};

let PresetBeginner: BoardInfo = {
  noGuessing: false,
  geometry: 'square',
  x: 9,
  y: 9,
  totalMines: 10,
  showTotalMines: true,
  totalQs: 0,
};
let PresetIntermediate: BoardInfo = {
  noGuessing: false,
  geometry: 'square',
  x: 16,
  y: 16,
  totalMines: 40,
  showTotalMines: true,
  totalQs: 0,
};
let PresetExpert: BoardInfo = {
  noGuessing: false,
  geometry: 'square',
  x: 30,
  y: 16,
  totalMines: 99,
  showTotalMines: true,
  totalQs: 0,
};


interface EimisweeperCellProps {
    pos: Pos
    key: number
    content: string
    hidden: boolean
    flagged: boolean
    adjHover: boolean
    setHover: (number)=>void
}

/// JSX Cell element
function EimisweeperCell({
    pos,
    idx,
    content,
    hidden,
    flagged,
    adjHover,
    setHover
}: EimsweeperCellProps) {
    return <div
      className={"cell"
	      + (hidden  ?" hidden"  :"")
	      + (flagged ?" flagged" :"")
	      + (adjHover?" adjhover":"")}
      style={{"--x": pos.x, "--y": pos.y}}
      onPointerEnter={()=>setHover(idx)}
      onPointerLeave={()=>setHover(null)}
    >
    <div>{content in sprites? sprites[content] && <img src={sprites[content]}/> : content==="*"?"💣":content}</div>
    </div>
}

// get cell index from propagated event.
// Used for all events interacting with specific grid cells
function cellIndexFromEvent(e) {
  // currentTarget is the grid
  if (e.target !== e.currentTarget) {
    let idx = undefined;
    let el = e.target;
    while(el.parentElement !== e.currentTarget){
      el = el.parentElement;
    }
    return [...el.parentElement.children].indexOf(el);
  }
}

/// Floodfill: given cells being revealed, add all adjacent to zeros
/// used by reveal
function floodfill(cells: Cell[], queue: number[]): number[] {
  let cur = 0;
  // floodfill open cells
  while (cur < queue.length) {
    let p = queue[cur];
    if (cells[p].isOpen) {
      cells[p].adj.forEach((np) => {
        if(!queue.includes(np) && !cells[np].flagged && cells[np].hidden) queue.push(np);
      });
    }
    cur++;
  }
  return queue;
}

/// Update cell visibility (and possibly win/loss state) by revealing cells in `idxs`
function reveal(cells: Cell[], setGameState: ((state: string)=>void), idxs: number[]): Cell[] {
  let revealed = floodfill(cells, idxs);
  let explode = false;
  let newCells = cells.map((cell, i) => {
    if (revealed.includes(i)) {
      if (cell.isBomb) explode = true;
      return {...cell, hidden: false};
    } else return cell;
  });
  if (explode) {
    setGameState('lose');
  } else if (newCells.every(cell=>(cell.isBomb===cell.hidden))) {
    setGameState('win');
  }
  return newCells;
}

/// Settings to generate a random game
/// TODO
///  - compute whether puzzle needs guessing (when it is fully generated)
function GeneratorSettings({disabled}) {
  const [geom, setGeom] = useState<'square' | 'hex' | 'square (no corners)'>('square');
  const [x, setX] = useState(10);
  const [y, setY] = useState(10);
  const [mines, setMines] = useState(0);
  const [unkns, setUnkns] = useState(0); // commonly displayed as '?' or 'EimiChu'
  const [noGuessing, setGuessing] = useState(false);
  const info: BoardInfo = {
    geometry: geom,
    x: x,
    y: y,
    totalMines: mines,
    showTotalMines: true,
    totalQs: unkns,
    showTotalQs: false,
    noGuessing: noGuessing,
  };
  return <div className="boardgenSettings">
    <label>Shape: <select name="geom" disabled="true" value={geom} onChange={e=>setGeom(e.target.value)}>
      <option value="square">square</option>
      <option value="hex">hex</option>
    </select></label>
    <label>Width: <input name="genX" type="number" value={x} onChange={e=>setX(e.target.value)} min="1" max="40"/></label>
    <label>Height: <input name="genY" type="number" value={y} onChange={e=>setY(e.target.value)} min="1" max="40"/></label>
    <label>Mines: <input name="genMines" type="number" value={mines} onChange={e=>setMines(e.target.value)} min="0" max={x*y - unkns} /></label>
    <label>Unknowns (?): <input name="genUnkns" type="number" value={unkns} onChange={e=>setUnkns(e.target.value)} min="0" max={x*y - mines} /></label>
    <label>No Guessing <input name="noGuessing" disabled="true" type="checkbox" value={noGuessing} onChange={e=>setGuessing(e.target.value)} /></label>
  </div>
}

function RenderGame({ game, setGame }: EimisweeperGame) {
  const [board, setBoard] = useState<LiveBoard>(game.board);
  const [generated, setGenerated] = useState<boolean>(game.generated);
  const [hoverIdx, setHover] = useState<number | null>(null);
  const [editorMode, setEditorMode] = useState<boolean>(false);
  "TODO: pre-start only for random games";
  //const setHoverLog = useCallback((x)=>{console.log("setting hover to",x); return setHover(x);}, [setHover]);
  //const setBoardWithUndo = updater => board => {addUndo(board); return updater(board)}
  //TODO useContext/useEffect for undo stack? research
  let globalsettings = {"chording": true};
  // play info
  const [gameStage, setGameStage] = useState<'generating' | 'playing' | 'win' | 'lose'>('playing');
  "Score: when winning, show time to beat; when losing show time + %cleared";
  let [mistakes, setMistakes] = useState(0);
  let [startTime, setStartTime] = useState(null);
  let [finishTime, setFinishTime] = useState(null);
  // when gameStage is updated (to playing):
  //  setStartTime(now)
  //  start timer (interval to update currentTime / displayed time)
  //  while playing: display as currentTime() - startTime (round to seconds)
  // when gameStage is updated (to win/loss):
  //  setFinishTime(now)
  //  stop timer
  //  display game end time as finishTime - startTime (rounded)
  // when gameStage is updated (to playing/Continue):
  //  setFinishTime(null)
  //  restart timer (with same startTime)
  // when gameStage is 'generating': set start/finish to null

  // ----------------------------------------------------- Event handlers for grid
  // Reveal cells on click
  const gridOnClick = useCallback((e) => {
    const i = cellIndexFromEvent(e);
    if (i===undefined) return;
    setBoard(board => {
      const cell = board.cells[i];
      if (cell.flagged) return board; /* no-op; must unflag to reveal */
      else if (cell.hidden) { /* not flagged - reveal it */
        return {...board, cells: reveal(board.cells, setGameStage, [i])};
      } else { /* "chording" click on number with adjacent flags to clear rest */
        if (globalsettings.chording===true // TODO
            && 'number'===typeof cell.content
            && cell.content===cell.adj.filter((a)=>board.cells[a].flagged).length) {
          return {...board, cells: reveal(board.cells, setGameStage,
            cell.adj.filter((a)=>board.cells[a].hidden && !board.cells[a].flagged))};
        }
      }
      return board;
    });
  }, [setBoard, globalsettings]);

  // Flag or unflag
  const gridOnContextmenu = useCallback((e)=>{
    /* right-click (contextmenu) to flag/unflag a cell, unless shift is held */
    if (!e.shiftKey) {
      e.preventDefault();
      const i = cellIndexFromEvent(e);
      if (i===undefined) return;
      // toggle flagged
      setBoard(board=>({
        ...board,
        cells: board.cells.map((cell,j)=>i===j && cell.hidden?{...cell, flagged:!cell.flagged}:cell),
      }));
    }
  }, [setBoard]);
  // ----------------------------------------------------- Event handlers for grid

  return <>
    <div className="eimisweeper-game">
      <div className="eimisweeper-header">
        <div className="title-author">
          <span className="title">{game.title || "Random"}</span>
          {game.author? <>{" by "}<span className="author">{game.author}</span></>:""}
          {game.date? <span className="date">{" ("+game.date+")"}</span>:""}
        </div>
        <div className="game-info">
          <div className="game-stage">{"Game stage is: "+gameStage}</div>
          <div className="unflagged-mines">
          {"Mines Left: " + (board.info.showTotalMines
               ? board.info.totalMines - board.cells.filter(c=>c.flagged).length
               : "??")}
          </div>
          {board.info.showTotalQs ? <div className="found-qs">
            {"Found " + cells.filter(c=>!c.hidden && !('number'===typeof c.content)).length
              + "/" + board.info.totalQs + " unknowns"}
            </div> : ""}
        </div>
        <div className="game-controls">
          <button name="reset" onClick={()=>{
            // how is the state working here? need to reset board state as well as game???
            // TODO understand how this works
            setBoard(game.board);
            setGameStage('playing');
            setGame(cur=>({...cur}));
          }}>Reset</button>
          <button name="exit-to-menu" onClick={()=>setGame(null)}>Exit to Menu</button>
        </div>
      </div>
      <div
      className={`grid ${board.info.geometry}`}
      style={{
        "--rows": board.info.y,
        "--cols": board.info.x,
      }}
      onClick={editorMode ? gridOnClickEditor : gridOnClick}
      onContextMenu={editorMode ? gridOnContextmenuEditor : gridOnContextmenu}
      onKeyDown={editorMode ? gridOnKeydownEditor : undefined}
      >
        {board.cells.map((cell, i) =>
          <EimisweeperCell
            key={i}
            pos={cell.pos}
            idx={i}
            content={cell.content}
            hidden={cell.hidden}
            flagged={cell.flagged}
            //disabled={cell.disabled}
            adjHover={(hoverIdx!==null) && cell.adj.includes(hoverIdx)}
            setHover={setHover}
          />)}
        {[].map(constraint => constraint.gen(constraint))}
        {editorMode && EditorButtons(board.info.x, board.info.y)}
      </div>
    </div>
  </>
}

export default function Eimisweeper() {
  // TODO Get current game (from URL fragment/hash)
  //const [currentGame, setCurrentGame] = useState<number>()
  // Get the eimisweeper history and statistics
  // TODO
  // Get the in-progress game from storage
  // TODO
  //
  //const [gameHistory, setGameHistory] = useState<ScranHistory>()
  //useEffect(() => {
  //  const puzzlesCompleted = localStorage.getItem("eimisweeper-puzzles-completed")
  //  setGameHistory(getHistoryFromStorage())
  //}, [])
  // Game state
  //const [stage, setStage] = useState<'menu' | 'round-select' | 'game' | 'results'>('menu')

  //{stage === 'menu' && renderMenu()}
  //{stage === 'random-settings' && renderBoardGenSettings()}
  //{stage === 'game' && renderGame()}
  const [game, setGame] = useState(null)

  return <div className="eimisweeper">
    {game===null ?
      <GameChooser setGame={setGame} /> :
      <RenderGame game={game} setGame={setGame} />
    }
  </div>
}

function PuzzleInfo({puzzle, setGame}) {
  return <tr className="puzzleInfo" onClick={()=>setGame(generatePuzzle(puzzle))}>
  <td>{puzzle.title}</td>
  <td>{"by " + puzzle.author}</td>
  <td>{puzzle.date}</td>
  <td>{puzzle.info.noGuessing ? "Yes" : "No"}</td>
  </tr>
}

function GameChooser({setGame}) {
  //const [sort, setSort] = useState(null);
  //let puzzles = puzzles.asSorted(sort);
  return <div className="game-chooser">
    <table className="puzzles">
      <caption>Premade Puzzles</caption>
      <thead><tr className="puzzles-header">
        <th>Title</th><th>Author</th><th>Date</th><th>Solvable without guessing</th>
      </tr></thead>
      <tbody>
        {puzzles.map((p,i)=>(<PuzzleInfo puzzle={p} key={i} setGame={setGame} />))}
      </tbody>
    </table>
  </div>
}

