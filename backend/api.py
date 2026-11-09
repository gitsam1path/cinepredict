"""
CinéPredict — API FastAPI
Lancer (depuis le dossier backend) : uvicorn api:app --reload --port 8000
"""

import os
import warnings
import requests
import joblib
import numpy as np
import pandas as pd
from concurrent.futures import ThreadPoolExecutor
from functools import lru_cache
from typing import Optional, List
from fastapi import FastAPI, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

warnings.filterwarnings("ignore")

app = FastAPI(title="CinéPredict API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─────────────────────────────────────────────────────────────────
# CONFIG
# ─────────────────────────────────────────────────────────────────
BASE_DIR  = os.path.dirname(os.path.abspath(__file__))
DATA_DIR  = os.path.join(BASE_DIR, "..")           # dossier cinepredict_final
MODEL_DIR = os.path.join(DATA_DIR, "models_local")
CSV_PATH  = os.path.join(DATA_DIR, "movies_features_v3.csv")

# La clé TMDb (affiches des films) se lit dans une variable d'environnement,
# ou dans un fichier .env à la racine du projet (voir .env.example).
# Elle ne doit JAMAIS être écrite dans le code : il finit sur GitHub.
def _load_dotenv(path):
    if os.path.exists(path):
        with open(path, encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    k, v = line.split("=", 1)
                    os.environ.setdefault(k.strip(), v.strip().strip('"').strip("'"))

_load_dotenv(os.path.join(DATA_DIR, ".env"))
TMDB_KEY = os.getenv("TMDB_API_KEY", "")

GENRES_CIBLES = ["Action", "Adventure", "Comedy", "Drama"]
FEATURES = [
    "vote_count", "popularity", "vote_average",
    "budget", "revenue", "runtime",
    "release_year", "release_month",
    "is_english", "nb_production_companies",
    "nb_production_countries", "nb_spoken_languages",
    "has_tagline", "has_homepage", "nb_keywords", "profit",
]
TOUS_GENRES = [
    "Action","Adventure","Animation","Comedy","Crime",
    "Documentary","Drama","Family","Fantasy","Horror",
    "Music","Mystery","Romance","Science_Fiction","Thriller","War",
]

# ─────────────────────────────────────────────────────────────────
# CHARGEMENT AU DÉMARRAGE
# ─────────────────────────────────────────────────────────────────
print("🎬 Chargement des données...")
try:
    df = pd.read_csv(CSV_PATH)
    print(f"   ✅ {len(df):,} films chargés")
except Exception as e:
    print(f"   ❌ Erreur CSV : {e}")
    df = pd.DataFrame()

print("🤖 Chargement des modèles...")
modeles = {}
for genre in GENRES_CIBLES:
    path = os.path.join(MODEL_DIR, genre.lower(), "model.pkl")
    if os.path.exists(path):
        try:
            modeles[genre] = joblib.load(path)
            print(f"   ✅ {genre}")
        except Exception as e:
            print(f"   ❌ {genre} : {e}")
            modeles[genre] = None
    else:
        print(f"   ⚠️  {genre} introuvable ({path})")
        modeles[genre] = None

# ─────────────────────────────────────────────────────────────────
# HELPERS
# ─────────────────────────────────────────────────────────────────
# Si TMDb ne répond pas (pas d'internet, clé invalide), on arrête de l'appeler
# pour ne pas ralentir toute l'application : le frontend affiche alors
# des affiches générées localement.
_tmdb_ok = {"value": bool(TMDB_KEY)}


@lru_cache(maxsize=4000)
def get_poster(tmdb_id: int) -> str:
    """URL de l'affiche TMDb du film, ou "" si indisponible."""
    if not _tmdb_ok["value"] or not tmdb_id:
        return ""
    try:
        r = requests.get(
            f"https://api.themoviedb.org/3/movie/{tmdb_id}",
            params={"api_key": TMDB_KEY, "language": "fr-FR"},
            timeout=4,
        )
        if r.status_code == 401:  # clé refusée
            _tmdb_ok["value"] = False
        elif r.status_code == 200:
            path = r.json().get("poster_path")
            if path:
                return f"https://image.tmdb.org/t/p/w500{path}"
    except requests.RequestException:
        _tmdb_ok["value"] = False  # réseau indisponible : on n'insiste pas
    return ""


def posters_for(ids) -> dict:
    """Récupère plusieurs affiches en parallèle (bien plus rapide qu'une par une)."""
    ids = [int(i) for i in ids]
    with ThreadPoolExecutor(max_workers=12) as pool:
        return dict(zip(ids, pool.map(get_poster, ids)))


def row_to_dict(row: pd.Series, poster: Optional[str] = None) -> dict:
    genres_list = [g.strip() for g in str(row.get("genres","")).split(",") if g.strip()]
    return {
        "id":           int(row.get("id", 0)),
        "title":        str(row.get("title", "")),
        "genres":       genres_list,
        "vote_average": round(float(row.get("vote_average", 0)), 1),
        "vote_count":   int(row.get("vote_count", 0)),
        "popularity":   round(float(row.get("popularity", 0)), 1),
        "release_year": int(row.get("release_year", 0)),
        "release_month":int(row.get("release_month", 0)),
        "runtime":      int(row.get("runtime", 0)),
        "budget":       float(row.get("budget", 0)),
        "revenue":      float(row.get("revenue", 0)),
        "profit":       float(row.get("profit", 0)),
        "is_english":   int(row.get("is_english", 0)),
        "nb_production_companies":  int(row.get("nb_production_companies", 0)),
        "nb_production_countries":  int(row.get("nb_production_countries", 0)),
        "nb_spoken_languages":      int(row.get("nb_spoken_languages", 0)),
        "has_tagline":  int(row.get("has_tagline", 0)),
        "has_homepage": int(row.get("has_homepage", 0)),
        "nb_keywords":  int(row.get("nb_keywords", 0)),
        "poster":       poster if poster is not None else get_poster(int(row.get("id", 0))),
        "genre_flags": {
            g: int(row.get(f"genre_{g}", 0)) for g in TOUS_GENRES
        },
    }


def rows_to_dicts(subset: pd.DataFrame) -> list:
    posters = posters_for(subset["id"])
    return [row_to_dict(r, posters.get(int(r["id"]), "")) for _, r in subset.iterrows()]


# ─────────────────────────────────────────────────────────────────
# ROUTES
# ─────────────────────────────────────────────────────────────────
@app.get("/api/status")
def status():
    return {
        "films":   len(df),
        "modeles": {g: (m is not None) for g, m in modeles.items()},
        "tmdb":    _tmdb_ok["value"],
    }


@app.get("/api/movies")
def get_movies(
    search:  Optional[str]  = Query(None),
    genre:   Optional[str]  = Query(None),
    year_min:Optional[int]  = Query(None),
    year_max:Optional[int]  = Query(None),
    note_min:Optional[float]= Query(None),
    sort:    str            = Query("popularity"),
    page:    int            = Query(1, ge=1),
    per_page:int            = Query(20, ge=1, le=100),
):
    if df.empty:
        return {"total": 0, "page": page, "pages": 0, "films": []}

    mask = pd.Series([True] * len(df), index=df.index)

    if search:
        mask &= df["title"].str.contains(search, case=False, na=False)
    if genre and genre != "Tous":
        col = f"genre_{genre.replace(' ','_')}"
        if col in df.columns:
            mask &= df[col] == 1
    if year_min:
        mask &= df["release_year"] >= year_min
    if year_max:
        mask &= df["release_year"] <= year_max
    if note_min:
        mask &= df["vote_average"] >= note_min

    filtered = df[mask].copy()

    sort_map = {
        "popularity":    ("popularity",    False),
        "vote_average":  ("vote_average",  False),
        "release_year":  ("release_year",  False),
        "vote_count":    ("vote_count",    False),
        "title":         ("title",         True),
    }
    col_sort, asc = sort_map.get(sort, ("popularity", False))
    filtered = filtered.sort_values(col_sort, ascending=asc)

    total  = len(filtered)
    pages  = max(1, (total - 1) // per_page + 1)
    start  = (page - 1) * per_page
    subset = filtered.iloc[start: start + per_page]

    return {
        "total":  total,
        "page":   page,
        "pages":  pages,
        "films":  rows_to_dicts(subset),
    }


@app.get("/api/movies/featured")
def get_featured():
    """Films mis en avant pour le hero/carousels."""
    if df.empty:
        return {}
    top = df[df["vote_count"] > 3000].nlargest(1, "popularity")
    if top.empty:
        return {}
    return row_to_dict(top.iloc[0])


@app.get("/api/movies/carousels")
def get_carousels():
    """Données pour les carousels par genre (12 films chacun)."""
    if df.empty:
        return {}
    result = {}
    sections = [
        ("Tendances",   df.nlargest(12, "popularity")),
        ("Mieux notés", df[df["vote_count"] > 1000].nlargest(12, "vote_average")),
        ("Action",      df[df["genre_Action"] == 1].nlargest(12, "popularity")),
        ("Comédie",     df[df["genre_Comedy"] == 1].nlargest(12, "popularity")),
        ("Drama",       df[df["genre_Drama"] == 1].nlargest(12, "vote_average")),
        ("Thriller",    df[df["genre_Thriller"] == 1].nlargest(12, "popularity")),
        ("Sci-Fi",      df[df["genre_Science_Fiction"] == 1].nlargest(12, "popularity")),
        ("Aventure",    df[df["genre_Adventure"] == 1].nlargest(12, "popularity")),
        ("Classiques",  df[df["release_year"] < 2000].nlargest(12, "vote_average")),
    ]
    # On récupère toutes les affiches d'un coup, en parallèle
    all_ids = pd.concat([sub["id"] for _, sub in sections]).unique()
    posters = posters_for(all_ids)
    for label, subset in sections:
        result[label] = [row_to_dict(r, posters.get(int(r["id"]), "")) for _, r in subset.iterrows()]
    return result


@app.get("/api/movies/{movie_id}")
def get_movie(movie_id: int):
    if df.empty:
        raise HTTPException(404, "Dataset non chargé")
    row = df[df["id"] == movie_id]
    if row.empty:
        raise HTTPException(404, "Film introuvable")
    return row_to_dict(row.iloc[0])


# ─────────────────────────────────────────────────────────────────
# PRÉDICTION
# ─────────────────────────────────────────────────────────────────
class PredictRequest(BaseModel):
    features: dict

@app.post("/api/predict")
def predict(req: PredictRequest):
    feats = req.features
    X = pd.DataFrame([{col: feats.get(col, 0) for col in FEATURES}])
    results = {}
    for genre, m in modeles.items():
        if m is None:
            results[genre] = {"pred": 0, "proba": 0.0}
            continue
        try:
            pred  = int(m.predict(X)[0])
            proba = round(float(m.predict_proba(X)[0][1]), 4)
        except Exception:
            pred, proba = 0, 0.0
        results[genre] = {"pred": pred, "proba": proba}
    return results


# ─────────────────────────────────────────────────────────────────
# RECOMMANDATIONS
# ─────────────────────────────────────────────────────────────────
FILMS_QUIZ = [
    {"id": 278,    "title": "The Shawshank Redemption", "genres": ["Drama","Crime"],                        "year": 1994, "emoji": "🏛️"},
    {"id": 680,    "title": "Pulp Fiction",              "genres": ["Thriller","Crime"],                     "year": 1994, "emoji": "🔫"},
    {"id": 13,     "title": "Forrest Gump",              "genres": ["Comedy","Drama","Romance"],             "year": 1994, "emoji": "🏃"},
    {"id": 603,    "title": "The Matrix",                "genres": ["Action","Science_Fiction"],             "year": 1999, "emoji": "💊"},
    {"id": 597,    "title": "Titanic",                   "genres": ["Drama","Romance"],                      "year": 1997, "emoji": "🚢"},
    {"id": 550,    "title": "Fight Club",                "genres": ["Drama"],                                "year": 1999, "emoji": "👊"},
    {"id": 120,    "title": "Lord of the Rings",         "genres": ["Adventure","Fantasy","Action"],         "year": 2001, "emoji": "💍"},
    {"id": 671,    "title": "Harry Potter",              "genres": ["Adventure","Fantasy"],                  "year": 2001, "emoji": "🧙"},
    {"id": 19995,  "title": "Avatar",                    "genres": ["Action","Adventure","Fantasy"],         "year": 2009, "emoji": "🌿"},
    {"id": 27205,  "title": "Inception",                 "genres": ["Action","Science_Fiction","Adventure"], "year": 2010, "emoji": "🌀"},
    {"id": 157336, "title": "Interstellar",              "genres": ["Adventure","Drama","Science_Fiction"],  "year": 2014, "emoji": "🚀"},
    {"id": 68718,  "title": "Django Unchained",          "genres": ["Drama","Western"],                      "year": 2012, "emoji": "🤠"},
    {"id": 106646, "title": "The Wolf of Wall Street",   "genres": ["Crime","Drama","Comedy"],               "year": 2013, "emoji": "💰"},
    {"id": 475557, "title": "Joker",                     "genres": ["Crime","Thriller","Drama"],             "year": 2019, "emoji": "🃏"},
    {"id": 11324,  "title": "Shutter Island",            "genres": ["Drama","Thriller","Mystery"],           "year": 2010, "emoji": "🏚️"},
]

CHOIX_POIDS = {"love": 2.0, "like": 1.0, "dislike": -1.0, "unseen_yes": 0.7, "unseen_no": -0.3}

QUESTIONS_PREFS = [
    {"key": "ambiance", "label": "🎭 Ambiance préférée",
     "choix": {
         "Rires & légèreté":      {"Comedy": 2,"Animation": 1,"Family": 1},
         "Frissons & tension":    {"Horror": 2,"Thriller": 2,"Mystery": 1},
         "Épopée & aventure":     {"Adventure": 2,"Action": 1,"Fantasy": 1},
         "Émotions & profondeur": {"Drama": 2,"Romance": 1},
         "Réflexion & intrigue":  {"Science_Fiction": 2,"Mystery": 1,"Crime": 1},
     }},
    {"key": "rythme", "label": "⚡ Rythme souhaité",
     "choix": {
         "Haletant, plein d'action": {"Action": 2,"Thriller": 1,"Adventure": 1},
         "Lent mais intense":        {"Drama": 2,"Mystery": 1},
         "Drôle et détendu":         {"Comedy": 2,"Family": 1},
         "Surprenant, inattendu":    {"Thriller": 1,"Mystery": 2,"Crime": 1},
         "Équilibré":                {},
     }},
    {"key": "epoque", "label": "📅 Époque préférée",
     "choix": {"Classiques (avant 2000)": "classic", "Années 2000–2010": "2000s",
               "Productions récentes": "recent", "Peu importe": "any"}},
    {"key": "format", "label": "🌍 Type de film",
     "choix": {"Blockbusters": "popular", "Films intimistes": "indie", "Les deux": "any"}},
    {"key": "fin", "label": "🎬 Fin préférée",
     "choix": {
         "Happy end":             {"Comedy": 1,"Romance": 1,"Family": 1},
         "Fin ouverte":           {"Drama": 1,"Mystery": 1,"Science_Fiction": 1},
         "Twist final":           {"Thriller": 2,"Mystery": 2,"Crime": 1},
         "Fin tragique":          {"Drama": 2,"War": 1},
         "Peu importe":           {},
     }},
]


class RecoRequest(BaseModel):
    films:  dict   # {title: choix}
    prefs:  dict   # {key: valeur}

@app.get("/api/quiz/films")
def quiz_films():
    posters = posters_for([f["id"] for f in FILMS_QUIZ])
    return [{**f, "poster": posters[f["id"]]} for f in FILMS_QUIZ]

@app.get("/api/quiz/questions")
def quiz_questions():
    return QUESTIONS_PREFS

@app.post("/api/recommend")
def recommend(req: RecoRequest):
    scores_genres = {g: 0.0 for g in TOUS_GENRES}

    # Contributions des films évalués
    for film in FILMS_QUIZ:
        choix = req.films.get(film["title"], "unseen_no")
        poids = CHOIX_POIDS.get(choix, 0)
        for g in film["genres"]:
            scores_genres[g] = scores_genres.get(g, 0) + poids

    # Contributions des préférences
    for q in QUESTIONS_PREFS:
        rep = req.prefs.get(q["key"])
        if rep:
            contrib = q["choix"].get(rep, {})
            if isinstance(contrib, dict):
                for g, v in contrib.items():
                    scores_genres[g] = scores_genres.get(g, 0) + v

    epoque = req.prefs.get("epoque", "any")
    format_ = req.prefs.get("format", "any")
    max_gs  = max(abs(v) for v in scores_genres.values()) or 1

    ids_vus = [f["id"] for f in FILMS_QUIZ]
    subset  = df[~df["id"].isin(ids_vus)].copy()

    def score(row):
        s = 0.0
        for g in TOUS_GENRES:
            if row.get(f"genre_{g}", 0) == 1:
                s += scores_genres.get(g, 0) / max_gs * 3
        s += (row.get("vote_average", 5) - 5) * 0.4
        if format_ == "popular":
            s += min(row.get("popularity", 0) / 50, 2)
        elif format_ == "indie":
            p = row.get("popularity", 0)
            s += 1 if p < 30 else (-0.5 if p > 100 else 0)
        yr = row.get("release_year", 2000)
        if epoque == "classic" and yr < 2000:         s += 1.5
        elif epoque == "2000s" and 2000 <= yr <= 2010: s += 1.5
        elif epoque == "recent" and yr > 2010:         s += 1.5
        elif epoque != "any":                          s -= 0.5
        s += min(row.get("vote_count", 0) / 5000, 1.5)
        return s

    subset["_score"] = subset.apply(score, axis=1)
    top = subset.nlargest(12, "_score")

    max_score = top["_score"].max() or 1
    films_out = []
    posters = posters_for(top["id"])
    for _, row in top.iterrows():
        d = row_to_dict(row, posters.get(int(row["id"]), ""))
        d["score"]         = round(float(row["_score"]), 3)
        d["compatibilite"] = min(int((row["_score"] / max_score) * 100), 100)
        films_out.append(d)

    profil_top = sorted(scores_genres.items(), key=lambda x: x[1], reverse=True)[:5]

    return {
        "films":  films_out,
        "profil": [{"genre": g, "score": round(v, 2)} for g, v in profil_top if v > 0],
    }
