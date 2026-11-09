import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import Browse from './pages/Browse'
import Predict from './pages/Predict'
import Quiz from './pages/Quiz'

export default function App() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <Navbar />
      <Routes>
        <Route path="/"        element={<Home />} />
        <Route path="/browse"  element={<Browse />} />
        <Route path="/predict" element={<Predict />} />
        <Route path="/quiz"    element={<Quiz />} />
      </Routes>
    </div>
  )
}
