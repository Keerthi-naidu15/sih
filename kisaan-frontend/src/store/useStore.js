import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import localforage from 'localforage'

// Create a custom storage object using localforage for IndexedDB caching
const idbStorage = {
    getItem: async (name) => {
        return (await localforage.getItem(name)) || null
    },
    setItem: async (name, value) => {
        await localforage.setItem(name, value)
    },
    removeItem: async (name) => {
        await localforage.removeItem(name)
    },
}

export const useStore = create(
    persist(
        (set, get) => ({
            user: null,
            token: null,
            setUser: (user) => set({ user }),
            setToken: (token) => set({ token }),
            clearUser: () => set({
                user: null,
                token: null,
                chats: [],
                chatsByUser: {},
                scans: [],
                points: 0
            }),

            weather: null,
            setWeather: (weather) => set({ weather }),

            marketPrices: [],
            setMarketPrices: (prices) => set({ marketPrices: prices }),

            chats: [],
            chatsByUser: {},
            getChatsForUser: (userId) => {
                if (!userId) return []

                const state = get()
                const scopedChats = state.chatsByUser?.[userId]

                if (Array.isArray(scopedChats)) {
                    return scopedChats
                }

                return Array.isArray(state.chats) ? state.chats : []
            },
            addChat: (userId, chat) => set((state) => {
                if (!userId) {
                    return {
                        chats: [...state.chats, chat],
                    }
                }

                const existingChats = state.chatsByUser?.[userId]
                    || (Array.isArray(state.chats) ? state.chats : [])

                return {
                    chatsByUser: {
                        ...state.chatsByUser,
                        [userId]: [...existingChats, chat]
                    },
                    chats: []
                }
            }),

            scans: [],
            addScan: (scan) => set((state) => ({ scans: [...state.scans, scan] })),

            points: 0,
            addPoints: (pts) => set((state) => ({ points: state.points + pts })),

            advisoryResult:      null,
            setAdvisoryResult:   (res) => set({ advisoryResult: res }),
            clearAdvisoryResult: () => set({ advisoryResult: null }),
        }),
        {
            name: 'kisaan-storage', // unique name
            storage: createJSONStorage(() => idbStorage), // use localforage
        }
    )
)
