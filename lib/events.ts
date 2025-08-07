import type { Event, Mesh } from "three"
import type TourControls from "./TourControls"

export type TourControlsEventMap<T extends Mesh> = {
    navigate: {
        location: T[] | undefined
    }
    transitionChange: {
        transitioning: boolean
    }
    change: {}
}

export type TourControlsNavigateEvent<T extends Mesh> = TourControlsEventMap<T>["navigate"] &
    Event<"navigate", TourControls<T>>
export type TourControlsTransitionChangeEvent<T extends Mesh> = TourControlsEventMap<T>["transitionChange"] &
    Event<"transitionChange", TourControls<T>>
export type TourControlsChangeEvent<T extends Mesh> = TourControlsEventMap<T>["change"] &
    Event<"change", TourControls<T>>
