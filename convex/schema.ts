import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
    projects: defineTable({
        name:v.string(),
        ownerId: v.string(),
        importStatus: v.optional(
            v.union(
                // these enums mark the status of the import
                v.literal("importing"),
                v.literal("completed"),
                v.literal("failed")
            ),
        ),
    }).index("by_owner", ["ownerId"])
});