#!/bin/bash

BRANCH="gh-pages"
BUILD_FOLDER=_build
REPOSITORY=git@github.com:treeskar/html-console.git
NOW=$(date +"%H:%m %d.%m.%Y")

echo "Downloading $BRANCH branch..."

# clean _build folder
rm -rf $BUILD_FOLDER

# clone repository
git clone --quiet -b $BRANCH $REPOSITORY $BUILD_FOLDER
success=$?

if [[ $success -eq 0 ]]; then
    echo "Repository successfully cloned."
else
    echo "$(tput setaf 1)Can't clone "$BRANCH" :( $(tput setaf 7)"
    exit 0
fi

echo "Building..."

webpack

# Get version
VERSION=$(jq -r ".version" package.json)

cp -a build/. $BUILD_FOLDER/

cd $BUILD_FOLDER

git add --all
git commit -m ":ship: build v. $VERSION at $NOW"

# push build to github.com

echo -e "\nPush build to $REPOSITORY\n"
git push origin gh-pages

# clean build folder
cd ../
rm -rf $BUILD_FOLDER

# Commit bump version
git add package.json
git commit -m ":ship: version bump to $VERSION by deploy script"

if [ -n "$(git status --porcelain)" ]; then
  echo "There are changes, so please commit them and than push your changes to origin";
  git status --porcelain
else
  git push origin master
fi

echo 'Build end'
