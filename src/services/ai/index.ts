import { createClient } from "@/lib/supabase/server";

interface AIMessage {
  role: "user" | "assistant" | "system";
  content: string;
  toolCalls?: any[];
}

interface AIResponse {
  content: string;
  toolCalls?: { name: string; args: any; result: any }[];
}

interface AIContext {
  userId: string;
  conversationId?: string;
}

export class AIService {
  private provider: string;
  private apiKey: string;

  constructor() {
    this.provider = process.env.AI_PROVIDER || "openai";
    this.apiKey = process.env.AI_API_KEY || "";
  }

  async chat(messages: AIMessage[], context: AIContext): Promise<AIResponse> {
    const systemPrompt = await this.buildSystemPrompt(context);
    const apiMessages = [
      { role: "system", content: systemPrompt },
      ...messages,
    ];

    if (!this.apiKey) {
      return this.simulateResponse(messages, context);
    }

    try {
      const response = await fetch(this.getApiEndpoint(), {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: this.getModel(),
          messages: apiMessages,
          tools: this.getTools(),
          tool_choice: "auto",
        }),
      });

      const data = await response.json();
      const choice = data.choices?.[0];

      if (choice?.message?.tool_calls) {
        const results = await this.executeToolCalls(choice.message.tool_calls, context);
        return {
          content: choice.message.content || "",
          toolCalls: results,
        };
      }

      return { content: choice?.message?.content || "" };
    } catch (error) {
      console.error("AI API error:", error);
      return this.simulateResponse(messages, context);
    }
  }

  async stream(messages: AIMessage[], context: AIContext): Promise<ReadableStream> {
    const systemPrompt = await this.buildSystemPrompt(context);
    const apiMessages = [
      { role: "system", content: systemPrompt },
      ...messages,
    ];

    if (!this.apiKey) {
      return this.streamSimulated(messages, context);
    }

    const response = await fetch(this.getApiEndpoint(), {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: this.getModel(),
        messages: apiMessages,
        stream: true,
      }),
    });

    return response.body || new ReadableStream();
  }

  private getTools() {
    return [
      {
        type: "function",
        function: {
          name: "get_user_profile",
          description: "Get the current user's profile information",
          parameters: { type: "object", properties: {} },
        },
      },
      {
        type: "function",
        function: {
          name: "get_streak",
          description: "Get the current user's streak information",
          parameters: { type: "object", properties: {} },
        },
      },
      {
        type: "function",
        function: {
          name: "get_today_task",
          description: "Get today's streak task",
          parameters: { type: "object", properties: {} },
        },
      },
      {
        type: "function",
        function: {
          name: "get_reward_balance",
          description: "Get the user's reward wallet balance",
          parameters: { type: "object", properties: {} },
        },
      },
      {
        type: "function",
        function: {
          name: "get_trading_account",
          description: "Get the user's trading account and portfolio",
          parameters: { type: "object", properties: {} },
        },
      },
    ];
  }

  private async executeToolCalls(toolCalls: any[], context: AIContext) {
    const results = [];
    for (const tool of toolCalls) {
      const result = await this.executeTool(tool.function.name, tool.function.arguments, context);
      results.push({ name: tool.function.name, args: tool.function.arguments, result });
    }
    return results;
  }

  async executeTool(toolName: string, args: any, context: AIContext) {
    const supabase = await createClient();
    const { userId } = context;

    switch (toolName) {
      case "get_user_profile": {
        const { data } = await supabase
          .from("profiles")
          .select("*")
          .eq("user_id", userId)
          .single();
        return data;
      }
      case "get_streak": {
        const { data } = await supabase
          .from("user_streaks")
          .select("*")
          .eq("user_id", userId)
          .single();
        return data;
      }
      case "get_today_task": {
        const { data: streak } = await supabase
          .from("user_streaks")
          .select("current_streak")
          .eq("user_id", userId)
          .single();
        const dayIndex = (streak?.current_streak || 0) % 4;
        const tasks = ["Daily Engagement", "Daily Check-in", "Daily Quiz", "Share & Refer"];
        return { task: tasks[dayIndex], dayNumber: dayIndex + 1 };
      }
      case "get_reward_balance": {
        const { data: wallet } = await supabase
          .from("wallets")
          .select("balance")
          .eq("user_id", userId)
          .eq("currency", "NGN")
          .single();
        return { balance: wallet?.balance || 0, currency: "NGN" };
      }
      case "get_trading_account": {
        const { data: account } = await supabase
          .from("trading_accounts")
          .select("*, trading_positions(*)")
          .eq("user_id", userId)
          .single();
        return account;
      }
      default:
        return { error: "Unknown tool" };
    }
  }

  private async buildSystemPrompt(context: AIContext): Promise<string> {
    const supabase = await createClient();
    let userData = "";

    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, verification_status")
      .eq("user_id", context.userId)
      .single();

    const { data: streak } = await supabase
      .from("user_streaks")
      .select("current_streak, longest_streak")
      .eq("user_id", context.userId)
      .single();

    const { data: wallet } = await supabase
      .from("wallets")
      .select("balance")
      .eq("user_id", context.userId)
      .eq("currency", "NGN")
      .single();

    userData = `
User Data:
- Name: ${profile?.full_name || "Unknown"}
- Verification: ${profile?.verification_status || "unverified"}
- Current Streak: ${streak?.current_streak || 0} days
- Longest Streak: ${streak?.longest_streak || 0} days
- Reward Balance: \u20A6${wallet?.balance || 0}
      `.trim();

    return `You are STREAK AI, a helpful assistant for the StreakPay platform.

Your role:
- Help users understand their streak progress
- Explain reward milestones and eligibility
- Provide trading insights (simulated market only)
- Answer questions about the platform
- Guide users through features

Important rules:
- NEVER approve payments or modify financial data
- NEVER access other users' data
- Always refer to the database for current state, not conversation memory
- SPK is a simulated asset, NOT real cryptocurrency
- For sensitive actions (withdrawals, trades), guide users to the appropriate page
- Be concise, helpful, and futuristic in tone

${userData}`;
  }

  private simulateResponse(messages: AIMessage[], context: AIContext): AIResponse {
    const lastMessage = messages[messages.length - 1]?.content?.toLowerCase() || "";

    if (lastMessage.includes("streak") || lastMessage.includes("day")) {
      return {
        content: "I can help you track your streak! To see your current streak details, check the Streak page in your dashboard. Complete daily tasks to keep your streak going!",
      };
    }
    if (lastMessage.includes("reward") || lastMessage.includes("balance")) {
      return {
        content: "Your rewards are tracked in your Reward Wallet. Check the Rewards page to see your milestones and available balance. Complete streaks to unlock bigger rewards!",
      };
    }
    if (lastMessage.includes("trade") || lastMessage.includes("portfolio")) {
      return {
        content: "Your virtual trading portfolio is in the Trade section. Remember, SPK is a simulated asset with no real money involved. You can practice trading strategies risk-free!",
      };
    }
    if (lastMessage.includes("withdraw")) {
      return {
        content: "To withdraw your rewards, go to the Withdrawals page. You need a verified account and minimum \u20A6500 balance. Would you like me to guide you there?",
      };
    }
    return {
      content: "I'm STREAK AI, your StreakPay assistant. I can help with your streak, rewards, trading, and account questions. What would you like to know?",
    };
  }

  private async streamSimulated(messages: AIMessage[], context: AIContext): Promise<ReadableStream> {
    const response = this.simulateResponse(messages, context);
    const encoder = new TextEncoder();
    const words = response.content.split(" ");

    return new ReadableStream({
      async start(controller) {
        for (const word of words) {
          controller.enqueue(encoder.encode(word + " "));
          await new Promise((r) => setTimeout(r, 50));
        }
        controller.close();
      },
    });
  }

  private getApiEndpoint(): string {
    const endpoints: Record<string, string> = {
      openai: "https://api.openai.com/v1/chat/completions",
      anthropic: "https://api.anthropic.com/v1/messages",
    };
    return endpoints[this.provider] || endpoints.openai;
  }

  private getModel(): string {
    const models: Record<string, string> = {
      openai: "gpt-4o-mini",
      anthropic: "claude-3-haiku-20240307",
    };
    return models[this.provider] || models.openai;
  }
}

export const aiService = new AIService();
