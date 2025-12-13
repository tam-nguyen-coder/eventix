export class ErrorResponseDto {
    statusCode: number;
    message: string;
    error?: string;
    timestamp: string;
    path: string;

    constructor(partial: Partial<ErrorResponseDto>) {
        this.statusCode = partial.statusCode || 500;
        this.message = partial.message || 'Internal Server Error';
        this.error = partial.error;
        this.path = partial.path || '';
        this.timestamp = partial.timestamp || new Date().toISOString();
    }
}
