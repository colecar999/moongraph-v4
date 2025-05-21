# Cosmograph JavaScript Documentation

> This documentation is adapted from the official Cosmograph JavaScript docs: [Cosmograph JavaScript Docs](http://cosmograph.app/docs/cosmograph/Cosmograph%20JavaScript/Cosmograph/)

---

## Introduction

`Cosmograph` is a powerful and flexible visualization component built on top of the [`@cosmograph/cosmos`](https://github.com/cosmograph-org/cosmos) GPU-accelerated force graph layout algorithm and rendering engine. With its extensive configuration options and seamless integration with other components, `Cosmograph` is an essential tool for building graph data-driven applications.

---

## Creating a Cosmograph Instance

### React
```jsx
import { Cosmograph, CosmographProvider } from '@cosmograph/react'

export const Component = ({ nodes, links }) => {
  return (
    <Cosmograph nodes={nodes} links={links} />
  )
}
```

### JavaScript/TypeScript
```js
import { Cosmograph } from '@cosmograph/cosmograph'
import { nodes, links } from './path/to/data'

// Create an HTML element
const div = document.createElement('div')
document.body.appendChild(div)

// Create a Cosmograph instance with this element
const cosmograph = new Cosmograph(div)

// Set the data for the Cosmograph instance
cosmograph.setData(nodes, links)
```

### Example Data
```js
export const nodes = [
  { id: 'node1' },
  { id: 'node2' },
  { id: 'node3' },
]

export const links = [
  { source: 'node1', target: 'node2' },
  { source: 'node2', target: 'node3' },
]
```

---

## Passing the Data and Configuration

If you use React, the data and configuration can be passed as props to the `Cosmograph` component. React will take care of updating the graph when the data or configuration changes. If you use JavaScript, you can pass the data and configuration to the `Cosmograph` instance using the `setData` and `setConfig` methods.

### React
```jsx
<Cosmograph nodes={nodes} links={links} nodeColor={d => d.color} nodeSize={20} linkWidth={2} />
```

### JS/TS
```js
const config = {
  nodeColor: d => d.color,
  nodeSize: 20,
  linkWidth: 2,
}

cosmograph.setConfig(config)
cosmograph.setData(nodes, links)
```

You can load only nodes without any links into `Cosmograph`. In this case, `Cosmograph` will automatically configure itself to render the nodes as embeddings, without running a simulation.

If you want to simulate a network with links between nodes, check the [Simulation settings](#simulation-settings) section.

---

## Rendering Preferences

### Node Appearance

The appearance of the nodes in the `Cosmograph` can be customized using various configuration properties:

- `nodeColor`: Define the color of the nodes. Can be a function or a color string (Hex or RGBA). Default: `#b3b3b3`.
- `nodeSize`: Set the size of the nodes. Can be a function or a fixed value in pixels. Default: `4`.
- `nodeSizeScale`: Scale factor for node size. Default: `1`.
- `scaleNodesOnZoom`: Boolean, whether nodes scale on zoom. Default: `true`.

#### Example

```jsx
<Cosmograph
  ...
  nodeSize={(n, i) => n.size}
  nodeColor={(n, i) => n.color}
/>
```

```js
const config = {
  nodeSize: (n, i) => n.size,
  nodeColor: (n, i) => n.color,
}
cosmograph.setConfig(config)
```

### Node States

Nodes can be **selected**, **focused**, or **hovered**. Each state has its own set of properties:

- `nodeGreyoutOpacity`: Opacity of unselected nodes when a selection is active. Default: `0.1`.
- `focusedNodeRingColor`: Color of the focus ring. Default: `white`.
- `renderHoveredNodeRing`: Boolean to enable/disable hover ring. Default: `true`.
- `hoveredNodeRingColor`: Color of the hover ring. Default: `white`.

#### Example

```jsx
<Cosmograph
  ref={cosmographRef}
  hoveredNodeRingColor={'red'}
  focusedNodeRingColor={'yellow'}
  ...
/>
```

```js
const config = {
  hoveredNodeRingColor: 'red',
  focusedNodeRingColor: 'yellow',
}
cosmograph.setConfig(config)
cosmograph.focusNode({ id: 'node0' })
```

### Node Labels

- `nodeLabelAccessor`: Function to generate custom label text for each node. Default: `n => n.id`.
- `showDynamicLabels`: Show dynamic labels for visible nodes. Default: `true`.
- `showTopLabelsValueKey`: Key to calculate top nodes by. Default: `undefined`.
- `showTopLabelsLimit`: Max number of top nodes to show labels for. Default: `100`.
- `showTopLabels`: Boolean to turn top node labels on/off. Default: `false`.
- `showHoveredNodeLabel`: Show label for hovered node. Default: `true`.
- `showLabelsFor`: Array of nodes to always show labels for.

#### Example

```jsx
<Cosmograph
  ...
  showDynamicLabels={false}
  showLabelsFor={[{ id: "node0" }, { id: "node3" }]}
/>
```

```js
const config = {
  showDynamicLabels: false,
  showLabelsFor: [{ id: "node0" }, { id: "node3" }]
}
cosmograph.setConfig(config)
```

#### Styling Labels

- `nodeLabelClassName`, `hoveredNodeLabelClassName`: CSS class for labels.
- `nodeLabelColor`, `hoveredNodeLabelColor`: Color for labels.

---

### Link Customization

- `renderLinks`: Boolean to render links. Default: `true`.
- `linkColor`: Color of links. Function or color string. Default: `#666666`.
- `linkWidth`: Width of links. Function or value. Default: `1`.
- `linkWidthScale`: Scale factor for link width. Default: `1`.
- `linkArrows`: Show arrows at link ends. Default: `true`.
- `linkArrowsSizeScale`: Scale for arrow size. Default: `1`.
- `linkGreyoutOpacity`: Opacity of links when selection is active. Default: `0.1`.
- `linkVisibilityDistance`: Min/max link lengths in px. Default: `[50, 150]`.
- `linkVisibilityMinTransparency`: Transparency for longest links. Default: `0.25`.

#### Curved Links

- `curvedLinks`: Boolean to render curved links. Default: `false`.
- `curvedLinkSegments`: Number of segments in a curve. Default: `19`.
- `curvedLinkWeight`: Shape of the curve. Default: `0.8`.
- `curvedLinkControlPointDistance`: Control point position. Default: `0.5`.

#### Example

```jsx
const colors = ['#88C6FF', '#FF99D2', '#2748A4'];

<Cosmograph
  linkWidth={() => 1 + 2 * Math.random()}
  linkColor={() => colors[Math.floor(Math.random() * colors.length)]}
  ...
/>
```

```js
const colors = ['#88C6FF', '#FF99D2', '#2748A4'];

const config = {
  linkWidth: () => 1 + 2 * Math.random(),
  linkColor: () => colors[Math.floor(Math.random() * colors.length)]
}
cosmograph.setConfig(config)
```

---

### Tweaking Zoom

- `initialZoomLevel`: Initial zoom level. Default: `1`.
- `disableZoom`: Disable zoom and drag. Default: `false`.

### Fitting View

- `fitViewOnInit`: Center and zoom to fit all nodes on init. Default: `true`.
- `fitViewDelay`: Delay before fitting view (ms). Default: `250`.
- `fitViewByNodesInRect`: Rectangle to enclose nodes. Default: `undefined`.

### Miscellaneous

- `backgroundColor`: Canvas background color. Default: `#222222`.
- `showFPSMonitor`: Show WebGL performance monitor. Default: `false`.
- `pixelRatio`: Canvas pixel ratio. Default: `2`.
- `nodeSamplingDistance`: Min distance between sampled nodes. Default: `150` px.

---

## Simulation Settings

`Cosmograph` detects if a graph only contains nodes without links. In this case, it will automatically disable the simulation. If links are present, simulation is enabled by default.

- `disableSimulation`: Control simulation. `true`, `false`, or `null` (auto). Default: `null`.
- `spaceSize`: Size of simulation space. Default: `4096`.
- `randomSeed`: Randomness of layout. Default: `undefined`.

### Forces

| Name | Description | Range | Default |
|------|-------------|-------|---------|
| simulationRepulsion | Node repulsion strength | 0.0–2.0 | 0.1 |
| simulationRepulsionTheta | Many-Body force detail | 0.3–2.0 | 1.7 |
| simulationLinkSpring | Link spring force | 0.0–2.0 | 1.0 |
| simulationLinkDistance | Min distance between linked nodes | 1–20 | 2 |
| simulationGravity | Gravity force | 0.0–1.0 | 0.0 |
| simulationCenter | Centering force | 0.0–1.0 | 0.0 |
| simulationFriction | Friction coefficient | 0.8–1.0 | 0.85 |
| simulationDecay | Simulation decay | 100–10000 | 1000 |
| simulationRepulsionFromMouse | Repulsion from mouse | 0.0–5.0 | 2.0 |

#### Example

```jsx
<Cosmograph
  ...
  simulationFriction={0.1}
  simulationLinkSpring={0.5}
  simulationLinkDistance={2.0}
/>
```

```js
const config = {
  simulationFriction: 0.1,
  simulationLinkSpring: 0.5,
  simulationLinkDistance: 2.0,
}
cosmograph.setConfig(config)
```

### Quadtree Algorithm

- `useQuadtree`: Enable quadtree for Many-Body force. Default: `false`.
- `repulsionQuadtreeLevels`: Depth of Barnes-Hut approximation. Range: 5–12. Default: `12`.

---

## Events Configuration

`Cosmograph` supports several event handlers for user interactions:

### Mouse and Zoom Events
- `onClick(clickedNode, index, nodePosition, event)`
- `onLabelClick(node, event)`
- `onMouseMove(hoveredNode, index, nodePosition, event)`
- `onNodeMouseOver(hoveredNode, index, nodePosition, event)`
- `onNodeMouseOut(event)`
- `onZoomStart(event, userDriven)`
- `onZoom(event, userDriven)`
- `onZoomEnd(event, userDriven)`

### Simulation Callbacks
- `onSimulationStart()`
- `onSimulationTick(alpha, hoveredNode, index, nodePosition)`
- `onSimulationEnd()`
- `onSimulationPause()`
- `onSimulationRestart()`
- `onSetData(nodes, links)`

### Crossfilter Callbacks
- `onNodesFiltered(filteredNodes)`
- `onLinksFiltered(filteredLinks)`

---

## Controlling the Graph

You can control the graph via methods on the Cosmograph instance (JS/TS) or via refs in React.

### Node Methods
- `selectNode(node, selectAdjacentNodes)`
- `selectNodes(nodes)`
- `selectNodesInRange(selection)`
- `getSelectedNodes()`
- `unselectNodes()`
- `focusNode(node)`
- `getAdjacentNodes(id)`
- `getNodePositions()`
- `getNodePositionsMap()`
- `getNodePositionsArray()`
- `getSampledNodePositionsMap()`
- `getNodeDegrees()`
- `getNodeRadiusByIndex(index)`
- `getNodeRadiusById(id)`
- `maxPointSize`

### Zooming
- `fitView(duration)`
- `fitViewByNodeIds(ids, duration)`
- `zoomToNode(node)`
- `setZoomLevel(value, duration)`
- `getZoomLevel`

### Simulation Methods
- `start(alpha)`
- `pause()`
- `step()`
- `restart()`
- `progress`
- `isSimulationRunning`

### Miscellaneous
- `remove()`
- `create()`
- `spaceToScreenPosition(spacePosition)`
- `spaceToScreenRadius(spaceRadius)`

---

## References
- [Official Cosmograph JavaScript Docs](http://cosmograph.app/docs/cosmograph/Cosmograph%20JavaScript/Cosmograph/)
- [Cosmograph GitHub](https://github.com/cosmograph-org/cosmos) 