import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import strip from 'strip-comments';

async function scanFilesAndReplaceImportExportWords(
  directoryPath: string
): Promise<void> {
  const importExportToSearchArr: RegExp[] = [
    /const ([\w#\{\}\s\,]+) = require\(((\"|\')[^;]+(\"|\'))\);/g,
    /const ([\w#\{\}\s\,]+) = require\(((\"|\')[^;]+(\"|\'))\)\.([\w#]+);/g,
    /require\(((\"|\')([^;\'\"]+)(\"|\'))\)\.([\w#]+)\(\)/g,
    /module.exports =([^{}]+);/s,
    /module.exports =([\s\t\r\n]*)\{(.+)\}/s,
    /module.exports =([\s\t\r\n]*)class([\s\t\r\n]+)([\w#]+)([\s\t\r\n]*)\{(.+)\}/s
  ];
  const replacementImportExportArr: string[] = [
    "import $1 from $2;",
    "import { $5 as $1 } from $2;",
    "import $3 from $1;\n$3.$5()",
    "export default $1;",
    "export { $2 }",
    "export default class $3 { $5 }"
  ];

  const files: string[] = await fs.promises.readdir(directoryPath);
  for (const file of files) {
    const filePath: string = path.join(directoryPath, file);
    if (filePath.includes('node_modules') || filePath.includes('migrations') || filePath.includes("seeders") || filePath.includes('tests')) {
      continue; // Skip processing folder 'node_modules', 'migrations', 'seeders', 'tests'
    }
    const stats: fs.Stats = await fs.promises.stat(filePath);

    if (stats.isDirectory()) {
      await scanFilesAndReplaceImportExportWords(filePath); // Recursively scan subdirectory
    } else if (stats.isFile()) {
      if (
        !/(.*)\.js$/.test(filePath) ||
        /(.*)\.test\.js$/.test(filePath) ||
        /(.*)\.config\.js$/.test(filePath)
      ) {
        continue;
      }
      const content: string = await fs.promises.readFile(filePath, 'utf8');

      let replacedContent: string = content;
      for (let i = 0; i < importExportToSearchArr.length; i++) {
        replacedContent = replacedContent.replace(
          importExportToSearchArr[i],
          replacementImportExportArr[i]
        );
      }

      if (replacedContent !== content) {
        await fs.promises.writeFile(filePath, replacedContent, 'utf8');
        console.log(
          `Replaced words(importing and exporting) in file: ${filePath}`
        );
        execSync(`npx prettier ${filePath} --write`);
      }
    }
  }
}

async function scanFilesAndReplaceImportWords(
  directoryPath: string
): Promise<void> {
  const importToSearchArr: RegExp[] = [
    /const ([\w#\{\}\s\,]+) = require\(((\"|\')[^;]+(\"|\'))\);/g,
    /const ([\w#\{\}\s\,]+) = require\(((\"|\')[^;]+(\"|\'))\)\.([\w#]+);/g,
    /require\(((\"|\')([^;\'\"]+)(\"|\'))\)\.([\w#]+)\(\)/g
  ];
  const replacementImportArr: string[] = [
    "import $1 from $2;",
    "import { $3 } from $2;",
    "import $3 from $1;\n$3.$5()"
  ];

  const files: string[] = await fs.promises.readdir(directoryPath);
  for (const file of files) {
    const filePath: string = path.join(directoryPath, file);
    if (filePath.includes('node_modules') || filePath.includes('tests')) {
      continue; // Skip processing folder 'node_modules', 'tests'
    }
    const stats: fs.Stats = await fs.promises.stat(filePath);

    if (stats.isDirectory()) {
      await scanFilesAndReplaceImportWords(filePath); // Recursively scan subdirectory
    } else if (stats.isFile()) {
      if (
        !/(.*)\.js$/.test(filePath) ||
        /(.*)\.test\.js$/.test(filePath) ||
        /(.*)\.config\.js$/.test(filePath)
      ) {
        continue;
      }
      const content: string = await fs.promises.readFile(filePath, 'utf8');
      let replacedContent: string = content;
      for (let i = 0; i < importToSearchArr.length; i++) {
        replacedContent = replacedContent.replace(
          importToSearchArr[i],
          replacementImportArr[i]
        );
      }

      if (replacedContent !== content) {
        await fs.promises.writeFile(filePath, replacedContent, 'utf8');
        console.log(
          `Replaced words(importing) in file: ${filePath}`
        );
        execSync(`npx prettier ${filePath} --write`);
      }
    }
  }
}

async function scanFilesAndModifyStaticFunctions(
  directoryPath: string
): Promise<void> {
  const classNameToSearch: RegExp =
    /class([\s\t]+)([\w]+)([\s\t]*){([\s\t]*)}/g;
  const files: string[] = await fs.promises.readdir(directoryPath);
  for (const file of files) {
    const filePath: string = path.join(directoryPath, file);
    if (filePath.includes('node_modules') || filePath.includes('migrations') || filePath.includes('tests')) {
      continue; // Skip processing folder 'node_modules', 'migrations', 'tests'
    }
    const stats: fs.Stats = await fs.promises.stat(filePath);

    if (stats.isDirectory()) {
      await scanFilesAndModifyStaticFunctions(filePath); // Recursively scan subdirectory
    } else if (stats.isFile()) {
      if (
        !/(.*)\.js$/.test(filePath) ||
        /(.*)\.test\.js$/.test(filePath) ||
        /(.*)\.config\.js$/.test(filePath)
      ) {
        continue;
      }
      const content: string = await fs.promises.readFile(filePath, 'utf8');

      let replacedContent: string = content;

      let arrMatches: RegExpExecArray | null;
      if ((arrMatches = classNameToSearch.exec(content)) !== null) {
        let classNameStartingIndex: number = arrMatches.index;
        let classNameEndingIndex: number = classNameToSearch.lastIndex;
        let classNameFull: string = content.substring(
          classNameStartingIndex,
          classNameEndingIndex
        );
        //start modifying
        const classNameWithFunctionRegex: RegExp =
          /([\w\d]+)\.([\w#]+)([\s\t]*)=([\s\t]*)((async)*)([\s\t]*)\(([\w\,\s\t]+)\)([\s\t]*)=>([\s\t]*)\{/g;

        let contentArr: string[] = [];
        let functionHeaderArr: string[] = [];
        let arrClassNameWithFunctionMatches: RegExpExecArray | null;
        while (
          (arrClassNameWithFunctionMatches =
            classNameWithFunctionRegex.exec(content)) !== null
        ) {
          functionHeaderArr.push(arrClassNameWithFunctionMatches[0]);
          contentArr.push(
            arrClassNameWithFunctionMatches[0] +
              content.substring(classNameWithFunctionRegex.lastIndex)
          );
        }

        let functionArr: string[] = [];
        if (contentArr.length > 0) {
          for (let i: number = 0; i < contentArr.length; i++) {
            let text: string = contentArr[i];
            const openingBracketIndex: number = text.indexOf('{'); // Find the index of the first opening curly bracket
            let count: number = 1; // Track the number of nested brackets
            let closingBracketIndex: number = -1; // Initialize the index of the closing bracket

            for (
              let j: number = openingBracketIndex + 1;
              j < text.length;
              j++
            ) {
              if (text[j] === '{') {
                count++; // Increment the count for nested opening brackets
              } else if (text[j] === '}') {
                count--; // Decrement the count for closing brackets
                if (count === 0) {
                  closingBracketIndex = j; // Found the matching closing bracket
                  break;
                }
              }
            }

            functionArr.push(
              functionHeaderArr[i] +
                text.substring(openingBracketIndex + 1, closingBracketIndex + 2)
            );
          }
        }

        //delete these functions first in content since we already copied to our functionArr
        functionArr.forEach((func: string) => {
          const escapedWord: string = escapeRegExp(func);
          replacedContent = replacedContent.replace(
            new RegExp(escapedWord, 'g'),
            ''
          );
        });
        //paste in inside class ... {} with static in front of the function name
        let classNameFullIndexOfClosingBracket: number =
          classNameFull.indexOf('}');
        let classNameFullIndexOfClosingBracketInReplacedContent: number =
          classNameStartingIndex + classNameFullIndexOfClosingBracket;
        //putting the words in between
        let filledUpWords: string = '';
        functionArr.forEach((func: string) => {
          let funcNameIndex: number = func.indexOf('.') + 1;
          filledUpWords += '\nstatic ' + func.substring(funcNameIndex);
        });

        replacedContent =
          replacedContent.substring(
            0,
            classNameFullIndexOfClosingBracketInReplacedContent
          ) +
          filledUpWords +
          replacedContent.substring(
            classNameFullIndexOfClosingBracketInReplacedContent
          );

        if (replacedContent !== content) {
          await fs.promises.writeFile(filePath, replacedContent, 'utf8');
          console.log(`Replaced words(static functions) in file: ${filePath}`);
          execSync(`npx prettier ${filePath} --write`);
        }
      }
    }
  }
}

async function deleteComments(directoryPath: string): Promise<void> {
  const files: string[] = await fs.promises.readdir(directoryPath);
  for (const file of files) {
    const filePath: string = path.join(directoryPath, file);
    if (filePath.includes('node_modules') || filePath.includes('migrations') || filePath.includes('tests')) {
      continue; // Skip processing folder 'node_modules', 'migrations', 'tests'
    }
    const stats: fs.Stats = await fs.promises.stat(filePath);

    if (stats.isDirectory()) {
      await deleteComments(filePath); // Recursively scan subdirectory
    } else if (stats.isFile()) {
      if (
        !/(.*)\.js$/.test(filePath) ||
        /(.*)\.test\.js$/.test(filePath) ||
        /(.*)\.config\.js$/.test(filePath)
      ) {
        continue;
      }
      const content: string = await fs.promises.readFile(filePath, 'utf8');

      let replacedContent: string = content;
      replacedContent = strip(replacedContent);
      if (replacedContent !== content) {
        await fs.promises.writeFile(filePath, replacedContent, 'utf8');
        console.log(`Replaced comments with nothing in file: ${filePath}`);
        execSync(`npx prettier ${filePath} --write`);
      }
    }
  }
}

function escapeRegExp(string: string): string {
    return string.replace(/[.*+\-?^${}()|[\]\\]/g, "\\$&"); // Escape special characters
}

async function fixImportExportStaticFunctionsComments(
  directoryPath: string
): Promise<void> {
  await scanFilesAndReplaceImportExportWords(directoryPath);
  console.log('=========================================');
  await scanFilesAndReplaceImportWords(directoryPath);
  console.log('=========================================');
  await scanFilesAndModifyStaticFunctions(directoryPath);
  console.log('=========================================');
  await deleteComments(directoryPath);
  console.log('=========================================');
}
export { fixImportExportStaticFunctionsComments };
