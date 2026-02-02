import { useCallback, useEffect, useRef, useState } from "react";
import { WebContainer } from "@webcontainer/api";
import {
    buildFileTree,
    getFilePath
} from "@/features/preview/utils/file-tree";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";
import { useFiles } from "@/features/projects/hooks/use-files";

// Singleton WebContainer instance
let webcontainerInstance: WebContainer | null = null;
let bootPromise: Promise<WebContainer> | null = null;

const getWebcontainer = async (): Promise<WebContainer> => {
    if (webcontainerInstance) {
        return webcontainerInstance;
    }

    if (!bootPromise) {
        // this is from the documentation
        // this is how we make sure that the webcontainer is always the same instance
        bootPromise = WebContainer.boot({ coep: "credentialless" });
    }

    webcontainerInstance = await bootPromise;
    return webcontainerInstance;
}

// This is to reduce memory leaks
const teardownWebContainer = () => {
    if (webcontainerInstance) {
        webcontainerInstance.teardown();
        webcontainerInstance = null;
    }
    bootPromise = null;
};

interface UseWebContainerProps {
    projectId: Id<"projects">;
    enabled: boolean;
    settings?: {
        installCommand?: string;
        devCommand?: string;
    };
};

// Webcontainer is a better choice than sandbox but it is also usage-limited
export const useWebContainer = ({ projectId, enabled, settings }: UseWebContainerProps) => {
    const [status, setStatus] = useState<"idle" | "booting" | "installing" | "running" | "error">("idle");
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    // change the key of an element (because changing in react will make it render entirely)
    // Kinda like a hack to refresh the webcontainer (forcefully restart)
    const [restartKey, setRestartKey] = useState(0);
    const [terminalOutput, setTerminalOutput] = useState("");

    const containerRef = useRef<WebContainer | null>(null);
    const hasStartedRef = useRef(false);

    // Fetch files from Convex (auto-updates on any changes) => hot reload
    const files = useFiles(projectId);

    // Initial boot and mount files
    useEffect(() => {
        // if we haven't enabled it || we haven't fetched the files || the files are empty || we have already started it
        if (!enabled || !files || files.length === 0 || hasStartedRef.current) {
            return;
        }

        hasStartedRef.current = true;

        const start = async () => {
            try {
                setStatus("booting");
                setError(null);
                setTerminalOutput(""); // these three are kinda like a reset 

                const appendOutput = (text: string) => {
                    setTerminalOutput((prev) => prev + text); // append the data to the current of the state
                };

                const container = await getWebcontainer();
                containerRef.current = container;

                const fileTree = buildFileTree(files); // since we build the file tree from the files array, 
                // we can use it directly and it will be compatible with the webcontainer api
                await container.mount(fileTree);

                // Look for an event that tells us the server is ready
                container.on("server-ready", (_port, url) => {
                    setPreviewUrl(url);
                    setStatus("running");
                });

                // Only when the server is ready, we can start installing the dependencies
                setStatus("installing");

                // 1. Parse install command (default: npm install)
                const installCmd = settings?.installCommand || "npm install";
                const [installBin, ...installArgs] = installCmd.split(" "); // ["npm", "install"]
                appendOutput(`$ ${installCmd}\n`) // show to the user that we are installing the dependencies
                const installProcess = await container.spawn(installBin, installArgs);

                // pipe the output of the install process to the terminal output
                // this is how we get the data from the install process to the terminal output
                installProcess.output.pipeTo(
                    new WritableStream({
                        write(data) { appendOutput(data) }, // write the data to the terminal output
                    })
                );

                const installExitCode = await installProcess.exit;
                if (installExitCode !== 0) {
                    throw new Error(`${installCmd} failed with code ${installExitCode}`);
                }

                // 2. Parse dev command (default: npm run dev) same as install command
                const devCmd = settings?.devCommand || "npm run dev";
                const [devBin, ...devArgs] = devCmd.split(" ");
                appendOutput(`\n$ ${devCmd}\n`);
                const devProcess = await container.spawn(devBin, devArgs);
                devProcess.output.pipeTo(
                    new WritableStream({
                        write(data) { appendOutput(data) },
                    })
                );
            } catch (error) {
                setError(error instanceof Error ? error.message : "Unknown error");
                setStatus("error");
            }
        };

        start();
    }, [enabled, projectId, files, restartKey, settings?.installCommand, settings?.devCommand]);

    // Sync file changes (hot reload)
    useEffect(() => {
        const container = containerRef.current;
        if (!container || !files || status !== "running") return;

        const filesMap = new Map(files.map((f) => [f._id, f]));

        for (const file of files) {
            if (file.type !== "file" || file.storageId || !file.content) continue;

            // If it's an actual file
            const filePath = getFilePath(file, filesMap);
            container.fs.writeFile(filePath, file.content);
        }
    }, [files, status]);

    // Reset when disabled
    useEffect(() => {
        if (!enabled) {
            hasStartedRef.current = false;
            setStatus("idle");
            setPreviewUrl(null);
            setError(null);
        }
    }, [enabled]);

    // Restart the entire WebContainer process
    const restart = useCallback(() => {
        teardownWebContainer();
        containerRef.current = null;
        hasStartedRef.current = false;
        setStatus("idle");
        setPreviewUrl(null);
        setError(null);
        setRestartKey((k) => k + 1); // forcefully increase the key to trigger the useEffect to restart the webcontainer
    }, []);

    return {
        status,
        previewUrl,
        error,
        restart,
        terminalOutput,
    };
};