# Release Artifacts — v1.0.0

This folder is a placeholder for **generated** release artifacts. Nothing here is committed to
Git except this README; artifacts are produced on demand and attached to the GitHub Release.

TahfidzFlow ships as **source** and is built on Vercel (`npm ci && npm run build`). There is no
committed build output. The primary artifact is a reproducible source archive of exactly the
Git-tracked files at the release commit.

## Produce the source archive

From the repository root at the release commit (`94ee97b`, tag `v1.0.0`):

```bash
# App + docs source archive (all tracked files, respects .gitignore)
git archive --format=tar.gz --prefix=tahfidzflow-1.0.0/ -o tahfidzflow-1.0.0.tar.gz HEAD

# Optional: exclude the legacy Python bot for an app-only archive
git archive --format=tar.gz --prefix=tahfidzflow-1.0.0/ -o tahfidzflow-1.0.0-app.tar.gz HEAD -- . ':(exclude)legacy-bot'
```

## Verify the archive before distributing

```bash
# List archive contents
tar -tzf tahfidzflow-1.0.0.tar.gz | sort

# Confirm forbidden paths are absent (should print nothing)
tar -tzf tahfidzflow-1.0.0.tar.gz | grep -E '(^|/)(\.env($|\.)|node_modules/|\.next/|src/generated/)' || echo "clean"

# Record a checksum to attach alongside the archive
sha256sum tahfidzflow-1.0.0.tar.gz > tahfidzflow-1.0.0.tar.gz.sha256
```

## Attach to the GitHub Release

1. Create tag `v1.0.0` and the GitHub Release using `../RELEASE_NOTES.md` as the body.
2. Upload `tahfidzflow-1.0.0.tar.gz` and its `.sha256` checksum as release assets.

> Do not commit the generated `.tar.gz` / `.sha256` files into the repository. Keep them as
> release assets only.
