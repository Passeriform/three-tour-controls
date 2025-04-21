import { OrthographicCamera, PerspectiveCamera, Quaternion, Vector3 } from "three"
import { describe, expect, it, vi } from "vitest"
import TourControls from "./TourControls"
import type { BoundPose, Pose } from "./types"

describe("TourControls", () => {
    const mockDomElement = document.createElement("div")

    it("should initialize with default values", () => {
        const camera = new PerspectiveCamera()
        const boundPoses = [] as BoundPose[]
        const controls = new TourControls(camera, boundPoses, mockDomElement)

        expect(controls.cameraOffset).toBe(4)
        expect(controls.timing).toBe(400)
        expect(controls.transitionOnPoseChange).toBe(true)
        expect((controls as any).history).toEqual([])
        expect((controls as any).historyIdx).toBe(-1)
    })

    it("should throw an error if an orthographic camera is used", () => {
        const camera = new OrthographicCamera() as unknown as PerspectiveCamera
        const boundPoses = [] as BoundPose[]

        expect(() => new TourControls(camera, boundPoses, mockDomElement)).toThrow(
            "Tour controls currently only works for perspective camera.",
        )
    })

    it("should update poses and animate to the first pose", () => {
        const camera = new PerspectiveCamera()
        const boundPoses = [] as BoundPose[]
        const controls = new TourControls(camera, boundPoses, mockDomElement)

        const poses = [
            {
                position: new Vector3(1, 2, 3),
                quaternion: new Quaternion(0, 0, 0, 1),
            },
        ]

        controls.setPoses(poses)

        expect(((controls as any).boundPoses as BoundPose[]).length).toBe(1)
        expect((controls as any).historyIdx).toBe(0)
        expect(((controls as any).history as Pose[])[0].position.toArray()).toBeCloseToArray([1, 2, -2.072])
        expect(((controls as any).history as Pose[])[0].quaternion.toArray()).toBeCloseToArray([0, 1, 0, 0])
        expect(((controls as any).boundPoses as BoundPose[])[0].bounds.min.toArray()).toBeCloseToArray([0.5, 1.5, 2.5])
        expect(((controls as any).boundPoses as BoundPose[])[0].bounds.max.toArray()).toBeCloseToArray([1.5, 2.5, 3.5])
        expect(((controls as any).boundPoses as BoundPose[])[0].quaternion.toArray()).toBeCloseToArray([0, 0, 0, 1])
    })

    it("should handle mouse wheel events to navigate poses", () => {
        vi.useFakeTimers()

        const camera = new PerspectiveCamera()
        const boundPoses = [] as BoundPose[]
        const controls = new TourControls(camera, boundPoses, mockDomElement)

        const poses = [
            {
                position: new Vector3(1, 2, 3),
                quaternion: new Quaternion(0, 0, 0, 1),
            },
            {
                position: new Vector3(4, 5, 6),
                quaternion: new Quaternion(0, -1, 0, 0),
            },
        ]

        controls.setPoses(poses)

        vi.advanceTimersByTime(400)
        controls.update()

        expect(((controls as any).history as Pose[])[0].position.toArray()).toBeCloseToArray([1, 2, -2.072])
        expect(((controls as any).history as Pose[])[0].quaternion.toArray()).toBeCloseToArray([0, 1, 0, 0])
        expect(((controls as any).history as Pose[])[1].position.toArray()).toBeCloseToArray([4, 5, 11.072])
        expect(((controls as any).history as Pose[])[1].quaternion.toArray()).toBeCloseToArray([0, 0, 0, 1])

        mockDomElement.dispatchEvent(new WheelEvent("wheel", { deltaY: -1 }))

        vi.advanceTimersByTime(400)
        controls.update()

        expect((controls as any).historyIdx).toBe(1)

        mockDomElement.dispatchEvent(new WheelEvent("wheel", { deltaY: 1 }))

        vi.advanceTimersByTime(400)
        controls.update()

        expect((controls as any).historyIdx).toBe(0)

        vi.useRealTimers()
    })

    it("should update tween group on update call", () => {
        const camera = new PerspectiveCamera()
        const boundPoses = [] as BoundPose[]
        const controls = new TourControls(camera, boundPoses, mockDomElement)

        const updateSpy = vi.spyOn(controls["tweenGroup"], "update")

        controls.update(1000)

        expect(updateSpy).toHaveBeenCalledWith(1000)
    })
})
