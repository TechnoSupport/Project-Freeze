import { execFile } from "child_process";

type Temperature = number;

export function readTemperature(): Promise<Temperature> {
  return new Promise((resolve, reject) => {
    execFile("python3", ["./src/hardware/temp.py"], (error, stdout, stderr) => {
      if (error) {
        reject(error);
        return;
      }

      if (stderr) {
        console.error("stderr:", stderr);
      }

      try {
        const data = JSON.parse(stdout);

        resolve(data.temperature_c);
      } catch (error) {
        reject(error);
      }
    });
  });
}