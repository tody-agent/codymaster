"""Search command implementation."""

from ..search_engine import SearchEngine
from ..utils.console import console


def search_command(
    query: str,
    domain: str | None,
    max_results: int = 3
) -> list[dict]:
    """Execute search command.
    
    Args:
        query: Search query
        domain: Domain to search
        max_results: Maximum results
        
    Returns:
        List of search results
    """
    engine = SearchEngine()
    return engine.search(query, domain, max_results)
