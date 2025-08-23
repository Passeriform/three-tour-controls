import { BoxGeometry, Mesh, MeshBasicMaterial, PerspectiveCamera, Quaternion, Vector3, type Vector3Tuple } from "three"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import TourControls from "./TourControls"

describe("TourControls", () => {
    let controls: TourControls<Mesh>
    let domElement: HTMLDivElement
    const camera = new PerspectiveCamera(75, 2, 0.1, 100)

    const createMesh = (position: Vector3Tuple) => {
        const mesh = new Mesh(new BoxGeometry(1, 1, 1), new MeshBasicMaterial())
        mesh.position.set(...position)
        mesh.updateMatrixWorld(true)
        return mesh
    }

    const timeSkip = () => {
        vi.runAllTimers()
        controls.update(Infinity)
    }

    const goForward = () => {
        domElement.dispatchEvent(new WheelEvent("wheel", { deltaY: -1 }))
        timeSkip()
    }

    const goBackward = () => {
        domElement.dispatchEvent(new WheelEvent("wheel", { deltaY: 1 }))
        timeSkip()
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
            const quaternion = new Quaternion(0, 0, 0, 1)

            controls.setItinerary([{ meshes: [mesh], quaternion, distance: 5 }])
            timeSkip()
            window.innerWidth = 800
            window.innerHeight = 400

            window.dispatchEvent(new Event("resize"))
            timeSkip()
            expect(camera.aspect).toBe(2)
        })

        it("navigates forward and backward through multiple itinerary locations", () => {
            const mesh1 = createMesh([0, 0, 0])
            const mesh2 = createMesh([10, 0, 0])
            const quaternion = new Quaternion(0, 0, 0, 1)

            controls.setItinerary([
                { meshes: [mesh1], quaternion, distance: 5 },
                { meshes: [mesh2], quaternion, distance: 5 },
            ])
            timeSkip()
            expect(camera.position.toArray()).toBeCloseToArray([0, 0, 5])

            goForward()
            expect(camera.position.toArray()).toBeCloseToArray([10, 0, 5])

            goBackward()
            expect(camera.position.toArray()).toBeCloseToArray([0, 0, 5])
        })
    })

    describe("detour camera movement", () => {
        const mesh1 = createMesh([0, 0, 0])
        const mesh2 = createMesh([10, 0, 0])
        const mesh3 = createMesh([20, 0, 0])
        const mesh4 = createMesh([30, 0, 0])
        const mesh5 = createMesh([40, 0, 0])
        const quaternion = new Quaternion(0, 0, 0, 1)
        const detourMesh = createMesh([25, 0, 5])
        const detourQuaternion = new Quaternion(0, 1, 0, 0)
        const strategies: ["same" | "next" | "first" | "last", Vector3Tuple][] = [
            ["same", [20, 0, 15]],
            ["next", [30, 0, 20]],
            ["first", [0, 0, 5]],
            ["last", [40, 0, 25]],
        ]

        it.each(strategies)("supports detour exit strategy: %s", (strategy, expectedPosition) => {
            controls.setItinerary([
                { meshes: [mesh1], quaternion, distance: 5 },
                { meshes: [mesh2], quaternion, distance: 10 },
                { meshes: [mesh3], quaternion, distance: 15 },
                { meshes: [mesh4], quaternion, distance: 20 },
                { meshes: [mesh5], quaternion, distance: 25 },
            ])
            timeSkip()
            goForward()
            goForward()

            controls["detourExitStrategy"] = strategy
            controls.detour({ meshes: [detourMesh], quaternion: detourQuaternion, distance: 5 })
            timeSkip()
            expect(camera.position.toArray()).toBeCloseToArray([25, 0, 0])

            goForward()
            expect(camera.position.toArray()).toBeCloseToArray(expectedPosition)
        })

        it("does not add detour if already detoured to the mesh", () => {
            controls.setItinerary([{ meshes: [mesh1], quaternion, distance: 5 }])
            timeSkip()

            controls.detour({ meshes: [mesh2], quaternion, distance: 5 })
            timeSkip()
            controls.detour({ meshes: [mesh2], quaternion, distance: 10 })
            timeSkip()

            expect(controls["detourLocations"].length).toBe(1)
            expect(controls["detourLocations"][0]?.distance).toBe(5)
        })
    })

    it("should dispatch 'transitionChange', 'change' and 'navigate' events", async () => {
        camera.position.set(100, 100, 100)
        camera.quaternion.set(0, 0, 0, 1)
        camera.updateMatrixWorld(true)
        controls.timing = 1000

        const mesh1 = createMesh([30, 0, 0])
        const mesh2 = createMesh([40, 0, 0])
        const quaternion = new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), Math.PI / 2)

        const transitionChangeHandler = vi.fn()
        const changeHandler = vi.fn()
        const navigateHandler = vi.fn()

        controls.addEventListener("transitionChange", transitionChangeHandler)
        controls.addEventListener("change", changeHandler)
        controls.addEventListener("navigate", navigateHandler)

        controls.setItinerary([
            { meshes: [mesh1], quaternion, distance: 5 },
            { meshes: [mesh2], quaternion, distance: 5 },
        ])
        timeSkip()

        expect(changeHandler).toHaveBeenCalledTimes(2)
        expect(transitionChangeHandler).toHaveBeenCalledTimes(4)
        expect(transitionChangeHandler).toHaveBeenNthCalledWith(1, expect.objectContaining({ transitioning: true }))
        expect(transitionChangeHandler).toHaveBeenNthCalledWith(2, expect.objectContaining({ transitioning: true }))
        expect(transitionChangeHandler).toHaveBeenNthCalledWith(3, expect.objectContaining({ transitioning: false }))
        expect(transitionChangeHandler).toHaveBeenNthCalledWith(4, expect.objectContaining({ transitioning: false }))
        expect(navigateHandler).toHaveBeenCalledTimes(2)
        expect(navigateHandler).toHaveBeenNthCalledWith(1, expect.objectContaining({ location: [mesh2] }))
        expect(navigateHandler).toHaveBeenNthCalledWith(2, expect.objectContaining({ location: [mesh1] }))
        changeHandler.mockClear()
        transitionChangeHandler.mockClear()
        navigateHandler.mockClear()

        goForward()

        expect(changeHandler).toHaveBeenCalledTimes(1)
        expect(transitionChangeHandler).toHaveBeenCalledTimes(2)
        expect(transitionChangeHandler).toHaveBeenNthCalledWith(1, expect.objectContaining({ transitioning: true }))
        expect(transitionChangeHandler).toHaveBeenNthCalledWith(2, expect.objectContaining({ transitioning: false }))
        expect(navigateHandler).toHaveBeenCalledTimes(1)
        expect(navigateHandler).toHaveBeenNthCalledWith(1, expect.objectContaining({ location: [mesh2] }))
    })

    describe("camera remains stationary", () => {
        it("does not move camera pose on construction", () => {
            expect(camera.position.toArray()).toBeCloseToArray([0, 0, 10])
            expect(camera.quaternion.toArray()).toBeCloseToArray([0, 0, 0, 1])
        })

        it("does not move camera pose if itinerary is empty", () => {
            controls.setItinerary([])
            timeSkip()

            expect(camera.position.toArray()).toBeCloseToArray([0, 0, 10])
            expect(camera.quaternion.toArray()).toBeCloseToArray([0, 0, 0, 1])

            goForward()

            expect(camera.position.toArray()).toBeCloseToArray([0, 0, 10])
            expect(camera.quaternion.toArray()).toBeCloseToArray([0, 0, 0, 1])
        })

        it("does not move camera when controls are disabled", () => {
            const mesh1 = createMesh([0, 0, 0])
            const mesh2 = createMesh([10, 0, 0])
            const quaternion = new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), Math.PI / 2)
            controls.enabled = false
            controls.setItinerary([
                { meshes: [mesh1], quaternion, distance: 5 },
                { meshes: [mesh2], quaternion, distance: 5 },
            ])
            timeSkip()

            goForward()
            timeSkip()

            expect(camera.position.toArray()).toBeCloseToArray([0, 0, 10])
            expect(camera.quaternion.toArray()).toBeCloseToArray([0, 0, 0, 1])
        })
    })

    it("moves camera with a different target rotation", () => {
        const mesh1 = createMesh([0, 0, 0])
        const mesh2 = createMesh([10, 0, 0])
        const quaternion = new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), Math.PI / 2)
        controls.setItinerary([
            { meshes: [mesh1], quaternion, distance: 5 },
            { meshes: [mesh2], quaternion, distance: 5 },
        ])
        timeSkip()

        goForward()

        expect(camera.position.toArray()).toBeCloseToArray([15, 0, 0])
        expect(camera.quaternion.toArray()).toBeCloseToArray([0, 0.707, 0, 0.707])
    })

    it("does not move camera when transitioning", () => {
        const mesh1 = createMesh([0, 0, 0])
        const mesh2 = createMesh([10, 0, 0])
        const quaternion = new Quaternion(0, 0, 0, 1)
        controls.setItinerary([
            { meshes: [mesh1], quaternion, distance: 5 },
            { meshes: [mesh2], quaternion, distance: 5 },
        ])
        timeSkip()

        controls["transitioning"] = true
        goForward()

        expect(camera.position.toArray()).toBeCloseToArray([0, 0, 5])
        expect(camera.quaternion.toArray()).toBeCloseToArray([0, 0, 0, 1])

        controls["transitioning"] = false
        goForward()

        expect(camera.position.toArray()).toBeCloseToArray([10, 0, 5])
        expect(camera.quaternion.toArray()).toBeCloseToArray([0, 0, 0, 1])
    })

    it("throws if a location's meshes are empty", () => {
        const quaternion = new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), Math.PI / 2)
        expect(() => {
            controls.setItinerary([{ meshes: [], quaternion, distance: 1 }])
        }).toThrow("Location must contain at least one mesh")
    })

    it("throws if a location's meshes are invalid", () => {
        expect(() => {
            controls.setItinerary([{ meshes: [null as any], quaternion: new Quaternion(), distance: 1 }])
        }).toThrow("Location contains an invalid mesh")
    })
})
