/**
 *
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/*
 * Typescript transformer implemented in this file
 *
 * Ported from https://github.com/facebook/jest/blob/
 * 45db59de5f863a7d5007c7bca925a0fc0b497440/packages/babel-plugin-jest-hoist/src/index.js
 */

import * as ts from 'typescript';
import {PluginConfig} from 'ttypescript/lib/PluginCreator';

function invariant(condition: any, message: string) {
  if (!condition) {
    throw new Error('ts-transformer-jest-hoist: ' + message);
  }
}

const JEST_GLOBAL = { name: 'jest' };

const disableEnableAutomock = (args: ts.NodeArray<ts.Expression>, program: ts.Program) =>
  args.length === 0;

const _FUNCTIONS = {
  mock: (args: ts.NodeArray<ts.Expression>, program: ts.Program) => {
    if (args.length === 1) {
      return ts.isStringLiteral(args[0]) || ts.isLiteralExpression(args[0]);
    } else if (args.length === 2 || args.length === 3) {
      return true;
    }
    return false;
  },

  unmock: (args: ts.NodeArray<ts.Expression>, program: ts.Program) => args.length === 1 && ts.isStringLiteral(args[0]),
  deepUnmock: (args: ts.NodeArray<ts.Expression>, program: ts.Program) => args.length === 1 && ts.isStringLiteral(args[0]),

  disableAutomock: disableEnableAutomock,

  enableAutomock: disableEnableAutomock,
};
const FUNCTIONS: typeof _FUNCTIONS = Object.assign(Object.create(null), _FUNCTIONS);

function shouldHoistStatement(stmt: ts.Statement, program: ts.Program): boolean {
  if (!ts.isExpressionStatement(stmt)) {
    return false;
  }
  const expr = stmt.expression;
  if (!ts.isCallExpression(expr)) {
    return false;
  }
  const propAccessExpression = expr.expression;
  if (!ts.isPropertyAccessExpression(propAccessExpression)) {
    return false;
  }
  const { expression, name } = propAccessExpression;
  if (!ts.isIdentifier(expression) || !ts.isIdentifier(name)) {
    return false;
  }
  console.log(expression.getText());
  console.log(name.getText());
  if (expression.getText() !== JEST_GLOBAL.name) {
    return false;
  }
  const validatorFunction = (FUNCTIONS as Record<string, undefined | typeof FUNCTIONS[keyof typeof FUNCTIONS]>)[name.getText()];
  if (!validatorFunction) {
    return false;
  }
  return validatorFunction(expr.arguments, program);
}

export function createTransformer(context: ts.TransformationContext, program: ts.Program) {
  return transformer;
  function transformer(file: ts.SourceFile) {
    const hoistedStatements: ts.Statement[] = [];
    const nonHoistedStatements: ts.Statement[] = [];

    console.log('visiting children of ' + file.kind);
    console.log(ts.SyntaxKind.SourceFile);
    ts.visitEachChild(file, (childNode) => visitSourceFileChild(childNode, context), context);

    if (!hoistedStatements.length) {
      return file;
    }

    // perform hoisting
    const newFile = ts.getMutableClone(file);
    newFile.statements = ts.setTextRange(
      ts.createNodeArray([...hoistedStatements, ...nonHoistedStatements]),
      newFile.statements,
    );
    return newFile;

    /** Visit each direct child of SourceFile to see if it should be hoisted */
    function visitSourceFileChild(childNode: ts.Node, ctx: ts.TransformationContext) {
      const statement = childNode as ts.Statement;
      console.log(statement.getText());
      if (shouldHoistStatement(statement, program)) {
        hoistedStatements.push(statement);
      } else {
        nonHoistedStatements.push(statement);
      }
      return childNode;
    }
  }
}

export interface TransformerOptions extends PluginConfig {}

export function createTransformerFactory(program: ts.Program, opts: TransformerOptions) {
    return function(context: ts.TransformationContext) {
        return createTransformer(context, program);
    }
}

export default createTransformerFactory;
