// localhost:3000/demo
"use client";

import { Button } from "@/components/ui/button";
import { useState } from "react";
import * as Sentry from "@sentry/nextjs";
import { useAuth } from "@clerk/nextjs";

export default function DemoPage() {
    const { userId } = useAuth();
    const [loading, setLoading] = useState(false); // keeps track of loading
    const [loading2, setLoading2] = useState(false); // keeps track of loading


    const handleBlocking = async () => {
        setLoading(true);
        await fetch("/api/demo/blocking", {method: "POST"});
        setLoading(false);
    };

    const handleBackground = async () => {
        setLoading2(true);
        await fetch("/api/demo/background", {method: "POST"});
        setLoading2(false);
    };

    // 1) Client error - throws in the browser
    const handleClientError = () => {
        Sentry.logger.info("User attempting to click on client function", {userId})
        // check more Sentry log at docs.sentry.io/platforms/javascript/guides/nextjs/logs/
        throw new Error("Client error: something went wrong in the browser!");
    };

    // 2) API error - trigger server-side error
    const handleApiError = async () => {
        await fetch("/api/demo/error", { method: "POST"});
    };

    // 3) Inngest error - trigger error in background job
    const handleInngestError = async () => {
        await fetch("/api/demo/inngest-error", { method: "POST"});
    };

    return (
        <div className="p-8 space-x-4">
            <Button disabled={loading} onClick={handleBlocking}>
                {loading ? "Loading..." : "Blocking"}
            </Button>

            <Button disabled={loading2} onClick={handleBackground}>
                {loading2 ? "Loading..." : "Background"}
            </Button>

            <Button
                variant="destructive"
                onClick={handleClientError}
            >
                Client Error
            </Button>

            <Button
                variant="destructive"
                onClick={handleApiError}
            >
                Api Error
            </Button>

            <Button
                variant="destructive"
                onClick={handleInngestError}
            >
                Inngest Error
            </Button>
        </div>
    )
}