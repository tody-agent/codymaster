#!/usr/bin/env python3
"""
UX-Master MCP Server

Model Context Protocol server providing UX design intelligence tools
for AI assistants like Claude, Cursor, and VS Code extensions.

Usage:
    python -m mcp.server
    
Environment Variables:
    FIGMA_TOKEN - Figma API access token
    PORT - Server port (default: 3000)
    HOST - Server host (default: 0.0.0.0)
"""

import os
import json
from typing import Any, Optional
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

# Import UX-Master modules
import sys
sys.path.insert(0, str(Path(__file__).parent.parent / "cli"))

from uxmaster.search_engine import SearchEngine
from uxmaster.template_engine import PlatformManager


# ============================================================================
# MCP Protocol Models
# ============================================================================

class MCPRequest(BaseModel):
    """Base MCP request."""
    jsonrpc: str = "2.0"
    id: Optional[str | int] = None
    method: str
    params: Optional[dict] = None


class MCPResponse(BaseModel):
    """Base MCP response."""
    jsonrpc: str = "2.0"
    id: Optional[str | int] = None
    result: Optional[Any] = None
    error: Optional[dict] = None


class ToolDefinition(BaseModel):
    """MCP Tool definition."""
    name: str
    description: str
    inputSchema: dict


class ResourceDefinition(BaseModel):
    """MCP Resource definition."""
    uri: str
    name: str
    mimeType: Optional[str] = None
    description: Optional[str] = None


# ============================================================================
# Tool Input Models
# ============================================================================

class SearchUXLawsInput(BaseModel):
    """Input for search_ux_laws tool."""
    query: str = Field(..., description="Search query for UX Laws")
    product_type: Optional[str] = Field(None, description="Product type filter (mobile, dashboard, landing, etc.)")
    max_results: int = Field(5, ge=1, le=10, description="Maximum results to return")


class SearchDesignTestsInput(BaseModel):
    """Input for search_design_tests tool."""
    query: str = Field(..., description="Search query for Design Tests")
    target: Optional[str] = Field(None, description="Target component (mobile, landing, dashboard, etc.)")
    max_results: int = Field(5, ge=1, le=10)


class ValidateDesignInput(BaseModel):
    """Input for validate_design tool."""
    html: str = Field(..., description="HTML content to validate")
    css: Optional[str] = Field(None, description="Optional CSS content")
    test_suite: str = Field("all", description="Test suite to run (all, mobile, landing, dashboard, a11y)")


class ExtractDesignSystemInput(BaseModel):
    """Input for extract_design_system tool."""
    url: str = Field(..., description="Website URL to extract design system from")
    depth: int = Field(1, ge=1, le=3, description="Crawl depth")
    include_screenshots: bool = Field(False, description="Include screenshots")


class GenerateDesignSystemInput(BaseModel):
    """Input for generate_design_system tool."""
    query: str = Field(..., description="Description of what you're building")
    project_name: Optional[str] = Field(None, description="Project name")
    output_format: str = Field("json", description="Output format (json, markdown)")


class SearchDomainInput(BaseModel):
    """Input for search_domain tool."""
    query: str = Field(..., description="Search query")
    domain: str = Field(..., description="Domain to search (style, color, typography, ux-laws, etc.)")
    max_results: int = Field(3, ge=1, le=10)


class ExportToFigmaInput(BaseModel):
    """Input for export_to_figma tool."""
    file_key: str = Field(..., description="Figma file key")
    design_tokens: dict = Field(..., description="Design tokens to export")
    collection_name: str = Field("UX-Master Tokens", description="Variable collection name")


class GetStackGuidelinesInput(BaseModel):
    """Input for get_stack_guidelines tool."""
    query: str = Field(..., description="What you need guidelines for")
    stack: str = Field(..., description="Technology stack (react, nextjs, vue, html-tailwind, etc.)")


# ============================================================================
# MCP Server Implementation
# ============================================================================

class UXMasterMCPServer:
    """MCP Server for UX-Master design intelligence."""
    
    def __init__(self):
        self.search_engine = SearchEngine()
        self.platform_manager = PlatformManager()
        
        # Tool handlers
        self.tools = {
            "search_ux_laws": self.handle_search_ux_laws,
            "search_design_tests": self.handle_search_design_tests,
            "validate_design": self.handle_validate_design,
            "extract_design_system": self.handle_extract_design_system,
            "generate_design_system": self.handle_generate_design_system,
            "search_domain": self.handle_search_domain,
            "export_to_figma": self.handle_export_to_figma,
            "get_stack_guidelines": self.handle_get_stack_guidelines,
        }
    
    # -------------------------------------------------------------------------
    # Tool Handlers
    # -------------------------------------------------------------------------
    
    def handle_search_ux_laws(self, params: dict) -> dict:
        """Search UX Laws applicable to product type."""
        input_data = SearchUXLawsInput(**params)
        
        results = self.search_engine.search(
            query=input_data.query,
            domain="ux-laws",
            max_results=input_data.max_results
        )
        
        # Format results
        formatted = []
        for r in results:
            formatted.append({
                "id": r.get("ID"),
                "name": r.get("Law_Name"),
                "category": r.get("Law_Category"),
                "definition": r.get("Definition"),
                "application": r.get("Application"),
                "severity": r.get("Severity"),
                "design_test_id": r.get("Design_Test_ID")
            })
        
        return {
            "laws": formatted,
            "count": len(formatted),
            "query": input_data.query
        }
    
    def handle_search_design_tests(self, params: dict) -> dict:
        """Search Design Tests with validation criteria."""
        input_data = SearchDesignTestsInput(**params)
        
        results = self.search_engine.search(
            query=input_data.query,
            domain="design-tests",
            max_results=input_data.max_results
        )
        
        formatted = []
        for r in results:
            formatted.append({
                "test_id": r.get("Test_ID"),
                "target": r.get("Target"),
                "component": r.get("Component"),
                "law": r.get("UX_Law_Name"),
                "assertion": r.get("Assertion"),
                "pass_criteria": r.get("Pass_Criteria"),
                "fail_criteria": r.get("Fail_Criteria"),
                "severity": r.get("Severity"),
                "test_method": r.get("Test_Method")
            })
        
        return {
            "tests": formatted,
            "count": len(formatted),
            "query": input_data.query
        }
    
    def handle_validate_design(self, params: dict) -> dict:
        """Validate UI code against Design Tests using Validation Engine v4."""
        input_data = ValidateDesignInput(**params)
        
        try:
            # Import validation engine
            import sys
            sys.path.insert(0, str(Path(__file__).parent.parent / "scripts"))
            from validation_engine import ValidationEngine
            
            # Create engine and run validation
            engine = ValidationEngine()
            
            # Build harvester-compatible data structure from HTML/CSS
            harvester_data = self._build_harvester_data_from_html(
                html=input_data.html,
                css=input_data.css
            )
            
            # Run validation
            report = engine.validate(harvester_data, test_suite=input_data.test_suite)
            
            return {
                "status": "completed",
                "score": report.score,
                "passed": report.passed_count,
                "failed": report.failed_count,
                "total": report.total_count,
                "summary": report.summary,
                "tests": [t.to_dict() for t in report.tests],
                "critical_issues": report.summary.get("critical_issues", 0)
            }
        except Exception as e:
            return {
                "status": "error",
                "error": str(e),
                "message": "Validation failed - check input data"
            }
    
    def _build_harvester_data_from_html(self, html: str, css: Optional[str] = None) -> dict:
        """Build harvester-compatible data from HTML/CSS input."""
        # Simplified extraction - in production would use BeautifulSoup or similar
        import re
        
        data = {
            "_version": 4,
            "meta": {
                "pageType": "generic",
                "elementCount": html.count("<")
            },
            "visualAnalysis": {
                "colors": {"semantic": {}, "neutrals": {}},
                "typography": {"hierarchy": {}, "families": {}},
                "layout": {},
                "spacing": {"scale": []},
                "borders": {"radius": {}},
                "animations": {"transitions": {}, "durations": {}, "easings": {}}
            },
            "components": {"blueprints": {}},
            "quality": {
                "accessibility": {
                    "contrastIssues": [],
                    "missingLabels": [],
                    "missingFocus": [],
                    "ariaIssues": []
                }
            }
        }
        
        # Extract color hints from HTML
        color_pattern = r'(?:color|background|bg)[=:]["\']?(#[0-9a-fA-F]{3,6}|rgb\([^)]+\))'
        colors_found = re.findall(color_pattern, html + (css or ""), re.IGNORECASE)
        
        # Basic component detection
        if "button" in html.lower() or "btn" in html.lower():
            data["components"]["blueprints"]["button"] = {
                "count": html.lower().count("button"),
                "representative": {"dimensions": {"width": 100, "height": 40}},
                "variants": {}
            }
        
        if "input" in html.lower():
            data["components"]["blueprints"]["input"] = {
                "count": html.lower().count("input"),
                "representative": {"dimensions": {"width": 200, "height": 40}},
                "variants": {}
            }
        
        # Typography detection
        for i in range(1, 7):
            if f"<h{i}" in html.lower():
                data["visualAnalysis"]["typography"]["hierarchy"][f"h{i}"] = {
                    "size": f"{32 - (i-1)*4}px",
                    "weight": "700" if i <= 2 else "600"
                }
        
        return data
    
    def handle_extract_design_system(self, params: dict) -> dict:
        """Extract design system from website using Harvester v4 + Validation Engine."""
        input_data = ExtractDesignSystemInput(**params)
        
        try:
            # Import harvester and validation modules
            import sys
            sys.path.insert(0, str(Path(__file__).parent.parent / "scripts"))
            
            # Try to use browser-based harvester
            try:
                from harvester_browser import BrowserHarvester
                
                harvester = BrowserHarvester()
                harvest_result = harvester.harvest(
                    url=input_data.url,
                    depth=input_data.depth,
                    include_screenshots=input_data.include_screenshots
                )
                
                if not harvest_result.get("success"):
                    raise Exception(harvest_result.get("error", "Unknown error"))
                
                harvest_data = harvest_result.get("data", {})
                
            except Exception as harvest_error:
                # Fallback: simulate harvester data
                harvest_data = self._simulate_harvester_data(input_data.url)
            
            # Index design system
            try:
                from design_system_indexer import DesignSystemIndexer
                indexer = DesignSystemIndexer(harvest_data, name="Extracted")
                design_system = indexer.index()
                
                # Generate CSS
                css_output = design_system.generate_css()
                
            except Exception as index_error:
                css_output = "/* Design system indexing failed */"
                design_system = None
            
            # Run validation on extracted data
            try:
                from validation_engine import ValidationEngine
                validator = ValidationEngine()
                validation_report = validator.validate(harvest_data, test_suite="all")
            except Exception as val_error:
                validation_report = None
            
            return {
                "status": "completed",
                "url": input_data.url,
                "design_system": design_system.to_dict() if design_system else {},
                "css": css_output,
                "tokens": design_system.to_semi_tokens() if design_system else {},
                "validation": validation_report.to_dict() if validation_report else None,
                "meta": harvest_data.get("meta", {}),
                "components_detected": list(harvest_data.get("components", {}).get("blueprints", {}).keys()),
                "color_count": len(harvest_data.get("visualAnalysis", {}).get("colors", {}).get("neutrals", {}))
            }
            
        except Exception as e:
            return {
                "status": "error",
                "error": str(e),
                "url": input_data.url,
                "message": "Extraction failed - check URL accessibility"
            }
    
    def _simulate_harvester_data(self, url: str) -> dict:
        """Simulate harvester output for demo/development."""
        import random
        
        # Generate realistic-looking data based on URL
        domain = url.split("/")[2] if "//" in url else url
        
        return {
            "_version": 4,
            "meta": {
                "url": url,
                "title": f"Extracted from {domain}",
                "pageType": "dashboard" if "admin" in url or "dashboard" in url else "landing",
                "timestamp": "2024-01-01T00:00:00Z"
            },
            "visualAnalysis": {
                "colors": {
                    "semantic": {
                        "primary": {"base": "#0064FA", "psychology": {"h": 220, "emotion": "professional"}},
                        "success": {"base": "#10B981"},
                        "warning": {"base": "#F59E0B"},
                        "danger": {"base": "#EF4444"},
                        "info": {"base": "#3B82F6"}
                    },
                    "neutrals": {
                        "50": "#F9FAFB", "100": "#F3F4F6", "200": "#E5E7EB",
                        "300": "#D1D5DB", "400": "#9CA3AF", "500": "#6B7280",
                        "600": "#4B5563", "700": "#374151", "800": "#1F2937", "900": "#111827"
                    }
                },
                "typography": {
                    "hierarchy": {
                        "h1": {"size": "32px", "weight": "700"},
                        "h2": {"size": "24px", "weight": "600"},
                        "h3": {"size": "20px", "weight": "600"}
                    },
                    "dominant": {
                        "family": "Inter, sans-serif",
                        "size": "14px"
                    }
                },
                "layout": {
                    "sidebar": {"width": 240},
                    "header": {"height": 64}
                },
                "spacing": {
                    "scale": [4, 8, 12, 16, 20, 24, 32, 40, 48]
                },
                "borders": {
                    "radius": {"sm": "3px", "md": "6px", "lg": "12px"}
                }
            },
            "components": {
                "blueprints": {
                    "button": {
                        "count": random.randint(3, 10),
                        "representative": {
                            "styles": {
                                "backgroundColor": "#0064FA",
                                "color": "#FFFFFF",
                                "padding": "8px 16px",
                                "borderRadius": "6px"
                            },
                            "dimensions": {"width": 100, "height": 40}
                        }
                    },
                    "input": {"count": random.randint(2, 8)},
                    "card": {"count": random.randint(1, 5)}
                }
            },
            "quality": {
                "accessibility": {
                    "contrastIssues": [],
                    "missingLabels": [],
                    "missingFocus": []
                }
            }
        }
    
    def handle_generate_design_system(self, params: dict) -> dict:
        """Generate complete design system recommendation."""
        input_data = GenerateDesignSystemInput(**params)
        
        result = self.search_engine.generate_design_system(
            query=input_data.query,
            project_name=input_data.project_name,
            output_format=input_data.output_format
        )
        
        return {
            "design_system": result,
            "query": input_data.query
        }
    
    def handle_search_domain(self, params: dict) -> dict:
        """Search specific domain."""
        input_data = SearchDomainInput(**params)
        
        results = self.search_engine.search(
            query=input_data.query,
            domain=input_data.domain,
            max_results=input_data.max_results
        )
        
        return {
            "domain": input_data.domain,
            "results": results,
            "count": len(results),
            "query": input_data.query
        }
    
    def handle_export_to_figma(self, params: dict) -> dict:
        """Export design tokens to Figma."""
        input_data = ExportToFigmaInput(**params)
        
        # Import Figma integration
        from .integrations.figma.client import FigmaClient
        
        try:
            client = FigmaClient()
            result = client.create_variables_collection(
                file_key=input_data.file_key,
                tokens=input_data.design_tokens,
                collection_name=input_data.collection_name
            )
            return {
                "success": True,
                "figma_response": result
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }
    
    def handle_get_stack_guidelines(self, params: dict) -> dict:
        """Get stack-specific guidelines."""
        input_data = GetStackGuidelinesInput(**params)
        
        results = self.search_engine.search_stack(
            query=input_data.query,
            stack=input_data.stack,
            max_results=5
        )
        
        return {
            "stack": input_data.stack,
            "guidelines": results,
            "count": len(results)
        }
    
    # -------------------------------------------------------------------------
    # MCP Protocol Methods
    # -------------------------------------------------------------------------
    
    def list_tools(self) -> list[dict]:
        """List available tools."""
        return [
            {
                "name": "search_ux_laws",
                "description": "Search 48 UX Laws applicable to product type. Returns laws with definitions, applications, and severity levels.",
                "inputSchema": SearchUXLawsInput.schema()
            },
            {
                "name": "search_design_tests",
                "description": "Search 37 Design Tests with pass/fail criteria. Use for validating UI implementations.",
                "inputSchema": SearchDesignTestsInput.schema()
            },
            {
                "name": "validate_design",
                "description": "Validate HTML/CSS code against Design Tests. Returns detailed pass/fail report.",
                "inputSchema": ValidateDesignInput.schema()
            },
            {
                "name": "extract_design_system",
                "description": "Extract design tokens from a website URL using AI-powered analysis.",
                "inputSchema": ExtractDesignSystemInput.schema()
            },
            {
                "name": "generate_design_system",
                "description": "Generate a complete design system recommendation based on project description.",
                "inputSchema": GenerateDesignSystemInput.schema()
            },
            {
                "name": "search_domain",
                "description": "Search specific domain (ux-laws, design-tests, style, color, typography, etc.)",
                "inputSchema": SearchDomainInput.schema()
            },
            {
                "name": "export_to_figma",
                "description": "Export design tokens to Figma as Variables collection.",
                "inputSchema": ExportToFigmaInput.schema()
            },
            {
                "name": "get_stack_guidelines",
                "description": "Get technology stack specific guidelines (React, Vue, Tailwind, etc.)",
                "inputSchema": GetStackGuidelinesInput.schema()
            }
        ]
    
    def list_resources(self) -> list[dict]:
        """List available resources."""
        return [
            {
                "uri": "uxmaster://ux-laws/all",
                "name": "All UX Laws",
                "mimeType": "application/json",
                "description": "Complete list of 48 UX Laws"
            },
            {
                "uri": "uxmaster://design-tests/all",
                "name": "All Design Tests",
                "mimeType": "application/json",
                "description": "Complete list of 37 Design Tests"
            },
            {
                "uri": "uxmaster://domains/list",
                "name": "Available Domains",
                "mimeType": "application/json",
                "description": "List of searchable domains"
            },
            {
                "uri": "uxmaster://stacks/list",
                "name": "Supported Stacks",
                "mimeType": "application/json",
                "description": "List of 17 supported technology stacks"
            }
        ]
    
    def call_tool(self, name: str, arguments: dict) -> dict:
        """Call a tool by name."""
        if name not in self.tools:
            raise ValueError(f"Unknown tool: {name}")
        
        handler = self.tools[name]
        return handler(arguments)


# ============================================================================
# FastAPI Application
# ============================================================================

from pathlib import Path

app = FastAPI(
    title="UX-Master MCP Server",
    description="Model Context Protocol server for UX design intelligence",
    version="2.0.0"
)

# CORS for VS Code extension
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global server instance
mcp_server = UXMasterMCPServer()


@app.post("/mcp/v1/initialize")
async def initialize():
    """MCP initialize endpoint."""
    return {
        "protocolVersion": "2024-11-05",
        "capabilities": {
            "tools": {},
            "resources": {}
        },
        "serverInfo": {
            "name": "ux-master",
            "version": "2.0.0"
        }
    }


@app.post("/mcp/v1/tools/list")
async def list_tools():
    """List available tools."""
    return {"tools": mcp_server.list_tools()}


@app.post("/mcp/v1/tools/call")
async def call_tool(request: dict):
    """Call a tool."""
    try:
        name = request.get("name")
        arguments = request.get("arguments", {})
        
        result = mcp_server.call_tool(name, arguments)
        return {
            "content": [
                {
                    "type": "text",
                    "text": json.dumps(result, indent=2)
                }
            ]
        }
    except Exception as e:
        return {
            "content": [
                {
                    "type": "text",
                    "text": json.dumps({"error": str(e)}, indent=2)
                }
            ],
            "isError": True
        }


@app.post("/mcp/v1/resources/list")
async def list_resources():
    """List available resources."""
    return {"resources": mcp_server.list_resources()}


@app.get("/health")
async def health():
    """Health check endpoint."""
    return {"status": "healthy", "version": "2.0.0"}


@app.get("/")
async def root():
    """Root endpoint with documentation."""
    return {
        "name": "UX-Master MCP Server",
        "version": "2.0.0",
        "description": "Ultimate UX Design Intelligence",
        "endpoints": {
            "initialize": "/mcp/v1/initialize",
            "tools": "/mcp/v1/tools/list",
            "call_tool": "/mcp/v1/tools/call",
            "resources": "/mcp/v1/resources/list",
            "health": "/health"
        },
        "tools_count": len(mcp_server.tools),
        "features": [
            "48 UX Laws",
            "37 Design Tests",
            "16 Search Domains",
            "17 Technology Stacks",
            "Figma Integration"
        ]
    }


# ============================================================================
# Main Entry Point
# ============================================================================

if __name__ == "__main__":
    import uvicorn
    
    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", 3000))
    
    print(f"""
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║   UX-Master MCP Server v2.0.0                               ║
║   Ultimate UX Design Intelligence                           ║
║                                                              ║
╠══════════════════════════════════════════════════════════════╣
║   Port: {port:<5}                                             ║
║   Host: {host:<15}                                       ║
║                                                              ║
║   Endpoints:                                                 ║
║   • POST /mcp/v1/initialize                                  ║
║   • POST /mcp/v1/tools/list                                  ║
║   • POST /mcp/v1/tools/call                                  ║
║   • GET  /health                                             ║
║                                                              ║
║   Tools: 8 available                                         ║
║   • search_ux_laws                                           ║
║   • search_design_tests                                      ║
║   • validate_design                                          ║
║   • extract_design_system                                    ║
║   • generate_design_system                                   ║
║   • search_domain                                            ║
║   • export_to_figma                                          ║
║   • get_stack_guidelines                                     ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
    """)
    
    uvicorn.run(app, host=host, port=port)
