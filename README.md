2 Components: TS Language Service Plugin and TS Transformer

## Language Service Plugin: *does not work yet*

Runs within the language service in your favorite editor / IDE.  Generates useful diagnostic messages.  This will be responsible for generating the same error messages as jest's default transformer, for example when you try to access a variable that doesn't start with `mock`.  *Does not affect code emit.*

## Transformer

*works!*  Performs `jest.mock()` hoisting.  Transforms compiled code.

To see the transformer in action:

    npm install
    npm link
    cd ./sample-project
    npm install
    npm link ts-plugin-jest-hoist
    ttsc -p .

See compiled results with hoisted jest calls in foo.js
