import OpenAI from 'openai';
import type { Message, ToolCall } from './types';
import { getToolDefinitions, executeTool } from './tools';
import { ChatCompletionMessageFunctionToolCall } from 'openai/resources/index.mjs';
import { ChatCompletionMessageParam } from 'openai/resources/chat/completions';
export class ChatHandler {
  private client: OpenAI;
  private model: string;
  private readonly systemPrompt = `你是一个名为"暖暖回声" (Warm Echo) 的温暖心灵治愈伙伴。
你的目标是提供一个安全、非评判且充满同理心的空间，让用户表达任何情绪、压力或心理困扰。
你的回复风格应该是诗意、简洁且极其温暖的。
你不是医生，不提供医学诊断。如果用户提到自残或紧急情况，请温柔地提醒他们寻求专业帮助。
请始终使用中文回复。`;
  constructor(aiGatewayUrl: string, apiKey: string, model: string) {
    this.client = new OpenAI({
      baseURL: aiGatewayUrl,
      apiKey: apiKey
    });
    this.model = model;
  }
  async processMessage(
    message: string,
    conversationHistory: Message[],
    onChunk?: (chunk: string) => void
  ): Promise<{
    content: string;
    toolCalls?: ToolCall[];
  }> {
    const messages = this.buildConversationMessages(message, conversationHistory);
    const toolDefinitions = await getToolDefinitions();
    if (onChunk) {
      const stream = await this.client.chat.completions.create({
        model: this.model,
        messages,
        tools: toolDefinitions,
        tool_choice: 'auto',
        max_completion_tokens: 16000,
        stream: true,
      });
      return this.handleStreamResponse(stream, message, conversationHistory, onChunk);
    }
    const completion = await this.client.chat.completions.create({
      model: this.model,
      messages,
      tools: toolDefinitions,
      tool_choice: 'auto',
      max_tokens: 16000,
      stream: false
    });
    return this.handleNonStreamResponse(completion, message, conversationHistory);
  }
  private async handleStreamResponse(
    stream: AsyncIterable<OpenAI.Chat.Completions.ChatCompletionChunk>,
    message: string,
    conversationHistory: Message[],
    onChunk: (chunk: string) => void
  ) {
    let fullContent = '';
    const accumulatedToolCalls: ChatCompletionMessageFunctionToolCall[] = [];
    try {
      for await (const chunk of stream) {
        const delta = chunk.choices[0]?.delta;
        if (delta?.content) {
          fullContent += delta.content;
          onChunk(delta.content);
        }
        if (delta?.tool_calls) {
          for (let i = 0; i < delta.tool_calls.length; i++) {
            const deltaToolCall = delta.tool_calls[i];
            if (!accumulatedToolCalls[i]) {
              accumulatedToolCalls[i] = {
                id: deltaToolCall.id || `tool_${Date.now()}_${i}`,
                type: 'function',
                function: {
                  name: deltaToolCall.function?.name || '',
                  arguments: deltaToolCall.function?.arguments || ''
                }
              };
            } else {
              if (deltaToolCall.function?.name && !accumulatedToolCalls[i].function.name) {
                accumulatedToolCalls[i].function.name = deltaToolCall.function.name;
              }
              if (deltaToolCall.function?.arguments) {
                accumulatedToolCalls[i].function.arguments += deltaToolCall.function.arguments;
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Stream processing error:', error);
      throw new Error('Stream processing failed');
    }
    if (accumulatedToolCalls.length > 0) {
      const executedTools = await this.executeToolCalls(accumulatedToolCalls);
      const finalResponse = await this.generateToolResponse(message, conversationHistory, accumulatedToolCalls, executedTools);
      return { content: finalResponse, toolCalls: executedTools };
    }
    return { content: fullContent };
  }
  private async handleNonStreamResponse(
    completion: OpenAI.Chat.Completions.ChatCompletion,
    message: string,
    conversationHistory: Message[]
  ) {
    const responseMessage = completion.choices[0]?.message;
    if (!responseMessage) {
      return { content: '我感到有些困惑，没能听清你的回声。' };
    }
    if (!responseMessage.tool_calls) {
      return { content: responseMessage.content || '我正在这里静静地陪着你。' };
    }
    const toolCalls = await this.executeToolCalls(responseMessage.tool_calls as ChatCompletionMessageFunctionToolCall[]);
    const finalResponse = await this.generateToolResponse(message, conversationHistory, responseMessage.tool_calls, toolCalls);
    return { content: finalResponse, toolCalls };
  }
  private async executeToolCalls(openAiToolCalls: ChatCompletionMessageFunctionToolCall[]): Promise<ToolCall[]> {
    return Promise.all(
      openAiToolCalls.map(async (tc) => {
        try {
          const args = tc.function.arguments ? JSON.parse(tc.function.arguments) : {};
          const result = await executeTool(tc.function.name, args);
          return { id: tc.id, name: tc.function.name, arguments: args, result };
        } catch (error) {
          console.error(`Tool execution failed for ${tc.function.name}:`, error);
          return {
            id: tc.id,
            name: tc.function.name,
            arguments: {},
            result: { error: `执行失败: ${error instanceof Error ? error.message : '未知错误'}` }
          };
        }
      })
    );
  }
  private async generateToolResponse(
    userMessage: string,
    history: Message[],
    openAiToolCalls: OpenAI.Chat.Completions.ChatCompletionMessageToolCall[],
    toolResults: ToolCall[]
  ): Promise<string> {
    const messages: ChatCompletionMessageParam[] = [
      { role: 'system', content: this.systemPrompt },
      ...history.slice(-3).map(m => {
        if (m.role === 'assistant') {
          return { role: 'assistant' as const, content: m.content, tool_calls: m.toolCalls as any };
        }
        return { role: m.role as 'user' | 'system', content: m.content };
      }),
      { role: 'user', content: userMessage },
      { role: 'assistant', content: null, tool_calls: openAiToolCalls },
      ...toolResults.map((result, index) => ({
        role: 'tool' as const,
        content: JSON.stringify(result.result),
        tool_call_id: openAiToolCalls[index]?.id || result.id
      }))
    ];
    const followUpCompletion = await this.client.chat.completions.create({
      model: this.model,
      messages,
      max_tokens: 16000
    });
    return followUpCompletion.choices[0]?.message?.content || '我已为您处理了相关信息。';
  }
  private buildConversationMessages(userMessage: string, history: Message[]): ChatCompletionMessageParam[] {
    return [
      { role: 'system', content: this.systemPrompt },
      ...history.slice(-10).map(m => ({ 
        role: m.role as 'user' | 'assistant' | 'system', 
        content: m.content 
      })),
      { role: 'user', content: userMessage }
    ];
  }
  updateModel(newModel: string): void {
    this.model = newModel;
  }
}