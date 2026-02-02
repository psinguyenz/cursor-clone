"use client";

import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import { useEffect, useRef } from "react";
import "@xterm/xterm/css/xterm.css"

interface PreviewTerminalProps {
    output: string;
}

/**
 * Render an xterm.js terminal inside a container and stream the provided output into it.
 *
 * The component mounts a read-only terminal and sizes it to its container. On mount it writes any
 * initial `output`; on subsequent prop updates it appends only the newly added text and clears the
 * terminal if the new `output` is shorter than the previously written content. The terminal is
 * re-fit on resize and disposed when the component unmounts.
 *
 * @param output - Full terminal content to display; the component will write the initial value on mount and then append or clear based on subsequent updates
 */
export function PreviewTerminal({ output }: PreviewTerminalProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const terminalRef = useRef<Terminal>(null);
    const fitAddonRef = useRef<FitAddon | null>(null);
    const lastLengthRef = useRef(0);

    // Initialize terminal
    useEffect(() => {
        if (!containerRef.current || terminalRef.current) return;

        const terminal = new Terminal({
            convertEol: true,
            disableStdin: true,
            fontSize: 12,
            fontFamily: "monospace",
            cursorBlink: true,
            theme: {
                background: "#1f2228",
                // foreground: "#d4d4d4",
            },
        });

        const fitAddon = new FitAddon();
        terminal.loadAddon(fitAddon);
        terminal.open(containerRef.current);

        terminalRef.current = terminal;
        fitAddonRef.current = fitAddon;

        // Write existing output the moment we mount the terminal
        if (output) {
            terminal.write(output);
            lastLengthRef.current = output.length;
        }

        requestAnimationFrame(() => fitAddon.fit()); // fit the terminal to the container

        const resizeObserver = new ResizeObserver(() => fitAddon.fit());
        resizeObserver.observe(containerRef.current);

        return () => {
            // clean up function
            resizeObserver.disconnect();
            terminal.dispose();
            terminalRef.current = null;
            fitAddonRef.current = null;
        };
        // "output" does not need to be a dependency since it is not intended to update anything, just to write on the terminal on mount
    }, []);

    // Write output when it changes
    useEffect(() => {
        if (!terminalRef.current) return;

        if (output.length < lastLengthRef.current) {
            terminalRef.current.clear();
            lastLengthRef.current = output.length; // this help clear up the content
        }

        const newData = output.slice(lastLengthRef.current);
        if (newData) {
            terminalRef.current.write(newData);
            lastLengthRef.current = output.length;
        }
    }, [output]);

    return (
        <div ref={containerRef} className="flex-1 min-h-0 p-3 [&_.xterm]:h-full! [&_.xterm-viewport]:h-full!
        [&_.xterm-screen]:h-full! bg-sidebar" />
    );
}