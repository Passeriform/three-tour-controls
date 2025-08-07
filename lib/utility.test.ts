import { Group as TweenGroup } from "@tweenjs/tween.js"
import { Object3D, Quaternion, Vector3 } from "three"
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest"
import { animatePoseTransform } from "./utility"

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
