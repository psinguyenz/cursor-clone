import { inngest } from "@/inngest/client";
import { Id } from "../../../../convex/_generated/dataModel";
import { NonRetriableError } from "inngest";
import { convex } from "@/lib/convex-client";
import { api } from "../../../../convex/_generated/api";
import { CODING_AGENT_SYSTEM_PROMPT, TITLE_GENERATOR_SYSTEM_PROMPT } from "./constants";
import { DEFAULT_CONVERSATION_TITLE } from "../constants";
import { createAgent, createNetwork, gemini } from "@inngest/agent-kit";
import { createReadFileTool } from "./tools/read-files";
import { createListFilesTool } from "./tools/list-files";
import { createUpdateFileTool } from "./tools/update-files";
import { createCreateFilesTool } from "./tools/create-files";
import { createCreateFolderTool } from "./tools/create-folder";
import { createRenameFileTool } from "./tools/rename-file";
import { createDeleteFilesTool } from "./tools/delete-files";
import { createScrapeUrlsTool } from "./tools/scrape-urls";

interface MessageEvent {
    messageId: Id<"messages">;
    conversationId: Id<"conversations">;
    projectId: Id<"projects">;
    message: string;
};

export const processMessage = inngest.createFunction(
    {
        id: "process-message",
        cancelOn: [
            {
                event: "message/cancel",
                if: "event.data.messageId == async.data.messageId",
            },
        ],
        onFailure: async ({ event, step }) => {
            const { messageId } = event.data.event.data as MessageEvent;
            const internalKey = process.env.CONVEX_INTERNAL_KEY;

            // Update the message with error content
            if (internalKey) {
                await step.run("update-message-on-failure", async () => {
                    await convex.mutation(api.system.updateMessageContent, {
                        internalKey,
                        messageId,
                        content: "My apologies, I encountered an error while processing your request. Let me know if you need anything else!",
                    });
                });
            }
        }
    },
    {
        event: "message/sent",

    },
    async ({ event, step }) => {
        const {
            messageId,
            conversationId,
            projectId,
            message
        } = event.data as MessageEvent;

        const internalKey = process.env.CONVEX_INTERNAL_KEY;

        if (!internalKey) {
            throw new NonRetriableError("CONVEX_INTERNAL_KEY is not configured");
        }

        // TODO: Check if this is needed, maybe an inngest run faster than convex database updated
        await step.sleep("wait-for-db-sync", "1s");

        // Get conversation for title generation check
        const conversation = await step.run("get-conversation", async () => {
            return await convex.query(api.system.getConversationById, {
                internalKey,
                conversationId,
            });
        });

        if (!conversation) {
            throw new NonRetriableError("Conversation not found");
        }

        // Fetch recent messages for conversation context
        const recentMessages = await step.run("get-recent-messages", async () => {
            return await convex.query(api.system.getRecentMessages, {
                internalKey,
                conversationId,
                limit: 10, // Sweat spot between context and performance, price and quality
            });
        });

        // Build system prompt with conversation history (exclude the current processing message)
        let systemPrompt = CODING_AGENT_SYSTEM_PROMPT;

        // Filter out the current processing message and empty messages
        const contextMessages = recentMessages.filter(
            (msg) => msg._id !== messageId && msg.content.trim() !== ""
        );

        if (contextMessages.length > 0) {
            // each message will return a template like "USER: Hello" or "ASSISTANT: Hi"
            const historyText = contextMessages.map((msg) => `${msg.role.toUpperCase()}: ${msg.content}`).join("\n");
            systemPrompt += `\n\n## Previous Conversation (for context only 
            - do NOT repeat these responses):\n${historyText}\n\n## 
            Current Request:\nRespond ONLY to the user's new message below. 
            Do not repeat or reference your previous responses.`;
        }

        // Generate conversation title if it's still the default
        const shouldGenerateTitle = conversation.title === DEFAULT_CONVERSATION_TITLE;

        if (shouldGenerateTitle) {
            const titleAgent = createAgent({
                name: "title-generator",
                system: TITLE_GENERATOR_SYSTEM_PROMPT,
                model: gemini({
                    model: "gemini-2.5-flash-lite",
                    apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY, // need this to run
                }),
            });

            const { output } = await titleAgent.run(message, { step });

            // response from the assistant in the form of text
            const textMessage = output.find((m) => m.type === "text" && m.role === "assistant");

            if (textMessage?.type === "text") {
                // Extract text from the message content, and trimming manually
                const title = typeof textMessage.content === "string"
                    ? textMessage.content.trim()
                    : textMessage.content
                        .map((c) => c.text)
                        .join("")
                        .trim();

                if (title) {
                    await step.run("update-conversation-title", async () => {
                        await convex.mutation(api.system.updateConversationTitle, {
                            internalKey,
                            conversationId,
                            title,
                        });
                    });
                }
            }
        }

        // Create the coding agent with file tools
        const codingAgent = createAgent({
            name: "polaris",
            description: "An expert AI coding assistant",
            // using prompt repetition to avoid the agent from hallucinating (Google Reseach '25)
            system: systemPrompt + "\n\n" + systemPrompt,
            model: gemini({
                model: "gemini-2.5-flash",
                apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY, // need this to run
            }),
            tools: [
                createReadFileTool({ internalKey }),
                createListFilesTool({ internalKey, projectId }),
                createUpdateFileTool({ internalKey }),
                createCreateFilesTool({ internalKey, projectId }),
                createCreateFolderTool({ internalKey, projectId }),
                createRenameFileTool({ internalKey }),
                createDeleteFilesTool({ internalKey }),
                createScrapeUrlsTool(),
            ],
        });

        // Create network to create while loops with memory (state) that call Agents and Tools until the Router decides to stop
        const network = createNetwork({
            name: "polaris-network",
            agents: [codingAgent],
            maxIter: 20, // limit the usage for cost control, maybe we can increase for pro users
            router: ({ network }) => {
                const lastResult = network.state.results.at(-1);
                const hasTextReponse = lastResult?.output.some(
                    (m) => m.type === "text" && m.role === "assistant"
                );
                const hasToolCalls = lastResult?.output.some(
                    (m) => m.type === "tool_call"
                );

                // Only stop if there is a text response WITHOUT tool calls
                if (hasTextReponse && !hasToolCalls) {
                    return undefined; // breaks the router loop
                }
                return codingAgent; // continue the router loop
            }
        });

        // Run the router agent
        const result = await network.run(message);

        // Extract the assistant's text response form the last agent result
        const lastMessage = result.state.results.at(-1);
        const textMessage = lastMessage?.output.find(
            (m) => m.type === "text" && m.role === "assistant"
        );

        let assistantResponse = "I processed your request. Let me know if you need anything else!";

        if (textMessage?.type === "text") {
            assistantResponse = typeof textMessage.content === "string"
                ? textMessage.content
                : textMessage.content
                    .map((c) => c.text)
                    .join("");
        }

        // Update the assistant message with the final response (this also set status to 'completed')
        await step.run("update-assistant-message", async () => {
            await convex.mutation(api.system.updateMessageContent, {
                internalKey,
                messageId,
                content: assistantResponse
            })
        });

        return { success: true, messageId, conversationId };
    }
);