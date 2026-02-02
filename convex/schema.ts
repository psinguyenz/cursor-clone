import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
    projects: defineTable({
        name: v.string(),
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
        settings: v.optional(
            v.object({
                installCommand: v.optional(v.string()), // instruct the webcontainer to install dependencies
                devCommand: v.optional(v.string()), // instruct the webcontainer to run the dev script
            })
        ),
    }).index("by_owner", ["ownerId"]),

    // when you load files, you basically get a flat array of objects
    // each object has a projectId, a parentId, a name, a type, a content, a storageId, and an updatedAt
    // [{ projectId: "1", parentId: "123", name: "file1.tsx", type: "file", content: "console.log('hello world')", storageId: "1", updatedAt: 1 }]
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

    conversations: defineTable({
        projectId: v.id("projects"),
        title: v.string(),
        updatedAt: v.number(),
    }).index("by_project", ["projectId"]),

    messages: defineTable({
        conversationId: v.id("conversations"),
        projectId: v.id("projects"),
        role: v.union(v.literal("user"), v.literal("assistant")),
        content: v.string(),
        status: v.optional(
            v.union(
                v.literal("processing"),
                v.literal("completed"),
                v.literal("cancelled")
            )
        ),
    })
        .index("by_conversation", ["conversationId"])
        .index("by_project_status", ["projectId", "status"])
});