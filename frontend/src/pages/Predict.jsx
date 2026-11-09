import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import axios from 'axios'
import styles from './Predict.module.css'

const GENRE_COLORS = {
  Action: '#e63946', Adventure: '#f5a623', Comedy: '#50fa7b', Drama: '#8be9fd'
}

function Field({ label, hint, children }) {
  return (
    <div className={styles.field}>
      <label className={styles.fieldLabel}>{label}</label>
      {hint && <span className={styles.fieldHint}>{hint}</span>}
      {children}
    </div>
  )
}

function Slider({ label, hint, min, max, step, value, onChange, format }) {
  return (
    <Field label={label} hint={hint}>
      <div className={styles.sliderWrap}>
        <input
          type="range" min={min} max={max} step={step}
          value={value} onChange={e => onChange(Number(e.target.value))}
          className={styles.slider}
        />
        <span className={styles.sliderVal}>{format ? format(value) : value}</span>
      </div>
    </Field>
  )
}

function NumInput({ label, hint, min, max, step, value, onChange, prefix, suffix }) {
  return (
    <Field label={label} hint={hint}>
      <div className={styles.numWrap}>
        {prefix && <span className={styles.numPrefix}>{prefix}</span>}
        <input
          type="number" min={min} max={max} step={step}
          value={value}
          onChange={e => onChange(Number(e.target.value))}
          className={styles.numInput}
        />
        {suffix && <span className={styles.numSuffix}>{suffix}</span>}
      </div>
    </Field>
  )
}

function ToggleGroup({ label, hint, options, value, onChange }) {
  return (
    <Field label={label} hint={hint}>
      <div className={styles.toggleGroup}>
        {options.map(opt => (
          <button
            key={opt.value}
            className={`${styles.toggleBtn} ${value === opt.value ? styles.toggleActive : ''}`}
            onClick={() => onChange(opt.value)}
            type="button"
          >
            {opt.label}
          </button>
        ))}
      </div>
    </Field>
  )
}

const MONTHS = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc']

export default function Predict() {
  const [form, setForm] = useState({
    vote_count: 5000, popularity: 50, vote_average: 7.0,
    budget_m: 50, revenue_m: 100, runtime: 110,
    release_year: 2018, release_month: 6,
    is_english: 1, nb_production_companies: 3,
    nb_production_countries: 2, nb_spoken_languages: 2,
    has_tagline: 1, has_homepage: 0, nb_keywords: 15,
  })
  const [result,  setResult]  = useState(null)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState(null)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const profit = (form.revenue_m - form.budget_m) * 1e6

  const handleSubmit = async () => {
    setLoading(true)
    setError(null)
    try {
      const features = {
        vote_count:              form.vote_count,
        popularity:              form.popularity,
        vote_average:            form.vote_average,
        budget:                  form.budget_m * 1e6,
        revenue:                 form.revenue_m * 1e6,
        runtime:                 form.runtime,
        release_year:            form.release_year,
        release_month:           form.release_month,
        is_english:              form.is_english,
        nb_production_companies: form.nb_production_companies,
        nb_production_countries: form.nb_production_countries,
        nb_spoken_languages:     form.nb_spoken_languages,
        has_tagline:             form.has_tagline,
        has_homepage:            form.has_homepage,
        nb_keywords:             form.nb_keywords,
        profit,
      }
      const { data } = await axios.post('/api/predict', { features })
      setResult(data)
    } catch (e) {
      setError('Impossible de contacter le serveur. Vérifiez que l\'API est lancée.')
    } finally {
      setLoading(false)
    }
  }

  const positifs = result ? Object.entries(result).filter(([, r]) => r.pred === 1) : []

  return (
    <div className={styles.page}>
      <div className={styles.inner}>
        {/* Header */}
        <div className={styles.header}>
          <h1 className={styles.title}>🔮 Prédire un genre</h1>
          <p className={styles.sub}>Décrivez les caractéristiques d'un film et vos modèles prédisent ses genres.</p>
        </div>

        <div className={styles.layout}>
          {/* ── Formulaire ── */}
          <div className={styles.form}>

            {/* Bloc 1 — Réception */}
            <div className={styles.bloc}>
              <h2 className={styles.blocTitle}>⭐ Popularité & Réception</h2>
              <div className={styles.blocGrid}>
                <Slider label="Note moyenne" min={1} max={10} step={0.1}
                  value={form.vote_average} onChange={v => set('vote_average', v)}
                  format={v => `${v.toFixed(1)} / 10`} />
                <NumInput label="Nombre de votes" min={0} max={500000} step={500}
                  value={form.vote_count} onChange={v => set('vote_count', v)} />
                <NumInput label="Score de popularité" min={0} max={1000} step={5}
                  value={form.popularity} onChange={v => set('popularity', v)} />
              </div>
            </div>

            {/* Bloc 2 — Finance */}
            <div className={styles.bloc}>
              <h2 className={styles.blocTitle}>💰 Budget & Revenus</h2>
              <div className={styles.blocGrid}>
                <NumInput label="Budget" min={0} max={600} step={5}
                  value={form.budget_m} onChange={v => set('budget_m', v)}
                  suffix="M$" />
                <NumInput label="Recettes" min={0} max={3000} step={10}
                  value={form.revenue_m} onChange={v => set('revenue_m', v)}
                  suffix="M$" />
                <Field label="Profit estimé">
                  <div className={styles.profitDisplay}
                    style={{ color: profit >= 0 ? '#50fa7b' : '#e63946' }}>
                    {profit >= 0 ? '+' : ''}{(profit / 1e6).toFixed(0)} M$
                    <span style={{ marginLeft: 6 }}>{profit >= 0 ? '📈' : '📉'}</span>
                  </div>
                </Field>
              </div>
            </div>

            {/* Bloc 3 — Caractéristiques */}
            <div className={styles.bloc}>
              <h2 className={styles.blocTitle}>🎬 Caractéristiques</h2>
              <div className={styles.blocGrid}>
                <Slider label="Durée" min={60} max={250} step={5}
                  value={form.runtime} onChange={v => set('runtime', v)}
                  format={v => `${v} min`} />
                <Slider label="Année de sortie" min={1950} max={2025} step={1}
                  value={form.release_year} onChange={v => set('release_year', v)} />
                <Field label="Mois de sortie">
                  <div className={styles.monthGrid}>
                    {MONTHS.map((m, i) => (
                      <button key={i+1} type="button"
                        className={`${styles.monthBtn} ${form.release_month === i+1 ? styles.monthActive : ''}`}
                        onClick={() => set('release_month', i+1)}>
                        {m}
                      </button>
                    ))}
                  </div>
                </Field>
              </div>
            </div>

            {/* Bloc 4 — Production */}
            <div className={styles.bloc}>
              <h2 className={styles.blocTitle}>🏭 Production</h2>
              <div className={styles.blocGrid}>
                <ToggleGroup label="Film en anglais ?"
                  options={[{ value: 1, label: '🇬🇧 Oui' }, { value: 0, label: '🌍 Non' }]}
                  value={form.is_english} onChange={v => set('is_english', v)} />
                <Slider label="Sociétés de production" min={1} max={15} step={1}
                  value={form.nb_production_companies} onChange={v => set('nb_production_companies', v)} />
                <Slider label="Pays de production" min={1} max={10} step={1}
                  value={form.nb_production_countries} onChange={v => set('nb_production_countries', v)} />
                <Slider label="Langues parlées" min={1} max={10} step={1}
                  value={form.nb_spoken_languages} onChange={v => set('nb_spoken_languages', v)} />
              </div>
            </div>

            {/* Bloc 5 — Médias */}
            <div className={styles.bloc}>
              <h2 className={styles.blocTitle}>📣 Présence médiatique</h2>
              <div className={styles.blocGrid}>
                <ToggleGroup label="Le film a un slogan ?"
                  options={[{ value: 1, label: '✅ Oui' }, { value: 0, label: '❌ Non' }]}
                  value={form.has_tagline} onChange={v => set('has_tagline', v)} />
                <ToggleGroup label="Le film a un site officiel ?"
                  options={[{ value: 1, label: '✅ Oui' }, { value: 0, label: '❌ Non' }]}
                  value={form.has_homepage} onChange={v => set('has_homepage', v)} />
                <Slider label="Mots-clés associés" min={0} max={80} step={1}
                  value={form.nb_keywords} onChange={v => set('nb_keywords', v)} />
              </div>
            </div>

            {/* Bouton */}
            <motion.button
              className={styles.submitBtn}
              onClick={handleSubmit}
              disabled={loading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {loading
                ? <><span className={styles.spinner} /> Prédiction en cours...</>
                : '✨ Prédire les genres'}
            </motion.button>

            {error && <p className={styles.error}>{error}</p>}
          </div>

          {/* ── Résultats ── */}
          <div className={styles.results}>
            <div className={styles.resultsSticky}>
              <h2 className={styles.resultsTitle}>📊 Résultats</h2>

              {!result && !loading && (
                <div className={styles.resultsEmpty}>
                  <div className={styles.emptyIcon}>🎬</div>
                  <p>Remplissez le formulaire et lancez la prédiction pour voir les résultats ici.</p>
                </div>
              )}

              <AnimatePresence>
                {result && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={styles.resultCards}
                  >
                    {Object.entries(result).map(([genre, r], idx) => {
                      const color = GENRE_COLORS[genre] || '#d4af37'
                      const pct   = Math.round(r.proba * 100)
                      const yes   = r.pred === 1
                      return (
                        <motion.div
                          key={genre}
                          className={`${styles.resultCard} ${yes ? styles.resultYes : ''}`}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.08 }}
                        >
                          <div className={styles.resultTop}>
                            <span className={styles.resultGenre} style={{ color }}>{genre}</span>
                            <span className={`${styles.resultVerdict} ${yes ? styles.verdictYes : styles.verdictNo}`}>
                              {yes ? '✅ OUI' : '❌ NON'}
                            </span>
                          </div>
                          <div className={styles.resultBarRow}>
                            <div className={styles.resultBarBg}>
                              <motion.div
                                className={styles.resultBarFill}
                                style={{ background: color }}
                                initial={{ width: 0 }}
                                animate={{ width: `${pct}%` }}
                                transition={{ duration: 0.7, delay: idx * 0.08 + 0.1 }}
                              />
                            </div>
                            <span className={styles.resultPct}>{pct}%</span>
                          </div>
                        </motion.div>
                      )
                    })}

                    {/* Résumé */}
                    <div className={styles.summary}>
                      {positifs.length > 0 ? (
                        <>
                          <span className={styles.summaryLabel}>Genres prédits :</span>
                          <div className={styles.summaryBadges}>
                            {positifs.map(([g]) => (
                              <span key={g} className={styles.summaryBadge}
                                style={{ background: `${GENRE_COLORS[g]}22`, color: GENRE_COLORS[g], borderColor: `${GENRE_COLORS[g]}55` }}>
                                {g}
                              </span>
                            ))}
                          </div>
                        </>
                      ) : (
                        <span className={styles.summaryLabel} style={{ color: 'var(--muted)' }}>
                          🤔 Aucun genre prédit — ajustez les valeurs
                        </span>
                      )}
                    </div>

                    <button className={styles.resetBtn} onClick={() => setResult(null)}>
                      ↺ Réinitialiser
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
