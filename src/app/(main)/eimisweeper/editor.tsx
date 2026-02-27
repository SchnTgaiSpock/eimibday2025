"use client"

import { LiveBoard, serializeBoard, recreateBoard, range } from "@/data/eimisweeper";
import { cellIndexFromEvent } from "./page"

type SetBoard = (updater: (board: LiveBoard) => LiveBoard) => void

/// ----------------- Editor functionality, updating size or arrangement of the grid
function shiftCol(col: number, shift: number, setBoard: SetBoard) {
  const update = (board: LiveBoard) => recreateBoard({
    ...board,
    cells: board.cells.map(
      cell => cell.pos.x===col?{...cell, pos:{y:(cell.pos.y+shift)%board.info.y, x:col}}:cell),
  })
  setBoard(update)
}
function shiftRow(row: number, shift: number, setBoard: SetBoard) {
  const update = (board: LiveBoard) => recreateBoard({
    ...board,
    cells: board.cells.map(
      cell => cell.pos.y===row?{...cell, pos:{y:row, x:(cell.pos.x+shift)%board.info.x}}:cell),
  })
  setBoard(update)
}
function removeCol(col: number, setBoard: SetBoard) {
  const update = (board: LiveBoard) => recreateBoard({
    ...board,
    cells: board.cells.filter(cell => cell.pos.x!==col)
      .map(cell => cell.pos.x > col?{...cell, pos:{x: cell.pos.x-1, y: cell.pos.y}}:cell),
    info: {...board.info, x: board.info.x-1},
  })
  setBoard(update)
}
function removeRow(row: number, setBoard: SetBoard) {
  const update = (board: LiveBoard) => recreateBoard({
    ...board,
    cells: board.cells.filter(cell => cell.pos.y!==row)
      .map(cell => cell.pos.y > row?{...cell, pos:{x: cell.pos.x, y: cell.pos.y-1}}:cell),
    info: {...board.info, y: board.info.y-1},
  })
  setBoard(update)
}
function addCol(beforeCol: number, setBoard: SetBoard) {
  const update = (board: LiveBoard) => recreateBoard({
    ...board,
    cells: [
      ...board.cells.map((cell) => cell.pos.x < beforeCol?cell:{...cell, pos:{x:cell.pos.x+1, y:cell.pos.y}}),
      ...range(board.info.y).map(y=>({
        pos:{x: beforeCol, y:y},
        adj: [], content: '', isBomb: false, isOpen: false, hidden: false, flagged: false
      }))
    ],
    info: {...board.info, x: board.info.x+1},
  })
  setBoard(update)
}
function addRow(beforeRow: number, setBoard: SetBoard) {
  const update = (board: LiveBoard) => recreateBoard({
    ...board,
    cells: [
      ...board.cells.map((cell) => cell.pos.y < beforeRow?cell:{...cell, pos:{x:cell.pos.x, y:cell.pos.y+1}}),
      ...range(board.info.x).map(x=>({
        pos:{x: x, y: beforeRow},
        adj: [], content: '', isBomb: false, isOpen: false, hidden: false, flagged: false
      }))
    ],
    info: {...board.info, y: board.info.y+1},
  })
  setBoard(update)
}
/// Editor: Fill board with all possible cells (no content).
function addAllEmptyCells(setBoard: SetBoard) {
  const update = (board: LiveBoard) => recreateBoard({
    ...board,
    cells: [...board.cells,
      ...range(board.info.x).map(x=>range(board.info.y).map(y=>({x:x,y:y})))
      .flat().filter(p=>!(p.y in board.index)||!(p.x in board.index[p.y]))
      .map(p=>({
        pos: p,
        adj: [], // will be updated by recreateBoard()
        content: '',
        isBomb: false,
        isOpen: false,
        hidden: false,
        flagged: false,
      })),
    ],
  })
  setBoard(update)
}
/// Editor: auto-populate content for numeric/empty cells
function updateContent(board: LiveBoard): LiveBoard {
  const cells = board.cells.map(cell => {
    const bombCount = cell.adj.filter(i=>board.cells[i].isBomb).length;
    const newContent = cell.isBomb? '*' :
      'number'===typeof cell.content? bombCount :
      cell.content;
    return (cell.content===newContent)? cell : {
      ...cell,
      content: newContent,
      isOpen: newContent===0,
    }
  });
  return {
    ...board,
    cells: cells,
  };
}

interface EditorColProps {
  col: number
  lastrow: number
  setBoard: SetBoard
}
interface EditorRowProps {
  row: number
  lastcol: number
  setBoard: SetBoard
}

function EditorInsertColButton({col, lastrow, setBoard}: EditorColProps) {
  return <button className="editor-insert col" style={{"--x": col, "--y": lastrow} as React.CSSProperties} onClick={()=>addCol(col, setBoard)}>{"+"}</button>
}
function EditorInsertRowButton({row, lastcol, setBoard}: EditorRowProps) {
  return <button className="editor-insert row" style={{"--y": row, "--x": lastcol} as React.CSSProperties} onClick={()=>addRow(row, setBoard)}>{"+"}</button>
}
function EditorEditColButtons({col, lastrow, setBoard}: EditorColProps) {
  return <div className="editor-edit col" style={{"--x": col} as React.CSSProperties}>
  <button className="shift-back" onClick={()=>shiftCol(col, -1, setBoard)}/>
  <button className="remove" onClick={()=>removeCol(col, setBoard)}/>
  <button className="shift-forward" onClick={()=>shiftCol(col, 1, setBoard)}/>
  </div>
}
function EditorEditRowButtons({row, lastcol, setBoard}: EditorRowProps) {
  return <div className="editor-edit row" style={{"--y": row} as React.CSSProperties}>
  <button className="shift-back" onClick={()=>shiftRow(row, -1, setBoard)}/>
  <button className="remove" onClick={()=>removeRow(row, setBoard)}/>
  <button className="shift-forward" onClick={()=>shiftRow(row, 1, setBoard)}/>
  </div>
}
// All the editor buttons to add/remove/etc rows and columns of the grid.
// These buttons are displayed as part of the grid (on the edges)
type EditorButtonProps = {
  x: number
  y: number
  setBoard: SetBoard
}
export function EditorButtons({x, y, setBoard}: EditorButtonProps) {
  return <>
    {range(x+1).map((xc) => <EditorInsertColButton key={"icol"+xc} col={xc+1} lastrow={y} setBoard={setBoard} />)}
    {range(y+1).map((yc) => <EditorInsertRowButton key={"irow"+yc} row={yc+1} lastcol={x} setBoard={setBoard} />)}
    {range(x).map((xc) => <EditorEditColButtons key={"ecol"+xc} col={xc+1} lastrow={y} setBoard={setBoard} />)}
    {range(y).map((yc) => <EditorEditRowButtons key={"erow"+yc} row={yc+1} lastcol={x} setBoard={setBoard} />)}
  </>
}

// ----------------------------------------------------- Event handlers for Editor
export const gridOnKeydownEditor = (setBoard: SetBoard) => (e: React.KeyboardEvent) => {
  const i = cellIndexFromEvent(e);
  if (i===undefined) return;
  if (/[a-zA-Z0-9? ]/.test(e.key)) { // TODO backspace/del to remove/disable?
    // set content
    // TODO update Q/Mines total info based on diff, or disallow
    setBoard((board: LiveBoard) => ({
      ...board,
      cells: board.cells.map((cell, j)=> {
        if (j===i) {
          let content: number|string = e.key;
          if (/[0-9]/.test(e.key)) {
            content = +(e.key);
          }
          return {...cell, content: content, isOpen: content===0};
        }
        return cell;
      })
      //TODO info: {...board.info, ...}
    }));
  }
}

export const gridOnClickEditor = (setBoard: SetBoard) => (e: React.MouseEvent) => {
  const i = cellIndexFromEvent(e);
  if (i===undefined) return;
  // toggle hidden
  setBoard((board: LiveBoard) => ({
    ...board,
    cells: board.cells.map((cell,j)=>
      j===i?{...cell, hidden: !cell.hidden}: cell)
  }));
}

export const gridOnContextmenuEditor = (setBoard: SetBoard) => (e: React.MouseEvent)=>{
  if (!e.shiftKey) {
    e.preventDefault();
    const i = cellIndexFromEvent(e);
    if (i===undefined) return;
    // (editor mode) toggle Bomb
    // also updates surrounding cells
    setBoard((board: LiveBoard) => {
      const diff = board.cells[i].isBomb ? -1 : 1;  // are we removing a bomb or adding it?
      const cells = board.cells.map((cell,j) => {
        if (j!==i) {
          if (cell.adj.includes(i) && 'number'===typeof cell.content) {
            return {...cell, content: cell.content+diff, isOpen: cell.content+diff <= 0};
          }
          return cell;
        }
        const nowBomb = !cell.isBomb;
        const bombCount = cell.adj.filter(i=>board.cells[i].isBomb).length;
        return {
          ...cell,
          isBomb: nowBomb,
          isOpen: !nowBomb && bombCount===0,
          content: nowBomb? '*' : bombCount,
        };
      });
      return {
        ...board,
        cells: cells,
        info: {...board.info, totalMines: board.info.totalMines+diff},
      };
    });
  }
}
// ----------------------------------------------------- Event handlers for Editor


