import { execFile } from "child_process";

export function setPumpSpeed(percent: number): Promise<number> {
  return new Promise((resolve, reject) => {
    const safePercent = Math.max(0, Math.min(100, percent));

    execFile(
      "python3",
      ["./src/hardware/pump.py", "set", safePercent.toString()],
      (error, stdout, stderr) => {
        if (error) {
          reject(error);
          return;
        }

        if (stderr) {
          console.error("Pump stderr:", stderr);
        }

        try {
          const data = JSON.parse(stdout);
          resolve(data.speed);
        } catch (error) {
          reject(error);
        }
      }
    );
  });
}

export function getPumpSpeed(): Promise<number> {
  return new Promise((resolve, reject) => {
    execFile(
      "python3",
      ["pump.py", "get"],
      (error, stdout, stderr) => {
        if (error) {
          reject(error);
          return;
        }

        if (stderr) {
          console.error("Pump stderr:", stderr);
        }

        try {
          const data = JSON.parse(stdout);
          resolve(data.speed);
        } catch (error) {
          reject(error);
        }
      }
    );
  });
}

export async function stopPump(): Promise<void> {
  await setPumpSpeed(0);
}