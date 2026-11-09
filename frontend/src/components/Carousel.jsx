import { useRef } from 'react'
import { motion } from 'framer-motion'
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi'
import MovieCard from './MovieCard'
import styles from './Carousel.module.css'

export default function Carousel({ title, films, onFilmClick }) {
  const ref = useRef(null)

  const scroll = dir => {
    if (!ref.current) return
    ref.current.scrollBy({ left: dir * 600, behavior: 'smooth' })
  }

  if (!films?.length) return null

  return (
    <section className={styles.section}>
      <div className={styles.header}>
        <h2 className={styles.title}>{title}</h2>
        <div className={styles.arrows}>
          <button className={styles.arrow} onClick={() => scroll(-1)}><FiChevronLeft size={18} /></button>
          <button className={styles.arrow} onClick={() => scroll(1)}><FiChevronRight size={18} /></button>
        </div>
      </div>

      <div className={styles.track} ref={ref}>
        {films.map((film, i) => (
          <MovieCard
            key={film.id}
            film={film}
            onClick={onFilmClick}
            rank={title === 'Tendances' ? `#${i + 1}` : null}
          />
        ))}
      </div>
    </section>
  )
}
