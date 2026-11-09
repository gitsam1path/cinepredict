import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import axios from 'axios'
import styles from './Quiz.module.css'
import { posterOf } from '../utils/poster'

const CHOICE_OPTIONS = [
  { key: 'love',       emoji: '❤️',  label: "J'adore" },
  { key: 'like',       emoji: '👍',  label: 'J\'aime bien' },
  { key: 'dislike',    emoji: '👎',  label: 'Pas mon truc' },
  { key: 'unseen_yes', emoji: '👀',  label: 'Jamais vu — m\'attire' },
  { key: 'unseen_no',  emoji: '😴',  label: 'Jamais vu — pas intéressé' },
]

const GENRE_COLORS = {
  Action: '#e63946', Adventure: '#f5a623', Comedy: '#50fa7b',
  Drama: '#8be9fd', Thriller: '#bd93f9', Science_Fiction: '#8be9fd',
  Crime: '#ffb86c', Mystery: '#bd93f9', Romance: '#ff79c6',
  Horror: '#ff5555', Fantasy: '#f1fa8c', War: '#aaa',
}

// ── Étape 1 : Cards films ─────────────────────────────────────────────────
function FilmCard({ film, choice, onChoice }) {
  const [imgError, setImgError] = useState(false)

  return (
    <motion.div
      className={`${styles.filmCard} ${choice ? styles.filmCardChosen : ''}`}
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className={styles.filmPosterWrap}>
        <img
          src={posterOf(film, imgError)}
          alt={film.title}
          className={styles.filmPoster}
          onError={() => setImgError(true)}
          loading="lazy"
        />
        {choice && (
          <div className={styles.filmChosenOverlay}>
            <span className={styles.filmChosenEmoji}>
              {CHOICE_OPTIONS.find(o => o.key === choice)?.emoji}
            </span>
          </div>
        )}
      </div>

      <div className={styles.filmInfo}>
        <div className={styles.filmTitle}>{film.title}</div>
        <div className={styles.filmYear}>{film.year}</div>
        <div className={styles.filmGenres}>
          {film.genres?.slice(0, 2).map(g => (
            <span key={g} className={styles.filmGenrePill}
              style={{ color: GENRE_COLORS[g] || '#d4af37', borderColor: `${GENRE_COLORS[g] || '#d4af37'}55`, background: `${GENRE_COLORS[g] || '#d4af37'}15` }}>
              {g.replace('_', ' ')}
            </span>
          ))}
        </div>
      </div>

      <div className={styles.filmChoices}>
        {CHOICE_OPTIONS.map(opt => (
          <button
            key={opt.key}
            className={`${styles.choiceBtn} ${choice === opt.key ? styles.choiceBtnActive : ''}`}
            onClick={() => onChoice(film.title, opt.key)}
            title={opt.label}
          >
            {opt.emoji}
          </button>
        ))}
      </div>
    </motion.div>
  )
}

// ── Étape 2 : Questions ───────────────────────────────────────────────────
function QuestionCard({ question, answer, onAnswer, index }) {
  const choixKeys = Object.keys(question.choix)
  return (
    <motion.div
      className={styles.questionCard}
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.08 }}
    >
      <div className={styles.questionLabel}>{question.label}</div>
      <div className={styles.questionChoices}>
        {choixKeys.map(c => (
          <button
            key={c}
            className={`${styles.questionBtn} ${answer === c ? styles.questionBtnActive : ''}`}
            onClick={() => onAnswer(question.key, c)}
          >
            {c}
          </button>
        ))}
      </div>
    </motion.div>
  )
}

// ── Carte résultat ────────────────────────────────────────────────────────
function RecoCard({ film, rank }) {
  const [imgError, setImgError] = useState(false)

  return (
    <motion.div
      className={styles.recoCard}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: rank * 0.05 }}
      whileHover={{ y: -4 }}
    >
      <div className={styles.recoPosterWrap}>
        <img
          src={posterOf(film, imgError)}
          alt={film.title}
          className={styles.recoPoster}
          onError={() => setImgError(true)}
          loading="lazy"
        />
        <div className={styles.recoRank}>#{rank + 1}</div>
        <div className={styles.recoRating}>⭐ {film.vote_average?.toFixed(1)}</div>

        {/* Compat bar overlay */}
        <div className={styles.recoCompat}>
          <div className={styles.recoCompatBar}
            style={{ width: `${film.compatibilite}%` }} />
          <span className={styles.recoCompatPct}>{film.compatibilite}%</span>
        </div>
      </div>

      <div className={styles.recoInfo}>
        <div className={styles.recoTitle}>{film.title}</div>
        <div className={styles.recoMeta}>{film.release_year} · {film.runtime}min</div>
        <div className={styles.recoGenres}>
          {film.genres?.slice(0, 2).map(g => (
            <span key={g} className={styles.recoGenrePill}
              style={{ color: GENRE_COLORS[g] || '#d4af37', borderColor: `${GENRE_COLORS[g] || '#d4af37'}44`, background: `${GENRE_COLORS[g] || '#d4af37'}12` }}>
              {g}
            </span>
          ))}
        </div>
      </div>
    </motion.div>
  )
}

// ── Page principale ───────────────────────────────────────────────────────
export default function Quiz() {
  const [step,       setStep]       = useState(1) // 1 films / 2 prefs / 3 results
  const [quizFilms,  setQuizFilms]  = useState([])
  const [questions,  setQuestions]  = useState([])
  const [filmChoices,setFilmChoices]= useState({})
  const [prefAnswers,setPrefAnswers]= useState({})
  const [results,    setResults]    = useState(null)
  const [profil,     setProfil]     = useState([])
  const [loading,    setLoading]    = useState(false)

  useEffect(() => {
    axios.get('/api/quiz/films').then(r => setQuizFilms(r.data)).catch(() => {})
    axios.get('/api/quiz/questions').then(r => setQuestions(r.data)).catch(() => {})
  }, [])

  const handleFilmChoice = (title, choice) =>
    setFilmChoices(c => ({ ...c, [title]: choice }))

  const handlePrefAnswer = (key, val) =>
    setPrefAnswers(a => ({ ...a, [key]: val }))

  const canGoStep2 = Object.keys(filmChoices).length >= 5
  const canGetReco = questions.every(q => prefAnswers[q.key])

  const handleGetReco = async () => {
    setLoading(true)
    try {
      const { data } = await axios.post('/api/recommend', {
        films: filmChoices,
        prefs: prefAnswers,
      })
      setResults(data.films)
      setProfil(data.profil)
      setStep(3)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const reset = () => {
    setStep(1); setFilmChoices({}); setPrefAnswers({})
    setResults(null); setProfil([])
  }

  return (
    <div className={styles.page}>
      <div className={styles.inner}>

        {/* Header */}
        <div className={styles.header}>
          <h1 className={styles.title}>🍿 Films pour Vous</h1>
          <p className={styles.sub}>Parlez-nous de vos goûts et on trouve les films parfaits pour vous.</p>

          {/* Progress */}
          <div className={styles.progress}>
            {[1, 2, 3].map(s => (
              <div key={s} className={styles.progressStep}>
                <div className={`${styles.progressDot} ${step >= s ? styles.progressDotActive : ''} ${step === s ? styles.progressDotCurrent : ''}`}>
                  {step > s ? '✓' : s}
                </div>
                <span className={`${styles.progressLabel} ${step >= s ? styles.progressLabelActive : ''}`}>
                  {s === 1 ? 'Vos films' : s === 2 ? 'Vos goûts' : 'Recommandations'}
                </span>
                {s < 3 && <div className={`${styles.progressLine} ${step > s ? styles.progressLineActive : ''}`} />}
              </div>
            ))}
          </div>
        </div>

        <AnimatePresence mode="wait">

          {/* ── ÉTAPE 1 ── */}
          {step === 1 && (
            <motion.div key="step1"
              initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
              <div className={styles.stepHeader}>
                <h2 className={styles.stepTitle}>Ces films, vous les connaissez ?</h2>
                <p className={styles.stepSub}>Évaluez au moins <strong style={{ color: 'var(--gold)' }}>5 films</strong> pour continuer. ({Object.keys(filmChoices).length}/15 évalués)</p>
              </div>

              <div className={styles.filmGrid}>
                {quizFilms.map(film => (
                  <FilmCard
                    key={film.id}
                    film={film}
                    choice={filmChoices[film.title]}
                    onChoice={handleFilmChoice}
                  />
                ))}
              </div>

              <div className={styles.stepFooter}>
                <motion.button
                  className={`${styles.nextBtn} ${!canGoStep2 ? styles.nextBtnDisabled : ''}`}
                  disabled={!canGoStep2}
                  onClick={() => setStep(2)}
                  whileHover={canGoStep2 ? { scale: 1.02 } : {}}
                  whileTap={canGoStep2 ? { scale: 0.98 } : {}}
                >
                  Continuer → ({Object.keys(filmChoices).length}/5 minimum)
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* ── ÉTAPE 2 ── */}
          {step === 2 && (
            <motion.div key="step2"
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <div className={styles.stepHeader}>
                <h2 className={styles.stepTitle}>Vos préférences</h2>
                <p className={styles.stepSub}>Répondez à toutes les questions pour affiner vos recommandations.</p>
              </div>

              <div className={styles.questionsGrid}>
                {questions.map((q, i) => (
                  <QuestionCard
                    key={q.key}
                    question={q}
                    answer={prefAnswers[q.key]}
                    onAnswer={handlePrefAnswer}
                    index={i}
                  />
                ))}
              </div>

              <div className={styles.stepFooter}>
                <button className={styles.backBtn} onClick={() => setStep(1)}>← Retour</button>
                <motion.button
                  className={`${styles.nextBtn} ${!canGetReco ? styles.nextBtnDisabled : ''}`}
                  disabled={!canGetReco || loading}
                  onClick={handleGetReco}
                  whileHover={canGetReco ? { scale: 1.02 } : {}}
                  whileTap={canGetReco ? { scale: 0.98 } : {}}
                >
                  {loading
                    ? <><span className={styles.spinner} /> Calcul en cours...</>
                    : '✨ Obtenir mes recommandations'}
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* ── ÉTAPE 3 ── */}
          {step === 3 && results && (
            <motion.div key="step3"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>

              {/* Profil */}
              {profil.length > 0 && (
                <div className={styles.profilCard}>
                  <span className={styles.profilLabel}>🎭 Votre profil de goûts :</span>
                  <div className={styles.profilBadges}>
                    {profil.map(({ genre, score }) => (
                      <span key={genre} className={styles.profilBadge}
                        style={{ color: GENRE_COLORS[genre] || '#d4af37', borderColor: `${GENRE_COLORS[genre] || '#d4af37'}55`, background: `${GENRE_COLORS[genre] || '#d4af37'}15` }}>
                        {genre.replace('_', ' ')} +{score.toFixed(1)}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className={styles.stepHeader}>
                <h2 className={styles.stepTitle}>🎉 Vos 12 films</h2>
                <p className={styles.stepSub}>Sélectionnés parmi {18000}+ films selon votre profil unique.</p>
              </div>

              <div className={styles.recoGrid}>
                {results.map((film, i) => (
                  <RecoCard key={film.id} film={film} rank={i} />
                ))}
              </div>

              <div className={styles.stepFooter}>
                <button className={styles.resetBtn} onClick={reset}>
                  🔄 Refaire le questionnaire
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
