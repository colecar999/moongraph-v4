# React usage

[`@cosmograph/react`](https://www.npmjs.com/package/@cosmograph/react) is a library that allows you to easily integrate Cosmograph into React applications by providing pre-built Cosmograph React Components for analyzing graph-based data.

These components provide a simple interface for displaying and interacting with graph data. The library also provides a `useCosmograph` hook, which allows developers to access the Cosmograph instance and data from within their components.

## CosmographProvider

The `CosmographProvider` component is used to provide a Cosmograph instance and data to the rest of the application using React's Context API. To use `CosmographProvider`, wrap your application with it and pass in the `nodes` and `links` to initialize Cosmograph with some initial data:

```jsx
import { CosmographProvider, Cosmograph } from '@cosmograph/react'
import { nodes, links } from './path/to/data'

function App() {
  return (
    <CosmographProvider nodes={nodes} links={links}>
      <Cosmograph />
      {/* Your app components */}
    </CosmographProvider>
  )
}
```

> It's important to initialize `Cosmograph` inside `CosmographProvider` for other Cosmograph React Components to work properly. Otherwise, they won't display because they depend on it.

Regardless of how deep the Cosmograph React Components are located in the component tree, just ensure they are wrapped in the `CosmographProvider`.

## useCosmograph

Once you've wrapped your app with `CosmographProvider`, you can use the `useCosmograph` hook to access the `cosmograph` instance and `nodes` and `links` data provided by the provider:

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

> Note that `useCosmograph` must be used within a component that is a descendant of `CosmographProvider`. If you try to use it outside of the provider, an error will be thrown.

## Available Components

Currently, there are four components that are ready for use with React:

- `Cosmograph`: The main component itself.
- `CosmographSearch`: A search engine designed specifically for Cosmograph.
- `CosmographTimeline`: Provides a timeline feature that allows for data visualization over time.
- `CosmographHistogram`: Offers a customizable histogram component.

> All components support refs and can be accessed via `useRef` or `useCallback` for enhanced control and management. Read more about it in the components documentation.

---

Questions? Contact us at [hi@cosmograph.app](mailto:hi@cosmograph.app) 