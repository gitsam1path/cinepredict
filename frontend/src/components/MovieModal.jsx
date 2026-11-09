import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FiX, FiStar, FiClock, FiCalendar, FiTrendingUp } from 'react-icons/fi'
import axios from 'axios'
import styles from './MovieModal.module.css'
import { posterOf } from '../utils/poster'

const GENRE_COLORS = {
  Action: '#e63946', Adventure: '#f5a623', Comedy: '#50fa7b',
  Drama: '#8be9fd', Thriller: '#bd93f9', Horror: '#ff5555',
  'Science Fiction': '#8be9fd', Romance: '#ff79c6',
  Fantasy: '#f1fa8c', Crime: '#ffb86c', Animation: '#50fa7b',
}
const GENRE_TARGET_COLORS = {
  Action: '#e63946', Adventure: '#f5a623', Comedy: '#50fa7b', Drama: '#8be9fd'
}

export default function MovieModal({ film, onClose }) {
  const [prediction, setPrediction] = useState(null)
  const [loading,    setLoading]    = useState(false)
  const [imgError,   setImgError]   = useState(false)

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  const handlePredict = async () => {
    setLoading(true)
    try {
      const features = {
        vote_count: film.vote_count, popularity: film.popularity,
        vote_average: film.vote_average, budget: film.budget,
        revenue: film.revenue, runtime: film.runtime,
        release_year: film.release_year, release_month: film.release_month,
        is_english: film.is_english, nb_production_companies: film.nb_production_companies,
        nb_production_countries: film.nb_production_countries,
        nb_spoken_languages: film.nb_spoken_languages,
        has_tagline: film.has_tagline, has_homepage: film.has_homepage,
        nb_keywords: film.nb_keywords, profit: film.profit,
      }
      const { data } = await axios.post('/api/predict', { features })
      setPrediction(data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const formatM = v => v > 0 ? `${(v / 1e6).toFixed(0)}M$` : 'N/A'
  const profit  = film.profit

  return (
    <AnimatePresence>
      <motion.div
        className={styles.backdrop}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className={styles.modal}
          initial={{ scale: 0.9, opacity: 0, y: 40 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 40 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          onClick={e => e.stopPropagation()}
        >
          {/* Close */}
          <button className={styles.close} onClick={onClose}><FiX size={20} /></button>

          {/* Hero */}
          <div className={styles.hero}>
            <div className={styles.posterCol}>
              <img
                src={posterOf(film, imgError)}
                alt={film.title}
                className={styles.poster}
                onError={() => setImgError(true)}
              />
            </div>

            <div className={styles.infoCol}>
              {/* Genres */}
              <div className={styles.genres}>
                {film.genres?.map(g => (
                  <span key={g} className={styles.genrePill}
                    style={{ background: `${GENRE_COLORS[g] || '#d4af37'}22`, color: GENRE_COLORS[g] || '#d4af37', borderColor: `${GENRE_COLORS[g] || '#d4af37'}55` }}>
                    {g}
                  </span>
                ))}
              </div>

              <h1 className={styles.title}>{film.title}</h1>

              {/* Stats row */}
              <div className={styles.statsRow}>
                <div className={styles.stat}>
                  <FiStar className={styles.statIcon} style={{ color: '#f0c84a' }} />
                  <span className={styles.statVal}>{film.vote_average?.toFixed(1)}</span>
                  <span className={styles.statLbl}>/10</span>
                </div>
                <div className={styles.statDiv} />
                <div className={styles.stat}>
                  <FiClock className={styles.statIcon} style={{ color: '#8be9fd' }} />
                  <span className={styles.statVal}>{film.runtime}</span>
                  <span className={styles.statLbl}>min</span>
                </div>
                <div className={styles.statDiv} />
                <div className={styles.stat}>
                  <FiCalendar className={styles.statIcon} style={{ color: '#bd93f9' }} />
                  <span className={styles.statVal}>{film.release_year}</span>
                </div>
                <div className={styles.statDiv} />
                <div className={styles.stat}>
                  <FiTrendingUp className={styles.statIcon} style={{ color: '#50fa7b' }} />
                  <span className={styles.statVal}>{film.popularity?.toFixed(0)}</span>
                  <span className={styles.statLbl}>pop</span>
                </div>
              </div>

              {/* Finance */}
              <div className={styles.finance}>
                <div className={styles.finCard}>
                  <div className={styles.finLbl}>💰 Budget</div>
                  <div className={styles.finVal}>{formatM(film.budget)}</div>
                </div>
                <div className={styles.finCard}>
                  <div className={styles.finLbl}>🎟️ Recettes</div>
                  <div className={styles.finVal}>{formatM(film.revenue)}</div>
                </div>
                <div className={styles.finCard}>
                  <div className={styles.finLbl}>📈 Profit</div>
                  <div className={styles.finVal} style={{ color: profit > 0 ? '#50fa7b' : profit < 0 ? '#e63946' : 'var(--muted)' }}>
                    {profit !== 0 ? `${profit > 0 ? '+' : ''}${(profit / 1e6).toFixed(0)}M$` : 'N/A'}
                  </div>
                </div>
                <div className={styles.finCard}>
                  <div className={styles.finLbl}>👥 Votes</div>
                  <div className={styles.finVal}>{film.vote_count?.toLocaleString()}</div>
                </div>
              </div>

              {/* Production */}
              <div className={styles.prodRow}>
                <span className={styles.prodItem}>🏭 {film.nb_production_companies} société(s)</span>
                <span className={styles.prodItem}>🌍 {film.nb_production_countries} pays</span>
                <span className={styles.prodItem}>🗣️ {film.nb_spoken_languages} langue(s)</span>
                <span className={styles.prodItem}>🏷️ {film.nb_keywords} mots-clés</span>
              </div>
            </div>
          </div>

          {/* Prédiction */}
          <div className={styles.predictSection}>
            <div className={styles.predictHeader}>
              <h3 className={styles.predictTitle}>🤖 Prédiction de genre</h3>
              {!prediction && (
                <button
                  className={styles.predictBtn}
                  onClick={handlePredict}
                  disabled={loading}
                >
                  {loading ? (
                    <span className={styles.spinner} />
                  ) : '✨ Lancer la prédiction'}
                </button>
              )}
            </div>

            {prediction && (
              <motion.div
                className={styles.predictResults}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                {/* Score : combien de genres le modèle a-t-il bien prédits pour ce film ? */}
                {(() => {
                  const entries = Object.entries(prediction).filter(([g]) => film.genre_flags?.[g] !== undefined)
                  const good = entries.filter(([g, r]) => r.pred === film.genre_flags[g]).length
                  return entries.length > 0 && (
                    <p className={styles.predScore}>
                      Le modèle a vu juste sur <strong>{good} genre{good > 1 ? 's' : ''} sur {entries.length}</strong>
                      <span> · « juste » = la prédiction correspond aux vrais genres du film</span>
                    </p>
                  )
                })()}
                {Object.entries(prediction).map(([genre, res]) => {
                  const color   = GENRE_TARGET_COLORS[genre] || '#d4af37'
                  const pct     = Math.round(res.proba * 100)
                  const yes     = res.pred === 1
                  const realVal = film.genre_flags?.[genre]
                  const correct = realVal !== undefined ? res.pred === realVal : null

                  return (
                    <div key={genre} className={`${styles.predItem} ${yes ? styles.predYes : ''}`}>
                      <div className={styles.predLeft}>
                        <span className={styles.predGenre} style={{ color }}>{genre}</span>
                        {correct !== null && (
                          <span
                            className={`${styles.predCorrect} ${correct ? styles.predGood : styles.predBad}`}
                            title={`Genre réel du film : ${realVal === 1 ? 'Oui' : 'Non'}`}
                          >
                            {correct ? 'juste' : 'erreur'}
                          </span>
                        )}
                      </div>
                      <div className={styles.predBar}>
                        <div className={styles.predBarBg}>
                          <motion.div
                            className={styles.predBarFill}
                            style={{ background: color }}
                            initial={{ width: 0 }}
                            animate={{ width: `${pct}%` }}
                            transition={{ duration: 0.6, delay: 0.1 }}
                          />
                        </div>
                        <span className={styles.predPct}>{pct}%</span>
                      </div>
                      <div className={`${styles.predVerdict} ${yes ? styles.verdictYes : styles.verdictNo}`}>
                        {yes ? '✅ OUI' : '❌ NON'}
                      </div>
                    </div>
                  )
                })}
                <button className={styles.resetBtn} onClick={() => setPrediction(null)}>
                  ↺ Réinitialiser
                </button>
              </motion.div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
