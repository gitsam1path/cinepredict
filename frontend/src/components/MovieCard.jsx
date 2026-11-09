import { useState } from 'react'
import { motion } from 'framer-motion'
import styles from './MovieCard.module.css'
import { posterOf } from '../utils/poster'

const GENRE_COLORS = {
  Action: '#e63946', Adventure: '#f5a623', Comedy: '#50fa7b',
  Drama: '#8be9fd', Thriller: '#bd93f9', Horror: '#ff5555',
  'Science Fiction': '#8be9fd', Romance: '#ff79c6',
  Fantasy: '#f1fa8c', Crime: '#ffb86c', Animation: '#50fa7b',
}

export default function MovieCard({ film, onClick, rank }) {
  const [imgError, setImgError] = useState(false)

  const genreColor = GENRE_COLORS[film.genres?.[0]] || '#d4af37'
  const profit = film.profit > 0

  return (
    <motion.div
      className={styles.card}
      onClick={() => onClick?.(film)}
      whileHover={{ scale: 1.04, zIndex: 10 }}
      transition={{ duration: 0.2 }}
      layout
    >
      {/* Poster */}
      <div className={styles.posterWrap}>
        <img
          src={posterOf(film, imgError)}
          alt={film.title}
          className={styles.poster}
          onError={() => setImgError(true)}
          loading="lazy"
        />

        {/* Overlay on hover */}
        <div className={styles.overlay}>
          <button className={styles.playBtn}>▶</button>
          <div className={styles.overlayInfo}>
            <div className={styles.overlayGenres}>
              {film.genres?.slice(0, 2).map(g => (
                <span key={g} className={styles.genrePill} style={{ borderColor: GENRE_COLORS[g] || '#d4af37', color: GENRE_COLORS[g] || '#d4af37' }}>
                  {g}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Rank badge */}
        {rank && (
          <div className={styles.rank}>{rank}</div>
        )}

        {/* Rating */}
        <div className={styles.rating}>
          ⭐ {film.vote_average?.toFixed(1)}
        </div>
      </div>

      {/* Info */}
      <div className={styles.info}>
        <div className={styles.title}>{film.title}</div>
        <div className={styles.meta}>
          <span>{film.release_year}</span>
          <span className={styles.dot}>·</span>
          <span>{film.runtime}min</span>
          {film.profit !== 0 && (
            <>
              <span className={styles.dot}>·</span>
              <span style={{ color: profit ? '#50fa7b' : '#e63946', fontSize: '0.72rem' }}>
                {profit ? '📈' : '📉'}
              </span>
            </>
          )}
        </div>
      </div>
    </motion.div>
  )
}
