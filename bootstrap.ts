#!/usr/bin/env -S deno run --allow-read --allow-write

function escapeBackticksAndSlash(str: string) {
  return str.replace(/\\/g, "\\\\").replace(/`/g, "\\`");
}

const pySource = Deno.readTextFileSync("gprof2dot.py");
Deno.writeTextFile(
  "gprof2dot.ts",
  `export const gprof2dotSource = \`${escapeBackticksAndSlash(pySource)}\``,
);
