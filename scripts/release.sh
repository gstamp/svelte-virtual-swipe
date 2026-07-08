#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PKGDIR="$ROOT/packages/swipe"
SCRIPT="$(basename "$0")"

RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

usage() {
	cat <<-EOF
	Usage: $SCRIPT <patch|minor|major>

	Bumps the version of svelte-virtual-swipe and publishes to npm.
	Must be run from the repository root.
	EOF
	exit 1
}

# --- argument ---
RELEASE_TYPE="${1:-}"
case "$RELEASE_TYPE" in
	patch|minor|major) ;;
	*) usage ;;
esac

# --- check logged in ---
echo "→ Checking npm login status..."
if ! npm whoami &>/dev/null; then
	echo -e "${RED}✗ Not logged in to npm. Run \`npm login\` first.${NC}"
	exit 1
fi
USER="$(npm whoami)"
echo -e "${GREEN}✓ Logged in as ${USER}${NC}"

# --- ensure clean working tree ---
if [ -n "$(git status --porcelain)" ]; then
	echo -e "${RED}✗ Working tree is dirty. Commit or stash changes first.${NC}"
	exit 1
fi

# --- run tests ---
echo "→ Running tests..."
(cd "$ROOT" && pnpm --filter=svelte-virtual-swipe test)
echo -e "${GREEN}✓ Tests pass${NC}"

# --- build ---
echo "→ Building..."
(cd "$ROOT" && pnpm build)
echo -e "${GREEN}✓ Build complete${NC}"

# --- bump version & tag ---
echo "→ Bumping $RELEASE_TYPE version..."
(cd "$PKGDIR" && npm version "$RELEASE_TYPE")
echo -e "${GREEN}✓ Version bumped${NC}"

# --- push tag ---
TAG="$(cd "$PKGDIR" && node -p "require('./package.json').version")"
TAG_NAME="v$TAG"
echo "→ Pushing tag $TAG_NAME..."
git push origin "$TAG_NAME"
echo -e "${GREEN}✓ Tag pushed${NC}"

# --- publish ---
echo "→ Publishing to npm..."
(cd "$PKGDIR" && npm publish --access public)
echo -e "${GREEN}✓ Published svelte-virtual-swipe@$TAG${NC}"

echo ""
echo -e "${GREEN}Release complete: svelte-virtual-swipe@$TAG${NC}"
