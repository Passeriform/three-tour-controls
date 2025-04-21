import { Group as TweenGroup } from "@tweenjs/tween.js";
import { Box3, Controls, MathUtils, OrthographicCamera, PerspectiveCamera, Vector3 } from "three";
import { Z_AXIS } from "./statics";
import type { BoundPose, Pose } from "./types";
import { lookAtFromQuaternion, tweenTransform, unpackBounds } from "./utility";
import type { TourControlsEventMap } from "./events";

class TourControls extends Controls<TourControlsEventMap> {
    private tweenGroup: TweenGroup
    private transitioning: boolean
    private history: Pose[]
    private historyIdx: number
    public cameraOffset: number
    public timing: number
    public transitionOnPoseChange: boolean

    private animate(pose: Pose) {
        if (!this.enabled) {
            return
        }

        this.transitioning = true

        tweenTransform(this.tweenGroup, this.object, pose, { timing: this.timing, onComplete: () => {
            this.transitioning = false
            this.dispatchEvent({ type: "change" })
        } })
    }

    private updateToFitScreen() {
        this.history = this.boundPoses.map((boundPose) => {
            const [center, size] = unpackBounds(boundPose.bounds)

            const heightToFit = size.x / size.y < this.object.aspect ? size.y : size.x / this.object.aspect
            const cameraDistance =
                (heightToFit * 0.5) / Math.tan(this.object.fov * MathUtils.DEG2RAD * 0.5) + this.cameraOffset

            const quaternion = lookAtFromQuaternion(this.object, boundPose.quaternion)
            const position = center.add(Z_AXIS.clone().applyQuaternion(quaternion).multiplyScalar(cameraDistance)).clone()

            return { position, quaternion }
        })
    }

    private onResize() {
        this.object.aspect = window.innerWidth / window.innerHeight

        this.object.updateProjectionMatrix()

        this.updateToFitScreen()

        this.animate(this.history[this.historyIdx])
    }

    private onMouseWheel(event: WheelEvent) {
        if (!this.enabled || !this.history.length || this.transitioning) {
            return
        }

        if (
            (event.deltaY < 0 && this.historyIdx === this.history.length - 1) ||
            (event.deltaY > 0 && this.historyIdx === 0)
        ) {
            return
        }

        if (event.deltaY < 0) {
            this.historyIdx++
        } else if (event.deltaY > 0) {
            this.historyIdx--
        }

        this.dispatchEvent({
            type: "drill",
            historyIdx: this.historyIdx,
        })

        this.animate(this.history[this.historyIdx])
    }

    constructor(
        public object: PerspectiveCamera,
        public boundPoses: BoundPose[],
        public domElement: HTMLElement | null = null,
    ) {
        super(object, domElement)

        if ("isOrthographicCamera" in object && (object as unknown as OrthographicCamera).isOrthographicCamera) {
            throw Error("Tour controls currently only works for perspective camera.")
        }

        this.tweenGroup = new TweenGroup()
        this.cameraOffset = 4
        this.transitioning = false
        this.history = []
        this.historyIdx = -1
        this.timing = 400
        this.transitionOnPoseChange = true

        if (domElement) {
            this.connect(domElement)
        }
        this.update()
    }

    connect(element: HTMLElement) {
        element.addEventListener("resize", () => this.onResize())
        element.addEventListener("wheel", (event) => this.onMouseWheel(event))
    }

    setPoses(poses: Pose[], boundSize: Vector3 = new Vector3(1, 1, 1)) {
        this.setBoundPoses(poses.map(({ position, quaternion }) => ({ bounds: new Box3().setFromCenterAndSize(position, boundSize), quaternion })))
    }

    setBoundPoses(boundPoses: BoundPose[]) {
        this.boundPoses = boundPoses

        this.historyIdx = 0

        this.updateToFitScreen()

        if (this.transitionOnPoseChange) {
            this.animate(this.history[this.historyIdx])
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