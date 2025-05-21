# Sharing graphs

Sharing your graph visualizations in [Cosmograph web application](https://cosmograph.app/run/) is made easy with two different methods: the in-app **Sharing** section and the **QueryString API**. Feel free to explore both methods to share your graph visualizations seamlessly.

## In-app Sharing section

This feature allows you to generate a URL that captures the current state of your graph visualization. By entering a data or embedding URL, you can create a link that loads the data into Cosmograph with your configured simulation and appearance settings. The generated URL can be easily copied and shared with others for instant graph exploration.

> To share the entire state of your graph, export the datasets and metadata with layout coordinates and upload them to a cloud storage service. This allows you to create a link that includes not only the simulation and appearance settings, but also the node positions.

## QueryString API

With the **Cosmograph QueryString API**, you can share a graph along with predefined visual parameters through a URL. This enables you to provide others with a direct link to your graph visualization, complete with specific visual settings.

**Example:**

```
https://cosmograph.app/run/?data=https://cosmograph.app/data/data-links-example.csv&nodeColor=incoming%20links
```

If your data file from URL loads only partially, it's likely due to **CORS** restrictions. Most servers block access to the **Content-Length** header needed to get the full file size. Try hosting the data on a service without **CORS** restrictions so Cosmograph can load all of it.

### Load Graph

Use the `data` parameter to load a data file, as in `data=<dataURL>`. This file must contain a minimum of two columns signifying source and target.

For metadata, employ the `meta` parameter— `meta=<metaURL>`. The metadata file must include an `id` column that corresponds with the entities in the data file.

> Accepted formats are **.csv, .tsv, .ssv**.

### Load Embedding

Use the `embedding` parameter to load a data file. Embedding file must contain a column named `id`, as well as columns that specify the `x` and `y` coordinates of the nodes.

> If the provided data URL is incorrect or unavailable, Cosmograph opens Launcher.

### Selecting source and target columns

The parameters to use are `source` and `target`.

Use these in the following manner - `source=a`, `target=b`. Ensure the columns named in the parameters exist in the data file included in the URL. For multiple targets, delimit them with commas: `target=a,b`.

> If Cosmograph fails to locate the specified columns in the supplied URL data file, it will default to the Launcher.

### Node appearance

There are 4 URL parameters for node settings:

- `nodeSize`: Specifies node size
- `nodeColor`: Designates the color of nodes
- `nodeLabel`: Defines which column should be used for displaying node labels. This value can be any column from metadata or embedding. Example usage: `nodeLabel=id`
- `nodeSizeScale`: Numerical option to set a scaling factor for node sizes (range: `0.1` to `5`). An out-of-range value is disregarded. Example usage: `nodeSizeScale=3`.

`nodeColor` and `nodeSize` options can be chosen from four built-in options that are always available when you have loaded a data file in graph mode. These options include:

- `type`: Colors/sizes nodes by their column (extra union columns may be generated if a node belongs to multiple columns)
- `incoming links`: Colors/sizes nodes by the sum of their incoming links
- `outgoing links`: Colors/sizes nodes by the sum of their outgoing links
- `total links`: Colors/sizes nodes by the total sum of their incoming and outgoing links

If your data file includes numeric columns, each specific column generates 3 more options, prefixed as follows:

- `sum-value`: Colors/sizes nodes by the cumulative values across all records in the `value` column
- `input-sum-value`: Colors/sizes nodes by the sum across input-only records in the `value` column
- `output-sum-value`: Colors/sizes nodes by the sum across output-only records in the `value` column

**Usage example:**

```
https://cosmograph.app/run/?data=https://cosmograph.app/data/data-links-example.csv&nodeColor=incoming%20links
```

When uploading metadata or embedding with color, numeric, or text columns, additional scales will be generated for each column. To specify the node size based on a numeric column, use the syntax `nodeSize=node_value`, where `node_value` is the exact name of the column in the metadata.

Node coloring can be applied to all types of columns: color, numeric, and text. To assign a specific column for node coloring, use the syntax `nodeColor=node_color`, where `node_color` is the exact name of the desired column of metadata.

### Link appearance

There are 3 URL parameters for links:

- `linkWidth`: Defines the width of links
- `linkColor`: Sets the color for links, similar to `linkWidth`
- `linkWidthScale`: Numeric option to adjust the scale coefficient of link width (range: `0.1` to `2`). Values outside this range will be ignored. Usage: `linkWidthScale=1`.

The default setting for `linkWidth` is `default`, which corresponds to a width of **1**, and the default color is used for `linkColor`. These defaults apply to all links.

If a data file contains duplicate listings of the same source and target for links, the `records` option becomes available. It colors/sizes links based on the number of data records connecting the source and target nodes. Usage: `linkColor=records` or `linkWidth=records`.

#### Link width

For data files with numeric columns, additional options are available for `linkWidth`:

- `sum-value`: Sizes links based on the total value of all data records between a pair of source and target nodes in the `value` column.
- `avg-value`: Sizes links based on the average value of all data records between the source and target nodes in the `value` column. This works as if you directly specified the raw `value` for setting the width of the links.

#### Link color

`linkColor` supports the same options as `linkWidth` for data files with numeric columns.

If a data file features color columns, there's an additional option for `linkColor`:

- `<columnName>`: Colors links by the raw value of the `columnName` column.

For example, if your data contains a color column named `columnName`, you would use `linkColor=columnName` to assign these values as link colors.

**Usage example:**

```
https://cosmograph.app/run/?data=https://cosmograph.app/data/data-links-example.csv&linkColor=avg-value
```

> Color and size options with invalid or non-existent values will be overridden with the defaults.

### Simulation parameters

The following parameters pertain to simulations:

- `gravity`: Modulates gravity _(min: 0, max: 0.5, step: 0.01)_
- `repulsion`: Adjusts repulsion _(min: 0, max: 2, step: 0.01)_
- `repulsion-theta`: Alters repulsion theta _(min: 0.3, max: 2, step: 0.01)_
- `link-spring`: Tunes link strength _(min: 0, max: 2, step: 0.01)_
- `link-distance`: Resets minimum link distance _(min: 1, max: 20, step: 1)_
- `friction`: Assigns friction _(min: 0, max: 1, step: 0.01)_
- `decay`: Sets force simulation decay rate. Smaller values slow down the "cooling" of the simulation _(min: 100, max: 10000, step: 1)_

**Usage example:**

```
https://cosmograph.app/run/?&decay=100000&link-distance=1&link-spring=2&data=https://cosmograph.app/data/100x100.csv
```

### Additional parameters

- `showFps=true`: Displays an FPS counter in the upper right corner
- `useQuadtree=true`: Activates the classic [quadtree algorithm](https://en.wikipedia.org/wiki/Barnes%E2%80%93Hut_simulation) for the Many-Body force. This property will be applied only at start and it can't be changed during using the app.

> `useQuadtree` might not work on certain GPUs (e.g., Nvidia) and on Windows, unless [ANGLE](https://en.wikipedia.org/wiki/ANGLE_(software)) is disabled in the browser settings.

---

Questions? Contact us at [hi@cosmograph.app](mailto:hi@cosmograph.app) 