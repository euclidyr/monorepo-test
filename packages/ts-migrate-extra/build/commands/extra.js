"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fixImportExportStaticFunctionsComments = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const child_process_1 = require("child_process");
const strip_comments_1 = __importDefault(require("strip-comments"));
async function scanFilesAndReplaceImportExportWords(directoryPath) {
    const importExportToSearchArr = [
        /const ([\w#\{\}\s\,]+) = require\(((\"|\')[^;]+(\"|\'))\);/g,
        /const ([\w#\{\}\s\,]+) = require\(((\"|\')[^;]+(\"|\'))\)\.([\w#]+);/g,
        /require\(((\"|\')([^;\'\"]+)(\"|\'))\)\.([\w#]+)\(\)/g,
        /module.exports =([^{}]+);/s,
        /module.exports =([\s\t\r\n]*)\{(.+)\}/s,
        /module.exports =([\s\t\r\n]*)class([\s\t\r\n]+)([\w#]+)([\s\t\r\n]*)\{(.+)\}/s
    ];
    const replacementImportExportArr = [
        "import $1 from $2;",
        "import { $5 as $1 } from $2;",
        "import $3 from $1;\n$3.$5()",
        "export default $1;",
        "export { $2 }",
        "export default class $3 { $5 }"
    ];
    const files = await fs.promises.readdir(directoryPath);
    for (const file of files) {
        const filePath = path.join(directoryPath, file);
        if (filePath.includes('node_modules') || filePath.includes('migrations') || filePath.includes("seeders") || filePath.includes('tests')) {
            continue; // Skip processing folder 'node_modules', 'migrations', 'seeders', 'tests'
        }
        const stats = await fs.promises.stat(filePath);
        if (stats.isDirectory()) {
            await scanFilesAndReplaceImportExportWords(filePath); // Recursively scan subdirectory
        }
        else if (stats.isFile()) {
            if (!/(.*)\.js$/.test(filePath) ||
                /(.*)\.test\.js$/.test(filePath) ||
                /(.*)\.config\.js$/.test(filePath)) {
                continue;
            }
            const content = await fs.promises.readFile(filePath, 'utf8');
            let replacedContent = content;
            for (let i = 0; i < importExportToSearchArr.length; i++) {
                replacedContent = replacedContent.replace(importExportToSearchArr[i], replacementImportExportArr[i]);
            }
            if (replacedContent !== content) {
                await fs.promises.writeFile(filePath, replacedContent, 'utf8');
                console.log(`Replaced words(importing and exporting) in file: ${filePath}`);
                (0, child_process_1.execSync)(`npx prettier ${filePath} --write`);
            }
        }
    }
}
async function scanFilesAndReplaceImportWords(directoryPath) {
    const importToSearchArr = [
        /const ([\w#\{\}\s\,]+) = require\(((\"|\')[^;]+(\"|\'))\);/g,
        /const ([\w#\{\}\s\,]+) = require\(((\"|\')[^;]+(\"|\'))\)\.([\w#]+);/g,
        /require\(((\"|\')([^;\'\"]+)(\"|\'))\)\.([\w#]+)\(\)/g
    ];
    const replacementImportArr = [
        "import $1 from $2;",
        "import { $3 } from $2;",
        "import $3 from $1;\n$3.$5()"
    ];
    const files = await fs.promises.readdir(directoryPath);
    for (const file of files) {
        const filePath = path.join(directoryPath, file);
        if (filePath.includes('node_modules') || filePath.includes('tests')) {
            continue; // Skip processing folder 'node_modules', 'tests'
        }
        const stats = await fs.promises.stat(filePath);
        if (stats.isDirectory()) {
            await scanFilesAndReplaceImportWords(filePath); // Recursively scan subdirectory
        }
        else if (stats.isFile()) {
            if (!/(.*)\.js$/.test(filePath) ||
                /(.*)\.test\.js$/.test(filePath) ||
                /(.*)\.config\.js$/.test(filePath)) {
                continue;
            }
            const content = await fs.promises.readFile(filePath, 'utf8');
            let replacedContent = content;
            for (let i = 0; i < importToSearchArr.length; i++) {
                replacedContent = replacedContent.replace(importToSearchArr[i], replacementImportArr[i]);
            }
            if (replacedContent !== content) {
                await fs.promises.writeFile(filePath, replacedContent, 'utf8');
                console.log(`Replaced words(importing) in file: ${filePath}`);
                (0, child_process_1.execSync)(`npx prettier ${filePath} --write`);
            }
        }
    }
}
async function scanFilesAndModifyStaticFunctions(directoryPath) {
    const classNameToSearch = /class([\s\t]+)([\w]+)([\s\t]*){([\s\t]*)}/g;
    const files = await fs.promises.readdir(directoryPath);
    for (const file of files) {
        const filePath = path.join(directoryPath, file);
        if (filePath.includes('node_modules') || filePath.includes('migrations') || filePath.includes('tests')) {
            continue; // Skip processing folder 'node_modules', 'migrations', 'tests'
        }
        const stats = await fs.promises.stat(filePath);
        if (stats.isDirectory()) {
            await scanFilesAndModifyStaticFunctions(filePath); // Recursively scan subdirectory
        }
        else if (stats.isFile()) {
            if (!/(.*)\.js$/.test(filePath) ||
                /(.*)\.test\.js$/.test(filePath) ||
                /(.*)\.config\.js$/.test(filePath)) {
                continue;
            }
            const content = await fs.promises.readFile(filePath, 'utf8');
            let replacedContent = content;
            let arrMatches;
            if ((arrMatches = classNameToSearch.exec(content)) !== null) {
                let classNameStartingIndex = arrMatches.index;
                let classNameEndingIndex = classNameToSearch.lastIndex;
                let classNameFull = content.substring(classNameStartingIndex, classNameEndingIndex);
                //start modifying
                const classNameWithFunctionRegex = /([\w\d]+)\.([\w#]+)([\s\t]*)=([\s\t]*)((async)*)([\s\t]*)\(([\w\,\s\t]+)\)([\s\t]*)=>([\s\t]*)\{/g;
                let contentArr = [];
                let functionHeaderArr = [];
                let arrClassNameWithFunctionMatches;
                while ((arrClassNameWithFunctionMatches =
                    classNameWithFunctionRegex.exec(content)) !== null) {
                    functionHeaderArr.push(arrClassNameWithFunctionMatches[0]);
                    contentArr.push(arrClassNameWithFunctionMatches[0] +
                        content.substring(classNameWithFunctionRegex.lastIndex));
                }
                let functionArr = [];
                if (contentArr.length > 0) {
                    for (let i = 0; i < contentArr.length; i++) {
                        let text = contentArr[i];
                        const openingBracketIndex = text.indexOf('{'); // Find the index of the first opening curly bracket
                        let count = 1; // Track the number of nested brackets
                        let closingBracketIndex = -1; // Initialize the index of the closing bracket
                        for (let j = openingBracketIndex + 1; j < text.length; j++) {
                            if (text[j] === '{') {
                                count++; // Increment the count for nested opening brackets
                            }
                            else if (text[j] === '}') {
                                count--; // Decrement the count for closing brackets
                                if (count === 0) {
                                    closingBracketIndex = j; // Found the matching closing bracket
                                    break;
                                }
                            }
                        }
                        functionArr.push(functionHeaderArr[i] +
                            text.substring(openingBracketIndex + 1, closingBracketIndex + 2));
                    }
                }
                //delete these functions first in content since we already copied to our functionArr
                functionArr.forEach((func) => {
                    const escapedWord = escapeRegExp(func);
                    replacedContent = replacedContent.replace(new RegExp(escapedWord, 'g'), '');
                });
                //paste in inside class ... {} with static in front of the function name
                let classNameFullIndexOfClosingBracket = classNameFull.indexOf('}');
                let classNameFullIndexOfClosingBracketInReplacedContent = classNameStartingIndex + classNameFullIndexOfClosingBracket;
                //putting the words in between
                let filledUpWords = '';
                functionArr.forEach((func) => {
                    let funcNameIndex = func.indexOf('.') + 1;
                    filledUpWords += '\nstatic ' + func.substring(funcNameIndex);
                });
                replacedContent =
                    replacedContent.substring(0, classNameFullIndexOfClosingBracketInReplacedContent) +
                        filledUpWords +
                        replacedContent.substring(classNameFullIndexOfClosingBracketInReplacedContent);
                if (replacedContent !== content) {
                    await fs.promises.writeFile(filePath, replacedContent, 'utf8');
                    console.log(`Replaced words(static functions) in file: ${filePath}`);
                    (0, child_process_1.execSync)(`npx prettier ${filePath} --write`);
                }
            }
        }
    }
}
async function deleteComments(directoryPath) {
    const files = await fs.promises.readdir(directoryPath);
    for (const file of files) {
        const filePath = path.join(directoryPath, file);
        if (filePath.includes('node_modules') || filePath.includes('migrations') || filePath.includes('tests')) {
            continue; // Skip processing folder 'node_modules', 'migrations', 'tests'
        }
        const stats = await fs.promises.stat(filePath);
        if (stats.isDirectory()) {
            await deleteComments(filePath); // Recursively scan subdirectory
        }
        else if (stats.isFile()) {
            if (!/(.*)\.js$/.test(filePath) ||
                /(.*)\.test\.js$/.test(filePath) ||
                /(.*)\.config\.js$/.test(filePath)) {
                continue;
            }
            const content = await fs.promises.readFile(filePath, 'utf8');
            let replacedContent = content;
            replacedContent = (0, strip_comments_1.default)(replacedContent);
            if (replacedContent !== content) {
                await fs.promises.writeFile(filePath, replacedContent, 'utf8');
                console.log(`Replaced comments with nothing in file: ${filePath}`);
                (0, child_process_1.execSync)(`npx prettier ${filePath} --write`);
            }
        }
    }
}
function escapeRegExp(string) {
    return string.replace(/[.*+\-?^${}()|[\]\\]/g, "\\$&"); // Escape special characters
}
async function fixImportExportStaticFunctionsComments(directoryPath) {
    await scanFilesAndReplaceImportExportWords(directoryPath);
    console.log('=========================================');
    await scanFilesAndReplaceImportWords(directoryPath);
    console.log('=========================================');
    await scanFilesAndModifyStaticFunctions(directoryPath);
    console.log('=========================================');
    await deleteComments(directoryPath);
    console.log('=========================================');
}
exports.fixImportExportStaticFunctionsComments = fixImportExportStaticFunctionsComments;
//# sourceMappingURL=extra.js.map