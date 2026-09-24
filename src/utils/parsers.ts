export function extractDate(text: string): string | undefined {
    const match = text.match(/Data:\s*(\d{2}\/\d{2}\/\d{4})/i);
    return match?.[1];
}

export function extractMealType(text: string): string | undefined {
    const match = text.match(/Refeição:\s*(Almoço|Almoco|Jantar|Café|Cafe)/i);
    return match?.[1];
}

export function extractAvailableQty(text: string): number {
    const match = text.match(/Qtd\.\s*Disponível:\s*(\d+)/i);
    return match ? Number(match[1]) : 0;
}

export function extractBoughtQty(text: string): number {
    const match = text.match(/Qtd\.\s*Comprada por você:\s*(\d+)/i);
    return match ? Number(match[1]) : 0;
}