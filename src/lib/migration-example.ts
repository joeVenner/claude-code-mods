import { readTemplateFile } from "@/lib/template-files";

/**
 * The migration example in `templates/migration-example/`: three classic hooks written as function
 * hooks on the `classic.<Name>` events. The Migration page shows its hooks module. Unlike the starter
 * mod it has no tests, because the test kit cannot fire a classic event: it is checked by
 * `claude plugin validate` and by `npm run typecheck:templates`.
 * Server code only: this module reads the file system.
 */

export const MIGRATION_EXAMPLE_DIRECTORY = "templates/migration-example";

/** Files the page shows. */
export const MIGRATION_EXAMPLE_SHOWN_FILES = ["hooks/register.ts"] as const;

/** Files in the folder that the page does not show, because they have the same shape as the starter mod's. */
export const MIGRATION_EXAMPLE_OTHER_FILES = [".claude-plugin/plugin.json", "hooks/hooks.json"] as const;

export interface MigrationExampleFile {
  readonly path: (typeof MIGRATION_EXAMPLE_SHOWN_FILES)[number];
  /** File text without its final newline. */
  readonly content: string;
}

/**
 * Reads the files the page shows under `rootDirectory` (the project root by default).
 * @throws Error naming the file when one cannot be read or is not a regular file in its place.
 */
export function loadMigrationExampleFiles(rootDirectory: string = process.cwd()): readonly MigrationExampleFile[] {
  return MIGRATION_EXAMPLE_SHOWN_FILES.map((relativePath) => ({
    path: relativePath,
    content: readTemplateFile(rootDirectory, MIGRATION_EXAMPLE_DIRECTORY, relativePath),
  }));
}
