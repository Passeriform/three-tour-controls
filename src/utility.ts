import { Box3, Camera, Object3D, Quaternion, Vector3 } from "three"
import { Easing, Tween, Group as TweenGroup } from "@tweenjs/tween.js"
import type { Pose } from "./types"

export const unpackBounds = (bounds: Box3) => {
    const boundCenter = new Vector3()
    const boundSize = new Vector3()
    bounds.getCenter(boundCenter)
    bounds.getSize(boundSize)
    return [boundCenter, boundSize] as [Vector3, Vector3]
}

export const lookAtFromQuaternion = (cam: Camera, q: Quaternion) =>
    q.clone().multiply(new Quaternion().setFromAxisAngle(cam.up, Math.PI)).normalize()

export const DEFAULT_TWEEN_OPTIONS = {
    timing: 1000,
}

export type TweenOptions = Partial<{
    timing: number
    onComplete: () => void
}>

export const tweenTransform = (
    group: TweenGroup,
    object: Object3D,
    to: Pose,
    tweenOptions: TweenOptions = DEFAULT_TWEEN_OPTIONS,
) => {
    if (!group) {
        return
    }

    const qFrom = object.quaternion.clone()
    const qTo = to.quaternion.normalize()

    group.add(
        new Tween({ position: object.position.clone(), time: 0 })
            .to({ position: to.position, time: 1 }, tweenOptions.timing ?? DEFAULT_TWEEN_OPTIONS.timing)
            .easing(Easing.Cubic.InOut)
            .onUpdate(({ position, time }) => {
                object.position.copy(position)
                object.quaternion.slerpQuaternions(qFrom, qTo, time)
            })
            .onComplete(() => {
                tweenOptions.onComplete?.()
            })
            .start(),
    )
}