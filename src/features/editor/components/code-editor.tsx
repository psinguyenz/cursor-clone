import { useEffect, useMemo, useRef } from "react";
import { basicSetup } from "codemirror"; // caution for the editorview import
import { EditorView, keymap } from "@codemirror/view";
import { oneDark } from "@codemirror/theme-one-dark";
import { customTheme } from "../extensions/theme";
import { getLanguageExtension } from "../extensions/language-extension";
import { indentWithTab } from "@codemirror/commands";
import { minimap } from "../extensions/minimap";
import { indentationMarkers } from "@replit/codemirror-indentation-markers";
import { customSetup } from "../extensions/custom-setup";
import { suggestion } from "../extensions/suggestion";
import { quickEdit } from "../extensions/quick-edit";
import { selectionTooltip } from "../extensions/selection-tooltip";

interface Props {
    fileName: string;
    initialValue?: string;
    onChange: (value: string) => void;
}

export const CodeEditor = ({ fileName, initialValue = "", onChange }: Props) => {
    const editorRef = useRef<HTMLDivElement>(null);
    const viewRef = useRef<EditorView | null>(null);

    const languageExtension = useMemo(() => getLanguageExtension(fileName), [fileName])

    useEffect(() => {
        if (!editorRef.current) return;

        const view = new EditorView({
            doc: initialValue,
            parent: editorRef.current,
            extensions: [
                oneDark,
                customTheme,
                // basicSetup,
                customSetup, // a more fine looking arrow icon
                languageExtension,
                suggestion(fileName),
                quickEdit(fileName),
                selectionTooltip(),
                keymap.of([indentWithTab]),
                minimap(),
                indentationMarkers(), // tabs level
                EditorView.updateListener.of((update) => {
                    if (update.docChanged) {
                        onChange(update.state.doc.toString()); // save our content
                    }
                })
            ],
        });

        viewRef.current = view;

        return () => {
            view.destroy();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps -- 
        // InitialValue is only used for initial document
    }, [languageExtension]);

    return (
        <div ref={editorRef} className="size-full pl-4 bg-background" />
    )
}