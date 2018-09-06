Note: The plugin is a work in progress and does not work right now!  The transformer *does* work.

To see the transformer in action:

    npm install
    npm link
    cd ./sample-project
    npm install
    npm link ts-plugin-jest-hoist
    ttsc -p .

See compiled results with hoisted jest calls in foo.js
