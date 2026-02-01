import { z } from "zod";
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { convex } from "@/lib/convex-client";
import { Id } from "../../../../convex/_generated/dataModel";
import { api } from "../../../../convex/_generated/api";
import { inngest } from "@/inngest/client";


const requestSchema = z.object({
    conversationId: z.string(),
    message: z.string(),
});

export async function POST(request: Request) {
    const { userId } = await auth();

    if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, {
            status:
                401
        });
    }

    const internalKey = process.env.CONVEX_INTERNAL_KEY;
    // prevent hacker access to api.system.getConversationById since it's an unprotected api/function from convex
    if (!internalKey) {
        return NextResponse.json(
            { error: "Internal key not configured" },
            { status: 500 }
        )
    }

    const body = await request.json();
    const { conversationId, message } = requestSchema.parse(body);

    // Call convex mutation, query
    const conversation = await convex.query(api.system.getConversationById, {
        internalKey,
        conversationId: conversationId as Id<"conversations">,
    });

    if (!conversation) {
        return NextResponse.json(
            { error: "Conversation not configured" },
            { status: 404 }
        )
    }

    const projectId = conversation.projectId;

    // If there are any processing messages in this project, cancel them when user sends a new message  
    // Find all processing messages in this project
    const processingMessages = await convex.query(
        api.system.getProcessingMessages,
        {
            internalKey,
            projectId,
        }
    );

    if (processingMessages.length > 0) {
        // Cancel all processing messages
        await Promise.all(
            processingMessages.map(async (msg) => {
                // trigger inngest to cancel the message    
                await inngest.send({
                    name: "message/cancel",
                    data: {
                        messageId: msg._id,
                    },
                });

                // update message status to cancelled   
                await convex.mutation(api.system.updateMessageStatus, {
                    internalKey,
                    messageId: msg._id,
                    status: "cancelled",
                });
            })
        );
    };

    // Create user message
    await convex.mutation(api.system.createMessage, {
        internalKey,
        conversationId: conversationId as Id<"conversations">,
        projectId,
        role: "user",
        content: message,
    });

    // Create assistant message placeholder with processing status
    const assistantMessageId = await convex.mutation(api.system.createMessage, {
        internalKey,
        conversationId: conversationId as Id<"conversations">,
        projectId,
        role: "assistant",
        content: "",
        status: "processing",
    });

    // Trigger Inngest to process the new message   
    const event = await inngest.send({
        name: "message/sent",
        data: {
            messageId: assistantMessageId,
            conversationId,
            projectId,
            message,
        },
    });

    return NextResponse.json({
        success: true,
        eventId: event.ids[0],
        messageId: assistantMessageId,
    })

    // Invoke Inngest background jobs
};