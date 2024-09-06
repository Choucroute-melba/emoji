#!/bin/bash

# Run the build script with passed arguments
node ./build.js "$@"

# Run webpack with the production configuration
npx webpack --config webpack.production.config.js && {

    # Define the files to be zipped
    files="./dist/manifest.json ./dist/build.js ./dist/assets"

    # Use the tar command to create the zip file
    pushd dist
    tar -czf ../build/emoji.zip manifest.json build.js assets/*
    popd

    # Create a zip file named emoji-src.zip with every source file except the node_modules folder
    tar -czf build/emoji-src.zip --exclude=node_modules --exclude=build --exclude=.idea --exclude=dist *
}