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

### 3. Create Camera Poses

Define the poses you want to cycle through. Each pose consists of a position and a rotation (or orientation).

```ts
const poses = [
    {
        position: new THREE.Vector3(10, 10, 10),
        quaternion: new THREE.Quaternion().setFromEuler(new THREE.Euler(0, Math.PI / 4, 0)),
    },
    {
        position: new THREE.Vector3(20, 10, 0),
        quaternion: new THREE.Quaternion().setFromEuler(new THREE.Euler(0, Math.PI / 2, 0)),
    },
    {
        position: new THREE.Vector3(0, 20, 10),
        quaternion: new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.PI / 4, 0, 0)),
    },
]
```

### 4. Initialize TourControls

Create and attach the `TourControls` instance to the camera. Pass in the array of predefined poses.

```ts
const controls = new TourControls(camera, poses)

// Timing of pose switching can be adjusted as required
controls.timing = 1000 // Timing for the pose transition in milliseconds (optional) [default: 400]
```

### 5. Render Loop

Use the animation loop to continuously update the camera and render the scene.

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

### 7. Updating Poses

Updating poses automatically marks the first pose as active and transitions to it.

```ts
const newPoses = [
    {
        position: new THREE.Vector3(0, 20, 10),
        quaternion: new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.PI / 4, 0, 0)),
    },
    {
        position: new THREE.Vector3(10, 10, 10),
        quaternion: new THREE.Quaternion().setFromEuler(new THREE.Euler(0, Math.PI / 4, 0)),
    },
    {
        position: new THREE.Vector3(20, 10, 0),
        quaternion: new THREE.Quaternion().setFromEuler(new THREE.Euler(0, Math.PI / 2, 0)),
    },
]
controls.setPoses(newPoses)
```

If you want to disable automatic animation when updating poses, set `transitionOnPoseChange` to `false`.
**NOTE:** Setting this option may cause undesirable user experience in the tour and is thus not recommended.

```ts
controls.transitionOnPoseChange = false
controls.setPoses(newPoses)
```

## API

### `TourControls(camera: THREE.PerspectiveCamera, boundPoses: Array<{ bounds: THREE.Box3, quaternion: THREE.Quaternion }>, domElement?: HTMLElement)`

- **camera**: The Three.js perspective camera you want to control.
- **boundPoses**: An array of objects representing the different camera poses. Each object should have:
    - `bounds`: The `THREE.Box3` bounding box for the pose.
    - `quaternion`: The `THREE.Quaternion` rotation (or orientation) for the camera.
- **domElement**: The HTML element to attach event listeners to (optional).

### `controls.setPoses(poses: Array<{ position: THREE.Vector3, quaternion: THREE.Quaternion }>, boundSize?: THREE.Vector3)`

- **poses**: An array of objects representing the different camera poses. Each object should have:
    - `position`: The `THREE.Vector3` position for the camera.
    - `quaternion`: The `THREE.Quaternion` rotation (or orientation) for the camera.
- **boundSize**: The size of the bounding box for each pose (optional, default: `new THREE.Vector3(1, 1, 1)`).

### `controls.setBoundPoses(boundPoses: Array<{ bounds: THREE.Box3, quaternion: THREE.Quaternion }>)`

- **boundPoses**: An array of objects representing the different camera poses. Each object should have:
    - `bounds`: The `THREE.Box3` bounding box for the pose.
    - `quaternion`: The `THREE.Quaternion` rotation (or orientation) for the camera.

### `controls.timing: number`

- The speed of transition across poses in milliseconds. Default: `400`.

### `controls.cameraOffset: number`

- Z-direction offset of camera from the given pose. This can be updated on runtime and will be used on the next transition.
  Changing this property does not trigger a transition by itself. Default: `400`.

### `controls.transitionOnPoseChange: boolean`

- Whether to begin a transition when the poses are updated using `setPoses()` or `setBoundPoses()`. Default: `true`.

### `controls.update(time?: number)`

- Updates the internal tween animations. Call this in your render loop.

### `controls.clear()`

- Clears all animations and disposes of the controls.

## Example

```ts
import * as THREE from "three"
import TourControls from "@passeriform/three-tour-controls"

const scene = new THREE.Scene()
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
const renderer = new THREE.WebGLRenderer()
document.body.appendChild(renderer.domElement)

const poses = [
    {
        position: new THREE.Vector3(10, 10, 10),
        quaternion: new THREE.Quaternion().setFromEuler(new THREE.Euler(0, Math.PI / 4, 0)),
    },
    {
        position: new THREE.Vector3(20, 10, 0),
        quaternion: new THREE.Quaternion().setFromEuler(new THREE.Euler(0, Math.PI / 2, 0)),
    },
    {
        position: new THREE.Vector3(0, 20, 10),
        quaternion: new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.PI / 4, 0, 0)),
    },
]

const controls = new TourControls(camera, poses)
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
