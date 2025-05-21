# Get started

## Installation

Cosmograph is available on NPM as a React [**@cosmograph/react**](https://www.npmjs.com/package/@cosmograph/react) library or vanilla TypeScript library [**@cosmograph/cosmograph**](https://www.npmjs.com/package/@cosmograph/cosmograph).

- React
- JS/TS

```bash
npm install -P @cosmograph/react
```

```bash
npm install -P @cosmograph/cosmograph
```

## Preparing data

Cosmograph expects the data to be nodes and links arrays:

```js
const nodes = [...]
const links = [...]
```

> You don't need TypeScript to use Cosmograph. But TypeScript types are provided as a reference.

Each node object needs to have a unique identifier specified in the `id` property. You can optionally provide starting positions for each node using the `x` and `y` properties. The links will need to have the `source` and `target` properties referencing specific nodes by their unique id.

```ts
type Node = {
  id: string;
  x?: number;
  y?: number;
}

type Link = {
  source: string;
  target: string;
}
```

## Initializing the graph

After your data is ready, you can initialize Cosmograph by defining its configuration and passing the data. The way to do it will depend on whether you use React or plain JavaScript. Below you can find an example code of how you can initialize Cosmograph with a simple configuration.

> While Cosmograph doesn't have adaptors to other UI frameworks besides React, you can still integrate it into your Angular, Vue, Svelte, or other app, by using JavaScript code.

### React

```jsx
import { Cosmograph } from '@cosmograph/react'

export function GraphVisualization ({ nodes, links }) {
  return (<Cosmograph
    nodes={nodes}
    links={links}
    nodeColor={d => d.color}
    nodeSize={20}
    linkWidth={2}
  />)
}
```

### JS/TS

```js
import { Cosmograph } from '@cosmograph/cosmograph'

// Create an HTML element
const targetElement = document.createElement('div')
document.body.appendChild(targetElement)

// Define the configuration (CosmographInputConfig<Node, Link>)
const config = {
  nodeColor: d => d.color,
  nodeSize: 20,
  linkWidth: 2,
  // ...
}

// Create a Cosmograph instance with the target element
const cosmograph = new Cosmograph(targetElement, config)

// Set the data
cosmograph.setData(nodes, links)
```

### Example data

```js
const nodes = [
  { id: '1', color: '#88C6FF' },
  { id: '2', color: '#FF99D2' },
  { id: '3', color: [227,17,108, 1] }, // Faster than providing a hex value
  { id: '4', color: '#50E3C2' },
  { id: '5', color: '#F5A623' },
  { id: '6', color: '#7ED321' },
  { id: '7', color: '#BD10E0' }
]

const links = [
  { source: '1', target: '2' },
  { source: '1', target: '3' },
  { source: '2', target: '3' },
  { source: '3', target: '4' },
  { source: '6', target: '7' },
  { source: '5', target: '4' },
  { source: '3', target: '6' },
  { source: '7', target: '2' },
  { source: '6', target: '2' }
]
```

---

Questions? Contact us at [hi@cosmograph.app](mailto:hi@cosmograph.app) 