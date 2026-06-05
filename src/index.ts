
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import readline from "readline/promises";
import dotenv from "dotenv";
import OpenAI from "openai";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

dotenv.config();

const OPENAI_API_KEY = process.env.OPENAI_API_KEY
if (!OPENAI_API_KEY) {
  throw new Error("OPENAI_API_KEY is not set");
}

class MCPClient {
  private mcp: Client;
  private openai: OpenAI;
  private transport: StdioClientTransport | StreamableHTTPClientTransport| null = null;
  private tools: OpenAI.ChatCompletionTool[] = [];
   
  /**Here i initialized the openai and mcp client instances */
  constructor() {
    this.openai = new OpenAI({
      apiKey: OPENAI_API_KEY,
    });
    this.mcp = new Client({ name: "local_mcp_client", version: "1.0.0" });
  }

  /** This is way to connect the mcp server according to openai */
  async connectToServer(serverScriptPath: string) {
  try {
    const isJs = serverScriptPath.endsWith(".js");
    const isPy = serverScriptPath.endsWith(".py");
    if (!isJs && !isPy) {
      throw new Error("Server script must be a .js or .py file");
    }
    const command = isPy
      ? process.platform === "win32"
        ? "python"
        : "python3"
      : process.execPath;

    this.transport = new StdioClientTransport({
      command,
      args: [serverScriptPath],
    });
    await this.mcp.connect(this.transport);

    const toolsResult = await this.mcp.listTools();
    this.tools = toolsResult.tools.map((tool) => {
      return {
        type: "function",
        function: {
          name: tool.name,
          description: tool.description,
          parameters: tool.inputSchema,
        },
      } as any;
    });
    console.log(
      "Connected to server with tools:",
      this.tools.map((tool) => (tool.type === "function" ? tool.function.name : "unknown"))
    );
  } catch (e) {
    console.log("Failed to connect to MCP server: ", e);
    throw e;
  }
}
 /** this is the method for proccessing the  query and calling the mcp server tool */

async processQuery(query: string) {
  /** this is the response of openai message*/ 
  const messages:OpenAI.ChatCompletionMessageParam[]= [
    {
      role: "user",
      content: query,
    },
  ];


  /** This is openai invoked */
 const response = await this.openai.chat.completions.create({
  model: 'gpt-5.1-mini',                             
  messages: messages, 
  tools: this.tools,               
});

console.log("OpenAI response:", response.choices[0].message);

/** this i keep for showing user related text */
   const finalText = [];

  // for (const content of response.content) {
  //   if (content.type === "text") {
  //     finalText.push(content.text);
  //   } else if (content.type === "tool_use") {
  //     const toolName = content.name;
  //     const toolArgs = content.input as { [x: string]: unknown } | undefined;

  //     const result = await this.mcp.callTool({
  //       name: toolName,
  //       arguments: toolArgs,
  //     });
  //     finalText.push(
  //       `[Calling tool ${toolName} with args ${JSON.stringify(toolArgs)}]`
  //     );

  //     messages.push({
  //       role: "user",
  //       content: result.content as string,
  //     });

  //     const response = await this.anthropic.messages.create({
  //       model: "claude-sonnet-4-20250514",
  //       max_tokens: 1000,
  //       messages,
  //     });

  //     finalText.push(
  //       response.content[0].type === "text" ? response.content[0].text : ""
  //     );
  //   }
  // }

  // return finalText.join("\n");
  return query.toString()
}




  /** this is the method for getting input form terminal */
  async chatLoop() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  try {
    console.log("\nMCP Client Started!");
    console.log("Type your queries or 'quit' to exit.");

    while (true) {
      const message = await rl.question("\nQuery: ");
      if (message.toLowerCase() === "quit") {
        break;
      }
      const response = await this.processQuery(message);
      console.log("\n" + response);
    }
  } finally {
    rl.close();
  }
}

async cleanup() {
  await this.mcp.close();
}
}


async function main() {
  if (process.argv.length < 3) {
    console.log("Usage: node index.ts <path_to_server_script>");
    return;
  }
  /**Here create the instance for server */
  const mcpClient = new MCPClient();
  try {
    await mcpClient.connectToServer(process.argv[2]);
     await mcpClient.chatLoop();
  } catch (e) {
    console.error("Error:", e);
    await mcpClient.cleanup();
    process.exit(1);
  } finally {
    await mcpClient.cleanup();
    process.exit(0);
  }
}

main();