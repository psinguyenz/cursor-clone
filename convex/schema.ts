import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
    projects: defineTable({
        name:v.string(),
        ownerId: v.string(),
        updatedAt: v.number(),
        importStatus: v.optional(
            v.union(
                // these enums mark the status of the import
                v.literal("importing"),
                v.literal("completed"),
                v.literal("failed")
            ),
        ),
        exportStatus: v.optional(
            v.union(
                // these enums mark the status of the import
                v.literal("exporting"),
                v.literal("completed"),
                v.literal("failed"),
                v.literal("cancelled"),
            ),
        ),
        exportRepoUrl: v.optional(v.string()),
    }).index("by_owner", ["ownerId"]),
});