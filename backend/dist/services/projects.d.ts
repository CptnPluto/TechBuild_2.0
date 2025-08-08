export interface CreateProjectData {
    name: string;
    description?: string | null;
}
export interface UpdateProjectData {
    name?: string;
    description?: string | null;
    current_step?: number;
}
export declare const projectService: {
    getAllProjects(): Promise<{}>;
    getProjectById(id: string): Promise<{} | null>;
    createProject(data: CreateProjectData): Promise<{
        id: string;
        name: string;
        description: string | null;
        currentStep: number;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string | null;
    }>;
    updateProject(id: string, data: UpdateProjectData): Promise<{
        id: string;
        name: string;
        description: string | null;
        currentStep: number;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string | null;
    } | null>;
    deleteProject(id: string): Promise<boolean>;
    getProjectStats(id: string): Promise<{
        doorCount: number;
        hardwareCount: number;
        fileCount: number;
    }>;
};
//# sourceMappingURL=projects.d.ts.map