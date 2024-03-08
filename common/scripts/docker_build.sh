#!/bin/bash

version=$(git rev-parse HEAD)

echo "Building version: $version" 

docker build -t "$1" -t "$1:$version" .
