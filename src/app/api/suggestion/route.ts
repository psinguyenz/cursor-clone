import { generateText, Output, tool } from "ai";
import { NextResponse } from "next/server";
import { z } from "zod";
// import { openai } from "@ai-sdk/openai";
import { google } from "@ai-sdk/google"; // Use this if you prefer Gemini
import { auth } from "@clerk/nextjs/server";

// 1. Define your schema
const suggestionSchema = z.object({
    suggestion: z.string().describe(
        "The code to insert at cursor, or empty string if no completion needed"
    ),
});

const SUGGESTION_PROMPT = `You are a code suggestion assistant.

<context>
<file_name>{fileName}</file_name>
<previous_lines>
{previousLines}
</previous_lines>
<current_line number="{lineNumber}">{currentLine}</current_line>
<before_cursor>{textBeforeCursor}</before_cursor>
<after_cursor>{textAfterCursor}</after_cursor>
<next_lines>
{nextLines}
</next_lines>
<full_code>
{code}
</full_code>
</context>

<instructions>
Follow these steps IN ORDER:

1. First, look at next_lines. If next_lines contains ANY code, check if it continues from where the cursor is. If it does, return empty string immediately - the code is already written.

2. Check if before_cursor ends with a complete statement (;, }, )). If yes, return empty string.

3. Only if steps 1 and 2 don't apply: suggest what should be typed at the cursor position, using context from full_code.

Your suggestion is inserted immediately after the cursor, so never suggest code that's already in the file.
</instructions>`;

/**
 * Handle POST requests to generate a code insertion suggestion from editor context.
 *
 * Expects the request body to be a JSON object with:
 * - fileName: The name of the file being edited.
 * - code: The full file contents.
 * - currentLine: The text of the line containing the cursor.
 * - previousLines: Text of the lines before the current line (optional).
 * - textBeforeCursor: Text immediately before the cursor on the current line.
 * - textAfterCursor: Text immediately after the cursor on the current line.
 * - nextLines: Text of the lines following the current line (optional).
 * - lineNumber: The 1-based line number of the current line.
 *
 * @param request - The incoming HTTP request whose JSON body contains the editor context.
 * @returns A JSON response:
 * - On success (200): { suggestion: string } where `suggestion` is the code to insert (or an empty string if no insertion is needed).
 * - On authentication failure (403): { error: string }.
 * - On bad request due to missing `code` (400): { error: string }.
 * - On internal error (500): { error: string }.
 */
export async function POST(request: Request) {
    try {
        const { userId } = await auth();

        if (!userId) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 403 },
            );
        }

        const {
            fileName,
            code,
            currentLine,
            previousLines,
            textBeforeCursor,
            textAfterCursor,
            nextLines,
            lineNumber,
        } = await request.json();

        if (!code) {
            return NextResponse.json(
                { error: "Code is requried" },
                { status: 400 }
            );
        }

        const prompt = SUGGESTION_PROMPT
            .replace("{fileName}", fileName)
            .replace("{code}", code)
            .replace("{currentLine}", currentLine)
            .replace("{previousLines}", previousLines || "")
            .replace("{textBeforeCursor}", textBeforeCursor)
            .replace("{textAfterCursor}", textAfterCursor)
            .replace("{nextLines}", nextLines || "")
            .replace("{lineNumber}", lineNumber.toString());

        const { output } = await generateText({
            model: google("gemini-2.5-flash-lite"), // faster
            output: Output.object({ schema: suggestionSchema }),
            prompt,
        });

        return NextResponse.json({ suggestion: output.suggestion })
    } catch (error) {
        console.error("Suggestion error: ", error);
        return NextResponse.json(
            { error: "Failed to generate suggestion" },
            { status: 500 }
        );
    }
}