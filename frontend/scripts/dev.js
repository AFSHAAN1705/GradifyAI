const { spawn } = require("child_process");
console.log("\n  Frontend Running: http://localhost:3000\n");
const proc = spawn("next", ["dev", "-p", "3000"], {
  stdio: "inherit",
  shell: true,
});
proc.on("exit", (code) => process.exit(code));
