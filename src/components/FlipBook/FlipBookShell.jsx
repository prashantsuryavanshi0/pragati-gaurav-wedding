import { useContext } from 'react'
import { FlipBookInternalCtx } from './FlipBookContext'
import FlipBook from './FlipBook'

export default function FlipBookShell({ pages }) {
  const { setCurrentPage, registerGoTo, registerStartRiffle } = useContext(FlipBookInternalCtx)
  return (
    <FlipBook
      pages={pages}
      onCurChange={setCurrentPage}
      registerGoTo={registerGoTo}
      registerStartRiffle={registerStartRiffle}
    />
  )
}
