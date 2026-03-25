import * as vscode from 'vscode';
import axios from 'axios';

// UX-Master MCP Server client
class UXMasterClient {
    private baseUrl: string;

    constructor(baseUrl: string) {
        this.baseUrl = baseUrl;
    }

    async searchUXLaws(query: string, productType?: string): Promise<any> {
        const response = await axios.post(`${this.baseUrl}/mcp/v1/tools/call`, {
            name: 'search_ux_laws',
            arguments: { query, product_type: productType }
        });
        return response.data;
    }

    async validateDesign(html: string, testSuite: string = 'all'): Promise<any> {
        const response = await axios.post(`${this.baseUrl}/mcp/v1/tools/call`, {
            name: 'validate_design',
            arguments: { html, test_suite: testSuite }
        });
        return response.data;
    }

    async generateDesignSystem(query: string, projectName?: string): Promise<any> {
        const response = await axios.post(`${this.baseUrl}/mcp/v1/tools/call`, {
            name: 'generate_design_system',
            arguments: { query, project_name: projectName }
        });
        return response.data;
    }

    async health(): Promise<any> {
        const response = await axios.get(`${this.baseUrl}/health`);
        return response.data;
    }
}

// Extension activation
export function activate(context: vscode.ExtensionContext) {
    console.log('UX-Master extension activated');

    const config = vscode.workspace.getConfiguration('uxmaster');
    const serverUrl = config.get<string>('mcpServerUrl') || 'http://localhost:3000';
    const client = new UXMasterClient(serverUrl);

    // Check server health
    client.health().then(() => {
        vscode.window.showInformationMessage('UX-Master MCP Server connected');
    }).catch(() => {
        vscode.window.showWarningMessage('UX-Master MCP Server not available. Run: python -m mcp.server');
    });

    // Register commands
    const searchCmd = vscode.commands.registerCommand('uxmaster.searchUXLaws', async () => {
        const query = await vscode.window.showInputBox({
            prompt: 'Search UX Laws',
            placeHolder: 'e.g., "mobile touch targets"'
        });
        if (!query) return;
        
        const result = await client.searchUXLaws(query);
        vscode.window.showInformationMessage(`Found ${result.content?.length || 0} UX Laws`);
    });

    const validateCmd = vscode.commands.registerCommand('uxmaster.validateFile', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) return;
        
        const html = editor.document.getText();
        const result = await client.validateDesign(html);
        vscode.window.showInformationMessage('Validation complete');
    });

    context.subscriptions.push(searchCmd, validateCmd);
}

export function deactivate() {}
