# Agent (`AGENT.md`)

## Overview

The `agent.py` module defines the `MorphikAgent`, a core component responsible for orchestrating complex tasks and queries by leveraging a suite of available tools. It uses a language model (configured via `AGENT_MODEL` in `morphik.toml`) to understand user queries, decide which tools to use, execute them, and synthesize the results into a coherent answer. This is a key part of Morphik's intelligent capabilities, enabling it to go beyond simple retrieval and perform multi-step reasoning and actions.

## `MorphikAgent` Class

The primary class in this module is `MorphikAgent`.

### Initialization

```python
class MorphikAgent:
    def __init__(self, document_service, model: str = None):
        ...

-document_service: An instance of DocumentService. This is crucial as many tools interact with documents, chunks, and graphs managed by this service.
-model (optional): Specifies the language model to be used by the agent. If not provided, it defaults to the AGENT_MODEL defined in the morphik.toml configuration file. The actual model name used with LiteLLM is looked up from the REGISTERED_MODELS in the configuration.

During initialization, the agent:

1. Stores the document_service.
2. Loads its configuration settings, particularly the AGENT_MODEL.
3. Loads tool definitions from core/tools/descriptions.json. This JSON file contains the schemas (name, description, input parameters) for all tools available to the agent. These definitions are formatted for use with LiteLLM's function calling capabilities.
4. Defines a system_prompt that instructs the language model on its role as "Morphik, an intelligent research assistant" and how to use the available tools.

# Key Methods
async def _execute_tool(self, name: str, args: dict, auth: AuthContext)
This private method is responsible for dispatching calls to the appropriate tool function based on the name provided by the language model.

-name: The name of the tool to execute (e.g., retrieve_chunks, knowledge_graph_query).
-args: A dictionary of arguments for the tool, as determined by the language model.
-auth: The AuthContext of the user making the request, ensuring that tools operate within the user's permissions.

It uses a match statement to call the correct tool function from core.tools.tools. It injects the document_service and auth context into each tool call. If an unknown tool name is provided, it raises a ValueError.

The available tools and their functionalities are:

-retrieve_chunks: Fetches relevant text/image chunks.
-retrieve_document: Gets full document content or metadata.
-document_analyzer: Analyzes documents for entities, summaries, facts, etc.
-execute_code: Runs Python code in a sandboxed environment.
-knowledge_graph_query: Queries the knowledge graph.
-list_graphs: Lists available knowledge graphs.
-save_to_memory: Saves information to persistent memory (implemented via document ingestion).
-list_documents: Lists accessible documents.

async def run(self, query: str, auth: AuthContext) -> str

This is the main method for running the agent. It takes a user query and AuthContext, then orchestrates the interaction with the language model and tools to produce a final answer.

The process is as follows:

1. Initializes a messages list with the system_prompt and the user's query.
2. Initializes an empty tool_history list to record tool calls and their results.
3. Retrieves the full model name for the agent from REGISTERED_MODELS based on self.model.
4. Enters a loop:
a. Sends the current messages list and tool_definitions to the language model via litellm.acompletion. tool_choice is set to "auto", allowing the LLM to decide if and which tool to call.
b. Receives the response from the LLM.
c. If the LLM response does not contain a tool call: The agent assumes the LLM has generated a final answer. It returns the content of the message and the tool_history.
d. If the LLM response contains a tool call:
i. Extracts the tool name and args.
ii. Appends the assistant's message (which includes the tool call) to the messages list.
iii. Calls _execute_tool to run the specified tool with the given arguments.
iv. Records the tool call and its result in the tool_history.
v. Appends a "tool" role message to the messages list, containing the name of the tool, the result of its execution, and the tool_call_id.
vi. The loop continues, sending the updated messages (now including the tool's output) back to the LLM for the next step.
The agent continues this loop (LLM predicts -> agent executes tool -> LLM processes result) until the LLM generates a response without a tool call.

def stream(self, query: str) (Not Implemented)
This method is a placeholder for future streaming capabilities. It currently raises a NotImplementedError. The intention is that it would yield intermediate steps like tool calls and results as they happen.

# Tool Integration
The MorphikAgent relies on tools defined in core/tools/. The schemas for these tools are loaded from core/tools/descriptions.json. This JSON file is critical as it tells the LLM what functions are available, what they do, and what parameters they expect.

# Workflow
1. User submits a query.
2. MorphikAgent.run() is called.
3. The agent sends the query and system prompt to the LLM, along with the list of available tools.
4. The LLM decides if a tool is needed.
-If yes, it returns a "tool_calls" message specifying the tool and arguments.
-If no, it returns a final answer.
5. If a tool is called, MorphikAgent._execute_tool() runs the tool.
6. The tool's output is sent back to the LLM.
7. Steps 4-6 repeat until the LLM provides a final answer.
8. The final answer and the history of tool calls are returned.

# Configuration
-AGENT_MODEL: Defined in morphik.toml, specifies the key for the language model to be used by the agent (e.g., "gpt-4-turbo"). This key is then used to look up the full model details in REGISTERED_MODELS.
-REGISTERED_MODELS: Also in morphik.toml, this dictionary contains the specific configurations for all models known to LiteLLM, including API keys, base URLs, etc.