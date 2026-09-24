import { LocalBotConfig } from "../domain/schedule";
import { TarefaAgendada } from "../domain/scheduled-task";
import { gerarTarefasParaOsProximosDias } from "./task-generator";

export class SchedulerService {
    private tasks: TarefaAgendada[] = [];

    constructor(private readonly config: LocalBotConfig) {}

    carregarTasks(baseDate = new Date()): void {
        this.tasks = gerarTarefasParaOsProximosDias(this.config, baseDate, 7);
    }

    obterTarefas(): TarefaAgendada[] {
        return [...this.tasks];
    }

    obterProximaTarefaPendente(now = new Date()): TarefaAgendada | undefined {
        return this.tasks.find((task) => {
            const executarEm = new Date(task.executarEm);
            const expiraEm = new Date(task.expiraEm);

            return task.status === "pendente" && now >= executarEm && now < expiraEm;
        });
    }

    marcarTarefaEmExecução(taskId: string): void {
        this.atualizarStatusDaTarefa(taskId, "em execução");
    }

    marcarTarefaSucesso(taskId: string): void {
        this.atualizarStatusDaTarefa(taskId, "sucesso");
    }

    marcarTarefaFalhou(taskId: string): void {
        this.atualizarStatusDaTarefa(taskId, "falhou");
    }

    marcarTarefasExpiradas(now = new Date()): void {
        this.tasks = this.tasks.map((task) => {
            if (task.status !== "pendente") return task;

            const expiraEm = new Date(task.expiraEm);
            if (now >= expiraEm) {
                return { ...task, status: "expirado" };
            }

            return task;
        });
    }

    private atualizarStatusDaTarefa(
        taskId: string,
        status: TarefaAgendada["status"]
    ): void {
        this.tasks = this.tasks.map((task) =>
            task.id === taskId ? { ...task, status } : task
        );
    }
}