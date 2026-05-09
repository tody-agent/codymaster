"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createProjectSchema = exports.autoSyncSchema = exports.updateTaskSchema = exports.createTaskSchema = void 0;
exports.createTaskSchema = {
    type: 'object',
    required: ['projectId', 'title'],
    properties: {
        projectId: { type: 'string', minLength: 1 },
        title: { type: 'string', minLength: 1 },
        description: { type: 'string' },
        column: { type: 'string', enum: ['backlog', 'in-progress', 'review', 'done'] },
        priority: { type: 'string', enum: ['low', 'medium', 'high', 'urgent'] },
        agent: { type: 'string' },
        skill: { type: 'string' },
    },
    additionalProperties: false,
};
exports.updateTaskSchema = {
    type: 'object',
    properties: {
        title: { type: 'string', minLength: 1 },
        description: { type: 'string' },
        priority: { type: 'string', enum: ['low', 'medium', 'high', 'urgent'] },
    },
    additionalProperties: false,
    minProperties: 1,
};
exports.autoSyncSchema = {
    type: 'object',
    required: ['conversationId', 'title'],
    properties: {
        conversationId: { type: 'string', minLength: 1 },
        title: { type: 'string', minLength: 1 },
        status: { type: 'string' },
        column: { type: 'string', enum: ['backlog', 'in-progress', 'review', 'done'] },
    },
    additionalProperties: true,
};
exports.createProjectSchema = {
    type: 'object',
    required: ['name'],
    properties: {
        name: { type: 'string', minLength: 1 },
        path: { type: 'string' },
        agents: { type: 'array', items: { type: 'string' } },
    },
    additionalProperties: false,
};
