import { Group as TweenGroup } from "@tweenjs/tween.js"
import { Box3, Controls, MathUtils, type Mesh, type PerspectiveCamera, Sphere, Vector3 } from "three"
import type { TourControlsEventMap } from "./events"
import { TrackedHistory } from "./history"
import { CAMERA_FORWARD } from "./statics"
import type { MeshPose, Pose } from "./types"
import { animatePoseTransform, equalsArray } from "./utility"

type DetourExitCondition = "first" | "last"
type DetourExitStrategy = "same" | "next" | "first" | "last"

class TourControls<T extends Mesh> extends Controls<TourControlsEventMap<T>> {
    private locations: MeshPose<T>[]
    private history: TrackedHistory<Pose>
    private detourLocations: MeshPose<T>[]
    private detourHistory: TrackedHistory<Pose>
    private tweenGroup: TweenGroup
    private transitioning: boolean
    public detourExitStrategy: DetourExitStrategy
    public detourExitCondition: DetourExitCondition
    public timing: number

    private computePose(location: MeshPose<T>) {
        const bounds = new Box3()
        location.meshes.forEach((mesh) => {
            mesh.geometry.computeBoundingBox()
            const meshBounds = mesh.geometry.boundingBox!.clone().applyMatrix4(mesh.matrixWorld)
            bounds.union(meshBounds)
        })

        const center = new Vector3()
        bounds.getCenter(center)

        const sphere = new Sphere()
        bounds.getBoundingSphere(sphere)

        const minRequiredDistance = sphere.radius / Math.sin(MathUtils.degToRad(this.object.fov / 2))
        const distance = Math.max(minRequiredDistance, location.distance)
        const forward = CAMERA_FORWARD.clone().applyQuaternion(location.quaternion)
        const position = center.clone().addScaledVector(forward, -distance)

        return { position, quaternion: location.quaternion }
    }

    private animate(pose: Pose) {
        if (!this.enabled) {
            return
        }

        this.transitioning = true
        this.dispatchEvent({
            type: "transitionChange",
            transitioning: this.transitioning,
        })

        animatePoseTransform(this.tweenGroup, this.object, pose, {
            timing: this.timing,
            onUpdate: () => {
                this.dispatchEvent({ type: "change" })
            },
            onComplete: () => {
                this.transitioning = false
                this.dispatchEvent({
                    type: "transitionChange",
                    transitioning: this.transitioning,
                })
            },
        })
    }

    private recomputePoses() {
        const poses = this.locations.map((location) => this.computePose(location))
        this.history.replace(poses)

        const detourPoses = this.detourLocations.map((location) => this.computePose(location))
        this.detourHistory.replace(detourPoses)
    }

    private onResize() {
        this.object.aspect = window.innerWidth / window.innerHeight
        this.object.updateProjectionMatrix()
        this.recomputePoses()
    }

    private onMouseWheel(event: WheelEvent) {
        // Early exit on skippable states
        if (!this.enabled || this.transitioning || event.deltaY === 0) {
            return
        }

        // Detour navigation
        if (this.detourHistory.peek()) {
            // Restore to main history
            if (
                (event.deltaY > 0 && this.detourExitCondition === "last" && this.detourHistory.isLast()) ||
                (event.deltaY < 0 && this.detourExitCondition === "first" && this.detourHistory.isFirst())
            ) {
                this.endDetour()
            }

            // Navigate detour history
            if (event.deltaY < 0) {
                this.detourHistory.seekNext()
            } else if (event.deltaY > 0) {
                this.detourHistory.seekPrevious()
            }
        }

        // Regular navigation
        if ((event.deltaY < 0 && this.history.isLast()) || (event.deltaY > 0 && this.history.isFirst())) {
            return
        }

        if (event.deltaY < 0) {
            this.history.seekNext()
        } else if (event.deltaY > 0) {
            this.history.seekPrevious()
        }
    }

    constructor(
        public override object: PerspectiveCamera,
        public override domElement: HTMLElement | null = null,
    ) {
        super(object, domElement)

        this.locations = []
        this.history = new TrackedHistory()
        this.detourLocations = []
        this.detourHistory = new TrackedHistory()
        this.detourExitCondition = "last"
        this.detourExitStrategy = "same"
        this.tweenGroup = new TweenGroup()
        this.transitioning = false
        this.timing = 400

        this.history.addEventListener("trackChanged", (event) => {
            if (!event.detail.item || this.detourHistory.peek()) {
                return
            }

            this.dispatchEvent({
                type: "navigate",
                location: this.locations[event.detail.index]!.meshes,
            })
            this.animate(event.detail.item)
        })

        this.detourHistory.addEventListener("trackChanged", (event) => {
            // Exit detour
            if (!event.detail.item) {
                return
            }

            this.dispatchEvent({
                type: "navigate",
                location: this.detourLocations[event.detail.index]!.meshes,
            })
            this.animate(event.detail.item)
        })

        if (this.domElement) {
            this.connect(this.domElement)
        }

        this.update()
    }

    connect(element: HTMLElement) {
        window.addEventListener("resize", () => this.onResize())
        element.addEventListener("wheel", (event) => this.onMouseWheel(event))
    }

    setItinerary(locations: MeshPose<T>[]) {
        this.locations = locations
        this.detourLocations = []
        this.recomputePoses()
    }

    detour(location: MeshPose<T>) {
        if (equalsArray(location.meshes, this.detourLocations[this.detourLocations.length - 1]?.meshes ?? [])) {
            return
        }

        this.detourLocations.push(location)
        this.detourHistory.push(this.computePose(location))

        this.dispatchEvent({ type: "detourStart" })
    }

    endDetour() {
        if (!this.detourHistory.peek()) {
            return
        }

        this.detourLocations = []
        this.detourHistory.clear()

        this.dispatchEvent({ type: "detourEnd" })

        switch (this.detourExitStrategy) {
            case "same":
                return this.history.refreshSeek()
            case "next":
                return this.history.seekNext()
            case "first":
                return this.history.seekFirst()
            case "last":
                return this.history.seekLast()
        }
    }

    update(time?: number) {
        this.tweenGroup.update(time)
    }

    clear() {
        this.tweenGroup.removeAll()
        super.dispose()
        return
    }
}

export default TourControls
