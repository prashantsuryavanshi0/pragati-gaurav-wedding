import { memo } from 'react'
import NavBar               from './components/NavBar'
import FlipBookProvider     from './components/FlipBook/FlipBookProvider'
import FlipBookShell        from './components/FlipBook/FlipBookShell'
import MusicPlayer          from './components/MusicPlayer/MusicPlayer'
import HeroSection          from './components/HeroSection'
import CoupleSection        from './components/CoupleSection'
import CelebrationsSection  from './components/CelebrationsSection'
import BigDaySection        from './components/BigDaySection'
import VenueSection         from './components/VenueSection'
import BlessingsFooter      from './components/BlessingsFooter'

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
    <FlipBookProvider>
      <NavBar />
      <MusicPlayer baseUrl={import.meta.env.BASE_URL} />
      <FlipBookShell pages={Pages} />
    </FlipBookProvider>
  )
}
