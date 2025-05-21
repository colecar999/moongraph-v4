# CosmographHistogram Component

The `CosmographHistogram` provides a customizable histogram visualization component for Cosmograph.

## Creating a histogram instance

> In React, you need a higher-order `CosmographProvider` in your component tree, and `Cosmograph` component initialized. `CosmographProvider` is responsible for providing data into all Cosmograph React Components and interaction with `Cosmograph` instance.

### React

```jsx
import { CosmographProvider, Cosmograph, CosmographHistogram } from '@cosmograph/react'
import { nodes, links } from './path/to/data'

export const Component = () => {
  return (
    <CosmographProvider nodes={nodes} links={links} >
      <Cosmograph />
      <CosmographHistogram />
    </CosmographProvider>
  )
}
```

### JS/TS

```js
import { Cosmograph, CosmographHistogram } from '@cosmograph/cosmograph'
import { nodes, links } from './path/to/data'

const cosmographContainer = document.createElement('div')
document.body.appendChild(cosmographContainer)
const cosmograph = new Cosmograph(cosmographContainer)

const histogramContainer = document.createElement('div')
document.body.appendChild(histogramContainer)
const histogram = new CosmographHistogram(cosmograph, histogramContainer)

cosmograph.setData(nodes, links)
```

## Histogram configuration

### Data and configuration

- In React, data is synced with `CosmographProvider` and configuration can be passed as props to `CosmographHistogram`.
- In JS/TS, data is synced with `Cosmograph` and configuration can be set via `setConfig` or during instantiation.

#### Accessor

`accessor` is a function that extracts numeric values from the nodes or links data array in Cosmograph. Default: `(n) => n.value`.

#### Custom data

The `data` parameter allows you to provide your own array of data to create a histogram. If not specified, the histogram uses nodes or links data from Cosmograph.

#### Data filtering

- `filterFunction`: Custom function to filter data based on selection.
- `filterType`: Determines whether to use node-based or link-based crossfilter. Default: `'nodes'`.

#### Example advanced configuration

```jsx
<CosmographProvider nodes={nodes} links={links}>
  <Cosmograph />
  <CosmographHistogram
    accessor={d => d}
    data={[1, 10, 15]}
    filterFunction={(selection, data, crossfilteredData) => {
      return crossfilteredData.filter(node => {
        return node.size >= selection[0] && node.size <= selection[1]
      })
    }}
  />
</CosmographProvider>
```

## Highlighting cross-filtered data

Cross-filtering updates the histogram with a second layer of bars that highlights the filtered data in real-time. You can turn off this layer with `highlightCrossfiltered` (default: `true`).

## Bar control configuration

- `customExtent`: Set min/max extent for the histogram.
- `formatter`: Format axis tick edge labels.
- `dataStep`: Width of each bar in X-axis units.
- `barCount`: Number of bars to display (default: `30`).

## Selection settings

- `allowSelection`: Allow users to select bars (default: `true`).
- `stickySelection`: Selection control coordinates stick to bar edges (default: `true`).

## Events configuration

- `onSelection(selection, isManuallySelected)`: Called when a range is selected.
- `onBarHover(data)`: Called when a bar is hovered.

## Appearance

- `padding`: Object for top, bottom, left, right padding (default: `{ top: 5, left: 5,  bottom: 1,  right: 5 }`).
- `labelSideMargin`: Margin between axis tick labels and sides (default: `3`).
- `minBarHeight`: Minimum bar height (default: `2`).
- `barRadius`: Bar corner roundness (default: `1`).
- `barPadding`: Spacing between bars as percent of bar width (default: `0.1`).
- `barTopMargin`: Margin between top edge and max height bar (default: `3`).
- `selectionRadius`: Corner roundness for selection control (default: `3`).
- `selectionPadding`: Padding for selection (default: `8`).

## Controlling the histogram

In JS/TS, call methods on the `CosmographHistogram` instance. In React, use `useRef` or `useCallback` to access the instance.

### Available methods

- `setConfig(config)`: Modify configuration.
- `getCurrentSelection()`: Get current selection in X-axis units.
- `getCurrentSelectionInPixels()`: Get current selection in pixels.
- `getBarWidth()`: Get current bar width in pixels.
- `setSelection(selection)`: Set selected range.
- `getConfig()`: Get current configuration.
- `remove()`: Destroy the histogram and remove events.

## CSS styling

In React, pass `style` or `className` as props. You can use CSS variables to customize appearance:

| Name | Default Value | Description |
| --- | --- | --- |
| --cosmograph-histogram-text-color | `white` | Color of the text in the histogram. |
| --cosmograph-histogram-axis-color | `#d7d7d7` | Color of the axis in the histogram. |
| --cosmograph-histogram-selection-color | `rgb(119, 119, 119)` | Color of the selection control. |
| --cosmograph-histogram-selection-opacity | `0.5` | Opacity of the selection control. |
| --cosmograph-histogram-bar-color | `#7a7a7a` | Color of the bars in the histogram. |
| --cosmograph-histogram-font-family | `inherit` | Font family of the histogram labels. |
| --cosmograph-histogram-font-size | `11px` | Font size of the histogram labels. |
| --cosmograph-histogram-background | `#222222` | Background color of the histogram container. |

---

Questions? Contact us at [hi@cosmograph.app](mailto:hi@cosmograph.app) 