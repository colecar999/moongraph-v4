# CosmographTimeline Component

The `CosmographTimeline` provides a timeline component that allows you to visualize your data over time. It also offers methods for controlling the animation of selected range data over time.

## Creating a timeline instance

> In React, you need a higher-order `CosmographProvider` in your component tree, and `Cosmograph` component initialized. `CosmographProvider` is responsible for providing data into all Cosmograph React Components and interaction with `Cosmograph` instance.

### React

```jsx
import { CosmographProvider, Cosmograph, CosmographTimeline } from '@cosmograph/react'
import { nodes, links } from './path/to/data'

export const Component = () => {
  return (
    <CosmographProvider nodes={nodes} links={links} >
      <Cosmograph />
      <CosmographTimeline />
    </CosmographProvider>
  )
}
```

### JS/TS

```js
import { Cosmograph, CosmographTimeline } from '@cosmograph/cosmograph'
import { nodes, links } from './path/to/data'

const cosmographContainer = document.createElement('div')
document.body.appendChild(cosmographContainer)
const cosmograph = new Cosmograph(cosmographContainer)

const timelineContainer = document.createElement('div')
document.body.appendChild(timelineContainer)
const timeline = new CosmographTimeline(cosmograph, timelineContainer)

cosmograph.setData(nodes, links)
```

## Timeline configuration

- In React, data is synced with `CosmographProvider` and configuration can be passed as props to `CosmographTimeline`.
- In JS/TS, data is synced with `Cosmograph` and configuration can be set via `setConfig` or during instantiation.

### Data and configuration

- `accessor`: Function to extract time values (default: `(n) => n.date`).
- `filterType`: Use node-based or link-based crossfilter (default: `'links'`).
- `animationSpeed`: Rate of refresh for selection animation (default: `50`).
- `showAnimationControls`: Show animation control button (default: `false`).
- `allowSelection`: Allow users to select a range (default: `true`).

### Intervals customization

- `dataStep`: Bar width in X-axis units (ms for datetime).
- `tickStep`: Interval between tick marks.
- `formatter`: Format tick labels.
- `barCount`: Number of bars (default: `100`).

### Events configuration

- `onSelection(selection, isManuallySelected)`: Called when a range is selected.
- `onBarHover(data)`: Called when a bar is hovered.
- `onAnimationPlay(isAnimationRunning, selection)`: Called when animation starts.
- `onAnimationPause(isAnimationRunning, selection)`: Called when animation pauses.

## Appearance

- `padding`: Spacing between outer edges (default: `{ top: 0, bottom: 0, left: 0, right: 0 }`).
- `axisTickHeight`: Height of axis ticks (default: `25`).
- `selectionRadius`: Corner roundness for selection control (default: `3`).
- `selectionPadding`: Padding for selection (default: `8`).
- `barCount`: Number of bars (default: `100`).
- `barRadius`: Bar corner roundness (default: `1`).
- `barPadding`: Padding between bars as percent of bar width (default: `0.1`).
- `barTopMargin`: Margin between top edge and max height bar (default: `3`).
- `minBarHeight`: Height of empty bars (default: `1`).

## Controlling the timeline

In JS/TS, call methods on the `CosmographTimeline` instance. In React, use `useRef` or `useCallback` to access the instance.

### Available methods

- `setConfig(config)`: Update configuration.
- `getCurrentSelection()`: Get current selection in time units.
- `getCurrentSelectionInPixels()`: Get current selection in pixels.
- `getBarWidth()`: Get bar width in pixels.
- `getIsAnimationRunning()`: Check if animation is running.
- `setSelection(selectionRange)`: Set selection by time range.
- `setSelectionInPixels(coordinates)`: Set selection by pixel range.
- `playAnimation()`: Start animation.
- `pauseAnimation()`: Pause animation.
- `stopAnimation()`: Stop animation and reset selection.
- `getConfig()`: Get current configuration.
- `remove()`: Remove the timeline and free resources.

## CSS styling

In React, pass `style` or `className` as props. You can use CSS variables to customize appearance:

| Name | Default Value | Description |
| --- | --- | --- |
| --cosmograph-timeline-axis-color | `white` | Color of the axis. |
| --cosmograph-timeline-selection-color | `rgb(119, 119, 119)` | Color of the selection control. |
| --cosmograph-timeline-selection-opacity | `0.5` | Opacity of the selection control. |
| --cosmograph-timeline-bar-color | `#7a7a7a` | Color of the bars. |
| --cosmograph-timeline-text-color | `white` | Color of the axis labels. |
| --cosmograph-timeline-font-family | `inherit` | Font family of the axis labels. |
| --cosmograph-timeline-font-size | `11px` | Font size of the axis labels. |
| --cosmograph-timeline-background | `#222222` | Background color of the timeline container. |

---

Questions? Contact us at [hi@cosmograph.app](mailto:hi@cosmograph.app) 