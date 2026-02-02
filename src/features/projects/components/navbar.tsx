"use client"

import { Button } from "@/components/ui/button";
import { Id } from "../../../../convex/_generated/dataModel";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { Poppins } from "next/font/google";
import { UserButton } from "@clerk/nextjs";
import { useProject, useRenameProject } from "../hooks/use-projects";
import { useState } from "react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { CloudCheckIcon, LoaderIcon } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

const font = Poppins({
    subsets: ["latin"],
    weight: ["400", "500", "600", "700"],
})

export const Navbar = ({ projectId }: { projectId: Id<"projects"> }) => {
    const project = useProject(projectId);
    const renameProject = useRenameProject();
    const [isRenaming, setIsRenaming] = useState(false);
    const [name, setName] = useState("");

    // this activate when clicked on project's name Breadcrumb
    const handleStartRename = () => {
        if (!project) return;
        setName(project.name); // copy name from databse to name
        setIsRenaming(true); // isRenaming to true
    };

    const handleSubmit = () => {
        if (!project) return
        setIsRenaming(false);

        const trimmedName = name.trim();
        if (!trimmedName || trimmedName === project.name) return;

        // this will send a request to Convex's Server for a mutation
        renameProject({ id: projectId, name: trimmedName });
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
            handleSubmit(); // save it
        } else if (e.key === "Escape") {
            setIsRenaming(false)
        }
    };

    return (
        <nav className="flex justify-between items-center gap-x-2 p-2 bg-sidebar border-b">
            <div className="flex items-center gap-x-2">
                <Breadcrumb>
                    <BreadcrumbList className="gap-0!">
                        {/* logo and web name item */}
                        <BreadcrumbItem>
                            <BreadcrumbLink className="flex items-center gap-1.5" asChild>
                                <Button variant="ghost" className="w-fit! p-1.5! h-7!" asChild>
                                    <Link href="/">
                                        <Image src="/logo.svg" alt="Logo" width={20} height={20} />
                                        <span className={cn("text-sm font-medium", font.className)}>
                                            Polaris
                                        </span>
                                    </Link>
                                </Button>
                            </BreadcrumbLink>
                        </BreadcrumbItem>

                        <BreadcrumbSeparator className="ml-0! mr-1" />

                        {/* Project's name item */}
                        <BreadcrumbItem>
                            {isRenaming ? (
                                <input
                                    autoFocus
                                    type="text"
                                    value={name}

                                    // continuously update the name (Local State) but haven't saved in database
                                    onChange={(e) => setName(e.target.value)}
                                    onFocus={(e) => e.currentTarget.select()}
                                    onBlur={handleSubmit}

                                    // it won't be save in db until user press key down
                                    onKeyDown={handleKeyDown}
                                    className="text-sm bg-transparent text-foreground
                                    outline-none focus:ring-1 focus:ring-inset
                                    focus:ring-ring font-medium max-w-40 truncate"
                                />
                            ) : (
                                <BreadcrumbPage onClick={handleStartRename} className="text-sm cursor-pointer
                                hover:text-primary font-medium max-w-40 truncate">
                                    {project?.name ?? "Loading..."}
                                </BreadcrumbPage>
                            )}
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>

                {project?.importStatus === "importing" ? (
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <LoaderIcon className="size-4 text-muted-foreground animate-spin" />
                        </TooltipTrigger>
                        <TooltipContent>Importing...</TooltipContent>
                    </Tooltip>
                ) : (
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <CloudCheckIcon className="size-4 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                            {/* if we have project.updatedAt, we get DistanceToNow otherwise let it unknown */}
                            Saved{" "}
                            {project?.updatedAt ? formatDistanceToNow(
                                project.updatedAt,
                                { addSuffix: true }
                            ) : "unknown"}
                        </TooltipContent>
                    </Tooltip>
                )}
            </div>

            {/* place to log out */}
            <div className="flex items-center gap-2">
                <UserButton />
            </div>
        </nav>
    )
};