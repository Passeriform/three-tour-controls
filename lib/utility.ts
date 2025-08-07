import { Easing, Tween, Group as TweenGroup } from "@tweenjs/tween.js"
import { type Object3D } from "three"
import type { Pose } from "./types"

export const DEFAULT_TWEEN_OPTIONS = {
    timing: 1000,
}

export type TweenOptions = Partial<{
    timing: number
    onUpdate: () => void
    onComplete: () => void
}>

export const animatePoseTransform = (
    group: TweenGroup,
    object: Object3D,
    to: Pose,
    tweenOptions: TweenOptions = DEFAULT_TWEEN_OPTIONS,
) => {
    if (!group) {
        return
    }

    const qFrom = object.quaternion.clone()
    const qTo = to.quaternion.clone().normalize()

    group.add(
        new Tween({ position: object.position.clone(), time: 0 })
            .to({ position: to.position, time: 1 }, tweenOptions.timing ?? DEFAULT_TWEEN_OPTIONS.timing)
            .easing(Easing.Cubic.InOut)
            .onUpdate(({ position, time }) => {
                object.position.copy(position)
                object.quaternion.slerpQuaternions(qFrom, qTo, time)
                tweenOptions.onUpdate?.()
            })
            .onComplete(() => {
                tweenOptions.onComplete?.()
            })
            .start(),
    )
}

export const equalsArray = <T>(a: T[], b: T[]) => {
    if (a.length !== b.length) {
        return false
    }

    for (var idx = 0; idx < a.length; idx++) {
        if (Array.isArray(a[idx]) && Array.isArray(b[idx])) {
            if (!equalsArray(a[idx] as any[], b[idx] as any[])) {
                return false
            }
        } else if (a[idx] !== b[idx]) {
            return false
        }
    }

    return true
}
