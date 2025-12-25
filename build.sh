#!/bin/bash

# This script is for local builds.
# It gathers version information from the local .git repository
# and passes it as build arguments to the docker build command.
# It also tags the resulting image with the git tag or short SHA.

set -e

# --- Version Information ---
CI_COMMIT_TAG=$(git describe --tags --always)
CI_COMMIT_REF_NAME=$(git rev-parse --abbrev-ref HEAD)
CI_COMMIT_SHA=$(git rev-parse --verify HEAD)
CI_COMMIT_SHORT_SHA=$(git rev-parse --verify --short HEAD)

# --- Docker Image Tagging ---
IMAGE_NAME="basiscompany/tarantool-admin"
# Use git tag if on a tagged commit, otherwise use short SHA
IMAGE_TAG=$(git describe --tags --exact-match 2>/dev/null || echo "$CI_COMMIT_SHORT_SHA")

echo "Building image: $IMAGE_NAME:$IMAGE_TAG"

docker build . \
    --build-arg CI_COMMIT_TAG="$CI_COMMIT_TAG" \
    --build-arg CI_COMMIT_REF_NAME="$CI_COMMIT_REF_NAME" \
    --build-arg CI_COMMIT_SHA="$CI_COMMIT_SHA" \
    --build-arg CI_COMMIT_SHORT_SHA="$CI_COMMIT_SHORT_SHA" \
    -t "$IMAGE_NAME:$IMAGE_TAG" \
    "$@"
