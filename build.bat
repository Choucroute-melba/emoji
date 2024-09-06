
node .\build.js %*
npx webpack --config webpack.production.config.js && (
    REM Define the files to be zipped
    set files=.\dist\manifest.json .\dist\build.js .\dist\assets

    REM Use the tar command to create the zip file
    pushd dist
    tar -a -c -f ..\build\emoji.zip manifest.json build.js assets\*
    popd

    REM Create a zip file named witch-src.zip with every source files except the node_modules folder
    tar -a -c -f build\emoji-src.zip --exclude=node_modules --exclude=build --exclude=.idea --exclude=dist *
)
