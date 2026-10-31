import { useState, useRef, useCallback } from 'react'
import { FlipBookContext, FlipBookInternalCtx } from './FlipBookContext'

export default function FlipBookProvider({ children }) {
  const [currentPage, setCurrentPage] = useState(0)
  const goToRef        = useRef(null)
  const startRiffleRef = useRef(null)

  const goTo        = useCallback((idx, dur) => goToRef.current?.(idx, dur), [])
  const startRiffle = useCallback(() => startRiffleRef.current?.(), [])

  const internal = {
    setCurrentPage,
    registerGoTo:        fn => { goToRef.current = fn },
    registerStartRiffle: fn => { startRiffleRef.current = fn },
  }

  return (
    <FlipBookContext.Provider value={{ currentPage, goTo, startRiffle }}>
      <FlipBookInternalCtx.Provider value={internal}>
        {children}
      </FlipBookInternalCtx.Provider>
    </FlipBookContext.Provider>
  )
}
