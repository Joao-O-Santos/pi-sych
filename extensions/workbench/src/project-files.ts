import { constants } from "node:fs";
import { access, mkdir, open, readFile, rename, rm, stat } from "node:fs/promises";
import { dirname, isAbsolute, parse, relative, resolve } from "node:path";
import { randomUUID } from "node:crypto";

export const CORE_PROJECT_FILES = ["PROJECT.md", "EVIDENCE.md", "SYNC.md"] as const;
export const OPTIONAL_PROJECT_FILES = ["DECISIONS.md", "STYLE.md", "TODO.md"] as const;

export interface DiscoveredProjectFile {
  name: (typeof CORE_PROJECT_FILES)[number] | (typeof OPTIONAL_PROJECT_FILES)[number];
  path: string;
  exists: boolean;
  required: boolean;
}

export interface ProjectDiscovery {
  root: string;
  files: DiscoveredProjectFile[];
}

export interface ProjectValidation {
  valid: boolean;
  errors: string[];
  headings: string[];
}

export interface EvidenceEntry {
  id: string;
  title: string;
  status?: string;
  kind?: string;
  source?: string;
}

async function exists(path: string): Promise<boolean> {
  try {
    await access(path, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

export async function locateProjectRoot(startPath: string): Promise<string> {
  let current = resolve(startPath);
  try {
    if (!(await stat(current)).isDirectory()) current = dirname(current);
  } catch {
    current = dirname(current);
  }

  let projectFallback: string | undefined;
  while (true) {
    if (await exists(resolve(current, "SYNC.md"))) return current;
    if (!projectFallback && (await exists(resolve(current, "PROJECT.md")))) projectFallback = current;
    const parent = dirname(current);
    if (parent === current) break;
    current = parent;
  }
  return projectFallback ?? resolve(startPath);
}

export async function discoverProjectFiles(startPath: string): Promise<ProjectDiscovery> {
  const root = await locateProjectRoot(startPath);
  const required = new Set<string>(CORE_PROJECT_FILES);
  const names = [...CORE_PROJECT_FILES, ...OPTIONAL_PROJECT_FILES];
  const files = await Promise.all(
    names.map(async (name) => ({ name, path: resolve(root, name), exists: await exists(resolve(root, name)), required: required.has(name) })),
  );
  return { root, files };
}

export function validateProjectMarkdown(markdown: string): ProjectValidation {
  const headings = [...markdown.matchAll(/^#{1,6}\s+(.+?)\s*$/gm)].map((match) => match[1].trim());
  const errors: string[] = [];
  if (!/^#\s+\S/m.test(markdown)) errors.push("PROJECT.md must contain a level-one title");
  for (const required of ["Objective", "Current direction", "Definition of done"]) {
    if (!headings.some((heading) => heading.toLowerCase() === required.toLowerCase())) {
      errors.push(`PROJECT.md is missing the '${required}' heading`);
    }
  }
  return { valid: errors.length === 0, errors, headings };
}

export async function readAndValidateProject(projectPath: string): Promise<ProjectValidation> {
  return validateProjectMarkdown(await readFile(projectPath, "utf8"));
}

export function parseEvidenceEntries(markdown: string): EvidenceEntry[] {
  const headingPattern = /^##\s+(E-[A-Za-z0-9-]+)\s+(?:—|-)\s+(.+?)\s*$/gm;
  const headings = [...markdown.matchAll(headingPattern)];
  return headings.map((heading, index) => {
    const sectionStart = (heading.index ?? 0) + heading[0].length;
    const sectionEnd = headings[index + 1]?.index ?? markdown.length;
    const section = markdown.slice(sectionStart, sectionEnd);
    const field = (name: string): string | undefined => {
      const match = section.match(new RegExp(`^\\*\\*${name}:\\*\\*\\s*(.+?)\\s*$`, "im"));
      return match?.[1]?.trim();
    };
    return { id: heading[1], title: heading[2].trim(), status: field("Status"), kind: field("Kind"), source: field("Source") };
  });
}

export function resolveProjectPath(projectRoot: string, projectPath: string): string {
  if (!projectPath || isAbsolute(projectPath)) throw new Error(`Project artifact path must be relative: ${projectPath}`);
  const absolute = resolve(projectRoot, projectPath);
  const rel = relative(projectRoot, absolute);
  if (rel === ".." || rel.startsWith(`..${parse(projectRoot).root === "/" ? "/" : "\\"}`) || isAbsolute(rel)) {
    throw new Error(`Project artifact path leaves the project root: ${projectPath}`);
  }
  return absolute;
}

export async function writeApprovedFile(path: string, content: string, approved: boolean): Promise<void> {
  if (!approved) throw new Error("Durable file write requires explicit approval");
  const parent = dirname(path);
  await mkdir(parent, { recursive: true });
  const temporary = resolve(parent, `.${parse(path).base}.${randomUUID()}.tmp`);
  let handle;
  try {
    handle = await open(temporary, "wx", 0o600);
    await handle.writeFile(content, "utf8");
    await handle.sync();
    await handle.close();
    handle = undefined;
    await rename(temporary, path);
  } catch (error) {
    await handle?.close().catch(() => undefined);
    await rm(temporary, { force: true }).catch(() => undefined);
    throw error;
  }
}
