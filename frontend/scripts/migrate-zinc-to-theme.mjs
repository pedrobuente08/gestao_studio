/**
 * Substitui classes Tailwind zinc-* por tokens semânticos (uma vez).
 * Executar: node scripts/migrate-zinc-to-theme.mjs
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = path.join(process.cwd(), "src");

const REPLACEMENTS = [
  ["ring-offset-zinc-900", "ring-offset-surface-card"],
  ["ring-offset-zinc-950", "ring-offset-surface-primary"],
  ["bg-zinc-950/80", "bg-surface-primary/80"],
  ["bg-zinc-950/50", "bg-surface-primary/50"],
  ["bg-zinc-950/40", "bg-surface-primary/40"],
  ["bg-zinc-950/30", "bg-surface-primary/30"],
  ["bg-zinc-950", "bg-surface-primary"],
  ["bg-zinc-900/50", "bg-surface-card/50"],
  ["bg-zinc-900/30", "bg-surface-card/30"],
  ["bg-zinc-900", "bg-surface-card"],
  ["bg-zinc-800/50", "bg-surface-elevated/50"],
  ["bg-zinc-800/30", "bg-surface-elevated/30"],
  ["bg-zinc-800", "bg-surface-elevated"],
  ["text-zinc-100", "text-content-primary"],
  ["text-zinc-200", "text-content-primary"],
  ["text-zinc-300", "text-content-primary"],
  ["text-zinc-400", "text-content-secondary"],
  ["text-zinc-500", "text-content-muted"],
  ["text-zinc-600", "text-content-muted"],
  ["border-zinc-800/50", "border-edge/50"],
  ["border-zinc-800/40", "border-edge/40"],
  ["border-zinc-800", "border-edge"],
  ["border-zinc-700", "border-edge-muted"],
  ["divide-zinc-800", "divide-edge"],
  ["hover:text-zinc-200", "hover:text-content-primary"],
  ["hover:text-zinc-100", "hover:text-content-primary"],
  ["hover:text-zinc-300", "hover:text-content-secondary"],
  ["hover:bg-zinc-900/30", "hover:bg-surface-card/30"],
  ["hover:bg-zinc-800", "hover:bg-surface-elevated"],
  ["hover:bg-zinc-900", "hover:bg-surface-card"],
  ["hover:border-zinc-600", "hover:border-edge"],
  ["from-zinc-950", "from-surface-primary"],
  ["to-zinc-950", "to-surface-primary"],
];

function walk(dir, files = []) {
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    const st = fs.statSync(p);
    if (st.isDirectory()) {
      if (name === "node_modules") continue;
      walk(p, files);
    } else if (/\.(tsx|ts|jsx|js)$/.test(name) && !name.endsWith(".d.ts")) {
      files.push(p);
    }
  }
  return files;
}

let changed = 0;
for (const file of walk(ROOT)) {
  let t = fs.readFileSync(file, "utf8");
  const orig = t;
  for (const [a, b] of REPLACEMENTS) {
    t = t.split(a).join(b);
  }
  if (t !== orig) {
    fs.writeFileSync(file, t);
    changed++;
    console.log(file);
  }
}
console.log("Files updated:", changed);
