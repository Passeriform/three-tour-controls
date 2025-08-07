import { describe, expect, it, vi } from "vitest"
import { TrackedHistory } from "./history"

describe("TrackedHistory", () => {
    it("should push and peek items, updating tracker", () => {
        const history = new TrackedHistory<number>()
        expect(history.peek()).toBeUndefined()
        history.push(1)
        expect(history.peek()).toBe(1)
        history.push(2)
        expect(history.peek()).toBe(2)
    })

    it("should expose map method that matches internal array", () => {
        const history = new TrackedHistory<number>()
        history.push(1)
        history.push(2)
        const mapped = history.map.call([1, 2], (x) => x * 2)
        expect(mapped).toEqual([2, 4])
    })

    it("should return correct values for isFirst and isLast in all tracker states", () => {
        const history = new TrackedHistory<number>()

        // empty history
        expect(history.isFirst()).toBe(false)
        expect(history.isLast()).toBe(false)

        // single element
        history.push(1)
        expect(history.isFirst()).toBe(true)
        expect(history.isLast()).toBe(true)

        // tracker at last element
        history.push(2)
        expect(history.isFirst()).toBe(false)
        expect(history.isLast()).toBe(true)

        // tracker at first element in multiple history elements
        history.seekPrevious()
        expect(history.isFirst()).toBe(true)
        expect(history.isLast()).toBe(false)

        // tracker in the middle
        history.push(3)
        history.seekPrevious()
        expect(history.isFirst()).toBe(false)
        expect(history.isLast()).toBe(false)
    })

    it("should seek next and previous, and not go out of bounds", () => {
        const history = new TrackedHistory<number>()
        history.push(1)
        history.push(2)
        history.push(3)
        expect(history.peek()).toBe(3)
        history.seekPrevious()
        expect(history.peek()).toBe(2)
        history.seekPrevious()
        expect(history.peek()).toBe(1)
        history.seekPrevious()
        expect(history.peek()).toBe(1)
        history.seekNext()
        expect(history.peek()).toBe(2)
        history.seekNext()
        expect(history.peek()).toBe(3)
        history.seekNext()
        expect(history.peek()).toBe(3)
    })

    it("should clear history and reset tracker", () => {
        const history = new TrackedHistory<number>()
        history.push(1)
        history.push(2)
        history.clear()
        expect(history.peek()).toBeUndefined()
        expect(history.getSeek()).toBeUndefined()
    })

    it("should replace history and preserve tracker by default", () => {
        const history = new TrackedHistory<number>()
        history.push(1)
        history.push(2)
        history.push(3)
        history.seekPrevious()
        expect(history.peek()).toBe(2)
        history.replace([10, 20, 30, 40])
        expect(history.peek()).toBe(20)
        history.replace([100])
        expect(history.peek()).toBe(100)
    })

    it("should replace history and auto-track first if strategy is TRACK_LATEST", () => {
        const history = new TrackedHistory<number>({ replaceStrategy: "TRACK_LATEST" })
        history.push(1)
        history.push(2)
        history.replace([10, 20, 30])
        expect(history.peek()).toBe(30)
    })

    it("should invalidate from seek and truncate history", () => {
        const history = new TrackedHistory<number>()
        history.push(1)
        history.push(2)
        history.push(3)
        history.seekPrevious()
        expect(history.peek()).toBe(2)
        history.invalidateFromSeek()
        expect(history.peek()).toBe(2)
        history.push(99)
        expect(history.peek()).toBe(99)
    })

    it("should dispatch trackChanged event on push, clear, seek, and replace", () => {
        const history = new TrackedHistory<number>()
        const handler = vi.fn()
        history.addEventListener("trackChanged", handler)
        history.push(1)
        history.push(2)
        history.seekPrevious()
        history.seekNext()
        history.replace([5, 6])
        history.clear()

        const details = handler.mock.calls.map((call) => call[0].detail)

        expect(details[0]).toEqual({ item: 1, index: 0 }) // push(1)
        expect(details[1]).toEqual({ item: 2, index: 1 }) // push(2)
        expect(details[2]).toEqual({ item: 1, index: 0 }) // seekPrevious
        expect(details[3]).toEqual({ item: 2, index: 1 }) // seekNext
        expect(details[4]).toEqual({ item: 6, index: 1 }) // replace([5,6])
        expect(details[5]).toEqual({ item: undefined, index: undefined }) // clear
    })

    it("should handle empty replace", () => {
        const history = new TrackedHistory<number>()
        history.push(1)
        history.replace([])
        expect(history.peek()).toBeUndefined()
    })
})
