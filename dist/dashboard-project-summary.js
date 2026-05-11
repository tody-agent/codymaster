"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getProjectActiveAgents = getProjectActiveAgents;
function getProjectActiveAgents(project, tasks) {
    return [...new Set([
            ...(Array.isArray(project.agents) ? project.agents : []),
            ...tasks.map(t => t.agent).filter(Boolean),
        ])];
}
