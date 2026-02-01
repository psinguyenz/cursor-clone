import { z } from "zod";
import { createTool } from "@inngest/agent-kit";
import { convex } from "@/lib/convex-client";
import { api } from "../../../../../convex/_generated/api";
import { Id } from "../../../../../convex/_generated/dataModel";

interface RenameFileToolOptions {
    internalKey: string;
}

const paramsSchema = z.object({
    fileId: z.string().min(1, "File ID is required"), // array of IDs, IDs can't be empty
    newName: z.string().min(1, "New name is required"),
});

export const createRenameFileTool = ({ internalKey }: RenameFileToolOptions) => {
    return createTool({
        name: "renameFile",
        description: "Rename a file or folder",
        parameters: z.object({
            fileId: z.string().describe("The ID of the file or folder to rename"),
            newName: z.string().describe("The new name of the file or folder"),
        }),
        handler: async (params, { step: toolStep }) => {
            const parsed = paramsSchema.safeParse(params); // fire error if the tool was called with invalid parameters
            if (!parsed.success) {
                return `Error: ${parsed.error.issues[0].message}`;
            }

            const { fileId, newName } = parsed.data;

            // Validate file exists before running the step
            const file = await convex.query(api.system.getFileById, {
                internalKey,
                fileId: fileId as Id<"files">,
            });

            if (!file) {
                return `Error: File with ID ${fileId} not found. Use listFiles tool to get valid file IDs`;
            }
            // All the checks above to help the agent to understand what's going on instead of keeping retrying in an infinite loop

            try {
                return await toolStep?.run("rename-file", async () => {
                    await convex.mutation(api.system.renameFile, {
                        internalKey,
                        fileId: fileId as Id<"files">,
                        newName,
                    });
                    return `File with ID ${fileId} has been renamed successfully`;
                });
            } catch (error) {
                return `Error renaming file: ${error instanceof Error ? error.message : "Unknown error"}`;
            }
        }
    });
};