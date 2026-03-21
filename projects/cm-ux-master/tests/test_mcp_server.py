#!/usr/bin/env python3
"""
Test Suite for MCP Server

Tests MCP protocol implementation and tool handlers.
"""

import sys
import json
import pytest
from pathlib import Path
from unittest.mock import Mock, patch, MagicMock

# Add paths
sys.path.insert(0, str(Path(__file__).parent.parent / "mcp"))
sys.path.insert(0, str(Path(__file__).parent.parent / "cli"))
sys.path.insert(0, str(Path(__file__).parent.parent / "scripts"))

# Mock FastAPI before import
sys.modules["fastapi"] = MagicMock()
sys.modules["fastapi.middleware"] = MagicMock()
sys.modules["fastapi.middleware.cors"] = MagicMock()
sys.modules["pydantic"] = MagicMock()

# Now import our code
from server import UXMasterMCPServer


# =============================================================================
# FIXTURES
# =============================================================================

@pytest.fixture
def mcp_server():
    """Create MCP server instance."""
    with patch.dict('sys.modules', {
        'fastapi': MagicMock(),
        'fastapi.middleware': MagicMock(),
        'fastapi.middleware.cors': MagicMock(),
        'pydantic': MagicMock()
    }):
        server = UXMasterMCPServer()
        return server


@pytest.fixture
def sample_design_tokens():
    """Sample design tokens."""
    return {
        "colors": {
            "primary": "#0064FA",
            "secondary": "#4ECDC4",
            "success": "#10B981",
            "warning": "#F59E0B",
            "danger": "#EF4444"
        },
        "spacing": {
            "sm": 4,
            "md": 8,
            "lg": 16
        },
        "typography": {
            "fontFamily": "Inter, sans-serif"
        }
    }


# =============================================================================
# SERVER INITIALIZATION TESTS
# =============================================================================

class TestServerInitialization:
    """Test MCP server setup."""
    
    def test_server_creates_tools(self, mcp_server):
        """Test server initializes all tools."""
        assert hasattr(mcp_server, 'tools')
        assert len(mcp_server.tools) >= 8
        assert "search_ux_laws" in mcp_server.tools
        assert "validate_design" in mcp_server.tools
        assert "extract_design_system" in mcp_server.tools
    
    def test_server_creates_search_engine(self, mcp_server):
        """Test server initializes search engine."""
        assert hasattr(mcp_server, 'search_engine')
    
    def test_server_creates_platform_manager(self, mcp_server):
        """Test server initializes platform manager."""
        assert hasattr(mcp_server, 'platform_manager')


# =============================================================================
# TOOL HANDLER TESTS
# =============================================================================

class TestSearchUXLaws:
    """Test search_ux_laws tool."""
    
    def test_search_returns_results(self, mcp_server):
        """Test basic search functionality."""
        params = {
            "query": "mobile touch targets",
            "max_results": 3
        }
        
        result = mcp_server.handle_search_ux_laws(params)
        
        assert "laws" in result
        assert "count" in result
        assert "query" in result
        assert isinstance(result["laws"], list)
    
    def test_search_with_product_type(self, mcp_server):
        """Test search with product type filter."""
        params = {
            "query": "dashboard",
            "product_type": "dashboard",
            "max_results": 5
        }
        
        result = mcp_server.handle_search_ux_laws(params)
        
        assert result["query"] == "dashboard"


class TestSearchDesignTests:
    """Test search_design_tests tool."""
    
    def test_search_returns_tests(self, mcp_server):
        """Test design tests search."""
        params = {
            "query": "button validation",
            "max_results": 5
        }
        
        result = mcp_server.handle_search_design_tests(params)
        
        assert "tests" in result
        assert "count" in result


class TestValidateDesign:
    """Test validate_design tool with Validation Engine v4."""
    
    def test_validate_returns_score(self, mcp_server):
        """Test validation returns proper structure."""
        params = {
            "html": "<button style='width: 100px; height: 50px;'>Click</button>",
            "test_suite": "all"
        }
        
        result = mcp_server.handle_validate_design(params)
        
        assert result["status"] == "completed"
        assert "score" in result
        assert "passed" in result
        assert "failed" in result
        assert "tests" in result
        assert isinstance(result["score"], (int, float))
    
    def test_validate_mobile_suite(self, mcp_server):
        """Test mobile-specific validation."""
        params = {
            "html": "<button>Small</button>",
            "test_suite": "mobile"
        }
        
        result = mcp_server.handle_validate_design(params)
        
        assert result["status"] == "completed"
        assert "tests" in result
    
    def test_validate_a11y_suite(self, mcp_server):
        """Test accessibility validation."""
        params = {
            "html": "<input type='text' />",  # Missing label
            "test_suite": "a11y"
        }
        
        result = mcp_server.handle_validate_design(params)
        
        assert result["status"] == "completed"
    
    def test_validate_handles_errors(self, mcp_server):
        """Test validation error handling."""
        # Test with invalid params
        params = {}  # Missing required 'html'
        
        result = mcp_server.handle_validate_design(params)
        
        assert result["status"] == "error"


class TestExtractDesignSystem:
    """Test extract_design_system tool with Harvester v4."""
    
    def test_extract_returns_design_system(self, mcp_server):
        """Test extraction returns proper structure."""
        params = {
            "url": "https://example.com",
            "depth": 1
        }
        
        result = mcp_server.handle_extract_design_system(params)
        
        assert result["status"] == "completed"
        assert "design_system" in result
        assert "url" in result
        assert result["url"] == "https://example.com"
    
    def test_extract_includes_validation(self, mcp_server):
        """Test extraction includes validation."""
        params = {"url": "https://example.com"}
        
        result = mcp_server.handle_extract_design_system(params)
        
        assert "validation" in result
        if result["validation"]:
            assert "score" in result["validation"]
    
    def test_extract_includes_tokens(self, mcp_server):
        """Test extraction returns design tokens."""
        params = {"url": "https://example.com"}
        
        result = mcp_server.handle_extract_design_system(params)
        
        assert "tokens" in result
        assert "css" in result


class TestGenerateDesignSystem:
    """Test generate_design_system tool."""
    
    def test_generate_returns_system(self, mcp_server):
        """Test generation returns design system."""
        params = {
            "query": "fintech dashboard",
            "project_name": "TestApp"
        }
        
        result = mcp_server.handle_generate_design_system(params)
        
        assert "design_system" in result
        assert "query" in result
    
    def test_generate_with_output_format(self, mcp_server):
        """Test generation with different formats."""
        params = {
            "query": "landing page",
            "output_format": "json"
        }
        
        result = mcp_server.handle_generate_design_system(params)
        
        assert "design_system" in result


class TestSearchDomain:
    """Test search_domain tool."""
    
    def test_search_domain_returns_results(self, mcp_server):
        """Test domain-specific search."""
        params = {
            "query": "blue color scheme",
            "domain": "color",
            "max_results": 3
        }
        
        result = mcp_server.handle_search_domain(params)
        
        assert result["domain"] == "color"
        assert "results" in result
        assert "count" in result


class TestGetStackGuidelines:
    """Test get_stack_guidelines tool."""
    
    def test_stack_guidelines_returned(self, mcp_server):
        """Test stack guidelines retrieval."""
        params = {
            "query": "button component",
            "stack": "react"
        }
        
        result = mcp_server.handle_get_stack_guidelines(params)
        
        assert result["stack"] == "react"
        assert "guidelines" in result


# =============================================================================
# PROTOCOL TESTS
# =============================================================================

class TestMCPProtocol:
    """Test MCP protocol compliance."""
    
    def test_list_tools_returns_array(self, mcp_server):
        """Test list_tools returns proper structure."""
        tools = mcp_server.list_tools()
        
        assert isinstance(tools, list)
        assert len(tools) >= 8
        
        for tool in tools:
            assert "name" in tool
            assert "description" in tool
            assert "inputSchema" in tool
    
    def test_list_resources_returns_array(self, mcp_server):
        """Test list_resources returns proper structure."""
        resources = mcp_server.list_resources()
        
        assert isinstance(resources, list)
        assert len(resources) >= 4
        
        for resource in resources:
            assert "uri" in resource
            assert "name" in resource
    
    def test_call_tool_routes_correctly(self, mcp_server):
        """Test call_tool routes to correct handler."""
        with patch.object(mcp_server, 'handle_search_ux_laws') as mock_handler:
            mock_handler.return_value = {"test": "result"}
            
            result = mcp_server.call_tool("search_ux_laws", {"query": "test"})
            
            mock_handler.assert_called_once_with({"query": "test"})
            assert result == {"test": "result"}
    
    def test_call_tool_unknown_tool(self, mcp_server):
        """Test call_tool handles unknown tools."""
        with pytest.raises(ValueError) as exc_info:
            mcp_server.call_tool("unknown_tool", {})
        
        assert "Unknown tool" in str(exc_info.value)


# =============================================================================
# ENDPOINT TESTS (Mocked)
# =============================================================================

class TestEndpoints:
    """Test FastAPI endpoints (mocked)."""
    
    @pytest.mark.asyncio
    async def test_initialize_endpoint(self):
        """Test /mcp/v1/initialize endpoint."""
        from server import initialize
        
        result = await initialize()
        
        assert result["protocolVersion"] == "2024-11-05"
        assert "capabilities" in result
        assert "serverInfo" in result
        assert result["serverInfo"]["name"] == "ux-master"
    
    @pytest.mark.asyncio
    async def test_health_endpoint(self):
        """Test /health endpoint."""
        from server import health
        
        result = await health()
        
        assert result["status"] == "healthy"
        assert "version" in result


# =============================================================================
# INTEGRATION TESTS
# =============================================================================

class TestIntegration:
    """Integration tests between components."""
    
    def test_validation_integration(self, mcp_server):
        """Test full validation flow through MCP."""
        # 1. Extract from URL (simulated)
        extract_params = {"url": "https://example.com"}
        extract_result = mcp_server.handle_extract_design_system(extract_params)
        
        assert extract_result["status"] == "completed"
        
        # 2. Validate extracted data
        if extract_result.get("design_system"):
            html = json.dumps(extract_result["design_system"])
            validate_params = {"html": html, "test_suite": "all"}
            validate_result = mcp_server.handle_validate_design(validate_params)
            
            assert validate_result["status"] == "completed"
            assert "score" in validate_result
    
    def test_end_to_end_workflow(self, mcp_server):
        """Test complete workflow."""
        # Generate -> Validate -> Export workflow
        
        # 1. Generate design system
        gen_params = {"query": "fintech dashboard"}
        gen_result = mcp_server.handle_generate_design_system(gen_params)
        
        assert "design_system" in gen_result
        
        # 2. Get UX Laws
        law_params = {"query": "dashboard", "max_results": 3}
        law_result = mcp_server.handle_search_ux_laws(law_params)
        
        assert "laws" in law_result
        
        # 3. Get stack guidelines
        stack_params = {"query": "dashboard", "stack": "react"}
        stack_result = mcp_server.handle_get_stack_guidelines(stack_params)
        
        assert "guidelines" in stack_result


# =============================================================================
# ERROR HANDLING TESTS
# =============================================================================

class TestErrorHandling:
    """Test error handling."""
    
    def test_handle_malformed_json(self, mcp_server):
        """Test handling of malformed JSON in validate."""
        params = {
            "html": "not valid json {[[",
            "test_suite": "all"
        }
        
        result = mcp_server.handle_validate_design(params)
        
        # Should handle gracefully
        assert result["status"] in ["completed", "error"]
    
    def test_handle_missing_params(self, mcp_server):
        """Test handling of missing required params."""
        # Missing required 'html' parameter
        params = {"test_suite": "all"}
        
        result = mcp_server.handle_validate_design(params)
        
        assert result["status"] == "error"
    
    def test_handle_empty_query(self, mcp_server):
        """Test handling of empty queries."""
        params = {"query": ""}
        
        result = mcp_server.handle_search_ux_laws(params)
        
        # Should handle gracefully
        assert "laws" in result


# =============================================================================
# PERFORMANCE TESTS
# =============================================================================

class TestPerformance:
    """Performance tests."""
    
    def test_search_performance(self, mcp_server):
        """Test search completes quickly."""
        import time
        
        params = {"query": "mobile", "max_results": 5}
        
        start = time.time()
        result = mcp_server.handle_search_ux_laws(params)
        elapsed = time.time() - start
        
        assert elapsed < 1.0, f"Search took {elapsed:.2f}s"
        assert "laws" in result
    
    def test_validation_performance(self, mcp_server):
        """Test validation completes quickly."""
        import time
        
        params = {
            "html": "<div><button>Test</button></div>",
            "test_suite": "mobile"
        }
        
        start = time.time()
        result = mcp_server.handle_validate_design(params)
        elapsed = time.time() - start
        
        assert elapsed < 2.0, f"Validation took {elapsed:.2f}s"


# =============================================================================
# MAIN
# =============================================================================

if __name__ == "__main__":
    pytest.main([__file__, "-v"])
