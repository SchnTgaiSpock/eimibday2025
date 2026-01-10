import { hash } from "@/util/hash"
import { CountryCode, getFlagClass } from "@/util/flags"
import scranJson from './scran.json'
import scranGameJson from './scranGame.json'

export interface Scran {
    imageUrl: string
    submittedBy?: string | null
    name?: string | null
    description?: string | null
    country?: CountryCode | null
    location?: string | null
    year?: number | null
    price?: number // GBP | null
    backgroundSize?: 'cover' | 'contain' | null
    backgroundPosition?: string | null

    percent: number
}

export type Score = boolean | null

export function getSubmittedBy(scran: Scran) {
    return scran.submittedBy ?? "Anonymous"
}

export function getName(scran: Scran) {
    return scran.name ?? ["Unknown", "Mysterious", "Intriguing", "Unidentified"][hash(scran.imageUrl, 4)] + " Scran"
}

export function getDescription(scran: Scran) {
    return scran.description ? scran.description + " • " : ""
}

export function getCountry(scran: Scran) {
    return scran.country ?? ""
}

export function getCountryFlagSpaces(scran: Scran) {
    return getFlagClass(scran.country) ? "\xa0\xa0" : ""
}

export function getCountryFlagClass(scran: Scran) {
    return getFlagClass(scran.country)
}

export function getLocation(scran: Scran) {
    return scran.location ?? ""
}

export function getYear(scran: Scran) {
    return scran.year ?? 2026
}

export function getPrice(scran: Scran) {
    return scran.price === 0 ? "FREE" : scran.price ? "£" + scran.price.toFixed(2) : "No price data"
}

export function getPercent(scran: Scran) {
    return scran.percent.toFixed(2)
}

export function getCopyText(score: Score[], mode: string) {
    // 🟥🟥🟩🟩🟩🟥🟥🟩🟩🟩 6/10 | Practice | https://scrandle.com
    return `${score.map(s => s ? "🟩" : "🟥").join("")} ${score.reduce((acc, curr) => (curr ? 1 : 0) + acc, 0)}/${score.length} | ${mode} | https://isami-industries.com`
}

export const testScrans: Scran[] = [
    {
        imageUrl: '/pfp.png',
        price: 1.01,
        percent: 100,
        backgroundSize: 'contain'
    },
    {
        imageUrl: '/pfp.png',
        price: 1.01,
        percent: 0,
    },
]

export const scrans: Scran[] = scranJson as Scran[]

// Each game consists of 10 matches between 2 scrans
export type ScranGame = [number, number][]
export const scranGames: ScranGame[] = scranGameJson as ScranGame[]

const scranFeedback = [
    ["The Secretive, Hidden Scranner"],
    ["Miserable Scranner", "Scranner outside Light and Heat", "The Scranner who Fell From Grace", "Just another insect in the tub", "Scranner who almost touched true greatness"],
    ["Dismal Scranner", "Tragic Scranner", "Cursed Scranner", "Nasty Scranner", "Tesco Just Ham Sandwich. No Mayo. Just Ham. Ham sandwich. Tesco Just Ham Sandwich Without Mayo and Just Ham"],
    ["Unhappy Scranner", "Dullard Scranner", "Stolic Scranner", "A shameful path led you here", "Hot dog (Pejorative)", "Alas, scranner"],
    ["Mediocre Scranner", "Simply Unacceptable Scranner", "Lousy Scranner", "Foolish Scranner", "Judged and Found Wanting"],
    ["Disappointing Scranner", "Poor Scranner", "Inferior Scranner", "Pitiful Scranner", "A coin could take your job, mate"],
    ["Unlucky Scranner", "Forgivable Scranner", "Indolent Scranner", "Scranner who should have tried harder", "You'll be back"],
    ["Barely Successful Scranner", "Lucky Scranner", "Good Scranner", "Solid Scranner", "Workmanlike Scranner", "Gentle Scranner", "Scranner on thin ice", "Unremarkable Scranner"],
    ["Confident Scranner", "Happy Scranner", "Easy Scranner", "Absolute Scranner", "Powerful Scranner", "Impervious Scranner", "Great Scranner (with a beer)", "10-inch Scranner"],
    ["Adept Scranner", "Master Scranner", "Professional Scranner", "Almighty Scranner", "Silent Ascransin", "The sucker of bones, the sipper of sauce", "Scranner with the Mandate of Heaven", "Yes You Scran"],
    ["Perfect Scranner", "Flawless Scranner", "Peerless Scranner"]
]

export function getFeedback(score: number) {
    return scranFeedback[score][Math.floor(Math.random() * scranFeedback[score].length)]
}

export function preloadImages(game: ScranGame) {
    game.forEach(([s1, s2]) => {
        const img1 = new Image();
        img1.src = scrans[s1].imageUrl
        const img2 = new Image();
        img2.src = scrans[s2].imageUrl
    });
}