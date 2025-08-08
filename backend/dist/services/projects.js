"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.projectService = void 0;
const client_1 = require("@prisma/client");
const errorHandler_1 = require("@/middleware/errorHandler");
const logger_1 = __importDefault(require("@/utils/logger"));
const cache_1 = require("@/utils/cache");
const prisma = new client_1.PrismaClient();
exports.projectService = {
    async getAllProjects() {
        try {
            const cachedProjects = await cache_1.cache.get(cache_1.cacheKeys.projects.all);
            if (cachedProjects) {
                logger_1.default.info('Returning cached projects');
                return cachedProjects;
            }
            logger_1.default.info('Fetching all projects from database');
            const projects = await prisma.project.findMany({
                include: {
                    files: {
                        select: {
                            id: true,
                            filename: true,
                            fileType: true,
                            processingStatus: true,
                            createdAt: true
                        }
                    },
                    doorSchedules: {
                        select: {
                            id: true,
                            mark: true,
                            doorType: true,
                            quantity: true
                        },
                        take: 5
                    },
                    hardwareComponents: {
                        select: {
                            id: true,
                            hardwareSet: true,
                            componentName: true
                        },
                        take: 5
                    }
                },
                orderBy: {
                    updatedAt: 'desc'
                }
            });
            await cache_1.cache.set(cache_1.cacheKeys.projects.all, projects, cache_1.cacheTTL.projects);
            return projects;
        }
        catch (error) {
            logger_1.default.error('Error fetching projects:', error);
            throw (0, errorHandler_1.createError)('Failed to fetch projects', 500);
        }
    },
    async getProjectById(id) {
        try {
            const cacheKey = cache_1.cacheKeys.projects.byId(id);
            const cachedProject = await cache_1.cache.get(cacheKey);
            if (cachedProject) {
                logger_1.default.info(`Returning cached project: ${id}`);
                return cachedProject;
            }
            logger_1.default.info(`Fetching project by ID: ${id}`);
            const project = await prisma.project.findUnique({
                where: { id },
                include: {
                    files: {
                        orderBy: { createdAt: 'desc' }
                    },
                    doorSchedules: {
                        orderBy: { mark: 'asc' }
                    },
                    hardwareComponents: {
                        orderBy: { hardwareSet: 'asc' }
                    }
                }
            });
            if (project) {
                await cache_1.cache.set(cacheKey, project, cache_1.cacheTTL.projects);
            }
            return project;
        }
        catch (error) {
            logger_1.default.error(`Error fetching project ${id}:`, error);
            throw (0, errorHandler_1.createError)('Failed to fetch project', 500);
        }
    },
    async createProject(data) {
        try {
            logger_1.default.info('Creating new project:', data);
            const project = await prisma.project.create({
                data: {
                    name: data.name,
                    description: data.description || null,
                    currentStep: 1,
                    status: 'active'
                }
            });
            await cache_1.cache.del(cache_1.cacheKeys.projects.all);
            await cache_1.cache.del(cache_1.cacheKeys.projects.stats);
            logger_1.default.info(`Created project: ${project.id}`);
            return project;
        }
        catch (error) {
            logger_1.default.error('Error creating project:', error);
            throw (0, errorHandler_1.createError)('Failed to create project', 500);
        }
    },
    async updateProject(id, data) {
        try {
            logger_1.default.info(`Updating project ${id}:`, data);
            const project = await prisma.project.update({
                where: { id },
                data: {
                    ...(data.name && { name: data.name }),
                    ...(data.description !== undefined && { description: data.description }),
                    ...(data.current_step && { currentStep: data.current_step }),
                    updatedAt: new Date()
                }
            });
            await cache_1.cache.del(cache_1.cacheKeys.projects.all);
            await cache_1.cache.del(cache_1.cacheKeys.projects.byId(id));
            await cache_1.cache.del(cache_1.cacheKeys.projects.stats);
            logger_1.default.info(`Updated project: ${project.id}`);
            return project;
        }
        catch (error) {
            if (error && typeof error === 'object' && 'code' in error && error.code === 'P2025') {
                return null;
            }
            logger_1.default.error(`Error updating project ${id}:`, error);
            throw (0, errorHandler_1.createError)('Failed to update project', 500);
        }
    },
    async deleteProject(id) {
        try {
            logger_1.default.info(`Deleting project: ${id}`);
            await prisma.project.delete({
                where: { id }
            });
            await cache_1.cache.del(cache_1.cacheKeys.projects.all);
            await cache_1.cache.del(cache_1.cacheKeys.projects.byId(id));
            await cache_1.cache.del(cache_1.cacheKeys.projects.stats);
            await cache_1.cache.delPattern(`projects:${id}:*`);
            await cache_1.cache.delPattern(`files:project:${id}`);
            logger_1.default.info(`Deleted project: ${id}`);
            return true;
        }
        catch (error) {
            if (error.code === 'P2025') {
                return false;
            }
            logger_1.default.error(`Error deleting project ${id}:`, error);
            throw (0, errorHandler_1.createError)('Failed to delete project', 500);
        }
    },
    async getProjectStats(id) {
        try {
            logger_1.default.info(`Fetching project stats: ${id}`);
            const [doorCount, hardwareCount, fileCount] = await Promise.all([
                prisma.doorSchedule.count({ where: { projectId: id } }),
                prisma.hardwareComponent.count({ where: { projectId: id } }),
                prisma.projectFile.count({ where: { projectId: id } })
            ]);
            return {
                doorCount,
                hardwareCount,
                fileCount
            };
        }
        catch (error) {
            logger_1.default.error(`Error fetching project stats ${id}:`, error);
            throw (0, errorHandler_1.createError)('Failed to fetch project statistics', 500);
        }
    }
};
//# sourceMappingURL=projects.js.map