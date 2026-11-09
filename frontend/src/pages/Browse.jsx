import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { FiSearch, FiFilter, FiChevronLeft, FiChevronRight } from 'react-icons/fi'
import axios from 'axios'
import MovieCard from '../components/MovieCard'
import MovieModal from '../components/MovieModal'
import styles from './Browse.module.css'

const GENRES = ['Tous','Action','Adventure','Animation','Comedy','Crime',
                'Documentary','Drama','Family','Fantasy','Horror',
                'Romance','Science_Fiction','Thriller','War']

const SORTS = [
  { val: 'popularity',   label: '🔥 Popularité' },
  { val: 'vote_average', label: '⭐ Note' },
  { val: 'release_year', label: '📅 Année' },
  { val: 'vote_count',   label: '👥 Votes' },
  { val: 'title',        label: '🔤 Titre' },
]

export default function Browse() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [films,    setFilms]    = useState([])
  const [total,    setTotal]    = useState(0)
  const [pages,    setPages]    = useState(1)
  const [loading,  setLoading]  = useState(false)
  const [selected, setSelected] = useState(null)

  const search   = searchParams.get('search')  || ''
  const genre    = searchParams.get('genre')   || 'Tous'
  const sort     = searchParams.get('sort')    || 'popularity'
  const page     = parseInt(searchParams.get('page') || '1')
  const noteMin  = parseFloat(searchParams.get('note_min') || '0')

  const set = (key, val) => {
    const p = new URLSearchParams(searchParams)
    p.set(key, val)
    if (key !== 'page') p.set('page', '1')
    setSearchParams(p)
  }

  const fetchFilms = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await axios.get('/api/movies', {
        params: {
          search: search || undefined,
          genre: genre !== 'Tous' ? genre : undefined,
          sort, page, per_page: 24,
          note_min: noteMin > 0 ? noteMin : undefined,
        }
      })
      setFilms(data.films)
      setTotal(data.total)
      setPages(data.pages)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [search, genre, sort, page, noteMin])

  useEffect(() => { fetchFilms() }, [fetchFilms])

  return (
    <div className={styles.page}>
      <div className={styles.pageInner}>
        <div className={styles.pageHeader}>
          <h1 className={styles.pageTitle}>Explorer les films</h1>
          <p className={styles.pageSub}>{total.toLocaleString()} films dans la base</p>
        </div>

        {/* ── Filters ── */}
        <div className={styles.filters}>
          {/* Search */}
          <div className={styles.searchWrap}>
            <FiSearch className={styles.searchIcon} size={15} />
            <input
              className={styles.searchInput}
              placeholder="Rechercher un titre..."
              value={search}
              onChange={e => set('search', e.target.value)}
            />
          </div>

          {/* Sort */}
          <select
            className={styles.select}
            value={sort}
            onChange={e => set('sort', e.target.value)}
          >
            {SORTS.map(s => <option key={s.val} value={s.val}>{s.label}</option>)}
          </select>

          {/* Note min */}
          <div className={styles.noteWrap}>
            <span className={styles.noteLabel}>⭐ ≥ {noteMin.toFixed(1)}</span>
            <input
              type="range" min="0" max="9" step="0.5"
              value={noteMin}
              onChange={e => set('note_min', e.target.value)}
              className={styles.noteRange}
            />
          </div>
        </div>

        {/* ── Genre tabs ── */}
        <div className={styles.genreTabs}>
          {GENRES.map(g => (
            <button
              key={g}
              className={`${styles.genreTab} ${genre === g ? styles.active : ''}`}
              onClick={() => set('genre', g)}
            >
              {g.replace('_', ' ')}
            </button>
          ))}
        </div>

        {/* ── Grid ── */}
        {loading ? (
          <div className={styles.loading}>
            {Array(12).fill(0).map((_, i) => (
              <div key={i} className={styles.skeleton} />
            ))}
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={`${genre}-${sort}-${page}-${search}`}
              className={styles.grid}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
            >
              {films.map(film => (
                <MovieCard
                  key={film.id}
                  film={film}
                  onClick={setSelected}
                />
              ))}
            </motion.div>
          </AnimatePresence>
        )}

        {/* ── Pagination ── */}
        {pages > 1 && (
          <div className={styles.pagination}>
            <button
              className={styles.pageBtn}
              disabled={page <= 1}
              onClick={() => set('page', page - 1)}
            >
              <FiChevronLeft size={16} />
            </button>

            {Array.from({ length: Math.min(pages, 7) }, (_, i) => {
              let p = i + 1
              if (pages > 7) {
                const half = 3
                const start = Math.max(1, page - half)
                const end = Math.min(pages, start + 6)
                p = start + i
                if (p > end) return null
              }
              return (
                <button
                  key={p}
                  className={`${styles.pageBtn} ${p === page ? styles.pageBtnActive : ''}`}
                  onClick={() => set('page', p)}
                >
                  {p}
                </button>
              )
            })}

            <button
              className={styles.pageBtn}
              disabled={page >= pages}
              onClick={() => set('page', page + 1)}
            >
              <FiChevronRight size={16} />
            </button>
          </div>
        )}
      </div>

      {selected && <MovieModal film={selected} onClose={() => setSelected(null)} />}
    </div>
  )
}
