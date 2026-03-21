#!/usr/bin/env python3
"""
UX-Master Template Engine

Advanced template system supporting:
- YAML-based platform configurations
- Conditional blocks: {{#if pro}}...{{/if}}
- Loops: {{#each stacks}}...{{/each}}
- Partials: {{> quick-reference}}
- Variables: {{variable_name}}
"""

import re
import yaml
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Callable, Optional
from rich.console import Console

console = Console()


@dataclass
class PlatformConfig:
    """Platform configuration for skill generation."""
    platform: str
    display_name: str
    install_type: str  # 'full', 'reference', 'mcp'
    folder_structure: dict
    script_path: str
    frontmatter: Optional[dict] = None
    sections: dict = field(default_factory=dict)
    title: str = "UX Master - Design Intelligence"
    description: str = ""
    skill_or_workflow: str = "Skill"
    # NEW: MCP-specific fields
    mcp_capabilities: list = field(default_factory=list)
    tool_endpoints: list = field(default_factory=list)
    
    @classmethod
    def from_yaml(cls, yaml_path: Path) -> "PlatformConfig":
        """Load platform config from YAML file."""
        with open(yaml_path, 'r', encoding='utf-8') as f:
            data = yaml.safe_load(f)
        return cls(**data)


class TemplateEngine:
    """Advanced template engine with rich features."""
    
    def __init__(self, templates_dir: Optional[Path] = None):
        """Initialize template engine.
        
        Args:
            templates_dir: Directory containing templates
        """
        if templates_dir is None:
            self.templates_dir = Path(__file__).parent.parent / "templates"
        else:
            self.templates_dir = Path(templates_dir)
        
        self._cache: dict[str, str] = {}
        self._helpers: dict[str, Callable] = {
            'upper': str.upper,
            'lower': str.lower,
            'title': str.title,
            'snake_case': self._to_snake_case,
            'kebab_case': self._to_kebab_case,
        }
    
    def render(self, template: str, context: dict[str, Any]) -> str:
        """Render template with context.
        
        Supports:
        - Variables: {{name}} or {{name | upper}}
        - Conditionals: {{#if condition}}...{{/if}}
        - Unless: {{#unless condition}}...{{/unless}}
        - Loops: {{#each items}}...{{/each}}
        - Partials: {{> partial_name}}
        - Comments: {{! comment }}
        """
        result = template
        
        # Remove comments first
        result = self._remove_comments(result)
        
        # Process partials
        result = self._process_partials(result)
        
        # Process conditionals (handle nested)
        result = self._process_conditionals(result, context)
        
        # Process loops
        result = self._process_loops(result, context)
        
        # Process variables
        result = self._process_variables(result, context)
        
        return result
    
    def render_file(self, template_name: str, context: dict[str, Any]) -> str:
        """Render template from file."""
        template_path = self.templates_dir / "base" / f"{template_name}.md"
        if not template_path.exists():
            raise FileNotFoundError(f"Template not found: {template_path}")
        
        with open(template_path, 'r', encoding='utf-8') as f:
            template = f.read()
        
        return self.render(template, context)
    
    def render_platform_config(self, config: PlatformConfig) -> str:
        """Render complete skill file for a platform."""
        context = {
            'platform': config.platform,
            'display_name': config.display_name,
            'title': config.title,
            'description': config.description,
            'skill_or_workflow': config.skill_or_workflow,
            'script_path': config.script_path,
            'frontmatter': config.frontmatter,
            'sections': config.sections,
            'mcp_capabilities': config.mcp_capabilities,
            'tool_endpoints': config.tool_endpoints,
            'has_ux_laws': True,
            'has_design_tests': True,
            'has_validation': True,
        }
        
        # Render frontmatter if exists
        lines = []
        if config.frontmatter:
            lines.append("---")
            for key, value in config.frontmatter.items():
                if isinstance(value, list):
                    lines.append(f"{key}:")
                    for item in value:
                        lines.append(f"  - {item}")
                elif isinstance(value, dict):
                    lines.append(f"{key}:")
                    for k, v in value.items():
                        lines.append(f"  {k}: {v}")
                else:
                    lines.append(f"{key}: {value}")
            lines.append("---")
            lines.append("")
        
        # Render main content
        content = self.render_file("skill-core", context)
        lines.append(content)
        
        # Add quick reference if enabled
        if config.sections.get('quick_reference', False):
            quick_ref = self.render_file("quick-reference", context)
            lines.append("")
            lines.append(quick_ref)
        
        return "\n".join(lines)
    
    def _remove_comments(self, template: str) -> str:
        """Remove template comments."""
        return re.sub(r'\{\{!.*?\}\}', '', template, flags=re.DOTALL)
    
    def _process_partials(self, template: str) -> str:
        """Process partial includes."""
        pattern = r'\{\{>\s*(\w+(-\w+)*)\s*\}\}'
        
        def replace_partial(match: re.Match) -> str:
            partial_name = match.group(1)
            try:
                partial_path = self.templates_dir / "partials" / f"{partial_name}.md"
                if partial_path.exists():
                    with open(partial_path, 'r', encoding='utf-8') as f:
                        return f.read()
                return f"<!-- Partial '{partial_name}' not found -->"
            except Exception as e:
                return f"<!-- Error loading partial '{partial_name}': {e} -->"
        
        return re.sub(pattern, replace_partial, template)
    
    def _process_conditionals(self, template: str, context: dict) -> str:
        """Process conditional blocks."""
        # Handle {{#if condition}}...{{/if}}
        def replace_if(match: re.Match) -> str:
            condition = match.group(1).strip()
            content = match.group(2)
            
            # Evaluate condition
            if self._evaluate_condition(condition, context):
                return self._process_conditionals(content, context)
            return ""
        
        # Handle {{#unless condition}}...{{/unless}}
        def replace_unless(match: re.Match) -> str:
            condition = match.group(1).strip()
            content = match.group(2)
            
            if not self._evaluate_condition(condition, context):
                return self._process_conditionals(content, context)
            return ""
        
        # Handle {{#if condition}}...{{else}}...{{/if}}
        def replace_if_else(match: re.Match) -> str:
            condition = match.group(1).strip()
            if_content = match.group(2)
            else_content = match.group(4) if match.group(4) else ""
            
            if self._evaluate_condition(condition, context):
                return self._process_conditionals(if_content, context)
            else:
                return self._process_conditionals(else_content, context)
        
        result = template
        # Process nested if-else first
        result = re.sub(
            r'\{\{#if\s+([^}]+)\}\}(.*?)\{\{else\}\}(.*?)\{\{/if\}\}',
            replace_if_else, result, flags=re.DOTALL
        )
        # Then simple if
        result = re.sub(
            r'\{\{#if\s+([^}]+)\}\}(.*?)\{\{/if\}\}',
            replace_if, result, flags=re.DOTALL
        )
        # Then unless
        result = re.sub(
            r'\{\{#unless\s+([^}]+)\}\}(.*?)\{\{/unless\}\}',
            replace_unless, result, flags=re.DOTALL
        )
        
        return result
    
    def _process_loops(self, template: str, context: dict) -> str:
        """Process loop blocks."""
        pattern = r'\{\{#each\s+(\w+)\}\}(.*?)\{\{/each\}\}'
        
        def replace_loop(match: re.Match) -> str:
            list_name = match.group(1)
            content = match.group(2)
            
            items = context.get(list_name, [])
            if not items:
                return ""
            
            results = []
            for i, item in enumerate(items):
                item_context = {**context, 'this': item, '@index': i, '@first': i == 0, '@last': i == len(items) - 1}
                # Handle {{this.property}} or just {{this}}
                item_content = content
                if isinstance(item, dict):
                    for key, value in item.items():
                        item_content = item_content.replace(f'{{{{this.{key}}}}}', str(value))
                else:
                    item_content = item_content.replace('{{this}}', str(item))
                item_content = self._process_variables(item_content, item_context)
                results.append(item_content)
            
            return "".join(results)
        
        return re.sub(pattern, replace_loop, template, flags=re.DOTALL)
    
    def _process_variables(self, template: str, context: dict) -> str:
        """Process variable substitutions with optional filters."""
        # Pattern: {{variable}} or {{variable | filter}} or {{variable.nested}}
        pattern = r'\{\{\s*([\w.]+)(?:\s*\|\s*(\w+))?\s*\}\}'
        
        def replace_var(match: re.Match) -> str:
            var_path = match.group(1)
            filter_name = match.group(2)
            
            # Get value from context (support nested: obj.prop)
            value = self._get_nested_value(context, var_path)
            
            if value is None:
                return f"{{{{{var_path}}}}}"  # Keep original if not found
            
            result = str(value)
            
            # Apply filter if specified
            if filter_name and filter_name in self._helpers:
                result = self._helpers[filter_name](result)
            
            return result
        
        return re.sub(pattern, replace_var, template)
    
    def _evaluate_condition(self, condition: str, context: dict) -> bool:
        """Evaluate a condition string."""
        condition = condition.strip()
        
        # Handle negation
        if condition.startswith('!'):
            return not self._evaluate_condition(condition[1:], context)
        
        # Handle comparisons
        if '==' in condition:
            left, right = condition.split('==', 1)
            left_val = self._get_nested_value(context, left.strip())
            right_val = right.strip().strip('"\'')
            return str(left_val) == right_val
        
        if '!=' in condition:
            left, right = condition.split('!=', 1)
            left_val = self._get_nested_value(context, left.strip())
            right_val = right.strip().strip('"\'')
            return str(left_val) != right_val
        
        # Simple truthiness check
        value = self._get_nested_value(context, condition)
        return bool(value)
    
    def _get_nested_value(self, context: dict, path: str) -> Any:
        """Get value from nested dict using dot notation."""
        parts = path.split('.')
        value = context
        
        for part in parts:
            if isinstance(value, dict):
                value = value.get(part)
            else:
                return None
            if value is None:
                return None
        
        return value
    
    def _to_snake_case(self, s: str) -> str:
        """Convert string to snake_case."""
        s = re.sub(r'(?<!^)(?=[A-Z])', '_', s).lower()
        s = re.sub(r'[\s-]+', '_', s)
        return s
    
    def _to_kebab_case(self, s: str) -> str:
        """Convert string to kebab-case."""
        s = re.sub(r'(?<!^)(?=[A-Z])', '-', s).lower()
        s = re.sub(r'[\s_]+', '-', s)
        return s


class PlatformManager:
    """Manages platform configurations and generation."""
    
    # Map AI types to platform config files
    AI_TO_PLATFORM = {
        'claude': 'claude',
        'cursor': 'cursor',
        'windsurf': 'windsurf',
        'antigravity': 'antigravity',
        'copilot': 'copilot',
        'kiro': 'kiro',
        'opencode': 'opencode',
        'roocode': 'roocode',
        'codex': 'codex',
        'qoder': 'qoder',
        'gemini': 'gemini',
        'trae': 'trae',
        'continue': 'continue',
        'codebuddy': 'codebuddy',
        'droid': 'droid',
        'cline': 'cline',
        'all': 'all',
    }
    
    def __init__(self, templates_dir: Optional[Path] = None):
        self.engine = TemplateEngine(templates_dir)
        self.platforms_dir = self.engine.templates_dir / "platforms"
    
    def load_platform_config(self, ai_type: str) -> PlatformConfig:
        """Load configuration for an AI assistant type."""
        platform_name = self.AI_TO_PLATFORM.get(ai_type)
        if not platform_name:
            raise ValueError(f"Unknown AI type: {ai_type}. Available: {list(self.AI_TO_PLATFORM.keys())}")
        
        config_path = self.platforms_dir / f"{platform_name}.yaml"
        if not config_path.exists():
            raise FileNotFoundError(f"Platform config not found: {config_path}")
        
        return PlatformConfig.from_yaml(config_path)
    
    def generate_skill(self, ai_type: str, output_dir: Path) -> list[str]:
        """Generate skill files for a platform."""
        config = self.load_platform_config(ai_type)
        
        # Determine output path
        skill_dir = output_dir / config.folder_structure['root'] / config.folder_structure['skillPath']
        skill_dir.mkdir(parents=True, exist_ok=True)
        
        # Render skill content
        content = self.engine.render_platform_config(config)
        
        # Write skill file
        skill_file = skill_dir / config.folder_structure['filename']
        with open(skill_file, 'w', encoding='utf-8') as f:
            f.write(content)
        
        created = [str(skill_file)]
        
        # Copy data and scripts if full install
        if config.install_type == 'full':
            created.extend(self._copy_data_and_scripts(skill_dir))
        
        return created
    
    def generate_all_platforms(self, output_dir: Path) -> list[str]:
        """Generate skill files for all platforms."""
        all_created = []
        for ai_type in self.AI_TO_PLATFORM.keys():
            if ai_type == 'all':
                continue
            try:
                created = self.generate_skill(ai_type, output_dir)
                all_created.extend(created)
            except Exception as e:
                console.print(f"[yellow]Warning: Failed to generate for {ai_type}: {e}[/yellow]")
        
        return all_created
    
    def list_supported_platforms(self) -> dict[str, str]:
        """List all supported AI platforms."""
        platforms = {}
        for ai_type, platform_name in self.AI_TO_PLATFORM.items():
            if ai_type == 'all':
                continue
            try:
                config = self.load_platform_config(ai_type)
                platforms[ai_type] = config.display_name
            except:
                platforms[ai_type] = platform_name
        
        return platforms
    
    def _copy_data_and_scripts(self, skill_dir: Path) -> list[str]:
        """Copy data and scripts to skill directory."""
        created = []
        
        # Find source directories
        cli_dir = self.engine.templates_dir.parent
        
        # Copy data (relative to existing ux-master structure)
        data_source = cli_dir.parent / "data"
        if data_source.exists():
            import shutil
            data_target = skill_dir / "data"
            if data_target.exists():
                shutil.rmtree(data_target)
            shutil.copytree(data_source, data_target)
            created.append(str(data_target))
        
        # Copy scripts
        scripts_source = cli_dir.parent / "scripts"
        if scripts_source.exists():
            import shutil
            scripts_target = skill_dir / "scripts"
            if scripts_target.exists():
                shutil.rmtree(scripts_target)
            shutil.copytree(scripts_source, scripts_target)
            created.append(str(scripts_target))
        
        return created
