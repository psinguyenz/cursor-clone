import { ProjectIdView } from "@/features/projects/components/project-id-view";
import { Id } from "../../../../convex/_generated/dataModel";

// the promise's key gotta match the folder [promise's key]
const ProjectIdPage = async ({ params }: { params: Promise<{ projectId: string }> }) => {
    const { projectId } = await params;

    return (
        <ProjectIdView projectId={projectId as Id<"projects">} />
    );
}

export default ProjectIdPage;