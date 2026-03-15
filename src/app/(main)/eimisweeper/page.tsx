"use client"

import { Pos, Cell, BoardGeometry, BoardInfo, LiveBoard, EimisweeperGame, EimisweeperPuzzleData, puzzles, generatePuzzle, generateRandomBoard, copyAsJSON, copyAsURL, importFromClipboard, tryLoadFromJSON, sprites } from "@/data/eimisweeper";
import { EditorButtons, gridOnClickEditor, gridOnContextmenuEditor, gridOnKeydownEditor } from "./editor"
import { useState, useCallback, useRef, useEffect } from "react";

/// Global game settings
/// Flagging and Chording can be disabled
type EimisweeperSettings = {
  flagging: boolean,
  chording: boolean,
};

interface EimisweeperCellProps {
    pos: Pos
    idx: number
    content: string | number
    hidden: boolean
    flagged: boolean
    adjHover: boolean
    setHover: (arg0: number | null)=>void
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
}: EimisweeperCellProps) {
  // default mine is EimiUeh
  if (content==="*") content = "EimiUeh";
  return <div
    className={"cell"
            + (hidden  ?" hidden"  :"")
            + (flagged ?" flagged" :"")
            + (adjHover?" adjhover":"")}
    style={{"--x": pos.x, "--y": pos.y} as React.CSSProperties}
    onPointerEnter={()=>setHover(idx)}
    onPointerLeave={()=>setHover(null)}
  >
  <div>{content in sprites? sprites[content] && <img src={sprites[content]} alt={content.toString()} /> : content==="*"?"💣":content}</div>
  </div>
}

// get cell index from propagated event.
// Used for all events interacting with specific grid cells
// requires that the element order matches up with cells array
// (i.e. no other grid children before the cells)
export function cellIndexFromEvent(e: React.SyntheticEvent) {
  // currentTarget is the grid
  if (e.target !== e.currentTarget) {
    let el = e.target as HTMLElement;
    while(el.parentElement !== e.currentTarget){
      el = el.parentElement!;
    }
    if (!el.classList.contains('cell')) return undefined;
    return [...el.parentElement.children].indexOf(el);
  }
}

/// Floodfill: given cells being revealed, add all adjacent to zeros
/// used by reveal
function floodfill(cells: Cell[], queue: number[]): number[] {
  let cur = 0;
  // floodfill open cells
  while (cur < queue.length) {
    const p = queue[cur];
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
function reveal(cells: Cell[], setGameStage: ((state: 'win' | 'lose')=>void), addMistake: ()=>void, idxs: number[]): Cell[] {
  const revealed = floodfill(cells, idxs);
  let explode = false;
  const newCells = cells.map((cell, i) => {
    if (revealed.includes(i)) {
      if (cell.isBomb) explode = true;
      return {...cell, hidden: false};
    } else return cell;
  });
  if (explode) {
    setGameStage('lose');
    addMistake();
  } else if (newCells.every(cell=>(cell.isBomb===cell.hidden))) {
    setGameStage('win');
  }
  return newCells;
}

type GameStage = 'generating' | 'playing' | 'win' | 'lose'
type SetGame = (game: EimisweeperGame | null) => void
type RenderGameProps = {
  game: EimisweeperGame
  setGame: SetGame
  prefs: EimisweeperSettings
}
function RenderGame({ game, setGame, prefs }: RenderGameProps) {
  const [board, setBoardOrig] = useState<LiveBoard>(game.board);
  //const [generated, setGenerated] = useState<boolean>(game.minesPlaced);
  const [hoverIdx, setHover] = useState<number | null>(null);
  const [editorMode, setEditorMode] = useState<boolean>(game.editor || false);

  const [undos, setUndos] = useState<number>(0);
  const history = useRef<LiveBoard[]>([]); // does not affect render
  const setBoard = useCallback((updater: (board: LiveBoard)=>LiveBoard) => {
    setBoardOrig((board: LiveBoard) => {
      history.current.push(board);
      return updater(board);
    })
  }, [setBoardOrig]);
  const undoBoard = useCallback(() => {
    if (history.current.length > 0) {
      setUndos(x=>x+1);
      setBoardOrig(history.current.pop()!);
    }
  }, [setBoardOrig, setUndos]);
  // play info
  const [gameStage, setGameStage] = useState<GameStage>('playing');
  //"Score: when winning, show time to beat; when losing show time + %cleared";
  const [mistakes, setMistakes] = useState(0);
  //const [startTime, setStartTime] = useState(Date.now());
  //const [finishTime, setFinishTime] = useState(null);
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
  const gridOnClick = useCallback((e: React.MouseEvent) => {
    const i = cellIndexFromEvent(e);
    if (i===undefined) return;
    setBoard(board => {
      const cell = board.cells[i];
      if (cell.flagged) return board; /* no-op; must unflag to reveal */
      else if (cell.hidden) { /* not flagged - reveal it */
        return {...board, cells: reveal(board.cells, setGameStage, ()=>setMistakes(x=>x+1), [i])};
      } else { /* "chording" click on number with adjacent flags to clear rest */
        if (prefs.chording===true // TODO
            && 'number'===typeof cell.content
            && cell.content===cell.adj.filter((a)=>board.cells[a].flagged).length) {
          return {...board, cells: reveal(board.cells, setGameStage, ()=>setMistakes(x=>x+1),
            cell.adj.filter((a)=>board.cells[a].hidden && !board.cells[a].flagged))};
        }
      }
      return board;
    });
  }, [setBoard, setGameStage, setMistakes, prefs]);

  // Flag or unflag
  const gridOnContextmenu = useCallback((e: React.MouseEvent)=>{
    /* right-click (contextmenu) to flag/unflag a cell, unless shift is held */
    if (!e.shiftKey) {
      e.preventDefault();
      const i = cellIndexFromEvent(e);
      if (i===undefined) return;
      // toggle flagged
      if (prefs.flagging===false) return;
      // setStatsUsedFlags(true);
      setBoard(board=>({
        ...board,
        cells: board.cells.map((cell,j)=>i===j && cell.hidden?{...cell, flagged:!cell.flagged}:cell),
      }));
    }
  }, [setBoard, prefs]);
  // ----------------------------------------------------- Event handlers for grid

  return <>
    <div className="eimisweeper-game">
      <div className="eimisweeper-header">
        <div className="title-author">
          <span className="title">{editorMode? "Editor" : game.title || "Random"}</span>
          {game.author? <>{" by "}<span className="author">{game.author}</span></>:""}
          {game.date? <span className="date">{" ("+game.date+")"}</span>:""}
        </div>
        <div className="game-info">
          <div className="game-stage">{"Game stage is: "+gameStage}</div>
          <div className="unflagged-mines">
          {"Mines Left: " + (board.info.showTotalMines
               ? board.info.totalMines - board.cells.filter(c=>c.flagged||(c.isBomb&&!c.hidden)).length
               : "???")}
          </div>
          {board.info.showTotalQs ? <div className="found-qs">
            {"Found " + board.cells.filter(c=>!c.hidden && !('number'===typeof c.content)).length
              + "/" + board.info.totalQs + " unknowns"}
            </div> : ""}
        </div>
        <div className="game-controls">
          <button name="undo" onClick={undoBoard}>{undos?"Undo ("+undos+")":"Undo"}</button>
          <button name="reset" onClick={()=>{
            // https://react.dev/learn/preserving-and-resetting-state
            setGame({...game});
          }}>Restart</button>
          {game.author?"":<button name="new-game" onClick={()=>setGame({title: game.title, ...generateRandomBoard(board.info)})}>New Game</button>}
          <button name="exit-to-menu" onClick={()=>setGame(null)}>Exit to Menu</button>
          {editorMode ? <>
            <button name="export" onClick={()=>copyAsJSON(board)}>Copy Puzzle to Clipboard</button>
            <button name="share" onClick={()=>copyAsURL(board)}>Copy puzzle URL</button></>:""}
        </div>
      </div>
      <div
      className={`grid ${board.info.geometry}`}
      style={{
        "--rows": board.info.y,
        "--cols": board.info.x,
      } as React.CSSProperties}
      onClick={editorMode ? gridOnClickEditor(setBoard) : gridOnClick}
      onContextMenu={editorMode ? gridOnContextmenuEditor(setBoard) : gridOnContextmenu}
      onKeyDown={editorMode ? gridOnKeydownEditor(setBoard) : undefined}
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
        {[].map(constraint => constraint)}
        {editorMode && <EditorButtons x={board.info.x} y={board.info.y} setBoard={setBoard} />}
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

  const [prefs, setPrefs] = useState<EimisweeperSettings>({"chording": true, "flagging": true});
  const [game, setGame] = useState<EimisweeperGame | null>(null);
  useEffect(()=>setGame(tryLoadFromJSON(decodeURIComponent(window.location.hash.slice(1)))), []);
  const [key, setKey] = useState(0);
  const newGame = (g: EimisweeperGame | null) => {
    setKey(k=>k+1); // force game to re-render (reset state)
    if (window.location.hash && g===null) window.location.hash='';
    setGame(g);
  }
  // GeneratorSettings, PuzzleChooser are defined below

  return <div className="eimisweeper">
    <div className="game-chooser" style={game===null?{}:{"display":"none"}}>
      <GeneratorSettings disabled={false} setGame={setGame} />
      <PuzzleChooser setGame={setGame} />
    </div>
    {game===null?"":<RenderGame key={key} game={game} setGame={newGame} prefs={prefs} />}
  </div>
}

// ---------------------------------------------- Game selection / menu
const PresetBeginner: BoardInfo = {
  noGuessing: false,
  geometry: 'square',
  x: 9,
  y: 9,
  totalMines: 10,
  showTotalMines: true,
  totalQs: 0,
};
const PresetIntermediate: BoardInfo = {
  noGuessing: false,
  geometry: 'square',
  x: 16,
  y: 16,
  totalMines: 40,
  showTotalMines: true,
  totalQs: 0,
};
const PresetExpert: BoardInfo = {
  noGuessing: false,
  geometry: 'square',
  x: 30,
  y: 16,
  totalMines: 99,
  showTotalMines: true,
  totalQs: 0,
};



/// Settings to generate a random game
/// TODO
///  - compute whether puzzle needs guessing (when it is fully generated)
function GeneratorSettings({disabled, setGame}: {disabled: boolean, setGame: SetGame}) {
  const [geom, setGeom] = useState<BoardGeometry>('square');
  const [x, setX] = useState<number>(9);
  const [y, setY] = useState<number>(9);
  const [mines, setMines] = useState<number>(10);
  const [unkns, setUnkns] = useState<number>(0); // commonly displayed as '?' or 'EimiChu'
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
  return <div className="random-boardgen">
  <div className="preset-modes">
    <button onClick={()=>setGame({title:"Beginner", ...generateRandomBoard(PresetBeginner)})}>Generate Beginner</button>
    <button onClick={()=>setGame({title:"Intermediate", ...generateRandomBoard(PresetIntermediate)})}>Generate Intermediate</button>
    <button onClick={()=>setGame({title:"Expert", ...generateRandomBoard(PresetExpert)})}>Generate Expert</button>
  </div>
  <div className="generator-settings">
    <label>Shape: <select name="geom" disabled={true} value={geom} onChange={e=>setGeom(e.target.value as BoardGeometry)}>
      <option value="square">square</option>
      <option value="hex">hex</option>
      <option value="cross">cross</option>
    </select></label>
    <label>Width: <input name="genX" type="number" value={x} onChange={e=>setX(+e.target.value)} min="1" max="40"/></label>
    <label>Height: <input name="genY" type="number" value={y} onChange={e=>setY(+e.target.value)} min="1" max="40"/></label>
    <label>Mines: <input name="genMines" type="number" value={mines} onChange={e=>setMines(+e.target.value)} min="0" max={Math.min(999, x*y - unkns)} /></label>
    <label>Unknowns (?): <input name="genUnkns" type="number" value={unkns} onChange={e=>setUnkns(+e.target.value)} min="0" max={Math.min(999, x*y - mines)} /></label>
    <label>No Guessing <input name="noGuessing" disabled={true} type="checkbox" checked={noGuessing} onChange={e=>setGuessing(e.target.checked)} /></label>
  </div>
  <button onClick={()=>setGame({title: "Custom", ...generateRandomBoard(info)})}>Generate Custom!</button>
  <button onClick={()=>importFromClipboard().then(setGame).catch(e=>console.log(e))}>Play from Clipboard</button>
  <button onClick={()=>setGame({editor: true, ...generateRandomBoard(info)})}>Puzzle Editor</button>
  </div>
}

type PuzzleInfoProps = {
  puzzle: EimisweeperPuzzleData
  setGame: SetGame
}
function PuzzleInfo({puzzle, setGame}: PuzzleInfoProps) {
  // TODO: store whether a puzzle was solved in localstorage (with stats?) and display it here
  return <tr className="puzzleInfo" onClick={()=>setGame(generatePuzzle(puzzle))}>
  <td>{puzzle.title}</td>
  <td>{"by " + puzzle.author}</td>
  <td>{puzzle.date}</td>
  <td>{puzzle.info.noGuessing ? "Yes" : "No"}</td>
  </tr>
}

type PuzzleChooserProps = {
  setGame: SetGame
}
function PuzzleChooser({setGame}: PuzzleChooserProps) {
  //const [sort, setSort] = useState(null);
  //let puzzles = puzzles.asSorted(sort);
  return <>
    <table className="puzzles">
      <caption>Premade Puzzles</caption>
      <thead><tr className="puzzles-header">
        <th>Title</th><th>Author</th><th>Date</th><th>Solvable without guessing</th>
      </tr></thead>
      <tbody>
        {puzzles.map((p,i)=>(<PuzzleInfo puzzle={p} key={i} setGame={setGame} />))}
      </tbody>
    </table>
  </>
}

