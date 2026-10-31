import NavBar               from './components/NavBar'
import HeroSection          from './components/HeroSection'
import CoupleSection        from './components/CoupleSection'
import CelebrationsSection  from './components/CelebrationsSection'
import BigDaySection        from './components/BigDaySection'
import VenueSection         from './components/VenueSection'
import BlessingsFooter      from './components/BlessingsFooter'

export default function App() {
  return (
    <>
      <NavBar />
      <main>
        <HeroSection />
        <CoupleSection />
        <CelebrationsSection />
        <BigDaySection />
        <VenueSection />
        <BlessingsFooter />
      </main>
    </>
  )
}
