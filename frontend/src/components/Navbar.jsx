import { useState, useEffect } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { FiSearch, FiMenu, FiX } from 'react-icons/fi'
import styles from './Navbar.module.css'

export default function Navbar() {
  const [scrolled,  setScrolled]  = useState(false)
  const [menuOpen,  setMenuOpen]  = useState(false)
  const [search,    setSearch]    = useState('')
  const [showSearch,setShowSearch]= useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const handleSearch = e => {
    e.preventDefault()
    if (search.trim()) {
      navigate(`/browse?search=${encodeURIComponent(search.trim())}`)
      setSearch('')
      setShowSearch(false)
    }
  }

  const links = [
    { to: '/',        label: 'Accueil' },
    { to: '/browse',  label: 'Explorer' },
    { to: '/predict', label: 'Prédire' },
    { to: '/quiz',    label: '🍿 Pour Vous' },
  ]

  return (
    <motion.nav
      className={`${styles.nav} ${scrolled ? styles.scrolled : ''}`}
      initial={{ y: -80 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      <div className={styles.inner}>
        {/* Logo */}
        <NavLink to="/" className={styles.logo}>
          <span className={styles.logoIcon}>🎬</span>
          <span className={styles.logoText}>Ciné<span>Predict</span></span>
        </NavLink>

        {/* Links desktop */}
        <ul className={styles.links}>
          {links.map(l => (
            <li key={l.to}>
              <NavLink
                to={l.to}
                className={({ isActive }) =>
                  `${styles.link} ${isActive ? styles.active : ''}`
                }
              >
                {l.label}
              </NavLink>
            </li>
          ))}
        </ul>

        {/* Search */}
        <div className={styles.actions}>
          {showSearch ? (
            <motion.form
              onSubmit={handleSearch}
              className={styles.searchForm}
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 220, opacity: 1 }}
            >
              <input
                autoFocus
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Titre, genre..."
                className={styles.searchInput}
              />
              <button type="button" onClick={() => setShowSearch(false)}>
                <FiX size={16} />
              </button>
            </motion.form>
          ) : (
            <button className={styles.iconBtn} onClick={() => setShowSearch(true)}>
              <FiSearch size={18} />
            </button>
          )}
          <button className={styles.iconBtn} onClick={() => setMenuOpen(o => !o)}>
            {menuOpen ? <FiX size={20} /> : <FiMenu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <motion.div
          className={styles.mobileMenu}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {links.map(l => (
            <NavLink
              key={l.to}
              to={l.to}
              className={styles.mobileLink}
              onClick={() => setMenuOpen(false)}
            >
              {l.label}
            </NavLink>
          ))}
        </motion.div>
      )}
    </motion.nav>
  )
}
