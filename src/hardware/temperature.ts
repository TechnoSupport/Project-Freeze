import { execFile } from "child_process";
import path from "path";

type Temperature = number;

const temperatureMode =
  process.env.TEMPERATURE_MODE ||
  (process.env.NODE_ENV === "production"
    ? "hardware"
    : "simulated");

const configuredSimulatedTemperature =
  Number(process.env.SIMULATED_TEMPERATURE_C ?? -18);

const simulatedTemperature =
  Number.isFinite(configuredSimulatedTemperature)
    ? configuredSimulatedTemperature
    : -18;

export function readTemperature(): Promise<Temperature> {
  if (temperatureMode === "simulated") {
    return Promise.resolve(simulatedTemperature);
  }

  return new Promise((resolve, reject) => {
    const python = process.env.PYTHON_BIN || "python3";
    const script = path.resolve(
      process.cwd(),
      "src/hardware/temp.py"
    );

    execFile(
      python,
      [script],
      { timeout: 15000 },
      (error, stdout, stderr) => {
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
            throw new Error(
              "Temperature sensor returned no reading"
            );
          }

          resolve(data.temperature_c);
        } catch (error) {
          reject(error);
        }
      }
    );
  });
}