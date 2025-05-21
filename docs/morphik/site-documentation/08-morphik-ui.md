# Morphik UI

Interact with your ingested data using Morphik's graphical user interface. The Morphik UI supports document ingestion, information retrieval, chat with your documents, and knowledge graph visualization. This guide walks you through setup and usage.

---

## Prerequisites

### Morphik Server
- Ensure the Morphik server is running. Follow the Getting Started guide for setup.
- Check the `[api]` section in your `morphik.toml` (in the root of `morphik-core`). It should look like:

```toml
[api]
host = "localhost" # Use "0.0.0.0" for docker
port = 8000
reload = true
```

- Visit [http://localhost:8000/docs](http://localhost:8000/docs) to verify the server is live.

### Node and NPM
- You need `node` and `npm` installed to run the UI.
- Check with:

```bash
node -v
npm -v
```

#### Install Node.js
- **macOS (Homebrew):**
  ```bash
  brew install node
  ```
- **Windows:**
  - Download from [nodejs.org](https://nodejs.org/)
  - Or use Chocolatey:
    ```powershell
    choco install nodejs
    ```
- **Linux (NVM):**
  ```bash
  curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.2/install.sh | bash
  # Add NVM to your shell profile, then:
  nvm install --lts
  nvm use --lts
  ```

---

## Running the UI

1. Ensure the Morphik server is running.
2. In a new terminal, navigate to the root of your `morphik-core` repository.
3. Change directory to the UI component:

```bash
cd ee/ui-component
```

4. Install dependencies:

```bash
npm i
```

5. Start the UI:

```bash
npm run dev
```

You should see output like:

```bash
> @morphik/ui@0.1.0 dev
> next dev

  ▲ Next.js 14.2.26
  - Local:        http://localhost:3000

 ✓ Starting...
 ✓ Ready in 1560ms
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser to access the Morphik UI.

---

## Using the UI - Features

- **Automatic Metadata Extraction:**
  - Define a JSON schema and Morphik will extract metadata at file ingestion time.
- **Chunk Searching:**
  - Test and iterate on retrieval strategies by searching document chunks.
- **Knowledge Graph Visualization:**
  - Visualize and create knowledge graphs to understand relationships in your data.
- **Chat with Your Documents:**
  - Interact conversationally with your ingested content.

---

*Source: [Morphik Docs - Morphik UI](https://docs.morphik.ai/using-morphik/morphik-ui)* 