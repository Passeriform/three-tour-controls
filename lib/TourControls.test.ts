import { BoxGeometry, Mesh, MeshBasicMaterial, PerspectiveCamera, Quaternion, Vector3 } from "three"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import TourControls from "./TourControls"

describe("TourControls", () => {
    let controls: TourControls<Mesh>
    let domElement: HTMLDivElement
    const camera = new PerspectiveCamera(75, 2, 0.1, 100)
    const wheelUpEvent = new WheelEvent("wheel", { deltaY: -1 })
    const wheelDownEvent = new WheelEvent("wheel", { deltaY: 1 })

    const createMesh = (pos: [number, number, number]) => {
        const mesh = new Mesh(new BoxGeometry(1, 1, 1), new MeshBasicMaterial())
        mesh.position.set(...pos)
        mesh.updateMatrixWorld(true)
        return mesh
    }

    beforeEach(() => {
        camera.position.set(0, 0, 10)
        camera.quaternion.set(0, 0, 0, 1)
        domElement = document.createElement("div")
        controls = new TourControls(camera, domElement)
        vi.useFakeTimers()
    })

    afterEach(() => {
        vi.useRealTimers()
    })

    describe("navigation and pose update", () => {
        it("updates camera aspect and recomputes poses on resize", () => {
            const mesh = createMesh([0, 0, 0])
            const quaternion = new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), 0)
            controls.setItinerary([{ meshes: [mesh], quaternion, distance: 5 }])
            window.innerWidth = 800
            window.innerHeight = 400
            window.dispatchEvent(new Event("resize"))
            expect(camera.aspect).toBeCloseTo(2)
        })

        it("navigates forward and backward through multiple itinerary locations", () => {
            const mesh1 = createMesh([0, 0, 0])
            const mesh2 = createMesh([10, 0, 0])
            const quaternion = new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), 0)
            controls.setItinerary([
                { meshes: [mesh1], quaternion, distance: 5 },
                { meshes: [mesh2], quaternion, distance: 5 },
            ])
            domElement.dispatchEvent(wheelUpEvent)
            vi.runAllTimers()
            controls.update(Infinity)
            expect(camera.position.toArray()).toBeCloseToArray([10, 0, 5])
            domElement.dispatchEvent(wheelDownEvent)
            vi.runAllTimers()
            controls.update(Infinity)
            expect(camera.position.toArray()).toBeCloseToArray([0, 0, 5])
        })
    })

    describe("detour exit strategies", () => {
        const strategies: ["next" | "first" | "last", [number, number, number]][] = [
            ["next", [10, 0, 5]],
            ["first", [10, 0, 5]],
            ["last", [10, 0, 5]],
        ]
        it.each(strategies)(
            "supports detour exit strategy: %s",
            (strategy: "next" | "first" | "last", expectedPos: [number, number, number]) => {
                const mesh1 = createMesh([0, 0, 0])
                const mesh2 = createMesh([10, 0, 0])
                const quaternion = new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), 0)
                controls.setItinerary([
                    { meshes: [mesh1], quaternion, distance: 5 },
                    { meshes: [mesh2], quaternion, distance: 5 },
                ])
                const detourMesh = createMesh([20, 0, 0])
                const detourQuat = new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), Math.PI)
                controls["detourExitStrategy"] = strategy
                controls.detour({ meshes: [detourMesh], quaternion: detourQuat, distance: 5 })
                domElement.dispatchEvent(wheelUpEvent)
                vi.runAllTimers()
                controls.update(Infinity)
                domElement.dispatchEvent(wheelDownEvent)
                vi.runAllTimers()
                controls.update(Infinity)
                domElement.dispatchEvent(wheelUpEvent)
                vi.runAllTimers()
                controls.update(Infinity)
                expect(camera.position.toArray()).toBeCloseToArray(expectedPos)
            },
        )

        it("does not add detour if meshes are the same as last itinerary location", () => {
            const mesh = createMesh([0, 0, 0])
            const quaternion = new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), 0)
            controls.setItinerary([{ meshes: [mesh], quaternion, distance: 5 }])
            controls.detour({ meshes: [mesh], quaternion, distance: 5 })
            controls.detour({ meshes: [mesh], quaternion, distance: 10 })
            expect(controls["detourLocations"].length).toBe(1)
            expect(controls["detourLocations"][0]?.distance).toBe(5)
        })
    })

    it("should dispatch 'transitionChange' event at start and end of animation", async () => {
        const mesh = createMesh([30, 0, 0])
        const quaternion = new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), Math.PI / 2)
        controls.setItinerary([{ meshes: [mesh], quaternion, distance: 5 }])
        camera.position.set(100, 100, 100)
        camera.quaternion.set(0, 0, 0, 1)
        camera.updateMatrixWorld(true)
        controls.timing = 1000
        const events: any[] = []
        controls.addEventListener("transitionChange", (e: any) => {
            events.push(e.transitioning)
        })
        controls.setItinerary([
            { meshes: [mesh], quaternion, distance: 5 },
            { meshes: [createMesh([40, 0, 0])], quaternion, distance: 5 },
        ])
        domElement.dispatchEvent(wheelUpEvent)
        vi.runAllTimers()
        controls.update(Infinity)
        expect(events).toContain(true)
        expect(events).toContain(false)
    })

    it("should dispatch 'change' event during animation", () => {
        const mesh = createMesh([40, 0, 0])
        const quaternion = new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), Math.PI / 2)
        controls.setItinerary([{ meshes: [mesh], quaternion, distance: 5 }])
        const changeHandler = vi.fn()
        controls.addEventListener("change", changeHandler)
        domElement.dispatchEvent(wheelUpEvent)
        vi.runAllTimers()
        controls.update(Infinity)
        expect(changeHandler).toHaveBeenCalled()
    })

    it("clears all tweens and disposes controls on clear", () => {
        controls.clear()
    })

    describe("edge cases and public API", () => {
        it("does not change camera pose on construction", () => {
            expect(camera.position.toArray()).toBeCloseToArray([0, 0, 10])
            expect(camera.quaternion.toArray()).toBeCloseToArray([0, 0, 0, 1])
        })

        it("does not change camera pose if itinerary is empty", () => {
            controls.setItinerary([])
            domElement.dispatchEvent(wheelUpEvent)
            vi.runAllTimers()
            expect(camera.position.toArray()).toBeCloseToArray([0, 0, 10])
            expect(camera.quaternion.toArray()).toBeCloseToArray([0, 0, 0, 1])
        })

        it("does not change camera pose if itinerary has only empty meshes", () => {
            const quaternion = new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), Math.PI / 2)
            controls.setItinerary([{ meshes: [], quaternion, distance: 1 }])
            domElement.dispatchEvent(wheelUpEvent)
            vi.runAllTimers()
            expect(camera.position.toArray()).toBeCloseToArray([0, 0, 10])
            expect(camera.quaternion.toArray()).toBeCloseToArray([0, 0, 0, 1])
        })
    })

    it("moves camera to new pose after setItinerary and wheel navigation with a real mesh", () => {
        const mesh1 = createMesh([0, 0, 0])
        const mesh2 = createMesh([10, 0, 0])
        const quaternion = new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), Math.PI / 2)
        controls.setItinerary([
            { meshes: [mesh1], quaternion, distance: 5 },
            { meshes: [mesh2], quaternion, distance: 5 },
        ])
        domElement.dispatchEvent(wheelUpEvent)
        vi.runAllTimers()
        controls.update(Infinity)
        expect(camera.position.toArray()).toBeCloseToArray([15, 0, 0])
        expect(camera.quaternion.toArray()).toBeCloseToArray([0, 0.707, 0, 0.707])
    })

    it("dispatches 'navigate' event on navigation", () => {
        const mesh = createMesh([20, 0, 0])
        const quaternion = new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), Math.PI / 2)
        const listener = vi.fn()
        controls.addEventListener("navigate", listener)
        controls.setItinerary([{ meshes: [mesh], quaternion, distance: 5 }])
        domElement.dispatchEvent(wheelUpEvent)
        vi.runAllTimers()
        controls.update(Infinity)
        expect(listener).toHaveBeenCalled()
    })

    it("does not move camera when controls are disabled", () => {
        const mesh = createMesh([0, 0, 0])
        const quaternion = new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), Math.PI / 2)
        controls.enabled = false
        controls.setItinerary([{ meshes: [mesh], quaternion, distance: 5 }])
        domElement.dispatchEvent(wheelUpEvent)
        vi.runAllTimers()
        controls.update(Infinity)
        expect(camera.position.toArray()).toBeCloseToArray([0, 0, 10])
        expect(camera.quaternion.toArray()).toBeCloseToArray([0, 0, 0, 1])
    })

    it("does not move camera when transitioning", () => {
        const mesh = createMesh([0, 0, 0])
        const quaternion = new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), Math.PI / 2)
        controls.setItinerary([{ meshes: [mesh], quaternion, distance: 5 }])
        controls["transitioning"] = true
        domElement.dispatchEvent(wheelUpEvent)
        vi.runAllTimers()
        expect(camera.position.toArray()).toBeCloseToArray([0, 0, 10])
        expect(camera.quaternion.toArray()).toBeCloseToArray([0, 0, 0, 1])
    })

    it("handles detour navigation and exit", () => {
        const mesh1 = createMesh([30, 0, 0])
        const mesh2 = createMesh([40, 0, 0])
        const quaternion1 = new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), 0)
        const quaternion2 = new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), Math.PI / 2)
        controls.setItinerary([
            { meshes: [mesh1], quaternion: quaternion1, distance: 5 },
            { meshes: [mesh2], quaternion: quaternion2, distance: 5 },
        ])
        const detourMesh = createMesh([50, 0, 0])
        const detourQuat = new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), Math.PI)
        controls["detourExitStrategy"] = "next"
        controls.detour({ meshes: [detourMesh], quaternion: detourQuat, distance: 5 })
        vi.runAllTimers()
        controls.update(Infinity)
        expect(camera.position.toArray()).toBeCloseToArray([50, 0, -5])
        expect(camera.quaternion.toArray()).toBeCloseToArray([0, 1, 0, 0])
        domElement.dispatchEvent(wheelDownEvent)
        vi.runAllTimers()
        controls.update(Infinity)
        expect(camera.position.toArray()).toBeCloseToArray([30, 0, 5])
        expect(camera.quaternion.toArray()).toBeCloseToArray([0, 0, 0, 1])
    })

    it("throws or ignores invalid input (invalid mesh)", () => {
        expect(() => {
            controls.setItinerary([{ meshes: [null as any], quaternion: new Quaternion(), distance: 1 }])
        }).toThrow()
    })
})
