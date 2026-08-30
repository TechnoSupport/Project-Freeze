import { exec } from "child_process";

export function shutdownPi(): void {
  exec("sudo shutdown -h now", (error) => {
    if (error) {
      console.error("Shutdown failed:", error);
    }
  });
}

export function rebootPi(): void {
  exec("sudo reboot", (error) => {
    if (error) {
      console.error("Reboot failed:", error);
    }
  });
}