import { Group as TweenGroup } from "@tweenjs/tween.js"
import { Box3, Camera, Object3D, Quaternion, Vector3 } from "three"
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest"
import { animatePoseTransform, lookAtFromQuaternion, unpackBounds } from "./utility"

describe("unpackBounds", () => {
    it("should return the center and size of the Box3 bounds", () => {
        const bounds = new Box3(new Vector3(0, 0, 0), new Vector3(2, 2, 2))
        const [center, size] = unpackBounds(bounds)

        expect(center.toArray()).toEqual([1, 1, 1])
        expect(size.toArray()).toEqual([2, 2, 2])
    })
})

describe("lookAtFromQuaternion", () => {
    it("should return quaternion rotated along camera UP axis by 180 degrees", () => {
        const camera = new Camera()
        const quaternion = new Quaternion(0, 0, 0, 1)

        const result = lookAtFromQuaternion(camera, quaternion)

        expect(result.toArray()).toBeCloseToArray([0, 1, 0, 0])
    })

    it("should return rotated quaternion given a complex quaternion", () => {
        const camera = new Camera()
        const quaternion = new Quaternion(0.5, 0.5, 0.5, 0.5).normalize()

        const result = lookAtFromQuaternion(camera, quaternion)

        expect(result.toArray()).toBeCloseToArray([-0.5, 0.5, 0.5, -0.5])
    })

    it("should return rotated quaternion given a different camera UP axis", () => {
        const camera = new Camera()
        camera.up.set(1, 1, 1).normalize()
        const quaternion = new Quaternion(0, 0, 0, 1)

        const result = lookAtFromQuaternion(camera, quaternion)

        expect(result.toArray()).toBeCloseToArray([0.577, 0.577, 0.577, 0], 3)
    })
})

describe("animatePoseTransform", () => {
    const mockPose = {
        position: new Vector3(1, 2, 3),
        quaternion: new Quaternion(1, 2, 3, 4).normalize(),
    }

    beforeAll(() => {
        vi.useFakeTimers()
    })

    beforeEach(() => {
        vi.clearAllTimers()
    })

    afterAll(() => {
        vi.useRealTimers()
    })

    it("should start a tween for transforming the pose", () => {
        const group = new TweenGroup()
        const object = new Object3D()
        const onComplete = vi.fn()

        animatePoseTransform(group, object, mockPose, { timing: 500, onComplete })

        expect(group.getAll().length).toBe(1)

        vi.advanceTimersByTime(250)

        group.update()

        expect(object.position.toArray()).toBeCloseToArray([0.5, 1, 1.5])
        expect(object.quaternion.toArray()).toBeCloseToArray([0.098, 0.196, 0.294, 0.93], 3)

        vi.advanceTimersByTime(250)
        group.update()

        expect(object.position.toArray()).toBeCloseToArray([1, 2, 3])
        expect(object.quaternion.toArray()).toBeCloseToArray([0.182, 0.365, 0.547, 0.73])
        expect(onComplete).toHaveBeenCalled()
    })
})
