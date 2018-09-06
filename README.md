2 Components: TS Language Service Plugin and TS Transformer

Tries to be a direct port of [babel-plugin-jest-hoist](https://github.com/facebook/jest/tree/master/packages/babel-plugin-jest-hoist).  If features are added to the babel transformer, they should hopefully be obvious to port here as well.

## Transformer *works!*

Transforms compiled code.  Performs `jest.mock()` hoisting.

## Language Service Plugin: *does not work yet*

https://github.com/Microsoft/TypeScript/wiki/Writing-a-Language-Service-Plugin  
TS language service loads this when it runs in your favorite editor / IDE.  Plugin generates useful diagnostic messages.  This will be responsible for generating the same error messages as jest's default transformer, for example when you try to access a variable that doesn't start with `mock`.  *Does not affect code emit.*

---

## Sample usage

Look at ["sample-project/tsconfig.json"](sample-project/tsconfig.json)

The "plugins" array is a TS built-in feature of the language service.  You can list custom plugins.  They will be loaded by the langauge service and provide useful language service features: extra diagnostics, refactoring, suggestions, code completion items, etc.  https://github.com/Microsoft/TypeScript/wiki/Writing-a-Language-Service-Plugin

The TypeScript API also allows specifying custom transformers.  However, there is no built-in way to declare these in a tsconfig.json in a simple way that should work in many different kinds of projects.

[`ttypescript`](https://github.com/cevek/ttypescript) solves this problem.  It is a wrapper around `typescript` that allows specifying custom transformers in your tsconfig's "plugins" array.  *Plus*, it *also* lets tools like ts-jest use the API to specify additional transformers.  In other words, tools that use the programmatic API are unaffected.  *Both* programmatic and tsconfig transformers are applied.  `ttypescript` is a drop-in enhancement that allows end-users to specify their own transformers *even when* using something like ts-jest that may specify its own built-in transformers.  Plus, `ttypescript` can be used via API or CLI (`ttsc`) and offers the same features in both situations.

For this demo, we are using `ttypescript` as a simple way to demonstrate our transformer.  Ideally, ts-jest should declare an npm dependency on this transformer and automatically apply it via the API.

---

To see the transformer in action:

    npm install
    npm link
    cd ./sample-project
    npm install
    npm link ts-plugin-jest-hoist
    ttsc -p .

See compiled results with hoisted jest calls in foo.js
