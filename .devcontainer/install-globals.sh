#!/bin/sh
pnpm config set global-bin-dir ~/.local/bin
pnpm config set global-dir ~/.local/share/pnpm
pnpm config list
mkdir -p ~/.local/bin
mkdir -p ~/.local/share/pnpm
pnpm add -g @anthropic-ai/claude-code