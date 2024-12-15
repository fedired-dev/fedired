import { readFileSync } from 'fs';
import path from 'path';

export function loadVerifiedUsers(): string[] {
    try {
        const filePath = path.resolve(__dirname, '../../../.conf/verified.txt');
        const fileContent = readFileSync(filePath, 'utf-8');

        return fileContent
            .split('\n')
            .map((line) => line.trim())
            .filter((line) => line.length > 0); 
    } catch (error) {
        console.error('Error al cargar los usuarios verificados:', error);
        return [];
    }
}
