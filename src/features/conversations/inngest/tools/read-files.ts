import { z } from "zod";
import { createTool } from "@inngest/agent-kit";
import { convex } from "@/lib/convex-client";
import { api } from "../../../../../convex/_generated/api";
import { Id } from "../../../../../convex/_generated/dataModel";

interface ReadFileToolOptions {
    internalKey: string;
}

const paramsSchema = z.object({
    fileIds: z.array(z.string().min(1, "File ID cannot be empty")) // array of IDs, IDs can't be empty
        .min(1, "Provide at least one file ID"), // array can't be empty
});

export const createReadFileTool = ({ internalKey }: ReadFileToolOptions) => {
    return createTool({
        name: "readFiles",
        description: "Read the content of files from the project. Returns file contents",
        parameters: z.object({
            fileIds: z.array(z.string()).describe("Array of file IDs to read"),
        }),
        handler: async (params, { step: toolStep }) => {
            const parsed = paramsSchema.safeParse(params); // fire error if the tool was called with invalid parameters
            if (!parsed.success) {
                return `Error: ${parsed.error.issues[0].message}`;
            }

            const { fileIds } = parsed.data;

            try {
                return await toolStep?.run("read-files", async () => {
                    // an array of file objects, each object has id, name, and content 
                    const results: { id: string; name: string; content: string }[] = []

                    for (const fileId of fileIds) {
                        const file = await convex.query(api.system.getFileById, {
                            internalKey,
                            fileId: fileId as Id<"files">,
                        });

                        // if we successfully retrieve the file and it has content, add it to the results
                        if (file && file.content) {
                            results.push({
                                id: file._id,
                                name: file.name,
                                content: file.content,
                            });
                        }
                    }

                    if (results.length === 0) {
                        return "Error: No files found with provided IDs. Use listFiles tool to get valid file IDs";
                    }

                    return JSON.stringify(results);
                });
            } catch (error) {
                return `Error reading files: ${error instanceof Error ? error.message : "Unknown error"}`;
            }
        }
    })
}