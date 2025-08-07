import { TypedEventTarget } from "typescript-event-target"

const ReplaceStrategy = {
    TRACK_LATEST: "TRACK_LATEST",
    TRY_PRESERVE_TRACK: "TRY_PRESERVE_TRACK",
} as const

type ReplaceStrategy = (typeof ReplaceStrategy)[keyof typeof ReplaceStrategy]

type TrackedHistoryCtorOptions = Partial<{
    replaceStrategy: ReplaceStrategy
}>

type TrackedHistoryEventMap<T> = {
    trackChanged: CustomEvent<
        | {
              item: T
              index: number
          }
        | {
              item: undefined
              index: undefined
          }
    >
}

export class TrackedHistory<T> extends TypedEventTarget<TrackedHistoryEventMap<T>> {
    private tracker: number | undefined
    private history: T[]
    private replaceStrategy: ReplaceStrategy
    public map: T[]["map"]

    private get MIN_TRACK() {
        return 0
    }

    private get MAX_TRACK() {
        return this.history.length - 1
    }

    private dispatchTrackChanged() {
        const index = this.tracker

        const payload =
            index === undefined
                ? {
                      index,
                      item: undefined,
                  }
                : {
                      index,
                      item: this.history[index]!,
                  }

        this.dispatchTypedEvent(
            "trackChanged",
            new CustomEvent("trackChanged", {
                detail: payload,
            }),
        )
    }

    constructor(options?: TrackedHistoryCtorOptions) {
        super()
        this.tracker = undefined
        this.history = []
        this.map = this.history.map
        this.replaceStrategy = options?.replaceStrategy ?? ReplaceStrategy.TRY_PRESERVE_TRACK
    }

    // Helpers
    isFirst() {
        return this.tracker === this.MIN_TRACK
    }

    isLast() {
        return this.tracker === this.MAX_TRACK
    }

    // History methods
    clear() {
        this.history = []
        this.tracker = undefined
        this.dispatchTrackChanged()
    }

    replace(newHistory: T[]) {
        this.history = newHistory

        if (!this.history.length) {
            this.tracker = undefined
        } else if (this.replaceStrategy === ReplaceStrategy.TRY_PRESERVE_TRACK) {
            this.tracker = Math.min(this.tracker ?? this.MAX_TRACK, this.MAX_TRACK)
        } else if (this.replaceStrategy === ReplaceStrategy.TRACK_LATEST && this.history.length) {
            this.tracker = this.MAX_TRACK
        }

        this.dispatchTrackChanged()
    }

    push(item: T) {
        this.history.push(item)
        this.tracker = this.MAX_TRACK
        this.dispatchTrackChanged()
    }

    invalidateFromSeek() {
        if (this.tracker === undefined) {
            return
        }

        this.history.splice(this.tracker + 1, this.history.length)
        this.tracker = this.MAX_TRACK

        this.dispatchTrackChanged()
    }

    // Track methods
    getSeek() {
        return this.tracker
    }

    seekNext() {
        if (this.tracker === undefined) {
            return
        }

        if (this.tracker === this.MAX_TRACK) {
            return
        }

        this.tracker++

        this.dispatchTrackChanged()
    }

    seekPrevious() {
        if (this.tracker === undefined) {
            return
        }

        if (this.tracker === this.MIN_TRACK) {
            return
        }

        this.tracker--

        this.dispatchTrackChanged()
    }

    peek() {
        if (this.tracker === undefined) {
            return undefined
        }

        return this.history[this.tracker]
    }
}
