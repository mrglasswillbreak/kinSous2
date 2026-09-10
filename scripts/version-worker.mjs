import { readFile, writeFile, readdir } from "node:fs/promises";
import { createHash } from "node:crypto";
const hash = createHash("sha256");
async function scan(directory) {
  for (const entry of (await readdir(directory, { withFileTypes: true })).sort(
    (a, b) => a.name.localeCompare(b.name),
  )) {
    const path = directory + "/" + entry.name;
    if (entry.isDirectory()) await scan(path);
    else if (path !== "public/sw.js")
      hash.update(path).update(await readFile(path));
  }
}
await scan("src");
await scan("public");
const worker = await readFile("public/sw.js", "utf8");
hash.update(worker.slice(worker.indexOf("\n")));
await writeFile(
  "public/sw.js",
  worker.replace(
    /^const CACHE = .*;$/m,
    `const CACHE = "kinsous-public-${hash.digest("hex").slice(0, 12)}";`,
  ),
);
