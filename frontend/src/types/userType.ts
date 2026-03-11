export interface User{
    id: number;
    uuid: string;
    google_sub: string;
    name?: string;
    detail?: string;
    avatar?: string | null;
    is_admin?: boolean;
    created_at: Date;
    updated_at: Date;
}
