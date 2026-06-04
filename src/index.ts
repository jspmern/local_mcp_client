
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import readline from "readline/promises";
import dotenv from "dotenv";
import OpenAI from "openai";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { Tool } from "openai/resources/responses/responses.js";

dotenv.config();

const OPENAI_API_KEY = process.env.OPENAI_API_KEY
if (!OPENAI_API_KEY) {
  throw new Error("OPENAI_API_KEY is not set");
}

class MCPClient {
  private mcp: Client;
  private openai: OpenAI;
  private transport: StdioClientTransport | StreamableHTTPClientTransport| null = null;
  private tools: Tool[] = [];
   
  /**Here i initialized the openai and mcp client instances */
  constructor() {
    this.openai = new OpenAI({
      apiKey: OPENAI_API_KEY,
    });
    this.mcp = new Client({ name: "local_mcp_client", version: "1.0.0" });
  }
  
}