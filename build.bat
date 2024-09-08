@echo off

node .\build.js %*
if %errorLevel% neq 0 (
    echo "Build failed"
    exit /b %errorLevel%
)

CALL npx webpack --config webpack.production.config.js
echo "webpack finished with code %errorlevel%"
if %errorlevel% neq 0 (
    echo "Webpack build failed"
    exit /b %errorLevel%
)
echo "Build successful"

REM Define the files to be zipped
set files=.\dist\manifest.json .\dist\build.js .\dist\assets

REM Use the tar command to create the zip file
pushd dist
tar -a -c -f ..\build\emoji-%2.zip manifest.json build.js assets\*
popd
echo "asset 1 created"

REM Create a zip file named witch-src.zip with every source files except the node_modules folder
tar -a -c -f build\emoji-src-%2.zip --exclude=node_modules --exclude=build --exclude=.idea --exclude=dist *
echo "asset 2 created"

REM Check if -v argument is provided
echo %* | findstr /r /c:"-v" >nul
if %errorlevel% equ 0 (
    REM git
    git add *
    git commit -m "build v-%2"
    git tag v-%2
    git push
    git push --tags
)
