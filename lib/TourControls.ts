import { Group as TweenGroup } from "@tweenjs/tween.js"
import { Box3, Controls, MathUtils, type Mesh, type PerspectiveCamera, Sphere, Vector3 } from "three"
import type { TourControlsEventMap } from "./events"
import { TrackedHistory } from "./history"
import { CAMERA_FORWARD } from "./statics"
import type { MeshPose, Pose } from "./types"
import { animatePoseTransform, equalsArray } from "./utility"

class TourControls<T extends Mesh> extends Controls<TourControlsEventMap<T>> {
    private locations: MeshPose<T>[]
    private exitToHome: boolean
    private viewingDistance: number
    private homePose: Pose
    private history: TrackedHistory<Pose>
    private tweenGroup: TweenGroup
    private transitioning: boolean
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
        const distance = Math.max(minRequiredDistance, this.viewingDistance)
        const forward = CAMERA_FORWARD.clone().applyQuaternion(location.quaternion)
        const position = center.clone().addScaledVector(forward, -distance)

        return { position, quaternion: location.quaternion }
    }

    private recomputePoses() {
        return this.locations.map((location) => this.computePose(location))
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

    private onResize() {
        this.object.aspect = window.innerWidth / window.innerHeight

        this.object.updateProjectionMatrix()

        const poses = this.recomputePoses()

        this.history.replace(poses)
    }

    private onMouseWheel(event: WheelEvent) {
        if (!this.enabled || this.transitioning || event.deltaY === 0 || !this.history.peek()) {
            return
        }

        if (this.exitToHome && event.deltaY > 0 && this.history.isFirst()) {
            this.history.clear()
            return
        }

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
        this.tweenGroup = new TweenGroup()
        this.history = new TrackedHistory()
        this.homePose = {
            position: this.object.position.clone(),
            quaternion: this.object.quaternion.clone(),
        }
        this.exitToHome = false
        this.viewingDistance = 4
        this.transitioning = false
        this.timing = 400

        this.history.addEventListener("trackChanged", (event) => {
            this.dispatchEvent({
                type: "navigate",
                location: event.detail.item ? this.locations[event.detail.index]?.meshes : undefined,
            })
            this.animate(event.detail.item ?? this.homePose)
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

    setExitToHome(value: boolean) {
        this.exitToHome = value
    }

    setHomePose(pose: Pose) {
        this.homePose = pose
    }

    setViewingDistance(distance: number) {
        this.viewingDistance = distance

        const poses = this.recomputePoses()

        this.history.replace(poses)
    }

    setItinerary(locations: MeshPose<T>[]) {
        this.locations = locations

        const poses = this.recomputePoses()

        this.history.replace(poses)
    }

    pushItinerary(location: MeshPose<T>) {
        if (equalsArray(location.meshes, this.locations[this.locations.length - 1]!.meshes)) {
            return
        }

        this.history.push(this.computePose(location))
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
