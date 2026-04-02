export type UserRole = 'teacher' | 'student';

export interface UserProfile {
    uid: string;
    email: string;
    displayName: string;
    role: UserRole;
    institution?: string;
    createdAt: Date;
}
