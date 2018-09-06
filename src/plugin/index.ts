/**
 *
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/*
 * Language service plugin implemented in this file
 *
 * Ported from https://github.com/facebook/jest/blob/
 * 45db59de5f863a7d5007c7bca925a0fc0b497440/packages/babel-plugin-jest-hoist/src/index.js
 */


import * as ts_types from 'typescript/lib/tsserverlibrary';


export = init;
function init(modules: { typescript: typeof ts_types }) {
    const ts = modules.typescript;

    function create(info: ts_types.server.PluginCreateInfo) {
        // Set up decorator
        const proxy: ts_types.LanguageService = Object.create(null);
        for(const k of Object.keys(info.languageService) as Array<keyof ts_types.LanguageService>) {
            const x = info.languageService[k];
            proxy[k] = (...args: Array<{}>) => x.apply(info.languageService, args);
        }
        proxy.getSemanticDiagnostics = (fileName: string) => {
            const sourceFile = info.languageService.getProgram().getSourceFile(fileName);
            const diagnostics = info.languageService.getSemanticDiagnostics(fileName);
            diagnostics.push({
                category: ts.DiagnosticCategory.Warning,
                code: 44444,
                file: sourceFile,
                start: 1,
                length: 5,
                messageText: 'You did something wrong!',
                source: 'ts-plugin-jest-hoist'
            });
            return diagnostics;
        }

        return proxy;
    }

    const SOMETHING_WRONG: Diagnostic = {
        code: 100,
        messageText: 'you did something wrong!',
        category: ts.DiagnosticCategory.Warning
    };

    const FORBIDDEN_VALUE_ACCESS_FROM_MOCK_FACTORY: Diagnostic = {
        category: ts.DiagnosticCategory.Warning,
        code: 101,
        messageText: 'Cannot access externally-declared values TODO'
    };

    const JEST_MOCK_SECOND_ARG_MUST_BE_INLINE_FUNCTION: Diagnostic = {
        category: ts.DiagnosticCategory.Warning,
        code: 102,
        messageText: 'The second argument of `jest.mock` must be an inline function'
    }


    return { create };
}

interface Diagnostic {
    code: number;
    messageText: string;
    category: ts_types.DiagnosticCategory;
}

// We allow `jest`, `expect`, `require`, all default Node.js globals and all
// ES2015 built-ins to be used inside of a `jest.mock` factory.
// We also allow variables prefixed with `mock` as an escape-hatch.
const WHITELISTED_IDENTIFIERS: Record<string, true> = {
    Array: true,
    ArrayBuffer: true,
    Boolean: true,
    DataView: true,
    Date: true,
    Error: true,
    EvalError: true,
    Float32Array: true,
    Float64Array: true,
    Function: true,
    Generator: true,
    GeneratorFunction: true,
    Infinity: true,
    Int16Array: true,
    Int32Array: true,
    Int8Array: true,
    InternalError: true,
    Intl: true,
    JSON: true,
    Map: true,
    Math: true,
    NaN: true,
    Number: true,
    Object: true,
    Promise: true,
    Proxy: true,
    RangeError: true,
    ReferenceError: true,
    Reflect: true,
    RegExp: true,
    Set: true,
    String: true,
    Symbol: true,
    SyntaxError: true,
    TypeError: true,
    URIError: true,
    Uint16Array: true,
    Uint32Array: true,
    Uint8Array: true,
    Uint8ClampedArray: true,
    WeakMap: true,
    WeakSet: true,
    arguments: true,
    console: true,
    expect: true,
    isNaN: true,
    jest: true,
    parseFloat: true,
    parseInt: true,
    require: true,
    undefined: true,
};
Object.keys(global).forEach(name => (WHITELISTED_IDENTIFIERS[name] = true));

function canAccessIdentifier(identifier: ts.Identifier): boolean {
    const s = (null as any as ts.Program).getTypeChecker().getSymbolAtLocation(identifier);
    // ts.SymbolFlags.
    // s!.flags
    // identifier.flags
    return false; // TESTING HACK
}

function validateJestMockCall(args: ReadonlyArray<ts.Node>) {
    function diagnostic(location: ts.Node, message: string) {/* TODO */}
    const ts: typeof ts_types = undefined as any;
    const program: ts_types.Program = undefined as any;

    function visitModuleFactoryIdentifiers(node: ts.Node) {
        if(ts.isIdentifier(node)) {
            // ids.add(node);
        }
        ts.forEachChild(node, visitModuleFactoryIdentifiers);
    }

    if(args.length === 2 || args.length === 3) {
        const moduleFactory = args[1];
        if(!ts.isFunctionExpression(moduleFactory)) {
            diagnostic(moduleFactory, JEST_MOCK_SECOND_ARG_MUST_BE_INLINE_FUNCTION);
        }
        const ids = new Set<ts.Identifier>();
        const ident: ts.Identifier;
        program.getTypeChecker().getSymbolAtLocation(ident);
        const parentScope = moduleFactory.parentPath.scope;
        // Discover all identifiers within moduleFactory
        visitModuleFactoryIdentifiers(moduleFactory);
        for(const id of ids) {
            const name = id.node.name;
            let found = false;
            let scope = id.scope;

            while(scope !== parentScope) {
                if(scope.bindings[name]) {
                    found = true;
                    break;
                }

                scope = scope.parent;
            }

            // If identifier is a reference to something declared *outside* the moduleFactory function...
            if(!found) {
                if(!(
                    (scope.hasGlobal(name) && WHITELISTED_IDENTIFIERS[name]) ||
                    /^mock/.test(name)
                )) {
                    diagnostic(
                        id, 
                        'The module factory of `jest.mock()` is not allowed to ' +
                        'reference any out-of-scope variables.\n' +
                        'Invalid variable access: ' +
                        name +
                        '\n' +
                        'Whitelisted objects: ' +
                        Object.keys(WHITELISTED_IDENTIFIERS).join(', ') +
                        '.\n' +
                        'Note: This is a precaution to guard against uninitialized mock ' +
                        'variables. If it is ensured that the mock is required lazily, ' +
                        'variable names prefixed with `mock` are permitted.'
                    );
                }
            }
        }
    }
}
