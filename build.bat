@echo off

node .\build.js %*
if %errorLevel% neq 0 (
    echo "Build failed"
    exit /b %errorLevel%
)

npx webpack --config webpack.production.config.js && (
    REM Define the files to be zipped
    set files=.\dist\manifest.json .\dist\build.js .\dist\assets

    REM Use the tar command to create the zip file
    pushd dist
    tar -a -c -f ..\build\emoji-%2.zip manifest.json build.js assets\*
    popd

    REM Create a zip file named witch-src.zip with every source files except the node_modules folder
    tar -a -c -f build\emoji-src-%2.zip --exclude=node_modules --exclude=build --exclude=.idea --exclude=dist *

    REM Check if -v argument is provided
    echo %* | findstr /r /c:"-v" >nul
    if %errorLevel% equ 0 (
        git add *
        git commit -m "build v-%2"
        git tag v-%2
        git push
        git push --tags
    )
)
