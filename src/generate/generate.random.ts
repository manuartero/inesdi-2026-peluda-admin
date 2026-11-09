// mulberry32: a tiny seeded generator, so `pnpm generate` writes the same files on every run.
function mulberry32(seed: number) {
  let state = seed >>> 0
  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export type Weighted<T> = { value: T; weight: number }

export function seededRandom(seed: number) {
  const next = mulberry32(seed)

  // int({ min: 1, max: 3 }) is 1, 2 or 3.
  const int = ({ min, max }: { min: number; max: number }) => min + Math.floor(next() * (max - min + 1))

  const chance = (probability: number) => next() < probability

  const pick = <T>(items: readonly T[]) => {
    if (items.length === 0) {
      throw new Error('pick(): empty list')
    }
    return items[Math.floor(next() * items.length)]
  }

  const weighted = <T>(items: readonly Weighted<T>[]) => {
    const total = items.reduce((sum, item) => sum + item.weight, 0)
    let roll = next() * total
    for (const item of items) {
      roll -= item.weight
      if (roll < 0) {
        return item.value
      }
    }
    return pick(items).value
  }

  const shuffle = <T>(items: readonly T[]) => {
    const copy = [...items]
    for (let index = copy.length - 1; index > 0; index--) {
      const other = Math.floor(next() * (index + 1))
      ;[copy[index], copy[other]] = [copy[other], copy[index]]
    }
    return copy
  }

  // A deck deals every item once before repeating any, so 120 tickets from 40 templates use each about three times.
  const deck = <T>(items: readonly T[]) => {
    let cards: T[] = []
    return () => {
      if (cards.length === 0) {
        cards = shuffle(items)
      }
      const card = cards.pop()
      if (card === undefined) {
        throw new Error('deck(): empty list')
      }
      return card
    }
  }

  return { next, int, chance, pick, weighted, shuffle, deck }
}

export type Random = ReturnType<typeof seededRandom>
