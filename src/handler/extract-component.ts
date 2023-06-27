import * as node from "vscode-languageserver/node";

import { documents, connection } from '../server'

import { BaseHandler, ContinuousOutputHandler } from "../interface/Handler";

const { textToAst, dataGenerator, modifier } = require('./utils-extract-component');

export class ExtractComponentHandler extends ContinuousOutputHandler<node.CodeAction[], node.CodeActionParams> {
    concreteHandle(prevOutput: node.CodeAction[], request: node.CodeActionParams): node.CodeAction[] {
        const document = documents.get(request.textDocument.uri)
        const text = document.getText(request.range)
        const ast = textToAst(text)
        if (ast === 6) {
            return [...prevOutput]
        }
        const { valid, specified } = dataGenerator(ast)
        if (!valid) {
            return [...prevOutput]
        }


        const codeAction: node.CodeAction = {
            title: "Extract-Component",
            kind: node.CodeActionKind.RefactorExtract,
            data: document.uri
        }

        const { newText, _range } = modifier(ast, specified)
        const newRange = {
            start: {
                line: request.range.start.line + _range.start.line,
                character: request.range.start.character + _range.start.column
            },
            end: {
                line: request.range.start.line + _range.end.line,
                character: request.range.start.character + _range.end.column
            }
        }

        const change: node.WorkspaceChange = new node.WorkspaceChange()
        const a = change.getTextEditChange(document)
        connection.window.showInformationMessage(newText);
        a.replace(newRange, newText)
        codeAction.edit = change.edit
        connection.window.showInformationMessage(JSON.stringify(codeAction));
        return [...prevOutput, codeAction]
    }
}