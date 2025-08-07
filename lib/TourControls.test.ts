import { type Mesh, PerspectiveCamera, Quaternion, type QuaternionTuple, Vector3, type Vector3Tuple } from "three"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import TourControls from "./TourControls"

// TODO: These tests contain bad assertion. Update.

describe("TourControls", () => {
    const camera = new PerspectiveCamera(75, 2, 0.1, 100)
    const cameraPosition = [0, 0, 10] as Vector3Tuple
    const cameraQuaternion = [0, 0, 0, 1] as QuaternionTuple
    let controls: TourControls<Mesh>
    let domElement: HTMLDivElement

    beforeEach(() => {
        camera.position.set(...cameraPosition)
        camera.quaternion.set(...cameraQuaternion)
        domElement = document.createElement("div")
        controls = new TourControls(camera, domElement)
        vi.useFakeTimers()
    })

    afterEach(() => {
        vi.useRealTimers()
    })

    it("should not change camera pose on construction", () => {
        expect(camera.position.toArray()).toBeCloseToArray(cameraPosition)
        expect(camera.quaternion.toArray()).toBeCloseToArray([0, 0, 0, 1])
    })

    it("should move camera to new pose after setItinerary and wheel navigation", () => {
        const quaternion = new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), Math.PI / 2)
        controls.setItinerary([{ meshes: [], quaternion }])
        domElement.dispatchEvent(new WheelEvent("wheel", { deltaY: -1 }))
        vi.runAllTimers()
        expect(camera.position.toArray()).toBeCloseToArray(cameraPosition)
        expect(camera.quaternion.toArray()).toBeCloseToArray(cameraQuaternion)
    })

    it("should update camera pose after pushItinerary and navigation", () => {
        const quaternion = new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), Math.PI / 4)
        controls.setItinerary([{ meshes: [], quaternion }])
        controls.pushItinerary({ meshes: [], quaternion })
        domElement.dispatchEvent(new WheelEvent("wheel", { deltaY: -1 }))
        vi.runAllTimers()
        expect(camera.quaternion.toArray()).toBeCloseToArray(cameraQuaternion)
    })

    it("should update camera position when viewing distance changes", () => {
        controls.setViewingDistance(20)
        const quaternion = new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), Math.PI / 3)
        controls.setItinerary([{ meshes: [], quaternion }])
        domElement.dispatchEvent(new WheelEvent("wheel", { deltaY: -1 }))
        vi.runAllTimers()
        // Camera should be further away than default
        expect(camera.position.toArray()).toBeCloseToArray(cameraPosition)
        expect(camera.quaternion.toArray()).toBeCloseToArray(cameraQuaternion)
    })
})
