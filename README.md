# TourControls

**TourControls** is a lightweight, customizable control for **Three.js** that allows you to navigate through a series of predefined "poses" using scroll events. This control provides an intuitive way to cycle through different camera positions or orientations in your 3D scene like a tour.

## Installation

You can install TourControls via npm:

```bash
npm install @passeriform/three-tour-controls
```

Or, if you use Yarn:

```bash
yarn add @passeriform/three-tour-controls
```

## Usage

To use **TourControls** in your Three.js project, follow these steps:

### 1. Import TourControls

First, make sure you import both **Three.js** and **TourControls**.

```ts
import * as THREE from "three"
import TourControls from "@passeriform/three-tour-controls"
```

### 2. Set Up the Camera and Scene

Create a basic Three.js scene and camera.

```ts
const scene = new THREE.Scene()
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
const renderer = new THREE.WebGLRenderer()
document.body.appendChild(renderer.domElement)
renderer.setSize(window.innerWidth, window.innerHeight)

// Add some objects to your scene (optional)
const geometry = new THREE.BoxGeometry()
const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 })
const cube = new THREE.Mesh(geometry, material)
scene.add(cube)
```

### 3. Define an Itinerary

Each location in the itinerary is a set of meshes and a target quaternion. The camera will move to frame the meshes from the given orientation.

```ts
const itinerary = [
    {
        meshes: [mesh1],
        quaternion: new THREE.Quaternion().setFromEuler(new THREE.Euler(0, Math.PI / 4, 0)),
    },
    {
        meshes: [mesh2a, mesh2b],
        quaternion: new THREE.Quaternion().setFromEuler(new THREE.Euler(0, Math.PI / 2, 0)),
    },
    {
        meshes: [mesh3],
        quaternion: new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.PI / 4, 0, 0)),
    },
]
```

### 4. Initialize TourControls

Attach the `TourControls` instance to the camera.

```ts
const controls = new TourControls(camera, renderer.domElement)

controls.setItinerary(itinerary)

// Optionally adjust the timing and viewing distance for locations
controls.timing = 1000 // default: 400
controls.setViewingDistance(8) // default: 4
```

### 5. Navigation

Use the mouse wheel to navigate through the itinerary. The camera will animate to each location.

```ts
function animate() {
    requestAnimationFrame(animate)

    // Update the controls
    controls.update()

    // Render the scene from the camera's perspective
    renderer.render(scene, camera)
}

animate()
```

### 6. Handling Window Resize

Camera aspect ratio is automatically updated when window is resized.

### 7. Updating the Itinerary

You can update the itinerary at any time.

```ts
controls.setItinerary(newItinerary)
```

## API

### `TourControls(camera: THREE.PerspectiveCamera, domElement?: HTMLElement)`

- **camera**: The Three.js perspective camera you want to control.
- **domElement**: The HTML element to attach event listeners to (optional).

### `controls.setItinerary(locations: Array<{ meshes: THREE.Mesh[], quaternion: THREE.Quaternion }>)`

Set the base locations the control can move the camera to along with their target orientation.

- **location**: Array of objects representing locations. Each object should have:
    - `meshes`: Array of meshes to frame.
    - `quaternion`: Target orientation for the camera.

### `controls.pushItinerary(meshes: THREE.Mesh[], quaternion: THREE.Quaternion)`

Add a new location to the itinerary and navigate to it.

- **meshes**: Array of meshes to focus on.
- **quaternion**: Target orientation for the camera.

### `controls.setViewingDistance(distance: number)`

Set the camera's distance from the framed meshes.

### `controls.setHomePose(pose: { position: THREE.Vector3, quaternion: THREE.Quaternion })`

Set the home pose for the camera. When navigation is goes before the first location via scroll, the camera will return to this pose.

### `controls.setExitToHomeFlag(value: boolean)`

If set to `true`, scrolling past the first pose will return the camera to the home pose and clear navigation history.

### `controls.timing: number`

The speed of animating the camera across locations in milliseconds. Default: `400`.

### `controls.connect(element: HTMLElement)`

Manually attach event listeners to a specific DOM element. This is called automatically in the constructor if a `domElement` is provided, but can be used to re-attach listeners if needed.

### `controls.update(time?: number)`

Updates the internal tween animations. Call this in your render loop.

### `controls.clear()`

Clears all animations and disposes of the controls.

## Example

```ts
import * as THREE from "three"
import TourControls from "@passeriform/three-tour-controls"

const scene = new THREE.Scene()
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
const renderer = new THREE.WebGLRenderer()
document.body.appendChild(renderer.domElement)

const cube = new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshBasicMaterial({ color: 0x00ff00 }))
const sphere = new THREE.Mesh(new THREE.SphereGeometry(), new THREE.MeshBasicMaterial({ color: 0xff0000 }))
const torus = new THREE.Mesh(new THREE.TorusGeometry(), new THREE.MeshBasicMaterial({ color: 0x0000ff }))
scene.add(cube, sphere, torus)

const itinerary = [
    {
        meshes: [cube, sphere],
        quaternion: new THREE.Quaternion().setFromEuler(new THREE.Euler(0, Math.PI / 4, 0)),
    },
    {
        meshes: [torus],
        quaternion: new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.PI / 6, Math.PI / 2, 0)),
    },
    {
        meshes: [cube, torus],
        quaternion: new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, Math.PI / 3)),
    },
]

const controls = new TourControls(camera, renderer.domElement)
controls.setItinerary(itinerary)
controls.timing = 1000

function animate() {
    requestAnimationFrame(animate)
    controls.update()
    renderer.render(scene, camera)
}

animate()

window.addEventListener("resize", () => {
    renderer.setSize(window.innerWidth, window.innerHeight)
})
```

## License

MIT License. See [LICENSE](LICENSE) for details.
