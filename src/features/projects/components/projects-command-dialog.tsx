// don't need "use client" cuz this will be used within a client component

import { useRouter } from "next/navigation";
import { FaGithub } from "react-icons/fa";
import { AlertCircleIcon, GlobeIcon, Loader2Icon } from "lucide-react";
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { useProjects } from "../hooks/use-projects";
import { Doc } from "../../../../convex/_generated/dataModel";

interface ProjectsCommandDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
};

const getProjectIcon = (project: Doc<"projects">) => {
    if (project.importStatus === "completed") {
        return <FaGithub className="size-4 text-muted-foreground" />
    }

    if (project.importStatus === "failed") {
        return <AlertCircleIcon className="size-4 text-muted-foreground" />
    }

    if (project.importStatus === "importing") {
        return <Loader2Icon className="size-4 text-muted-foreground animate-spin" />
    }

    // default
    return <GlobeIcon className="size-4 text-muted-foreground"/>
}

// onViewAll will set onOpenChange to true
export const ProjectsCommandDialog = ({ open, onOpenChange}: ProjectsCommandDialogProps) => {
    const router = useRouter();
    const projects = useProjects();

    // a helper function that when select a project will router push to that particular project
    const handleSelect = (projectId: string) => {
        router.push(`/projects/${projectId}`);
        onOpenChange(false);
    };

    return (
        <CommandDialog
            open={open}
            onOpenChange={onOpenChange}
            title="Search Projects"
            description="Search and navigate to your projects"
        >
            <CommandInput placeholder="Search projects..." />

            <CommandList>
                <CommandEmpty>No projects found</CommandEmpty>
                <CommandGroup heading="Projects">
                    {projects?.map((project) => (
                        <CommandItem
                            key={project._id}
                            // use project so it highlight, use the project id too incase there're 2 projects with the same name
                            value={`${project.name}-${project._id}`}
                            onSelect={() => handleSelect(project._id)}
                        >
                            {getProjectIcon(project)}
                            <span>{project.name}</span>
                        </CommandItem>
                    ))}
                </CommandGroup>
            </CommandList>
        </CommandDialog>
    )
};
