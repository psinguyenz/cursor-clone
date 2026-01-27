import { useMutation, useQuery } from "convex/react"
import { api } from "../../../../convex/_generated/api"
import { Id } from "../../../../convex/_generated/dataModel";

// return project by id
export const useProject = (projectId: Id<"projects">) => {
    return useQuery(api.projects.getById, {id: projectId});
};

// return lots of project
export const useProjects = () => {
    return useQuery(api.projects.get);
};

export const useProjectsPartial = (limit: number) => {
    return useQuery(api.projects.getPartial, {limit});
};

export const useCreateProject = () => {
    // const { userId } = useAuth();

    return useMutation(api.projects.create).withOptimisticUpdate((localStore, args) => {
            const existingProjects = localStore.getQuery(api.projects.get);

            if (existingProjects !== undefined) {
                const now = Date.now();
                const newProject = {
                    _id: crypto.randomUUID() as Id<"projects">,
                    _creationTime: now,
                    name: args.name,
                    ownerId: "anonymous",
                    updatedAt: now,
                };

                localStore.setQuery(api.projects.get, {}, [
                    newProject,
                    ...existingProjects, // add the newProject to the list of existing projects
                ]);
            }
        }
    );
};

// ADVANCED: rename the project
export const useRenameProject = () => {
    return useMutation(api.projects.rename).withOptimisticUpdate((localStore, args) => {
            const existingProject = localStore.getQuery(api.projects.getById, {id: args.id});

            // rename it
            if (existingProject !== undefined && existingProject !== null) {
                localStore.setQuery(api.projects.getById, {id: args.id}, {
                    ...existingProject,
                    name: args.name,
                    updatedAt: Date.now(),
                });
            }

            // push the newly renamed project into our projects 
            // (update the project) in all the places where we fetch projects
            const existingProjects = localStore.getQuery(api.projects.get);
            if (existingProjects !== undefined) {
                localStore.setQuery(api.projects.get, {}, 
                    existingProjects.map((project) => {
                        return project._id === args.id 
                            ? {
                                ...project,
                                name: args.name,
                                updatedAt: Date.now()
                            }
                            : project
                    })
                )
            }
        }
    );
};