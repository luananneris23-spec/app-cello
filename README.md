# 🎻 Arco & Alma — Alfabetização Musical para Violoncelo

Aplicativo de estudo e prática para violoncelistas, com foco em alfabetização musical progressiva.

---

## Stack

- **Frontend:** React 18 + Vite
- **Backend/Auth/DB:** Supabase (PostgreSQL + Auth + Storage)
- **Deploy:** Vercel
- **Áudio:** Web Audio API nativa (afinador, metrônomo, gravação)

---

## Funcionalidades

| Módulo | Funcionalidades |
|---|---|
| **Afinador Cromático** | Detecção de pitch via microfone, agulha visual, histograma, cordas soltas do violoncelo |
| **Metrônomo** | BPM 20–240, tap tempo, indicações de andamento (Adagio–Prestissimo), subdivisões, compassos |
| **Escalas** | 13 escalas em ordem de dificuldade, filtros por fase/tipo, graus da escala, sala de prática integrada |
| **Sala de Prática** | Metrônomo + afinador + gravação simultâneos, notas da escala iluminadas ao beat |
| **Método Dotzauer** | 6 exercícios-chave com instruções, metrônomo integrado, link para escala relacionada |
| **Teoria Musical** | Escalas (maior/menor), tonalidade, ritmo, sonoridade e arco, afinação |
| **Gravações** | Gravar, ouvir, salvar no Supabase Storage, gerenciar biblioteca |
| **Progresso** | Gráfico semanal, fases de desenvolvimento, conquistas, sessões recentes |

---

## Deploy — Passo a Passo

### 1. Supabase

1. Acesse [supabase.com](https://supabase.com) e crie um novo projeto
2. No SQL Editor, execute o conteúdo de `supabase-schema.sql`
3. Anote:
   - `Project URL` (Settings → API → Project URL)
   - `anon public key` (Settings → API → Project API Keys)
4. Em **Authentication → Settings**, configure o Site URL como seu domínio Vercel

### 2. GitHub

```bash
git init
git add .
git commit -m "feat: Arco & Alma — initial commit"
git branch -M main
git remote add origin https://github.com/SEU-USUARIO/arco-e-alma.git
git push -u origin main
```

### 3. Vercel

1. Acesse [vercel.com](https://vercel.com) e importe o repositório GitHub
2. Framework preset: **Vite**
3. Em **Environment Variables**, adicione:
   ```
   VITE_SUPABASE_URL = https://SEU-PROJETO.supabase.co
   VITE_SUPABASE_ANON_KEY = sua-anon-key
   ```
4. Clique em **Deploy**

### 4. Local Development

```bash
cp .env.example .env.local
# Edite .env.local com suas chaves
npm install
npm run dev
```

---

## Estrutura do Projeto

```
src/
├── components/
│   └── Layout.jsx          # Sidebar + navegação
├── data/
│   └── musicData.js        # Escalas, Dotzauer, conceitos teóricos
├── lib/
│   └── supabase.js         # Cliente Supabase
├── pages/
│   ├── Auth.jsx            # Login / Cadastro
│   ├── Dashboard.jsx       # Painel inicial
│   ├── Scales.jsx          # Lista de escalas
│   ├── ScalePractice.jsx   # Sala de prática (escala individual)
│   ├── Tuner.jsx           # Afinador cromático
│   ├── Rhythm.jsx          # Metrônomo
│   ├── Theory.jsx          # Teoria musical
│   ├── Dotzauer.jsx        # Método Dotzauer
│   ├── Recordings.jsx      # Gravações
│   └── Progress.jsx        # Progresso e conquistas
├── styles/
│   └── globals.css         # Estilos globais (tema clássico)
├── App.jsx                 # Router + AuthContext
└── main.jsx                # Entry point
```

---

## Escalas Incluídas (ordem de dificuldade)

**Fase I** — Dó Maior, Sol Maior, Lá Menor Natural, Ré Maior  
**Fase II** — Mi Menor Harmônica, Lá Maior, Ré Menor Harmônica, Fá Maior  
**Fase III** — Sol Menor Harmônica, Mi Maior, Si♭ Maior  
**Fase IV** — Dó Menor Melódica, Si Maior

---

## Sobre o Design

Estética **concerto clássico** — paleta de ouro, veludo escuro e marfim.  
Tipografia: Playfair Display (títulos) + Cormorant Garamond (corpo) + IM Fell English (citações).  
Inspirado nos programas de concerto e partituras do século XIX.

---

*"A técnica é o veículo da expressão." — Método Dotzauer*
