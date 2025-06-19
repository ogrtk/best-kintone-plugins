FROM mcr.microsoft.com/devcontainers/base:bookworm

SHELL ["/bin/bash", "-c"]

RUN apt update \
  && apt install -y curl gnupg2

# Node.js 公式のDebian用セットアップ（LTS版: v20系をインストール）
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
  && apt install -y nodejs

# バージョン確認 (オプション)
RUN node -v && npm -v

# corepack有効化 + pnpmインストール + symlink作成
RUN corepack enable \
  && corepack prepare pnpm@8.15.4 --activate \
  && corepack enable pnpm

USER vscode
