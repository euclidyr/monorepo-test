#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/* eslint-disable no-await-in-loop, no-restricted-syntax */
const path_1 = __importDefault(require("path"));
const updatable_log_1 = __importDefault(require("updatable-log"));
const yargs_1 = __importDefault(require("yargs"));
const ts_migrate_plugins_1 = require("ts-migrate-plugins");
const ts_migrate_server_1 = require("ts-migrate-server");
const init_1 = __importDefault(require("./commands/init"));
const rename_1 = __importDefault(require("./commands/rename"));
const extra_1 = require("./commands/extra");
const availablePlugins = [
    ts_migrate_plugins_1.addConversionsPlugin,
    ts_migrate_plugins_1.declareMissingClassPropertiesPlugin,
    ts_migrate_plugins_1.eslintFixPlugin,
    ts_migrate_plugins_1.explicitAnyPlugin,
    ts_migrate_plugins_1.hoistClassStaticsPlugin,
    ts_migrate_plugins_1.jsDocPlugin,
    ts_migrate_plugins_1.memberAccessibilityPlugin,
    ts_migrate_plugins_1.reactClassLifecycleMethodsPlugin,
    ts_migrate_plugins_1.reactClassStatePlugin,
    ts_migrate_plugins_1.reactDefaultPropsPlugin,
    ts_migrate_plugins_1.reactPropsPlugin,
    ts_migrate_plugins_1.reactShapePlugin,
    ts_migrate_plugins_1.stripTSIgnorePlugin,
    ts_migrate_plugins_1.tsIgnorePlugin,
];
// eslint-disable-next-line no-unused-expressions
yargs_1.default
    .scriptName('npm run @euclidyr/ts-migrate-extra --')
    .version(false)
    .usage('Usage: $0 <command> [options]')
    .command('init <folder>', 'Initialize tsconfig.json file in <folder>', (cmd) => cmd.positional('folder', { type: 'string' }).require(['folder']), (args) => {
    const rootDir = path_1.default.resolve(process.cwd(), args.folder);
    (0, init_1.default)({ rootDir, isExtendedConfig: false });
})
    .command('init:extended <folder>', 'Initialize tsconfig.json file in <folder>', (cmd) => cmd.positional('folder', { type: 'string' }).require(['folder']), (args) => {
    const rootDir = path_1.default.resolve(process.cwd(), args.folder);
    (0, init_1.default)({ rootDir, isExtendedConfig: true });
})
    .command('rename [options] <folder>', 'Rename files in folder from JS/JSX to TS/TSX', (cmd) => cmd
    .positional('folder', { type: 'string' })
    .string('sources')
    .alias('sources', 's')
    .describe('sources', 'Path to a subset of your project to rename.')
    .example('$0 rename /frontend/foo', 'Rename all the files in /frontend/foo')
    .example('$0 rename /frontend/foo -s "bar/**/*"', 'Rename all the files in /frontend/foo/bar')
    .require(['folder']), (args) => {
    const rootDir = path_1.default.resolve(process.cwd(), args.folder);
    const { sources } = args;
    const renamedFiles = (0, rename_1.default)({ rootDir, sources });
    if (renamedFiles === null) {
        process.exit(-1);
    }
})
    .command('extra <folder>', 'Modifying import, export, static functions', (cmd) => cmd
    .positional('folder', { type: 'string' })
    .string('sources')
    .alias('sources', 's')
    .describe('sources', 'Path to a subset of your project to modify import, export, static functions.')
    .example('$0 extra /frontend/foo', 'Modify import, export, static functions in all the files in /frontend/foo')
    .example('$0 extra /frontend/foo -s "bar/**/*"', 'Modify import, export, static functions in all the files in /frontend/foo/bar')
    .require(['folder']), async (args) => {
    await (0, extra_1.fixImportExportStaticFunctionsComments)(args.folder);
})
    .command('migrate [options] <folder>', 'Fix TypeScript errors, using codemods', (cmd) => cmd
    .positional('folder', { type: 'string' })
    .choices('defaultAccessibility', ['private', 'protected', 'public'])
    .string('plugin')
    .choices('plugin', availablePlugins.map((p) => p.name))
    .describe('plugin', 'Run a specific plugin')
    .string('privateRegex')
    .string('protectedRegex')
    .string('publicRegex')
    .string('sources')
    .alias('sources', 's')
    .describe('sources', 'Path to a subset of your project to rename (globs are ok).')
    .example('migrate /frontend/foo', 'Migrate all the files in /frontend/foo')
    .example('$0 migrate /frontend/foo -s "bar/**/*" -s "node_modules/**/*.d.ts"', 'Migrate all the files in /frontend/foo/bar, accounting for ambient types from node_modules.')
    .example('$0 migrate /frontend/foo --plugin jsdoc', 'Migrate JSDoc comments for all the files in /frontend/foo')
    .require(['folder']), async (args) => {
    const rootDir = path_1.default.resolve(process.cwd(), args.folder);
    const { sources } = args;
    let config;
    const airbnbAnyAlias = '$TSFixMe';
    const airbnbAnyFunctionAlias = '$TSFixMeFunction';
    // by default, we're not going to use any aliases in ts-migrate
    const anyAlias = args.aliases === 'tsfixme' ? airbnbAnyAlias : undefined;
    const anyFunctionAlias = args.aliases === 'tsfixme' ? airbnbAnyFunctionAlias : undefined;
    if (args.plugin) {
        const plugin = availablePlugins.find((cur) => cur.name === args.plugin);
        if (!plugin) {
            updatable_log_1.default.error(`Could not find a plugin named ${args.plugin}.`);
            process.exit(1);
            return;
        }
        if (plugin === ts_migrate_plugins_1.jsDocPlugin) {
            const anyAlias = args.aliases === 'tsfixme' ? '$TSFixMe' : undefined;
            const typeMap = typeof args.typeMap === 'string' ? JSON.parse(args.typeMap) : undefined;
            config = new ts_migrate_server_1.MigrateConfig().addPlugin(ts_migrate_plugins_1.jsDocPlugin, { anyAlias, typeMap });
        }
        else {
            config = new ts_migrate_server_1.MigrateConfig().addPlugin(plugin, {
                anyAlias,
                anyFunctionAlias,
            });
        }
    }
    else {
        const useDefaultPropsHelper = args.useDefaultPropsHelper === 'true';
        const { defaultAccessibility, privateRegex, protectedRegex, publicRegex } = args;
        config = new ts_migrate_server_1.MigrateConfig()
            .addPlugin(ts_migrate_plugins_1.stripTSIgnorePlugin, {})
            .addPlugin(ts_migrate_plugins_1.hoistClassStaticsPlugin, { anyAlias })
            .addPlugin(ts_migrate_plugins_1.reactPropsPlugin, {
            anyAlias,
            anyFunctionAlias,
            shouldUpdateAirbnbImports: true,
        })
            .addPlugin(ts_migrate_plugins_1.reactClassStatePlugin, { anyAlias })
            .addPlugin(ts_migrate_plugins_1.reactClassLifecycleMethodsPlugin, { force: true })
            .addPlugin(ts_migrate_plugins_1.reactDefaultPropsPlugin, {
            useDefaultPropsHelper,
        })
            .addPlugin(ts_migrate_plugins_1.reactShapePlugin, {
            anyAlias,
            anyFunctionAlias,
        })
            .addPlugin(ts_migrate_plugins_1.declareMissingClassPropertiesPlugin, { anyAlias })
            .addPlugin(ts_migrate_plugins_1.memberAccessibilityPlugin, {
            defaultAccessibility,
            privateRegex,
            protectedRegex,
            publicRegex,
        })
            .addPlugin(ts_migrate_plugins_1.explicitAnyPlugin, { anyAlias })
            .addPlugin(ts_migrate_plugins_1.addConversionsPlugin, { anyAlias })
            // We need to run eslint-fix before ts-ignore because formatting may affect where
            // the errors are that need to get ignored.
            .addPlugin(ts_migrate_plugins_1.eslintFixPlugin, {})
            .addPlugin(ts_migrate_plugins_1.tsIgnorePlugin, {})
            // We need to run eslint-fix again after ts-ignore to fix up formatting.
            .addPlugin(ts_migrate_plugins_1.eslintFixPlugin, {});
    }
    const { exitCode } = await (0, ts_migrate_server_1.migrate)({ rootDir, config, sources });
    process.exit(exitCode);
})
    .command('reignore <folder>', 'Re-run ts-ignore on a project', (cmd) => cmd
    .option('p', {
    alias: 'messagePrefix',
    default: 'FIXME',
    type: 'string',
    describe: 'A message to add to the ts-expect-error or ts-ignore comments that are inserted.',
})
    .positional('folder', { type: 'string' })
    .require(['folder']), async (args) => {
    const rootDir = path_1.default.resolve(process.cwd(), args.folder);
    const changedFiles = new Map();
    function withChangeTracking(plugin) {
        return {
            name: plugin.name,
            async run(params) {
                const prevText = params.text;
                const nextText = await plugin.run(params);
                const seen = changedFiles.has(params.fileName);
                if (!seen && nextText != null && nextText !== prevText) {
                    changedFiles.set(params.fileName, prevText);
                }
                return nextText;
            },
        };
    }
    const eslintFixChangedPlugin = {
        name: 'eslint-fix-changed',
        async run(params) {
            if (!changedFiles.has(params.fileName))
                return undefined;
            if (changedFiles.get(params.fileName) === params.text)
                return undefined;
            return ts_migrate_plugins_1.eslintFixPlugin.run(params);
        },
    };
    const config = new ts_migrate_server_1.MigrateConfig()
        .addPlugin(withChangeTracking(ts_migrate_plugins_1.stripTSIgnorePlugin), {})
        .addPlugin(withChangeTracking(ts_migrate_plugins_1.tsIgnorePlugin), {
        messagePrefix: args.messagePrefix,
    })
        .addPlugin(eslintFixChangedPlugin, {});
    const { exitCode } = await (0, ts_migrate_server_1.migrate)({ rootDir, config });
    process.exit(exitCode);
})
    .example('$0 --help', 'Show help')
    .example('$0 migrate --help', 'Show help for the migrate command')
    .example('$0 init frontend/foo', 'Create tsconfig.json file at frontend/foo/tsconfig.json')
    .example('$0 init:extended frontend/foo', 'Create extended from the base tsconfig.json file at frontend/foo/tsconfig.json')
    .example('$0 rename frontend/foo', 'Rename files in frontend/foo from JS/JSX to TS/TSX')
    .example('$0 rename frontend/foo --s "bar/baz"', 'Rename files in frontend/foo/bar/baz from JS/JSX to TS/TSX')
    .demandCommand(1, 'Must provide a command.')
    .help('h')
    .alias('h', 'help')
    .alias('i', 'init')
    .alias('m', 'migrate')
    .alias('rn', 'rename')
    .alias('ri', 'reignore')
    .wrap(Math.min(yargs_1.default.terminalWidth(), 100)).argv;
//# sourceMappingURL=cli.js.map