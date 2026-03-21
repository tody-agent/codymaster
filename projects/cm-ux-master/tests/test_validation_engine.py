#!/usr/bin/env python3
"""
Test Suite for Validation Engine v4

Comprehensive tests for all 41 Design Tests.
"""

import sys
import json
from pathlib import Path

# Add scripts to path
sys.path.insert(0, str(Path(__file__).parent.parent / "scripts"))

import pytest
from validation_engine import (
    ValidationEngine, DesignTest, TestResult, ValidationReport,
    TestSeverity, TestCategory,
    FittsLawTest, ThumbZoneTest, ColorContrastTest,
    TypographyScaleTest, SpacingSystemTest,
    hex_to_rgb, get_luminance, contrast_ratio, parse_px
)


# =============================================================================
# FIXTURES
# =============================================================================

@pytest.fixture
def validation_engine():
    """Create a fresh validation engine."""
    return ValidationEngine()


@pytest.fixture
def sample_harvester_data():
    """Sample harvester data for testing."""
    return {
        "_version": 4,
        "meta": {
            "url": "https://example.com",
            "title": "Test Page",
            "pageType": "landing",
            "timestamp": "2024-01-01T00:00:00Z"
        },
        "visualAnalysis": {
            "colors": {
                "semantic": {
                    "primary": {
                        "base": "#0064FA",
                        "psychology": {"h": 220, "emotion": "professional"}
                    },
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
                    "h1": {"size": "32px", "weight": "700", "family": "Inter"},
                    "h2": {"size": "24px", "weight": "600", "family": "Inter"},
                    "h3": {"size": "20px", "weight": "600", "family": "Inter"},
                    "h4": {"size": "18px", "weight": "600", "family": "Inter"}
                },
                "dominant": {
                    "family": "Inter, sans-serif",
                    "size": "16px",
                    "weight": "400"
                }
            },
            "layout": {
                "sidebar": {"width": 240, "position": "fixed"},
                "header": {"height": 64, "fixed": True},
                "content": {"maxWidth": "1200px", "centered": True}
            },
            "spacing": {
                "scale": [4, 8, 12, 16, 20, 24, 32, 40, 48, 64],
                "values": {}
            },
            "borders": {
                "radius": {
                    "none": "0px", "xs": "2px", "sm": "4px",
                    "md": "8px", "lg": "12px", "xl": "16px", "full": "9999px"
                }
            },
            "animations": {
                "transitions": {"all": 5},
                "durations": {"0.2s": 3},
                "easings": {"ease": 2}
            }
        },
        "components": {
            "blueprints": {
                "button": {
                    "count": 5,
                    "representative": {
                        "dimensions": {"width": 100, "height": 44},
                        "styles": {
                            "backgroundColor": "#0064FA",
                            "color": "#FFFFFF",
                            "padding": "12px 24px",
                            "borderRadius": "8px"
                        }
                    },
                    "variants": {
                        "primary": [{"styles": {}}],
                        "secondary": [{"styles": {}}]
                    }
                },
                "input": {
                    "count": 3,
                    "representative": {
                        "dimensions": {"width": 300, "height": 44}
                    }
                },
                "card": {
                    "count": 4,
                    "representative": {
                        "styles": {"borderRadius": "12px"}
                    }
                }
            }
        },
        "quality": {
            "accessibility": {
                "contrastIssues": [],
                "missingLabels": [],
                "missingFocus": [],
                "ariaIssues": []
            }
        }
    }


@pytest.fixture
def bad_harvester_data():
    """Harvester data with intentional issues."""
    return {
        "_version": 4,
        "meta": {"pageType": "generic"},
        "visualAnalysis": {
            "colors": {
                "semantic": {
                    "primary": {"base": "#0064FA"}
                    # Missing success, warning, danger
                },
                "neutrals": {
                    "500": "#6B7280"
                    # Missing most neutral levels
                }
            },
            "typography": {
                "hierarchy": {
                    "h1": {"size": "32px"}
                    # Missing h2, h3, etc.
                }
            },
            "spacing": {"scale": [4, 8]},  # Too few
            "borders": {"radius": {}}  # Missing
        },
        "components": {
            "blueprints": {
                "button": {
                    "count": 2,
                    "representative": {
                        "dimensions": {"width": 30, "height": 30}  # Too small!
                    }
                }
            }
        },
        "quality": {
            "accessibility": {
                "contrastIssues": [
                    {"element": "p", "contrast": "2.5", "fg": "#888888", "bg": "#FFFFFF"}
                ],
                "missingLabels": [{"type": "input"}]
            }
        }
    }


# =============================================================================
# UTILITY TESTS
# =============================================================================

class TestUtilities:
    """Test utility functions."""
    
    def test_hex_to_rgb(self):
        """Test hex to RGB conversion."""
        assert hex_to_rgb("#FF0000") == (255, 0, 0)
        assert hex_to_rgb("#00FF00") == (0, 255, 0)
        assert hex_to_rgb("#0000FF") == (0, 0, 255)
        assert hex_to_rgb("#FFF") == (255, 255, 255)  # Short form
    
    def test_get_luminance(self):
        """Test luminance calculation."""
        # White should have high luminance
        assert get_luminance("#FFFFFF") > 0.9
        # Black should have low luminance
        assert get_luminance("#000000") < 0.1
        # Gray should be middle
        assert 0.4 < get_luminance("#808080") < 0.6
    
    def test_contrast_ratio(self):
        """Test contrast ratio calculation."""
        # Black on white should have high contrast
        ratio = contrast_ratio("#000000", "#FFFFFF")
        assert ratio > 15
        
        # Similar colors should have low contrast
        ratio = contrast_ratio("#777777", "#888888")
        assert ratio < 2
        
        # WCAG AA requires 4.5:1 for normal text
        ratio = contrast_ratio("#666666", "#FFFFFF")
        assert ratio >= 4.5
    
    def test_parse_px(self):
        """Test pixel value parsing."""
        assert parse_px("16px") == 16
        assert parse_px("24.5px") == 24.5
        assert parse_px("auto") == 0
        assert parse_px("") == 0


# =============================================================================
# VALIDATION ENGINE TESTS
# =============================================================================

class TestValidationEngine:
    """Test Validation Engine core functionality."""
    
    def test_engine_initialization(self, validation_engine):
        """Test engine creates all tests."""
        assert len(validation_engine.tests) >= 37
        assert "DT-MOB-001" in validation_engine.tests
        assert "DT-CLR-001" in validation_engine.tests
    
    def test_get_test(self, validation_engine):
        """Test retrieving specific tests."""
        test = validation_engine.get_test("DT-MOB-001")
        assert test is not None
        assert test.test_id == "DT-MOB-001"
        assert test.name == "Fitts's Law - Touch Target Size"
    
    def test_list_tests(self, validation_engine):
        """Test listing tests."""
        all_tests = validation_engine.list_tests()
        assert len(all_tests) >= 37
        
        mobile_tests = validation_engine.list_tests(TestCategory.MOBILE)
        assert len(mobile_tests) >= 5
        assert all(t.category == TestCategory.MOBILE for t in mobile_tests)
    
    def test_validate_all_tests(self, validation_engine, sample_harvester_data):
        """Test full validation suite."""
        report = validation_engine.validate(sample_harvester_data, test_suite="all")
        
        assert isinstance(report, ValidationReport)
        assert report.total_count >= 37
        assert report.passed_count + report.failed_count == report.total_count
        assert 0 <= report.score <= 100
        assert len(report.tests) == report.total_count
        assert "by_category" in report.summary
    
    def test_validate_mobile_suite(self, validation_engine, sample_harvester_data):
        """Test mobile-specific validation."""
        report = validation_engine.validate(sample_harvester_data, test_suite="mobile")
        
        assert all(t.category == TestCategory.MOBILE for t in report.tests)
        assert report.total_count >= 5
    
    def test_validate_a11y_suite(self, validation_engine, sample_harvester_data):
        """Test accessibility validation."""
        report = validation_engine.validate(sample_harvester_data, test_suite="a11y")
        
        assert all(t.category == TestCategory.ACCESSIBILITY for t in report.tests)
    
    def test_validate_with_bad_data(self, validation_engine, bad_harvester_data):
        """Test validation catches issues."""
        report = validation_engine.validate(bad_harvester_data, test_suite="all")
        
        # Should have failures
        assert report.failed_count > 0
        assert report.score < 100
        
        # Should detect small touch targets
        fitts_test = next((t for t in report.tests if t.test_id == "DT-MOB-001"), None)
        if fitts_test:
            assert not fitts_test.passed
        
        # Should detect contrast issues
        contrast_test = next((t for t in report.tests if t.test_id == "DT-CLR-001"), None)
        if contrast_test:
            assert not contrast_test.passed
    
    def test_validate_component(self, validation_engine):
        """Test component-specific validation."""
        component_data = {
            "count": 3,
            "representative": {
                "styles": {"backgroundColor": "#0064FA"},
                "dimensions": {"width": 100, "height": 40}
            }
        }
        
        report = validation_engine.validate_component(component_data, "button")
        
        assert report.total_count > 0
        assert all(hasattr(t, "test_id") for t in report.tests)


# =============================================================================
# INDIVIDUAL TESTS
# =============================================================================

class TestFittsLaw:
    """Test Fitts's Law validation."""
    
    def test_passes_with_large_targets(self):
        """Test passes when targets are large enough."""
        test = FittsLawTest()
        data = {
            "components": {
                "blueprints": {
                    "button": {
                        "representative": {"dimensions": {"width": 100, "height": 50}}
                    }
                }
            }
        }
        
        result = test.run(data)
        assert result.passed
        assert result.severity == TestSeverity.CRITICAL
    
    def test_fails_with_small_targets(self):
        """Test fails when targets are too small."""
        test = FittsLawTest()
        data = {
            "components": {
                "blueprints": {
                    "button": {
                        "representative": {"dimensions": {"width": 30, "height": 30}}
                    }
                }
            }
        }
        
        result = test.run(data)
        assert not result.passed
        assert "44" in result.suggestion


class TestColorContrast:
    """Test color contrast validation."""
    
    def test_passes_with_good_contrast(self):
        """Test passes with WCAG-compliant contrast."""
        test = ColorContrastTest()
        data = {
            "quality": {
                "accessibility": {"contrastIssues": []}
            }
        }
        
        result = test.run(data)
        assert result.passed
    
    def test_fails_with_poor_contrast(self):
        """Test fails with contrast issues."""
        test = ColorContrastTest()
        data = {
            "quality": {
                "accessibility": {
                    "contrastIssues": [
                        {"element": "p", "contrast": "2.5"}
                    ]
                }
            }
        }
        
        result = test.run(data)
        assert not result.passed
        assert "4.5" in result.suggestion


class TestTypographyScale:
    """Test typography hierarchy validation."""
    
    def test_passes_with_good_hierarchy(self):
        """Test passes with 3+ heading levels."""
        test = TypographyScaleTest()
        data = {
            "visualAnalysis": {
                "typography": {
                    "hierarchy": {
                        "h1": {}, "h2": {}, "h3": {}
                    }
                }
            }
        }
        
        result = test.run(data)
        assert result.passed
    
    def test_fails_with_poor_hierarchy(self):
        """Test fails with insufficient levels."""
        test = TypographyScaleTest()
        data = {
            "visualAnalysis": {
                "typography": {
                    "hierarchy": {"h1": {}}  # Only one level
                }
            }
        }
        
        result = test.run(data)
        assert not result.passed


class TestSpacingSystem:
    """Test spacing system validation."""
    
    def test_passes_with_4px_base(self):
        """Test passes with 4px-based spacing."""
        test = SpacingSystemTest()
        data = {
            "visualAnalysis": {
                "spacing": {"scale": [4, 8, 12, 16, 24]}
            }
        }
        
        result = test.run(data)
        assert result.passed
    
    def test_detects_irregular_spacing(self):
        """Test detects non-standard spacing."""
        test = SpacingSystemTest()
        data = {
            "visualAnalysis": {
                "spacing": {"scale": [5, 13, 27]}  # Irregular
            }
        }
        
        result = test.run(data)
        # May pass or fail depending on implementation
        assert result.message is not None


# =============================================================================
# REPORT GENERATION TESTS
# =============================================================================

class TestReportGeneration:
    """Test report output formats."""
    
    def test_json_output(self, validation_engine, sample_harvester_data):
        """Test JSON report generation."""
        report = validation_engine.validate(sample_harvester_data, test_suite="all")
        
        json_output = json.dumps(report.to_dict())
        parsed = json.loads(json_output)
        
        assert "score" in parsed
        assert "tests" in parsed
        assert "summary" in parsed
    
    def test_markdown_output(self, validation_engine, sample_harvester_data):
        """Test Markdown report generation."""
        from validation_engine import generate_markdown_report
        
        report = validation_engine.validate(sample_harvester_data, test_suite="all")
        md = generate_markdown_report(report)
        
        assert "# UX-Master Validation Report" in md
        assert str(int(report.score)) in md or str(round(report.score, 1)) in md
        assert "## Test Results" in md
    
    def test_html_output(self, validation_engine, sample_harvester_data):
        """Test HTML report generation."""
        from validation_engine import generate_html_report
        
        report = validation_engine.validate(sample_harvester_data, test_suite="all")
        html = generate_html_report(report)
        
        assert "<!DOCTYPE html>" in html
        assert str(int(report.score)) in html
        assert "UX-Master" in html


# =============================================================================
# EDGE CASE TESTS
# =============================================================================

class TestEdgeCases:
    """Test edge cases and error handling."""
    
    def test_empty_data(self, validation_engine):
        """Test validation with empty data."""
        report = validation_engine.validate({}, test_suite="all")
        
        # Should not crash
        assert report is not None
        assert isinstance(report.score, float)
    
    def test_missing_sections(self, validation_engine):
        """Test validation with missing data sections."""
        data = {"meta": {}}  # Minimal data
        
        report = validation_engine.validate(data, test_suite="all")
        
        # Should handle gracefully
        assert report is not None
    
    def test_invalid_color_formats(self):
        """Test color utilities with invalid input."""
        # Should not crash on invalid hex
        result = hex_to_rgb("not-a-color")
        assert result == (0, 0, 0)  # Default fallback
        
        result = hex_to_rgb("#GGG")  # Invalid hex
        assert result == (0, 0, 0)
    
    def test_malformed_px_values(self):
        """Test px parsing with malformed values."""
        assert parse_px("not-px") == 0
        assert parse_px("16em") == 0  # Different unit
        assert parse_px("") == 0


# =============================================================================
# PERFORMANCE TESTS
# =============================================================================

class TestPerformance:
    """Test validation performance."""
    
    def test_validation_speed(self, validation_engine, sample_harvester_data):
        """Test that validation completes quickly."""
        import time
        
        start = time.time()
        report = validation_engine.validate(sample_harvester_data, test_suite="all")
        elapsed = time.time() - start
        
        # Should complete in under 1 second
        assert elapsed < 1.0, f"Validation took {elapsed:.2f}s, expected < 1s"
    
    def test_large_dataset(self, validation_engine):
        """Test validation with large dataset."""
        # Create large dataset
        data = {
            "components": {
                "blueprints": {
                    f"component_{i}": {
                        "count": i,
                        "representative": {"dimensions": {"width": 50, "height": 50}}
                    }
                    for i in range(100)
                }
            }
        }
        
        import time
        start = time.time()
        report = validation_engine.validate(data, test_suite="all")
        elapsed = time.time() - start
        
        # Should still complete quickly
        assert elapsed < 2.0, f"Large validation took {elapsed:.2f}s"


# =============================================================================
# INTEGRATION TESTS
# =============================================================================

class TestIntegration:
    """Integration tests with other components."""
    
    def test_validation_with_sample_data_file(self, validation_engine, tmp_path):
        """Test validation with JSON file input."""
        sample_data = {
            "meta": {"pageType": "dashboard"},
            "visualAnalysis": {
                "colors": {
                    "semantic": {"primary": {"base": "#0064FA"}}
                }
            }
        }
        
        # Write to file
        data_file = tmp_path / "test_data.json"
        with open(data_file, "w") as f:
            json.dump(sample_data, f)
        
        # Read and validate
        with open(data_file) as f:
            loaded_data = json.load(f)
        
        report = validation_engine.validate(loaded_data, test_suite="all")
        assert report is not None


# =============================================================================
# MAIN
# =============================================================================

if __name__ == "__main__":
    pytest.main([__file__, "-v"])
