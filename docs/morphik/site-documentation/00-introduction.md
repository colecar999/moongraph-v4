# Introduction to Morphik

Morphik is a database that makes it easy to create fast, versatile, and production-ready AI apps and agents.

## Key Features

- **First class support for Unstructured Data**: Unlike traditional databases, Morphik allows users to directly ingest unstructured data of all forms - including (but not limited to) videos and PDFs. We've built research-driven custom algorithms to ensure state-of-the-art retrieval accuracy.
- **Persistent KV-caching**: For documents you reference often, you can process them once and _freeze_ the LLM's internal state such that you can use it again later. This helps drastically reduce compute costs as well speed up model responses.
- **Out of the box MCP support**: Morphik has [built in support](https://www.morphik.ai/docs/using-morphik/mcp) for the open-source [Model Context Protocol](https://modelcontextprotocol.io/introduction) \- so you can integrate your knowledge with any MCP client in a single click.
- **Natural Language Rules Engine**: Define natural language rules that dictate how your data is ingested and queried. Think of it like defining schemas for your unstructured data.
- **User and Folder Scoping**: Organize and isolate your data with multi-user and folder-based access controls. Create logical boundaries for different projects or user groups while maintaining a unified database.
- **Completely Open-source**: You can check out Morphik core code [here!](https://github.com/morphik-org/morphik-core/).
- **Flexible Model Registry**: Easily register and use hundreds of different AI models across your application with our new registered models approach. Mix and match models by task (e.g., use smaller models for simpler tasks, powerful models for complex reasoning) through a simple configuration.
- **Enterprise App Provisioning**: For Teams and Enterprise users, Morphik offers a [Management API](https://www.morphik.ai/docs/api-reference/management-api) to provision and manage isolated application environments, each with its own dedicated database.

Check out our [GitHub repository](https://github.com/morphik-org/morphik-core/) and please give us a star ⭐ if you like what we're building!

---

Get started with Morphik with [our guide](https://www.morphik.ai/docs/getting-started). Alternatively, if you'd like more in-depth explanations for key concepts we apply, check out the guides below:

- [**Get Started** – Start using Morphik now!](https://www.morphik.ai/docs/getting-started)
- [**Configure Morphik** – Customize Morphik to your liking using the `morphik.toml` file.](https://www.morphik.ai/docs/configuration)
- [**Join our Community** – Get help, report bugs, and connect with other Morphik users in our open community.](https://discord.gg/BwMtv3Zaju)
- [**Retrieval Augmented Generation** – An explanation of the underlying ideas behind RAG](https://www.morphik.ai/docs/concepts/naive-rag) 