import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import Carousel from '../components/Carousel'
import MovieModal from '../components/MovieModal'
import styles from './Home.module.css'
import { posterOf } from '../utils/poster'

export default function Home() {
  const [featured,   setFeatured]   = useState(null)
  const [carousels,  setCarousels]  = useState({})
  const [selected,   setSelected]   = useState(null)
  const [imgError,   setImgError]   = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    axios.get('/api/movies/featured').then(r => setFeatured(r.data)).catch(() => {})
    axios.get('/api/movies/carousels').then(r => setCarousels(r.data)).catch(() => {})
  }, [])

  return (
    <div className={styles.page}>
      {/* ── Hero ── */}
      {featured && (
        <section className={styles.hero}>
          {/* Backdrop blur image */}
          <div className={styles.heroBg}>
            <img
              src={posterOf(featured, imgError)}
              alt=""
              className={styles.heroBgImg}
              onError={() => setImgError(true)}
            />
            <div className={styles.heroBgOverlay} />
          </div>

          <div className={styles.heroContent}>
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
              className={styles.heroInner}
            >
              <div className={styles.heroGenres}>
                {featured.genres?.slice(0, 3).map(g => (
                  <span key={g} className={styles.heroGenrePill}>{g}</span>
                ))}
              </div>

              <h1 className={styles.heroTitle}>{featured.title}</h1>

              <div className={styles.heroMeta}>
                <span className={styles.heroRating}>⭐ {featured.vote_average?.toFixed(1)}</span>
                <span className={styles.heroDot}>·</span>
                <span>{featured.release_year}</span>
                <span className={styles.heroDot}>·</span>
                <span>{featured.runtime} min</span>
                <span className={styles.heroDot}>·</span>
                <span>🔥 {featured.popularity?.toFixed(0)}</span>
              </div>

              <div className={styles.heroActions}>
                <motion.button
                  className={styles.heroBtn}
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setSelected(featured)}
                >
                  ▶ Voir les détails
                </motion.button>
                <motion.button
                  className={styles.heroBtnSecondary}
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => navigate('/browse')}
                >
                  🔍 Explorer
                </motion.button>
              </div>
            </motion.div>

            {/* Poster */}
            <motion.div
              className={styles.heroPoster}
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
            >
              <img
                src={posterOf(featured, imgError)}
                alt={featured.title}
                className={styles.heroPosterImg}
                onError={() => setImgError(true)}
              />
            </motion.div>
          </div>
        </section>
      )}

      {/* ── Carousels ── */}
      <div className={styles.carousels}>
        {Object.entries(carousels).map(([label, films]) => (
          <Carousel
            key={label}
            title={label}
            films={films}
            onFilmClick={setSelected}
          />
        ))}
      </div>

      {/* ── CTA Recommend ── */}
      <motion.section
        className={styles.cta}
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
      >
        <div className={styles.ctaInner}>
          <div className={styles.ctaIcon}>🍿</div>
          <h2 className={styles.ctaTitle}>Vous ne savez pas quoi regarder ?</h2>
          <p className={styles.ctaSub}>Répondez à quelques questions et on trouve les films faits pour vous.</p>
          <motion.button
            className={styles.ctaBtn}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate('/quiz')}
          >
            Découvrir mes films →
          </motion.button>
        </div>
      </motion.section>

      {selected && <MovieModal film={selected} onClose={() => setSelected(null)} />}
    </div>
  )
}
