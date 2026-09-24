export type UserCategory = 
    | "aluno_manha_tarde"
    | "aluno_noite"
    | "geral";

export interface UserProfile {
    login: string;
    password: string;
    category: UserCategory;
}