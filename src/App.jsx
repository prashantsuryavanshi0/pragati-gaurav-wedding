import { memo } from 'react'
import NavBar               from './components/NavBar'
import FlipBook             from './components/FlipBook/FlipBook'
import HeroSection          from './components/HeroSection'
import CoupleSection        from './components/CoupleSection'
import CelebrationsSection  from './components/CelebrationsSection'
import BigDaySection        from './components/BigDaySection'
import VenueSection         from './components/VenueSection'
import BlessingsFooter      from './components/BlessingsFooter'

// Memoize page components so FlipBook re-renders don't re-render every page
const Pages = [
  memo(HeroSection),
  memo(CoupleSection),
  memo(CelebrationsSection),
  memo(BigDaySection),
  memo(VenueSection),
  memo(BlessingsFooter),
]

export default function App() {
  return (
    <>
      <NavBar />
      <FlipBook pages={Pages} />
    </>
  )
}
