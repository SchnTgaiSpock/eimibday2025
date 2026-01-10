import { Score } from "@/data/scran"

export type ScranHistory = Record<string, Score[] | undefined>

export function getHistoryFromStorage() {
    const historyStr = localStorage.getItem("round-history")
    if (!historyStr) return {}
    return JSON.parse(historyStr) as ScranHistory
}