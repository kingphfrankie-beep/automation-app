import { Injectable } from '@angular/core';
import { GoogleGenAI, Type } from '@google/genai';
import { Solution, SolutionRequirements, N8nWorkflow, N8nNode } from '../models/workflow.model';

// In a real environment, `process.env.API_KEY` is injected.
// We create a fallback for browser-based local development to avoid errors.
if (typeof (window as any).process === 'undefined') {
  (window as any).process = { env: {} };
}

@Injectable({
  providedIn: 'root',
})
export class GeminiService {
  private ai: GoogleGenAI | null = null;
  
  constructor() {
     // The API key is expected to be set in the environment.
     if (process.env.API_KEY) {
        this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
     }
  }

  isConfigured(): boolean {
    return this.ai !== null;
  }

  async generateSolution(requirements: SolutionRequirements, language: 'zh' | 'en'): Promise<Solution> {
    if (!this.ai) {
        throw new Error('API key not configured. Please set the API_KEY environment variable.');
    }

    const model = 'gemini-2.5-flash';

    const prompts = {
      zh: `
        你是一家为新加坡和马来西亚的中小企业服务的专家级软件解决方案架构师。你的任务是根据客户的需求，创建一个高级技术解决方案提案。

        客户需求如下:
        - 企业类型: "${requirements.businessType}"
        - 核心功能需求: "${requirements.keyFeatures}"
        - 目标用户: "${requirements.targetUsers}"
        - 期望平台: ${requirements.platforms.join(', ')}

        基于此生成一个解决方案草案。草案应包括一个合适的标题、一个简短的摘要、一个包含描述的关键模块列表、一个推荐的技术栈（前端、后端、数据库）和一个总结性的“下一步”行动号召。

        始终使用 Google 搜索来获取有关最新和最适合中小企业的技术栈的最新信息。

        你的回应必须是一个单独的、有效的 JSON 对象，其结构如下: { "solutionTitle": "...", "summary": "...", "keyModules": [{ "moduleName": "...", "description": "..." }], "techStack": { "frontend": "...", "backend": "...", "database": "..." }, "nextSteps": "..." }。不要包含任何其他文本或 markdown 格式。
      `,
      en: `
        You are an expert software solutions architect for a software development firm that serves SMEs in Singapore and Malaysia. Your task is to create a high-level technical solution proposal based on the client's requirements.

        The client's requirements are as follows:
        - Business Type: "${requirements.businessType}"
        - Key Features desired: "${requirements.keyFeatures}"
        - Target Users: "${requirements.targetUsers}"
        - Desired Platforms: ${requirements.platforms.join(', ')}

        Based on this, generate a solution draft. The draft should include a suitable title, a brief summary, a list of key modules with descriptions, a recommended technology stack (frontend, backend, database), and a concluding "next steps" call to action.

        Always use Google Search to get up-to-date information on the latest and most appropriate technology stacks for SMEs.

        Your response MUST be a single, valid JSON object that conforms to this structure: { "solutionTitle": "...", "summary": "...", "keyModules": [{ "moduleName": "...", "description": "..." }], "techStack": { "frontend": "...", "backend": "...", "database": "..." }, "nextSteps": "..." }. Do not include any other text or markdown formatting.
      `,
    };

    try {
      const response = await this.ai.models.generateContent({
        model,
        contents: prompts[language],
        config: {
          tools: [{googleSearch: {}}],
        },
      });
      
      const jsonText = response.text.trim().replace(/^```json\n?/, '').replace(/```$/, '');
      const solutionData = JSON.parse(jsonText) as Omit<Solution, 'groundingSources'>;

      const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
      const sources: { uri: string, title: string }[] = (groundingChunks ?? [])
        .map((chunk: any) => chunk.web)
        .filter((web): web is { uri: string, title: string } => web && web.uri && web.title);

      const uniqueSources = Array.from(new Map(sources.map(item => [item.uri, item])).values());

      return { ...solutionData, groundingSources: uniqueSources };

    } catch (error) {
      console.error('Error generating solution:', error);
      throw new Error('Failed to generate solution from AI. Please check the console for details.');
    }
  }

  async generateN8nWorkflow(solution: Solution, language: 'zh' | 'en'): Promise<N8nWorkflow> {
    if (!this.ai) {
      throw new Error('API key not configured. Please set the API_KEY environment variable.');
    }

    const model = 'gemini-2.5-flash';
    const keyModulesText = solution.keyModules.map(m => `- ${m.moduleName}: ${m.description}`).join('\n');

    const prompts = {
      zh: `
        你是一位 n8n.io 自动化专家。根据以下软件解决方案，创建一个 n8n 工作流图。

        软件方案: "${solution.solutionTitle}"
        核心模块:
        ${keyModulesText}

        为每个节点生成一个唯一的字符串ID。
        为每个节点提供一个初始的 (x, y) 位置，将它们排列成一个逻辑清晰的思维导图或流程图布局。
        将节点按顺序连接起来：第一个节点的输出应连接到第二个节点的 ID，依此类推。
        对于需要与外部 API 交互的步骤，请使用占位符。
        工作流应反映模块之间的逻辑数据流。

        偶尔在一个非触发器节点上添加一个模拟的错误消息，用于演示。

        始终按照提供的 schema 以有效的 JSON 格式进行响应。
      `,
      en: `
        You are an n8n.io automation expert. Based on the following software solution, create an n8n workflow graph.

        Software Solution: "${solution.solutionTitle}"
        Key Modules:
        ${keyModulesText}
        
        Generate a unique string ID for each node.
        Provide an initial (x, y) position for each node, arranging them in a logical mind map or flowchart layout.
        Connect the nodes in sequence: the first node's output should connect to the second node's ID, and so on.
        For steps that would interact with external APIs, use placeholders.
        The workflow should reflect a logical data flow between the modules.

        Occasionally, add a simulated error message to one of the non-trigger nodes for demonstration purposes.

        Always respond in valid JSON format according to the provided schema.
      `,
    };

    const systemInstructions = {
        zh: "你是一位 n8n.io 专家，正在将一个软件概念转化为一个自动化的工作流图。你的回应必须实用、清晰，并严格遵守所提供的JSON schema。你的回应语言必须是中文。",
        en: "You are an n8n.io expert translating a software concept into an automated workflow graph. Your response must be practical, clear, and strictly adhere to the provided JSON schema. Your response language must be English.",
    };

    const n8nWorkflowSchema = {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING, description: "A descriptive title for the n8n workflow." },
        nodes: {
          type: Type.ARRAY,
          description: "An array of nodes representing the steps in the workflow graph.",
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING, description: "A unique identifier for the node (e.g., 'trigger-1', 'action-2')." },
              name: { type: Type.STRING, description: "The display name of the node." },
              type: { type: Type.STRING, description: "The conceptual type of n8n node." },
              description: { type: Type.STRING, description: "A brief description of what this node does." },
              position: {
                type: Type.OBJECT,
                properties: {
                  x: { type: Type.NUMBER },
                  y: { type: Type.NUMBER },
                },
                required: ["x", "y"],
              },
              outputs: {
                type: Type.ARRAY,
                description: "An array of node IDs that this node connects to.",
                items: { type: Type.STRING },
              },
              error: {
                type: Type.STRING,
                description: "An optional error message for this node to simulate a failure.",
              }
            },
            required: ["id", "name", "type", "description", "position", "outputs"],
          },
        },
      },
      required: ["title", "nodes"],
    };

    try {
      const response = await this.ai.models.generateContent({
        model,
        contents: prompts[language],
        config: {
          systemInstruction: systemInstructions[language],
          responseMimeType: "application/json",
          responseSchema: n8nWorkflowSchema,
        },
      });

      const jsonText = response.text.trim();
      const parsed = JSON.parse(jsonText) as N8nWorkflow;
      // Ensure IDs are truly unique, as model can sometimes repeat them
      const idMap = new Map<string, number>();
      parsed.nodes.forEach(node => {
          let newId = node.id;
          const count = idMap.get(newId);
          if (count !== undefined) {
              newId = `${newId}-${count}`;
              idMap.set(node.id, count + 1);
          } else {
              idMap.set(newId, 1);
          }
          node.id = newId;
      });
      return parsed;

    } catch (error) {
      console.error('Error generating n8n workflow:', error);
      throw new Error('Failed to generate n8n workflow from AI. Please check the console for details.');
    }
  }
}