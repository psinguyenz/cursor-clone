"use client"

import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Button } from "@/components/ui/button";

const X = () => {
  const projects = useQuery(api.projects.get)
  const createProject = useMutation(api.projects.create);

  return (
    <div className="flex flex-col gap-2 p-4">
      {/* no need validation no need pooling, the sync does the magic very well */}
      <Button onClick={() => createProject({
        name: "New project"
      })}>
        Add new
      </Button>

      {/* loop over projects */}
      {projects?.map((project) => (
        <div className="border rounded p-2 flex flex-col" 
        key={project._id}>
          <p>
            {project.name}
          </p>
          <p>
            Owner Id: {project.ownerId}
          </p>
        </div>
      ))}
    </div>
  );
};

export default X;