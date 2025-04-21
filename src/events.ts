import { type Event } from "three"
import type TourControls from "./TourControls"

export type TourControlsEventMap = {
    drill: {
        historyIdx: number
    }
    change: {}
}

export type TourControlsDrillEvent = TourControlsEventMap["drill"] & Event<"drill", TourControls>
export type TourControlsChangeEvent = TourControlsEventMap["change"] & Event<"change", TourControls>
