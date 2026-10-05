import { execFile } from "child_process";

export function shutdownPi(): void {
  execFile("sudo", ["-n", "/usr/bin/systemctl", "poweroff"], (error) => {
    if (error) {
      console.error("Shutdown failed:", error);
    }
  });
}

export function rebootPi(): void {
  execFile("sudo", ["-n", "/usr/bin/systemctl", "reboot"], (error) => {
    if (error) {
      console.error("Reboot failed:", error);
    }
  });
}
