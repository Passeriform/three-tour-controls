import type { Box3, Quaternion, Vector3 } from "three"

export type Pose = {
    position: Vector3
    quaternion: Quaternion
}

export type BoundPose = {
    bounds: Box3
    quaternion: Quaternion
}