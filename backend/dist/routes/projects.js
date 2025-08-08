"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const projects_1 = require("@/services/projects");
const logger_1 = __importDefault(require("@/utils/logger"));
const router = (0, express_1.Router)();
const createProjectSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, 'Project name is required').max(255),
    description: zod_1.z.string().optional()
});
const updateProjectSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(255).optional(),
    description: zod_1.z.string().optional(),
    current_step: zod_1.z.number().min(1).max(6).optional()
});
router.get('/', async (req, res, next) => {
    try {
        logger_1.default.info('Fetching all projects');
        const projects = await projects_1.projectService.getAllProjects();
        return res.json({
            success: true,
            data: projects,
            count: Array.isArray(projects) ? projects.length : 0
        });
    }
    catch (error) {
        next(error);
        return;
    }
});
router.get('/:id', async (req, res, next) => {
    try {
        const { id } = req.params;
        logger_1.default.info(`Fetching project: ${id}`);
        const project = await projects_1.projectService.getProjectById(id);
        if (!project) {
            return res.status(404).json({
                success: false,
                error: 'Project not found'
            });
        }
        return res.json({
            success: true,
            data: project
        });
    }
    catch (error) {
        next(error);
        return;
    }
});
router.post('/', async (req, res, next) => {
    try {
        const validatedData = createProjectSchema.parse(req.body);
        logger_1.default.info('Creating new project', { name: validatedData.name });
        const project = await projects_1.projectService.createProject({
            ...validatedData,
            description: validatedData.description || null
        });
        return res.status(201).json({
            success: true,
            data: project,
            message: 'Project created successfully'
        });
    }
    catch (error) {
        next(error);
        return;
    }
});
router.put('/:id', async (req, res, next) => {
    try {
        const { id } = req.params;
        const validatedData = updateProjectSchema.parse(req.body);
        logger_1.default.info(`Updating project: ${id}`, validatedData);
        const updateData = {};
        if (validatedData.name !== undefined) {
            updateData.name = validatedData.name;
        }
        if (validatedData.description !== undefined) {
            updateData.description = validatedData.description || null;
        }
        if (validatedData.current_step !== undefined) {
            updateData.current_step = validatedData.current_step;
        }
        const project = await projects_1.projectService.updateProject(id, updateData);
        if (!project) {
            return res.status(404).json({
                success: false,
                error: 'Project not found'
            });
        }
        return res.json({
            success: true,
            data: project,
            message: 'Project updated successfully'
        });
    }
    catch (error) {
        next(error);
        return;
    }
});
router.delete('/:id', async (req, res, next) => {
    try {
        const { id } = req.params;
        logger_1.default.info(`Deleting project: ${id}`);
        const success = await projects_1.projectService.deleteProject(id);
        if (!success) {
            return res.status(404).json({
                success: false,
                error: 'Project not found'
            });
        }
        return res.json({
            success: true,
            message: 'Project deleted successfully'
        });
    }
    catch (error) {
        next(error);
        return;
    }
});
exports.default = router;
//# sourceMappingURL=projects.js.map