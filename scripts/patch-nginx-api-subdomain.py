#!/usr/bin/env python3
"""Add api.arcanyx.ru to nginx for Arcanyx (CDN origin + certbot). Run on VPS as root."""
from __future__ import annotations

from pathlib import Path

p = Path("/etc/nginx/sites-enabled/arcanyx.ru")
if not p.is_file():
    raise SystemExit(f"Missing {p}")

text = p.read_text()
marker = "api.arcanyx.ru"

if marker in text:
    print("api.arcanyx.ru already present in nginx config")
else:
    old_name = "server_name arcanyx.ru www.arcanyx.ru;"
    new_name = "server_name arcanyx.ru www.arcanyx.ru api.arcanyx.ru;"
    count = text.count(old_name)
    if count == 0:
        raise SystemExit(f"Expected line {old_name!r} not found ({count} matches)")
    text = text.replace(old_name, new_name)

    api_http = """
server {
    listen 80;
    listen [::]:80;
    server_name api.arcanyx.ru;

    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Connection "";
        proxy_read_timeout 30;
        proxy_connect_timeout 5;
        proxy_send_timeout 30;
    }
}

"""
    certbot_block = "server {\n    if ($host = www.arcanyx.ru)"
    if certbot_block not in text:
        raise SystemExit("Certbot HTTP block not found")
    text = text.replace(certbot_block, api_http + certbot_block, 1)
    p.write_text(text)
    print("nginx api.arcanyx.ru patched")
