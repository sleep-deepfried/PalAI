import os
import sys

PALAI_API_URL = os.environ.get("PALAI_API_URL")
HOST = os.environ.get("EDGE_HOST", "0.0.0.0")
PORT = int(os.environ.get("EDGE_PORT", "5000"))
CORS_ORIGINS = os.environ.get("CORS_ORIGINS", "*")

if not PALAI_API_URL:
    print("ERROR: PALAI_API_URL environment variable is required.", file=sys.stderr)
    sys.exit(1)
