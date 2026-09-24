import { execFile } from "child_process";
import { promisify } from "util";

const execFileAsync = promisify(execFile);

export interface WindowsScheduledTaskInput {
    taskName: string;
    command: string;
    startDate: string; // dd/mm/yyyy
    startTime: string; // HH:mm
    description?: string;
}

export class WindowsTaskService {
    private readonly TASK_PREFIX = "botSari-";

    private async runPowerShell(script: string): Promise<{ stdout: string; stderr: string }> {
        try {
            const result = await execFileAsync(
                "powershell.exe",
                [
                    "-NoProfile",
                    "-ExecutionPolicy",
                    "Bypass",
                    "-Command",
                    script
                ],
                {
                    windowsHide: true,
                    encoding: "utf8",
                    maxBuffer: 1024 * 1024
                }
            );

            return {
                stdout: result.stdout ?? "",
                stderr: result.stderr ?? ""
            };
        } catch (error: any) {
            const stdout = error?.stdout ?? "";
            const stderr = error?.stderr ?? "";
            const message = error?.message ?? "Falha ao executar PowerShell";

            throw new Error(
                `${message}\nSCRIPT:\n${script}\nSTDOUT: ${stdout}\nSTDERR: ${stderr}`
            );
        }
    }

    private async runSchtasks(args: string[]): Promise<{ stdout: string; stderr: string }> {
        try {
            const result = await execFileAsync("schtasks", args, {
                windowsHide: true,
                encoding: "utf8"
            });

            return {
                stdout: result.stdout ?? "",
                stderr: result.stderr ?? ""
            };
        } catch (error: any) {
            const stdout = error?.stdout ?? "";
            const stderr = error?.stderr ?? "";
            const message = error?.message ?? "Falha ao executar schtasks";

            throw new Error(
                `${message}\nARGS: schtasks ${args.join(" ")}\nSTDOUT: ${stdout}\nSTDERR: ${stderr}`
            );
        }
    }

    async createTask(input: WindowsScheduledTaskInput): Promise<void> {
        const isoDateTime = this.toIsoDateTime(input.startDate, input.startTime);
        const escapedTaskName = this.escapePowerShellString(input.taskName);
        const escapedCommand = this.escapePowerShellString(input.command);
        const escapedDescription = this.escapePowerShellString(
            input.description ?? `Task automática do bot SARI: ${input.taskName}`
        );

        const script = `
$taskName = '${escapedTaskName}'
$action = New-ScheduledTaskAction -Execute 'cmd.exe' -Argument '/c ${escapedCommand}'
$trigger = New-ScheduledTaskTrigger -Once -At ([datetime]'${isoDateTime}')
$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable -WakeToRun -ExecutionTimeLimit (New-TimeSpan -Hours 72)

Register-ScheduledTask -TaskName $taskName -Action $action -Trigger $trigger -Settings $settings -Description '${escapedDescription}' -Force
        `.trim();

        await this.runPowerShell(script);
    }

    async deleteTask(taskName: string): Promise<void> {
        const exists = await this.taskExists(taskName);
        if (!exists) return;

        const escapedTaskName = this.escapePowerShellString(taskName);

        const script = `
Unregister-ScheduledTask -TaskName '${escapedTaskName}' -Confirm:$false
        `.trim();

        await this.runPowerShell(script);
    }

    async taskExists(taskName: string): Promise<boolean> {
        try {
            await this.runSchtasks([
                "/Query",
                "/TN",
                taskName
            ]);
            return true;
        } catch {
            return false;
        }
    }

    async listBotSariTasks(): Promise<string[]> {
        const { stdout } = await this.runSchtasks([
            "/Query",
            "/FO",
            "CSV",
            "/NH"
        ]);

        const lines = stdout
            .split(/\r?\n/)
            .map((line) => line.trim())
            .filter(Boolean);

        const taskNames: string[] = [];

        for (const line of lines) {
            const firstColumn = this.extractFirstCsvColumn(line);
            if (
                firstColumn.startsWith(`\\${this.TASK_PREFIX}`) ||
                firstColumn.startsWith(this.TASK_PREFIX)
            ) {
                taskNames.push(firstColumn.replace(/^\\/, ""));
            }
        }

        return taskNames;
    }

    async deleteAllBotSariTasks(): Promise<void> {
        const tasks = await this.listBotSariTasks();

        for (const taskName of tasks) {
            await this.deleteTask(taskName);
        }
    }

    private toIsoDateTime(dateBR: string, timeHHMM: string): string {
        const [day, month, year] = dateBR.split("/").map(Number);
        const [hour, minute] = timeHHMM.split(":").map(Number);

        const date = new Date(year, month - 1, day, hour, minute, 0, 0);

        const yyyy = date.getFullYear();
        const mm = String(date.getMonth() + 1).padStart(2, "0");
        const dd = String(date.getDate()).padStart(2, "0");
        const hh = String(date.getHours()).padStart(2, "0");
        const mi = String(date.getMinutes()).padStart(2, "0");
        const ss = String(date.getSeconds()).padStart(2, "0");

        return `${yyyy}-${mm}-${dd}T${hh}:${mi}:${ss}`;
    }

    private escapePowerShellString(value: string): string {
        return value.replace(/'/g, "''");
    }

    private extractFirstCsvColumn(line: string): string {
        if (!line.startsWith('"')) {
            return line.split(",")[0]?.trim() ?? "";
        }

        let value = "";
        for (let i = 1; i < line.length; i += 1) {
            const char = line[i];

            if (char === '"') {
                if (line[i + 1] === '"') {
                    value += '"';
                    i += 1;
                    continue;
                }
                break;
            }

            value += char;
        }

        return value;
    }
}