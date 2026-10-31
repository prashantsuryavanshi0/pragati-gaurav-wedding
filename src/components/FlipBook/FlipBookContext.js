import { createContext, useContext } from 'react'

export const PAGE_IDS = ['hero', 'couple', 'celebrations', 'bigday', 'venue', 'blessings']

// Public context: NavBar, HeroSection, any page component
export const FlipBookContext = createContext({ currentPage: 0, goTo: () => {}, startRiffle: () => {} })
export const useFlipBook = () => useContext(FlipBookContext)

// Internal context: only used by FlipBookShell to wire up the FlipBook
export const FlipBookInternalCtx = createContext(null)
