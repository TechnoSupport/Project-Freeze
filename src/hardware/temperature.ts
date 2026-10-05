import { execFile } from "child_process";
import path from "path";

type Temperature = number;

export function readTemperature(): Promise<Temperature> {
  return new Promise((resolve, reject) => {
    const python = process.env.PYTHON_BIN || "python3";
    const script = path.resolve(process.cwd(), "src/hardware/temp.py");

    execFile(python, [script], { timeout: 15000 }, (error, stdout, stderr) => {
      if (error) {
        reject(new Error(stderr.trim() || error.message));
        return;
      }

      if (stderr) {
        console.error("stderr:", stderr);
      }

      try {
        const data = JSON.parse(stdout);

        if (typeof data.temperature_c !== "number") {
          throw new Error("Temperature sensor returned no reading");
        }
        resolve(data.temperature_c);
      } catch (error) {
        reject(error);
      }
    });
  });
}
