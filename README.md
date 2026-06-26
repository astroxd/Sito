# 🚀 AnimeHub: La Next-Gen Community per Appassionati

**AnimeHub** è un ecosistema digitale progettato per trasformare la visione dei propri anime in un’esperienza sociale, analitica e gamificata. Sviluppato con **Ionic/Angular** per il client, **Node.js/Express** per il backend e **SQLite3** come database locale.

---

## 🛠️ Stack Tecnologico

* **Client (Frontend):** Ionic + Angular (Signals & Route Guards)
* **Server (Backend):** Node.js + Express (Architettura MVC + JWT Auth)
* **Database:** SQLite3
* **API Esterne:** Gateway GraphQL di AniList (catalogo anime)

---

## 🚀 Come Avviare il Progetto Localmente

### Prerequisiti
Assicurati di avere installato sul tuo computer:
* [Node.js](https://nodejs.org/) (v18 o superiore)
* Ionic CLI installato globalmente:
    ```bash
    npm install -g @ionic/cli
    ```

---

### 1. Clonare il progetto
Apri il terminale e clona la repository sul tuo computer:
```bash
git clone https://github.com/astroxd/Sito.git
cd Sito

```

### 2. Avviare il Server (Backend)

Apri il terminale nella cartella del progetto e digita:

```bash
cd server
npm install
npm run dev

```

*Il server si avvierà in modalità di sviluppo (di default sulla porta `3001`).*

### 3. Avviare il Client (Frontend)

Apri un **nuovo** terminale sempre nella cartella principale del progetto e digita:

```bash
cd client
npm install
ionic serve

```

*L'applicazione Ionic aprirà automaticamente una scheda nel tuo browser (di default su `http://localhost:8100`).*

## 📊 Schema dei Dati

Il diagramma relazionale delle tabelle SQL utilizzate per la persistenza dei dati è visionabile qui: [DrawSQL - AnimeHub Diagram](https://drawsql.app/teams/a_stro/diagrams/sito).
