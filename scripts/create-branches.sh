#!/bin/bash

BRANCHNAME=$1
SOURCE=$2
SOURCE="${SOURCE:-main}"

# checkout the review branch
git checkout $SOURCE
git checkout -b "feature/$BRANCHNAME-review"

# checkout the agent branch 
git checkout $SOURCE
git checkout -b "feature/$BRANCHNAME-agent"