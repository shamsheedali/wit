import { AuthState, User } from '@/types/auth';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            user: null,
            isAuthenticated: false,
            setUser: (userData: User) => 
                set({user: userData, isAuthenticated: true}),
            updateUser: (updatedData: Partial<User>) => {
                set((state) => ({
                    user : state.user ? { ...state.user, ...updatedData} : null,
                }))
            },
            logout: () => set({user: null, isAuthenticated: false}),
        }),
        {
            name: 'auth-storage', // Key for localStorage to persist state       
        }
    )
);