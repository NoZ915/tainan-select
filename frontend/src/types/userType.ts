export interface User{
    id: number;
    uuid: string;
    google_sub: string;
    name?: string;
    detail?: string;
    avatar?: string;
    created_at: Date;
    updated_at: Date;
}