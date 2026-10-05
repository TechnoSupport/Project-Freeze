import { execFile } from "child_process";
import path from "path";

const python = process.env.PYTHON_BIN || "python3";
const pumpScript = path.resolve(process.cwd(), "src/hardware/pump.py");

function runPump(command: "set" | "get", value?: number): Promise<number> {
  return new Promise((resolve, reject) => {
    const args = [pumpScript, command];
    if (value !== undefined) args.push(value.toString());

    execFile(python, args, { timeout: 10000 }, (error, stdout, stderr) => {
      if (error) {
        reject(new Error(stderr.trim() || error.message));
        return;
      }

      try {
        const data = JSON.parse(stdout);
        if (typeof data.speed !== "number") throw new Error("Invalid pump response");
        resolve(data.speed);
      } catch (parseError) {
        reject(parseError);
      }
    });
  });
}

export function setPumpSpeed(percent: number): Promise<number> {
  return runPump("set", Math.max(0, Math.min(100, percent)));
}

export function getPumpSpeed(): Promise<number> {
  return runPump("get");
}

export async function stopPump(): Promise<void> {
  await setPumpSpeed(0);
}
