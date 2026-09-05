import { spawn, ChildProcessWithoutNullStreams } from "child_process";
import path from "path";

let pumpRunning = false;
let pumpPower = 0;
let pumpProcess: ChildProcessWithoutNullStreams | null = null;

function ensureControllerStarted(): void {
    if (pumpProcess) return;

    const scriptPath = path.join(
        process.cwd(),
        "src",
        "hardware",
        "pump_control.py"
    );

    pumpProcess = spawn("python3", [scriptPath]);

    pumpProcess.stdout.on("data", (data) => {
        console.log(`[Pump Controller] ${data.toString().trim()}`);
    });

    pumpProcess.stderr.on("data", (data) => {
        console.error(`[Pump Controller Error] ${data.toString().trim()}`);
    });

    pumpProcess.on("exit", (code) => {
        console.log(`Pump controller exited with code ${code}`);
        pumpProcess = null;
        pumpRunning = false;
        pumpPower = 0;
    });
}

export function setPumpPower(percent: number): void {
    ensureControllerStarted();

    const safePercent = Math.max(0, Math.min(100, percent));

    if (!pumpProcess) {
        throw new Error("Pump controller failed to start.");
    }

    pumpProcess.stdin.write(`${safePercent}\n`);

    pumpPower = safePercent;
    pumpRunning = safePercent > 0;
}

export function startPump(): void {
    setPumpPower(100);
}

export function stopPump(): void {
    setPumpPower(0);
}

export function getPumpStatus(): boolean {
    return pumpRunning;
}

export function getPumpPower(): number {
    return pumpPower;
}

export function shutdownPumpController(): void {
    if (!pumpProcess) return;

    pumpProcess.stdin.write("exit\n");
    pumpProcess = null;
    pumpRunning = false;
    pumpPower = 0;
}