import * as fs from 'fs';
import * as path from 'path';

export interface ScanReport {
  target: string;
  summary: string;
  stats: {
    totalFiles: number;
    totalDirs: number;
    languages: Record<string, number>;
  };
  packages: Array<{ name: string; path: string; private?: boolean }>;
  findings: Array<{ severity: 'low' | 'medium' | 'high'; title: string; detail: string }>;
  suggestions: string[];
  agentsGuides: AgentsGuide[];
}

export interface AgentsGuide {
  path: string; // relative to root
  scope: string; // directory scope
  size: number;
  highlights: string[];
  content: string; // raw content for artifact persistence
}

const EXCLUDE_DIRS = new Set([
  'node_modules', '.git', 'dist', 'build', '.next', '.turbo', 'coverage', '.cache', '.venv', '__pycache__'
]);

const EXT_LANG: Record<string, string> = {
  '.ts': 'TypeScript',
  '.tsx': 'TypeScript',
  '.js': 'JavaScript',
  '.jsx': 'JavaScript',
  '.json': 'JSON',
  '.md': 'Markdown',
  '.py': 'Python',
  '.go': 'Go',
  '.rs': 'Rust',
  '.java': 'Java',
  '.kt': 'Kotlin',
  '.swift': 'Swift',
  '.cs': 'C#'
};

export async function scanRepository(root: string): Promise<ScanReport> {
  const absRoot = path.resolve(root);
  const stats = { totalFiles: 0, totalDirs: 0, languages: {} as Record<string, number> };
  const packages: Array<{ name: string; path: string; private?: boolean }> = [];
  const findings: Array<{ severity: 'low' | 'medium' | 'high'; title: string; detail: string }> = [];
  const suggestions: string[] = [];
  const agentsGuides: AgentsGuide[] = [];

  // Traverse filesystem (breadth-first), ignoring excluded directories
  const queue: string[] = [absRoot];
  while (queue.length) {
    const dir = queue.shift()!;
    let entries: fs.Dirent[] = [];
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      continue; // Skip unreadable directories
    }
    stats.totalDirs++;
    for (const e of entries) {
      const full = path.join(dir, e.name);
      if (e.isDirectory()) {
        if (EXCLUDE_DIRS.has(e.name)) continue;
        queue.push(full);
        continue;
      }
      stats.totalFiles++;
      const ext = path.extname(e.name).toLowerCase();
      const lang = EXT_LANG[ext];
      if (lang) {
        stats.languages[lang] = (stats.languages[lang] || 0) + 1;
      }
      if (e.name === 'package.json') {
        try {
          const json = JSON.parse(fs.readFileSync(full, 'utf8'));
          if (json?.name) {
            packages.push({ name: json.name, path: path.relative(absRoot, path.dirname(full)), private: json.private });
          }
        } catch {}
      }
      if (e.name.toLowerCase() === 'agents.md') {
        try {
          const rel = path.relative(absRoot, full);
          const content = fs.readFileSync(full, 'utf8');
          const highlights = extractAgentsHighlights(content, 15);
          agentsGuides.push({
            path: rel,
            scope: path.relative(absRoot, path.dirname(full)) || '.',
            size: Buffer.byteLength(content, 'utf8'),
            highlights,
            content
          });
        } catch {}
      }
    }
  }

  // Simple monorepo/workspace detection
  const hasPnpmWorkspace = fs.existsSync(path.join(absRoot, 'pnpm-workspace.yaml'));
  const hasTurbo = fs.existsSync(path.join(absRoot, 'turbo.json'));
  const hasGithub = fs.existsSync(path.join(absRoot, '.github'));
  const hasRootPkg = fs.existsSync(path.join(absRoot, 'package.json'));

  if (hasPnpmWorkspace && hasRootPkg) {
    findings.push({ severity: 'low', title: 'Monorepo detected', detail: 'pnpm workspace with root package.json' });
  }
  if (!hasTurbo) {
    findings.push({ severity: 'medium', title: 'Missing turbo.json', detail: 'Turbo repo config not found' });
    suggestions.push('Add turbo.json for coordinated monorepo builds and caching');
  }
  if (!hasGithub) {
    findings.push({ severity: 'medium', title: 'Missing .github CI', detail: 'No GitHub workflows detected' });
    suggestions.push('Add CI workflows for install/build/test across workspaces');
  }

  // Test presence heuristic
  const testGlobs = ['.test.', '.spec.'];
  const hasTests = packages.some((p) => {
    try {
      const pkgPath = path.join(absRoot, p.path, 'package.json');
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
      const scripts = pkg.scripts || {};
      return Boolean(scripts.test);
    } catch {
      return false;
    }
  }) || scanForSubstring(absRoot, testGlobs, 1000);

  if (!hasTests) {
    findings.push({ severity: 'high', title: 'No tests detected', detail: 'No test scripts or files found' });
    suggestions.push('Introduce unit/integration tests per package (vitest/jest)');
  }

  // TypeScript health
  const tsPkgs = packages.filter((p) => {
    try {
      const pkgPath = path.join(absRoot, p.path, 'package.json');
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
      return Boolean(pkg.devDependencies?.typescript || pkg.dependencies?.typescript);
    } catch {
      return false;
    }
  });
  if (tsPkgs.length > 0) {
    const missingTsConfig = tsPkgs.filter((p) => !fs.existsSync(path.join(absRoot, p.path, 'tsconfig.json')));
    if (missingTsConfig.length) {
      findings.push({ severity: 'medium', title: 'Missing tsconfig.json', detail: `${missingTsConfig.length} TS packages lack tsconfig` });
      suggestions.push('Add tsconfig.json per TS package and enable strict type-checking');
    }
  }

  // Produce summary
  const summary = `Scanned ${stats.totalDirs} directories and ${stats.totalFiles} files. ` +
    `${Object.keys(stats.languages).length ? 'Detected languages: ' + Object.keys(stats.languages).join(', ') + '.' : ''}`;

  // Additional general suggestions
  suggestions.push(
    'Add codeowners and PR templates for consistent reviews',
    'Adopt workspace-level linting and formatting with shared config',
    'Enable incremental builds and cache via turbo/pnpm',
    'Set up pre-commit hooks (lint-staged) for quality gates'
  );

  return {
    target: absRoot,
    summary,
    stats,
    packages: packages.sort((a, b) => a.path.localeCompare(b.path)),
    findings,
    suggestions,
    agentsGuides
  };
}

function scanForSubstring(root: string, needles: string[], maxFiles: number): boolean {
  let count = 0;
  const stack: string[] = [root];
  while (stack.length) {
    const dir = stack.pop()!;
    let entries: fs.Dirent[] = [];
    try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { continue; }
    for (const e of entries) {
      const full = path.join(dir, e.name);
      if (e.isDirectory()) {
        if (EXCLUDE_DIRS.has(e.name)) continue;
        stack.push(full);
      } else {
        if (++count > maxFiles) return false;
        try {
          const name = e.name.toLowerCase();
          if (needles.some(n => name.includes(n))) return true;
        } catch {}
      }
    }
  }
  return false;
}

function extractAgentsHighlights(md: string, max: number): string[] {
  const lines = md.split(/\r?\n/);
  const bullets = lines.filter((l) => /^(\s*[-*]|\s*\d+\.)\s+/.test(l));
  const directiveRegex = /(must|should|avoid|never|do not|required|prohibit|recommend)/i;
  const directiveLines = bullets.filter((l) => directiveRegex.test(l));
  const heads = lines.filter((l) => /^\s*#{1,3}\s+/.test(l)).slice(0, 10);
  const highlights = [...directiveLines.slice(0, max - Math.min(5, heads.length)), ...heads.slice(0, 5)];
  // Normalize spacing and trim
  return highlights.map((h) => h.replace(/^\s*[-*]\s+/, '').trim()).slice(0, max);
}
