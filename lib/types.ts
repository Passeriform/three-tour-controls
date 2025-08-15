import type { Mesh, Quaternion, Vector3 } from "three"

export type Pose = {
    position: Vector3
    quaternion: Quaternion
}

export type MeshPose<T extends Mesh = Mesh> = {
    meshes: T[]
    quaternion: Quaternion
    distance: number
}
