# Cosmograph React

`@cosmograph/react` is a user-friendly library for integrating the `@cosmograph/cosmograph` library into your React applications. It provides a collection of ready-to-use Cosmograph React components, allowing you to analyze graph-based data with ease.

## Installation

```bash
npm install @cosmograph/react
```

## React Usage

These pre-built Cosmograph React components provide a simple yet powerful interface for displaying and interacting with your graph data. The library comes with a `useCosmograph` hook, granting developers easy access to the Cosmograph instance and its data in their components.

### CosmographProvider

`CosmographProvider` is a component used to inject a Cosmograph instance and its data throughout your application via React's Context API. To put `CosmographProvider` into service, wrap your application around it and pass the nodes and links to populate Cosmograph with initial data.

```jsx
import { CosmographProvider, Cosmograph } from '@cosmograph/react'

const nodes = [
  { id: 0, color: 'red' },
  { id: 1, color: 'green' },
  { id: 2, color: 'blue' },
]

const links = [
  { source: 0, target: 1, color: 'blue' },
  { source: 1, target: 2, color: 'green' },
  { source: 2, target: 0, color:'red' },
]

function App() {
  return (
    <CosmographProvider nodes={nodes} links={links}>
      <Cosmograph
        nodeColor={d => d.color}
        linkColor={d => d.color}
      />
      {/* Your app components */}
    </CosmographProvider>
  )
}
```

> Ensure your initialization of Cosmograph takes place inside CosmographProvider. Failing to do so will prevent the Cosmograph React components from displaying as they rely on it.

Regardless of the depth of your Cosmograph React components in the component tree, they should be encompassed inside the `CosmographProvider`.

### useCosmograph

After surrounding your app with `CosmographProvider`, the `useCosmograph` hook can now be used to access the Cosmograph instance and the provided nodes and links data.

```jsx
import { useCosmograph } from '@cosmograph/react'

function MyComponent() {
  const { cosmograph, nodes, links } = useCosmograph()

  // You can use cosmograph and data here

  return (
    // Your component JSX
  )
}
```

> IMPORTANT: `useCosmograph` must be called within a component that is a direct descendant of the `CosmographProvider`. Attempting to use it outside of the provider will trigger an error.

## Available Components

Currently, `@cosmograph/react` provides four components ready for use:

1. `Cosmograph`: The primary component.
2. `CosmographSearch`: A search engine specifically created for `Cosmograph`.
3. `CosmographTimeline`: Offers a timeline feature for visualizing data over time.
4. `CosmographHistogram`: A fully customizable histogram component.

> All the components included support refs and can be accessed via `useRef` or `useCallback` for developers to have better control and management. Consult the component documentation for more details.

For more information see the [documentation](https://cosmograph.app/docs/cosmograph/Cosmograph%20Library/React%20Advanced%20Usage).

## License

`@cosmograph/react` is licensed under the CC-BY-NC-4.0 license, or the Creative Commons Attribution-NonCommercial 4.0 International License. 