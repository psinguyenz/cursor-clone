import { FileSystemTree } from "@webcontainer/api";

import { Doc, Id } from "../../../../convex/_generated/dataModel";

type FileDoc = Doc<"files">;

/**
 * Convert flat Convex files to nested FileSystemTree for WebContainer
 * since the convex files are stored in a flat array, we need to convert them to a nested tree structure
 * to be used by the WebContainer API
 */
export const buildFileTree = (files: FileDoc[]): FileSystemTree => {
    const tree: FileSystemTree = {};
    const filesMap = new Map(files.map((f) => [f._id, f])); // return a map of files include id and the rest of the file object

    // get the path of a file by get the full path from the root to the file 
    // {id: "123", content: "console.log('hello world')", name: "file1.tsx", parentId: "123", projectId: "1", storageId: "1", updatedAt: 1}
    // into ["src", "components", "icon.tsx"]
    const getPath = (file: FileDoc): string[] => {
        const parts: string[] = [file.name];
        let parentId = file.parentId;

        // icon.tsx => ["icon.tsx"]
        // src/icon.tsx => ["src", "icon.tsx"]
        // src/components/icon.tsx => ["src", "components", "icon.tsx"]
        while (parentId) {
            const parent = filesMap.get(parentId);
            if (!parent) break;
            parts.unshift(parent.name);
            parentId = parent.parentId;
        };

        return parts;
    };

    for (const file of files) {
        const pathParts = getPath(file);
        let current = tree;

        for (let i = 0; i < pathParts.length; i++) {
            const part = pathParts[i];
            const isLast = i === pathParts.length - 1;

            if (isLast) {
                if (file.type === "folder") {
                    current[part] = { directory: {} }; // last file and it's a folder
                } else if (!file.storageId && file.content !== undefined) {
                    current[part] = { file: { contents: file.content } }; // text file
                }
            } else {
                if (!current[part]) {
                    current[part] = { directory: {} }; // if we don't have that part in our current tree then add that part
                }
                const node = current[part];
                if ("directory" in node) {
                    current = node.directory;
                }
            }
        }
    }

    return tree;
};

/**
 * Get full path for a file by traversing parent chain
 */
// ["src", "components", "icon.tsx"] => "src/components/icon.tsx"
export const getFilePath = (
    file: FileDoc,
    filesMap: Map<Id<"files">, FileDoc>
): string => {
    const parts: string[] = [file.name];
    let parentId = file.parentId;

    while (parentId) {
        const parent = filesMap.get(parentId);
        if (!parent) break;
        parts.unshift(parent.name);
        parentId = parent.parentId;
    }

    return parts.join("/");
};