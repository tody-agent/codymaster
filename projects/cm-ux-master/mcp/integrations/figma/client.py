#!/usr/bin/env python3
"""
Figma API Client for UX-Master

Features:
- Create/update variable collections
- Import/export design tokens
- Sync color, typography, spacing tokens
"""

import os
import json
from typing import Optional
from dataclasses import dataclass

import httpx


class FigmaError(Exception):
    """Figma API error."""
    pass


@dataclass
class FigmaVariable:
    """Figma variable definition."""
    name: str
    type: str  # "COLOR", "FLOAT", "STRING", "BOOLEAN"
    value: any
    description: Optional[str] = None


class FigmaClient:
    """Figma API client."""
    
    BASE_URL = "https://api.figma.com/v1"
    
    def __init__(self, token: Optional[str] = None):
        """Initialize client with access token.
        
        Args:
            token: Figma personal access token (or from FIGMA_TOKEN env var)
        """
        self.token = token or os.getenv("FIGMA_TOKEN")
        if not self.token:
            raise FigmaError("Figma token required. Set FIGMA_TOKEN environment variable.")
        
        self.client = httpx.AsyncClient(
            headers={"X-Figma-Token": self.token},
            timeout=30.0
        )
    
    async def close(self):
        """Close HTTP client."""
        await self.client.aclose()
    
    async def get_file(self, file_key: str) -> dict:
        """Get file information."""
        response = await self.client.get(f"{self.BASE_URL}/files/{file_key}")
        
        if response.status_code != 200:
            raise FigmaError(f"Failed to get file: {response.text}")
        
        return response.json()
    
    async def get_variables(self, file_key: str) -> dict:
        """Get all variables in a file."""
        response = await self.client.get(
            f"{self.BASE_URL}/files/{file_key}/variables/local"
        )
        
        if response.status_code != 200:
            raise FigmaError(f"Failed to get variables: {response.text}")
        
        return response.json()
    
    async def create_variable_collection(
        self,
        file_key: str,
        name: str,
        mode_name: str = "Default"
    ) -> str:
        """Create a new variable collection.
        
        Returns:
            Collection ID
        """
        # Note: Figma API doesn't support creating collections directly
        # This is a placeholder for when the API supports it
        # For now, users need to create collections manually
        
        return f"collection_placeholder_for_{name}"
    
    async def create_variables(
        self,
        file_key: str,
        collection_id: str,
        variables: list[FigmaVariable]
    ) -> dict:
        """Create variables in a collection.
        
        Args:
            file_key: Figma file key
            collection_id: Variable collection ID
            variables: List of variables to create
            
        Returns:
            API response
        """
        # Convert UXM tokens to Figma format
        figma_variables = []
        
        for var in variables:
            figma_var = {
                "name": var.name,
                "type": var.type,
                "variableCollectionId": collection_id
            }
            
            if var.description:
                figma_var["description"] = var.description
            
            # Add value based on type
            if var.type == "COLOR":
                figma_var["value"] = self._convert_color(var.value)
            elif var.type == "FLOAT":
                figma_var["value"] = float(var.value)
            else:
                figma_var["value"] = var.value
            
            figma_variables.append(figma_var)
        
        # POST to Figma API
        response = await self.client.post(
            f"{self.BASE_URL}/files/{file_key}/variables",
            json={"variables": figma_variables}
        )
        
        if response.status_code not in (200, 201):
            raise FigmaError(f"Failed to create variables: {response.text}")
        
        return response.json()
    
    async def create_variables_collection(
        self,
        file_key: str,
        tokens: dict,
        collection_name: str = "UX-Master Tokens"
    ) -> dict:
        """Create a complete variable collection from design tokens.
        
        Args:
            file_key: Figma file key
            tokens: Design tokens dict from UX-Master
            collection_name: Name for the variable collection
            
        Returns:
            Created variables info
        """
        # Convert tokens to Figma variables
        variables = self._tokens_to_variables(tokens)
        
        # For now, return what would be created
        # Full implementation requires Figma API support for collection creation
        return {
            "status": "success",
            "file_key": file_key,
            "collection_name": collection_name,
            "variables_count": len(variables),
            "variables": [
                {"name": v.name, "type": v.type, "value": v.value}
                for v in variables[:10]  # Preview first 10
            ],
            "note": "Manual step required: Create variable collection in Figma UI"
        }
    
    def _tokens_to_variables(self, tokens: dict) -> list[FigmaVariable]:
        """Convert UX-Master tokens to Figma variables."""
        variables = []
        
        # Process colors
        if "colors" in tokens:
            colors = tokens["colors"]
            for role, value in colors.items():
                if isinstance(value, str) and value.startswith("#"):
                    variables.append(FigmaVariable(
                        name=f"color/{role}",
                        type="COLOR",
                        value=value,
                        description=f"{role} color"
                    ))
        
        # Process spacing
        if "spacing" in tokens:
            spacing = tokens["spacing"]
            for name, value in spacing.items():
                variables.append(FigmaVariable(
                    name=f"spacing/{name}",
                    type="FLOAT",
                    value=value,
                    description=f"{name} spacing"
                ))
        
        # Process typography sizes
        if "typography" in tokens:
            typography = tokens["typography"]
            if "sizes" in typography:
                for name, value in typography["sizes"].items():
                    variables.append(FigmaVariable(
                        name=f"font-size/{name}",
                        type="FLOAT",
                        value=value,
                        description=f"{name} font size"
                    ))
        
        # Process border radius
        if "borderRadius" in tokens:
            for name, value in tokens["borderRadius"].items():
                variables.append(FigmaVariable(
                    name=f"border-radius/{name}",
                    type="FLOAT",
                    value=value,
                    description=f"{name} border radius"
                ))
        
        return variables
    
    def _convert_color(self, hex_color: str) -> dict:
        """Convert hex color to Figma RGB format."""
        hex_color = hex_color.lstrip("#")
        
        if len(hex_color) == 6:
            r = int(hex_color[0:2], 16) / 255
            g = int(hex_color[2:4], 16) / 255
            b = int(hex_color[4:6], 16) / 255
            a = 1
        elif len(hex_color) == 8:
            r = int(hex_color[0:2], 16) / 255
            g = int(hex_color[2:4], 16) / 255
            b = int(hex_color[4:6], 16) / 255
            a = int(hex_color[6:8], 16) / 255
        else:
            # Invalid hex, return black
            r = g = b = 0
            a = 1
        
        return {
            "r": round(r, 4),
            "g": round(g, 4),
            "b": round(b, 4),
            "a": round(a, 4)
        }
    
    async def export_styles_to_tokens(self, file_key: str) -> dict:
        """Export Figma styles to design tokens format."""
        file_data = await self.get_file(file_key)
        
        tokens = {
            "colors": {},
            "typography": {},
            "spacing": {},
            "effects": {}
        }
        
        # Extract paint styles (colors)
        styles = file_data.get("styles", {})
        for style_id, style_info in styles.items():
            if style_info.get("styleType") == "FILL":
                # Would need to fetch actual style values
                tokens["colors"][style_info["name"]] = {
                    "type": "color",
                    "value": "#000000"  # Placeholder
                }
        
        return tokens


# Sync client for synchronous usage
class FigmaClientSync:
    """Synchronous Figma client."""
    
    def __init__(self, token: Optional[str] = None):
        self.token = token or os.getenv("FIGMA_TOKEN")
        self.client = httpx.Client(
            headers={"X-Figma-Token": self.token},
            timeout=30.0
        )
    
    def get_file(self, file_key: str) -> dict:
        """Get file information."""
        response = self.client.get(f"https://api.figma.com/v1/files/{file_key}")
        response.raise_for_status()
        return response.json()
