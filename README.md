# MCP Local Client

This repository contains a minimal local client for MCP-related experiments. It provides a TypeScript entry point that builds to `build/index.js`, plus project metadata and configuration.

**Purpose**
- Provide a small, reproducible client for developing and testing MCP integrations.
- Demonstrate how `tools` and `input_schema` objects are handled and mapped in TypeScript.

**Quick Summary**
- Language: TypeScript
- Build output: `build/index.js`
- Entry point: `src/index.ts`

**File Structure**
- `package.json` : project metadata and npm scripts
- `tsconfig.json` : TypeScript configuration
- `src/index.ts` : main TypeScript source
- `build/index.js` : compiled output (ignored by source control if desired)
- `abc.txt` : example or placeholder file

## Setup

Requirements
- Node.js (v18+) recommended
- npm (or yarn)

Install dependencies:

```bash
npm install
```

Build:

```bash
npm run build
# or
npx tsc
```

Run (built output):

```bash
node build/index.js
```

Run in development (TS node or direct run):

```bash
npx ts-node src/index.ts
```

## Key Concepts

- "Tools": This project models external tools as objects with a `name`, optional `description`, and an `input_schema` describing the expected input.
- TypeScript union types: the `Tool` type imported from dependencies is a union that can include a `NamespaceTool` variant which requires additional fields like `type: "namespace"` and a `tools` array. If you map raw tool objects to `Tool[]`, you must satisfy the correct discriminated union shape.

### Common TypeScript Error

If you see an error like:

```
Type '{ name: string; description: string | undefined; input_schema: { ... } }[]' is not assignable to type 'Tool[]'.
```

It means your mapped objects are missing the discriminant and required fields for some `Tool` union variants (e.g., `NamespaceTool`). Fix it by constructing the correct variant. For example, for the non-namespace tool variant use:

```ts
this.tools = toolsResult.tools.map((tool): Tool => ({
  type: "tool", // discriminant required by the union
  name: tool.name,
  description: tool.description,
  input_schema: tool.inputSchema,
}));
```

If your actual library uses a different discriminant string (e.g., `"tool"` vs `"action"`), use the correct string from the `Tool` definition. If you're certain the objects are safe, you can also assert the type explicitly (less preferred):

```ts
this.tools = toolsResult.tools as unknown as Tool[];
```

### Alternative approaches
- Import the more specific `NonNamespaceTool` type from the dependency (if available) and map to that type.
- Add runtime validation and construct `NamespaceTool` objects when appropriate.

## Where to look in this repo
- The entry point is [src/index.ts](src/index.ts) — start here to see how `tools` are consumed.
- The compiled output is at `build/index.js`.

## Resources

- The client discovers MCP resources by calling `mcp.listResources()` after connecting to a local MCP server.
- Discovered resources are exposed to the assistant via a generic `read_resource` tool that accepts a single `uri` string parameter.
- Example resource URIs (shown in `src/index.ts`):

  - `company://policy`
  - `db://schema`
  - `student://<id>` (e.g. `student://1`)
  - `image://logo`

- How it works (high-level):
  1. The client connects to a server script (JS or Python) using stdio transport.
  2. It calls `mcp.listResources()` to retrieve available resources and their metadata.
  3. It registers a tool named `read_resource` that the assistant can call with a `uri`.
  4. When `read_resource` is invoked, the client calls `mcp.readResource({ uri })` and forwards the result back to the assistant.

- Example: run the client and connect to a local MCP server script

```bash
# build then run (if using compiled output)
npm run build
node build/index.js path/to/server_script.js

# or run directly in TypeScript during development
npx ts-node src/index.ts path/to/server_script.js
```

Replace `path/to/server_script.js` with the path to your local MCP server script (or `.py` script). The client supports both `.js` and `.py` server scripts and will choose `node` or `python` accordingly.

See [src/index.ts](src/index.ts) for the concrete implementation and the resource examples logged during startup.

## Tests
- No tests are included by default. To add tests, install a test runner (e.g., Jest) and add scripts to `package.json`.

## Contributing
- Fork and open PRs. Keep changes focused and add tests where appropriate.

## Next steps you might want me to do
- Commit the `README.md` (I can do that for you).
- Expand sections with examples from `src/index.ts`.
- Add a `CONTRIBUTING.md` or `CHANGELOG.md`.

If you want, tell me which of those I should do next and I'll proceed.
