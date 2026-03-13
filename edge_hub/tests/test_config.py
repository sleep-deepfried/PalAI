"""Unit tests for edge_hub.config module.

Validates:
- Requirement 4.1: Reads PALAI_API_URL from environment
- Requirement 4.3: Exits with descriptive error when PALAI_API_URL is missing
- Requirement 4.4: Default host 0.0.0.0 and port 5000
"""

import os
import subprocess
import sys


def test_missing_palai_api_url_exits_with_error(tmp_path):
    """Startup fails with descriptive stderr message when PALAI_API_URL is not set."""
    script = tmp_path / "run_config.py"
    script.write_text(
        "import sys\n"
        f"sys.path.insert(0, {repr(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')))})\n"
        "import edge_hub.config\n"
    )

    env = {k: v for k, v in os.environ.items() if k != "PALAI_API_URL"}
    result = subprocess.run(
        [sys.executable, str(script)],
        capture_output=True,
        text=True,
        env=env,
        timeout=10,
    )

    assert result.returncode != 0, "Process should exit with non-zero code"
    assert "PALAI_API_URL" in result.stderr, (
        f"Error message should mention PALAI_API_URL, got: {result.stderr!r}"
    )


def test_default_host_is_0000():
    """Default HOST value is 0.0.0.0 when EDGE_HOST is not set."""
    env = os.environ.copy()
    env.pop("EDGE_HOST", None)
    env["PALAI_API_URL"] = "http://example.com"

    # Reload the module with controlled env
    old_env = os.environ.copy()
    try:
        os.environ.clear()
        os.environ.update(env)

        if "edge_hub.config" in sys.modules:
            del sys.modules["edge_hub.config"]

        import edge_hub.config as cfg

        assert cfg.HOST == "0.0.0.0"
    finally:
        os.environ.clear()
        os.environ.update(old_env)
        if "edge_hub.config" in sys.modules:
            del sys.modules["edge_hub.config"]


def test_default_port_is_5000():
    """Default PORT value is 5000 when EDGE_PORT is not set."""
    env = os.environ.copy()
    env.pop("EDGE_PORT", None)
    env["PALAI_API_URL"] = "http://example.com"

    old_env = os.environ.copy()
    try:
        os.environ.clear()
        os.environ.update(env)

        if "edge_hub.config" in sys.modules:
            del sys.modules["edge_hub.config"]

        import edge_hub.config as cfg

        assert cfg.PORT == 5000
    finally:
        os.environ.clear()
        os.environ.update(old_env)
        if "edge_hub.config" in sys.modules:
            del sys.modules["edge_hub.config"]
