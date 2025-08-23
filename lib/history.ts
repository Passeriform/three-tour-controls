import { TypedEventTarget } from "typescript-event-target"

type ReplaceStrategy = "TRACK_LATEST" | "TRY_PRESERVE_TRACK"

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
        this.replaceStrategy = options?.replaceStrategy ?? "TRY_PRESERVE_TRACK"
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
        } else if (this.replaceStrategy === "TRY_PRESERVE_TRACK") {
            this.tracker = Math.min(this.tracker ?? this.MAX_TRACK, this.MAX_TRACK)
        } else if (this.replaceStrategy === "TRACK_LATEST" && this.history.length) {
            this.tracker = this.MAX_TRACK
        }

        this.dispatchTrackChanged()
    }

    push(...items: T[]) {
        if (this.tracker === undefined || this.tracker === this.MAX_TRACK) {
            this.history.push(...items)
        } else {
            this.history.splice(this.tracker + 1, this.history.length, ...items)
        }
        this.tracker = this.MAX_TRACK
        this.dispatchTrackChanged()
    }

    // Track methods
    getSeek() {
        return this.tracker
    }

    seekFirst() {
        if (this.tracker === undefined) {
            return
        }

        this.tracker = this.MIN_TRACK

        this.dispatchTrackChanged()
    }

    seekLast() {
        if (this.tracker === undefined) {
            return
        }

        this.tracker = this.MAX_TRACK

        this.dispatchTrackChanged()
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

    refreshSeek() {
        this.dispatchTrackChanged()
    }

    peek() {
        if (this.tracker === undefined) {
            return undefined
        }

        return this.history[this.tracker]
    }
}
