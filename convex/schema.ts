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

    files: defineTable({
        projectId: v.id("projects"),
        parentId: v.optional(v.id("files")), // each file can have a parent file or not
        name: v.string(),
        type: v.union(v.literal("file"), v.literal("folder")), // can either be a file or folder
        content: v.optional(v.string()), // text files only
        storageId: v.optional(v.id("_storage")), // binary files only (png, jpg,...), refers to the storage property
        updatedAt: v.number(),
    })
        .index("by_project", ["projectId"])
        .index("by_parent", ["parentId"])
        .index("by_project_parent", ["projectId", "parentId"]),
});