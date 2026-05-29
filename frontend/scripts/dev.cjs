const { spawn } = require("child_process");
const path = require("path");

const nextCli = path.resolve(__dirname, "..", "node_modules", ".bin", "next");
console.log("\n  Frontend Running: http://localhost:3000\n");
const proc = spawn(nextCli, ["dev", "-p", "3000"], {
  stdio: "inherit",
  shell: true,
});
proc.on("exit", (code) => process.exit(code));
