// =============================================
// DADOS MUSICAIS — Escalas, Exercícios, Teoria
// =============================================

// Notas cromáticas
export const CHROMATIC_NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
export const NOTE_NAMES_PT = {
  'C': 'Dó', 'C#': 'Dó#', 'D': 'Ré', 'D#': 'Ré#',
  'E': 'Mi', 'F': 'Fá', 'F#': 'Fá#', 'G': 'Sol',
  'G#': 'Sol#', 'A': 'Lá', 'A#': 'Lá#', 'B': 'Si'
}

// Frequências base (A4 = 440Hz) — para síntese de áudio
export const NOTE_FREQUENCIES = {
  'C2': 65.41, 'D2': 73.42, 'E2': 82.41, 'F2': 87.31,
  'G2': 98.00, 'A2': 110.00, 'B2': 123.47,
  'C3': 130.81, 'D3': 146.83, 'E3': 164.81, 'F3': 174.61,
  'G3': 196.00, 'A3': 220.00, 'B3': 246.94,
  'C4': 261.63, 'D4': 293.66, 'E4': 329.63, 'F4': 349.23,
  'G4': 392.00, 'A4': 440.00, 'B4': 493.88,
  'C5': 523.25
}

// Cordas soltas do violoncelo (C2, G2, D3, A3)
export const CELLO_OPEN_STRINGS = [
  { note: 'C2', name: 'Dó', string: 'IV', freq: 65.41 },
  { note: 'G2', name: 'Sol', string: 'III', freq: 98.00 },
  { note: 'D3', name: 'Ré', string: 'II', freq: 146.83 },
  { note: 'A3', name: 'Lá', string: 'I', freq: 220.00 },
]

// Intervalos (em semitons)
const MAJOR_SCALE_INTERVALS = [0, 2, 4, 5, 7, 9, 11, 12]
const MINOR_NAT_INTERVALS   = [0, 2, 3, 5, 7, 8, 10, 12]
const MINOR_HARM_INTERVALS  = [0, 2, 3, 5, 7, 8, 11, 12]
const MINOR_MEL_INTERVALS   = [0, 2, 3, 5, 7, 9, 11, 12] // subida (descida = natural)

function buildScale(rootNote, intervals) {
  const rootIdx = CHROMATIC_NOTES.indexOf(rootNote)
  return intervals.map(i => CHROMATIC_NOTES[(rootIdx + i) % 12])
}

// Escala — gera graus, tônica, dominante, subdominante
export function getScaleData(root, type = 'maior') {
  let intervals
  switch (type) {
    case 'maior':           intervals = MAJOR_SCALE_INTERVALS; break
    case 'menor_natural':   intervals = MINOR_NAT_INTERVALS;   break
    case 'menor_harmonica': intervals = MINOR_HARM_INTERVALS;  break
    case 'menor_melodica':  intervals = MINOR_MEL_INTERVALS;   break
    default:                intervals = MAJOR_SCALE_INTERVALS
  }
  const notes = buildScale(root, intervals)
  return {
    root,
    type,
    notes,
    tonic: notes[0],          // I grau
    supertonic: notes[1],     // II
    mediant: notes[2],        // III
    subdominant: notes[3],    // IV
    dominant: notes[4],       // V
    submediant: notes[5],     // VI
    leadingTone: notes[6],    // VII
    octave: notes[7],         // VIII
    keySignature: getKeySignature(root, type)
  }
}

function getKeySignature(root, type) {
  // Armadura de clave — sustenidos/bemóis
  const majorKeySignatures = {
    'C': { count: 0, type: null },
    'G': { count: 1, type: '#', notes: ['F#'] },
    'D': { count: 2, type: '#', notes: ['F#', 'C#'] },
    'A': { count: 3, type: '#', notes: ['F#', 'C#', 'G#'] },
    'E': { count: 4, type: '#', notes: ['F#', 'C#', 'G#', 'D#'] },
    'B': { count: 5, type: '#', notes: ['F#', 'C#', 'G#', 'D#', 'A#'] },
    'F': { count: 1, type: 'b', notes: ['Bb'] },
    'A#': { count: 2, type: 'b', notes: ['Bb', 'Eb'] },
    'D#': { count: 3, type: 'b', notes: ['Bb', 'Eb', 'Ab'] },
    'G#': { count: 4, type: 'b', notes: ['Bb', 'Eb', 'Ab', 'Db'] },
    'C#': { count: 5, type: 'b', notes: ['Bb', 'Eb', 'Ab', 'Db', 'Gb'] },
  }
  // Relativas menores
  const minorToMajor = {
    'A': 'C', 'E': 'G', 'B': 'D', 'F#': 'A', 'C#': 'E', 'G#': 'B',
    'D': 'F', 'G': 'A#', 'C': 'D#', 'F': 'G#'
  }
  if (type === 'maior') return majorKeySignatures[root] || { count: 0, type: null }
  const relMajor = minorToMajor[root]
  return relMajor ? (majorKeySignatures[relMajor] || { count: 0, type: null }) : { count: 0, type: null }
}

// ESCALAS — ordenadas por dificuldade (método Dotzauer + progressão pedagógica)
export const SCALES_CURRICULUM = [
  // FASE 1 — Primeiras posições, cordas abertas
  {
    id: 'c_maior',
    name: 'Dó Maior',
    root: 'C',
    type: 'maior',
    difficulty: 1,
    phase: 1,
    positions: '1ª posição',
    strings: 'II e I (Ré e Lá)',
    description: 'A escala mais natural para o violoncelo iniciante. Usa apenas 1ª posição nas cordas Ré e Lá.',
    bpmGoals: [40, 60, 80, 100],
    dotzauerRef: 'Ex. 1-5',
    tips: [
      'Mantenha o polegar relaxado atrás do braço',
      'Arco no meio, movimento de ombro relaxado',
      'Escute cada nota — use o afinador cromático'
    ]
  },
  {
    id: 'g_maior',
    name: 'Sol Maior',
    root: 'G',
    type: 'maior',
    difficulty: 2,
    phase: 1,
    positions: '1ª posição',
    strings: 'III e II (Sol e Ré)',
    description: 'Introduz a corda Sol (III corda). Atenção ao cruzamento de cordas.',
    bpmGoals: [40, 60, 80, 100],
    dotzauerRef: 'Ex. 6-10',
    tips: [
      'Atenção ao cruzamento entre corda Sol e Ré',
      'Mantenha cotovelo do arco nivelado',
      'F# — 4º dedo bem posicionado'
    ]
  },
  {
    id: 'a_menor_natural',
    name: 'Lá Menor Natural',
    root: 'A',
    type: 'menor_natural',
    difficulty: 2,
    phase: 1,
    positions: '1ª posição',
    strings: 'II e I',
    description: 'Primeira escala menor. Relativa de Dó Maior — mesma armadura (sem acidentes).',
    bpmGoals: [40, 60, 80, 100],
    dotzauerRef: 'Ex. 11-15',
    tips: [
      'Compare com Dó maior — sinta o caráter diferente',
      'Identifique a tônica (Lá) e a sensação de repouso',
      'Trabalhe a diferença de sonoridade menor vs maior'
    ]
  },
  {
    id: 'd_maior',
    name: 'Ré Maior',
    root: 'D',
    type: 'maior',
    difficulty: 3,
    phase: 1,
    positions: '1ª posição',
    strings: 'II, I e IV',
    description: 'Introduz o C# (Dó#). Boa escala para trabalhar sonoridade na corda Ré.',
    bpmGoals: [40, 60, 80, 100],
    dotzauerRef: 'Ex. 16-22',
    tips: ['C# e F# exigem atenção de afinação', 'Explore o timbre rico da corda Ré']
  },
  // FASE 2 — Extensão e posições intermediárias
  {
    id: 'e_menor_harmonica',
    name: 'Mi Menor Harmônica',
    root: 'E',
    type: 'menor_harmonica',
    difficulty: 4,
    phase: 2,
    positions: '1ª e 4ª posição',
    strings: 'II, I, III',
    description: 'A escala menor harmônica tem o 7° grau elevado (D#), criando a sensação de tensão-resolução.',
    bpmGoals: [40, 60, 80],
    dotzauerRef: 'Ex. 23-30',
    tips: [
      'O intervalo aumentado entre VI e VII é característico',
      'D# (Ré#) — 4º dedo estendido',
      'Sinta a tensão do sensível e a resolução na tônica'
    ]
  },
  {
    id: 'a_maior',
    name: 'Lá Maior',
    root: 'A',
    type: 'maior',
    difficulty: 4,
    phase: 2,
    positions: '1ª posição',
    strings: 'I, II, III',
    description: 'Escala brilhante na corda Lá. Três sustenidos: F#, C#, G#.',
    bpmGoals: [40, 60, 80, 100],
    dotzauerRef: 'Ex. 31-38',
    tips: ['G# exige precisão do 3º dedo', 'Trabalhe a qualidade do som na corda Lá']
  },
  {
    id: 'd_menor_harmonica',
    name: 'Ré Menor Harmônica',
    root: 'D',
    type: 'menor_harmonica',
    difficulty: 5,
    phase: 2,
    positions: '1ª e extensão',
    strings: 'II, I, III, IV',
    description: 'Relativa de Fá Maior. O C# harmônico cria tensão expressiva.',
    bpmGoals: [40, 60, 80],
    dotzauerRef: 'Ex. 39-45',
    tips: ['Um bemol na armadura (Bb)', 'C# — sensível elevado, atenção à afinação']
  },
  {
    id: 'f_maior',
    name: 'Fá Maior',
    root: 'F',
    type: 'maior',
    difficulty: 5,
    phase: 2,
    positions: '1ª posição e extensão',
    strings: 'III, II, I',
    description: 'Um bemol (Bb). Trabalha a extensão do 4º dedo.',
    bpmGoals: [40, 60, 80],
    dotzauerRef: 'Ex. 46-52',
    tips: ['Bb — atenção à posição do 1º dedo', 'Movimento suave entre posições']
  },
  // FASE 3 — Posições intermediárias e altas
  {
    id: 'g_menor_harmonica',
    name: 'Sol Menor Harmônica',
    root: 'G',
    type: 'menor_harmonica',
    difficulty: 6,
    phase: 3,
    positions: '1ª, 2ª e 4ª posição',
    strings: 'Todas',
    description: 'Dois bemóis mais F# harmônico. Exige mudança de posição.',
    bpmGoals: [40, 60, 80],
    dotzauerRef: 'Ex. 53-60',
    tips: ['Planeje a mudança de posição com antecedência', 'F# harmônico — sensível expressivo']
  },
  {
    id: 'e_maior',
    name: 'Mi Maior',
    root: 'E',
    type: 'maior',
    difficulty: 6,
    phase: 3,
    positions: '1ª e 4ª posição',
    strings: 'I, II, III',
    description: 'Quatro sustenidos. Excelente para desenvolvimento técnico.',
    bpmGoals: [40, 60, 80],
    dotzauerRef: 'Ex. 61-68',
    tips: ['Quatro sustenidos: F#, C#, G#, D#', 'Clareza nas mudanças de posição']
  },
  {
    id: 'bb_maior',
    name: 'Si♭ Maior',
    root: 'A#',
    type: 'maior',
    difficulty: 7,
    phase: 3,
    positions: '1ª, 2ª e 4ª posição',
    strings: 'Todas',
    description: 'Dois bemóis. Escala com extensão expressiva no violoncelo.',
    bpmGoals: [40, 60, 80],
    dotzauerRef: 'Ex. 69-75',
    tips: ['Bb e Eb — semicírculos do arco', 'Qualidade de som constante em todas as cordas']
  },
  // FASE 4 — Escalas avançadas
  {
    id: 'c_menor_melodica',
    name: 'Dó Menor Melódica',
    root: 'C',
    type: 'menor_melodica',
    difficulty: 8,
    phase: 4,
    positions: 'Múltiplas posições',
    strings: 'Todas',
    description: 'A escala menor melódica sobe com 6° e 7° elevados, desce como natural. Alta expressividade.',
    bpmGoals: [40, 60],
    dotzauerRef: 'Ex. 76-85',
    tips: [
      'Subida: A natural e B natural (graus elevados)',
      'Descida: Ab e Bb (forma natural)',
      'A diferença sobe/desce é a essência melódica'
    ]
  },
  {
    id: 'b_maior',
    name: 'Si Maior',
    root: 'B',
    type: 'maior',
    difficulty: 9,
    phase: 4,
    positions: 'Múltiplas posições',
    strings: 'Todas',
    description: 'Cinco sustenidos. Exige domínio completo das posições.',
    bpmGoals: [40, 60],
    dotzauerRef: 'Ex. 86-95',
    tips: ['Cinco sustenidos — precisão total de afinação', 'Use afinador em cada nota']
  },
]

// MÉTODO DOTZAUER — Exercícios Fundamentais
export const DOTZAUER_EXERCISES = [
  {
    id: 'dtz_001',
    number: 1,
    title: 'Exercício em Dó Maior — Notas Longas',
    phase: 1,
    difficulty: 1,
    focus: 'Sonoridade e Afinação',
    description: 'O exercício inaugural de Dotzauer foca em notas longas com arco completo. Objetivo: produzir som uniforme, rico e bem afinado antes de qualquer velocidade.',
    instructions: [
      'Use arco completo — da ponta ao talão',
      'Mantenha pressão constante do arco na corda',
      'Escute a ressonância de cada nota',
      'Velocidade de arco uniforme em todo o trajeto',
      'Cada nota = 4 tempos com metrônomo'
    ],
    bpmRange: [40, 60],
    timeSignature: '4/4',
    scaleRef: 'c_maior',
    dotzauerPage: 4,
    techniques: ['notas_longas', 'arco_completo', 'legato']
  },
  {
    id: 'dtz_002',
    number: 2,
    title: 'Exercício em Sol Maior — Detaché',
    phase: 1,
    difficulty: 2,
    focus: 'Articulação Detaché',
    description: 'Introdução ao detaché — cada nota com movimento de arco separado mas contínuo. A base da articulação no violoncelo.',
    instructions: [
      'Cada nota tem seu próprio arco (detaché)',
      'Mantenha o cotovelo em nível estável',
      'Troca de arco sem tensão',
      'Velocidade consistente em todos os arcos',
      'Metrônomo desde o início'
    ],
    bpmRange: [50, 80],
    timeSignature: '4/4',
    scaleRef: 'g_maior',
    dotzauerPage: 6,
    techniques: ['detache', 'troca_arco']
  },
  {
    id: 'dtz_003',
    number: 3,
    title: 'Exercício em Ré Maior — Ligados',
    phase: 1,
    difficulty: 2,
    focus: 'Ligado (Slur)',
    description: 'Trabalha o ligado — múltiplas notas em um único arco. Fundamental para fluidez musical.',
    instructions: [
      'Duas notas por arco (slur 2)',
      'Troca de nota sem interromper o som',
      'Velocidade de arco diminui para acomodar o slur',
      'Dedos preparados antecipadamente',
      'Progride para slur 4 quando dominado'
    ],
    bpmRange: [40, 70],
    timeSignature: '3/4',
    scaleRef: 'd_maior',
    dotzauerPage: 8,
    techniques: ['ligado', 'slur_2', 'slur_4']
  },
  {
    id: 'dtz_005',
    number: 5,
    title: 'Exercício em Lá Maior — Cordas Dobradas',
    phase: 2,
    difficulty: 4,
    focus: 'Cordas Dobradas e Afinação',
    description: 'Introdução a cordas dobradas — duas cordas simultaneamente. Exige afinação precisa e peso de arco equilibrado.',
    instructions: [
      'Arco toca duas cordas ao mesmo tempo',
      'Peso distribuído igualmente entre as cordas',
      'Escute os harmônicos de ressonância',
      'Afinação perfeita — use afinador',
      'Comece lento e aumente gradualmente'
    ],
    bpmRange: [40, 60],
    timeSignature: '4/4',
    scaleRef: 'a_maior',
    dotzauerPage: 14,
    techniques: ['cordas_dobradas', 'duplo_som']
  },
  {
    id: 'dtz_008',
    number: 8,
    title: 'Exercício em Mi Menor — Posição do Polegar',
    phase: 3,
    difficulty: 6,
    focus: 'Mudança de Posição',
    description: 'Primeiro exercício que requer mudança de posição. Fundamental para desenvolver fluência no braço.',
    instructions: [
      'Identifique o momento da mudança de posição',
      'Movimento do braço inteiro, não só dos dedos',
      'Use o polegar como âncora durante a mudança',
      'Escute a continuidade de som na mudança',
      'Metrônomo lento até a mudança ser natural'
    ],
    bpmRange: [40, 60],
    timeSignature: '4/4',
    scaleRef: 'e_menor_harmonica',
    dotzauerPage: 22,
    techniques: ['mudanca_posicao', 'polegar']
  },
  {
    id: 'dtz_012',
    number: 12,
    title: 'Exercício em Sol Menor — Expressividade',
    phase: 3,
    difficulty: 7,
    focus: 'Dinâmica e Expressão',
    description: 'Introdução formal à dinâmica. O violoncelo expressa emoção através da intensidade do arco.',
    instructions: [
      'Piano = menos peso, ponta do arco',
      'Forte = mais peso, parte inferior do arco',
      'Crescendo = velocidade + peso progressivos',
      'Decrescendo = reduza gradualmente',
      'Sinta a narrativa musical do exercício'
    ],
    bpmRange: [50, 70],
    timeSignature: '3/4',
    scaleRef: 'g_menor_harmonica',
    dotzauerPage: 34,
    techniques: ['dinamica', 'expressividade', 'crescendo_decrescendo']
  }
]

// CONCEITOS TEÓRICOS — conteúdo educativo estruturado
export const MUSIC_CONCEPTS = {
  scales: {
    title: 'Escalas: Maior e Menor',
    subtitle: 'Como identificar e construir',
    sections: [
      {
        title: 'O que é uma escala?',
        content: 'Uma escala é uma sequência ordenada de notas dentro de uma oitava, seguindo um padrão específico de tons (T) e semitons (S). No violoncelo, as escalas são a base de tudo — afinação, técnica e musicalidade.'
      },
      {
        title: 'Escala Maior',
        content: 'A escala maior tem um caráter alegre, luminoso. Seu padrão de intervalos é: T-T-S-T-T-T-S (Dó Maior: C-D-E-F-G-A-B-C). O padrão é sempre o mesmo, independente da tônica.',
        pattern: 'T - T - S - T - T - T - S',
        example: 'Dó Maior: Dó - Ré - Mi - Fá - Sol - Lá - Si - Dó'
      },
      {
        title: 'Escala Menor Natural',
        content: 'A escala menor natural tem caráter sombrio, expressivo. Padrão: T-S-T-T-S-T-T. É a relativa menor da escala maior (começa no 6° grau da maior relativa).',
        pattern: 'T - S - T - T - S - T - T',
        example: 'Lá Menor: Lá - Si - Dó - Ré - Mi - Fá - Sol - Lá'
      },
      {
        title: 'Escala Menor Harmônica',
        content: 'A escala menor harmônica eleva o 7° grau meio tom, criando o intervalo aumentado entre o 6° e 7° grau. Isso cria forte tensão-resolução, muito usada em música clássica e barroca.',
        pattern: 'T - S - T - T - S - A - S (A = segunda aumentada)',
        example: 'Lá Menor Harmônica: Lá - Si - Dó - Ré - Mi - Fá - Sol# - Lá'
      },
      {
        title: 'Escala Menor Melódica',
        content: 'A escala menor melódica resolve o intervalo aumentado da harmônica. Na subida eleva 6° e 7° graus; na descida volta à forma natural. Muito usada em melodias cantabiles.',
        pattern: 'Subida: T-S-T-T-T-T-S | Descida: T-T-S-T-T-S-T',
        example: 'Subida: Lá-Si-Dó-Ré-Mi-Fá#-Sol#-Lá | Descida: Lá-Sol-Fá-Mi-Ré-Dó-Si-Lá'
      }
    ]
  },
  tonality: {
    title: 'Tonalidade e Tônica',
    subtitle: 'Como identificar o centro tonal',
    sections: [
      {
        title: 'O que é tonalidade?',
        content: 'Tonalidade é a organização das notas em torno de um centro — a TÔNICA. Em música tonal, todas as notas gravitam em direção a essa nota central, criando tensão e resolução.'
      },
      {
        title: 'Como identificar a Tônica',
        content: 'A tônica é a nota de repouso — onde a música "quer" chegar. No violoncelo, você sente quando chega na tônica pela sensação de resolução. Analiticamente, é o I grau da escala.'
      },
      {
        title: 'Graus Fundamentais',
        content: 'Três graus constroem a estrutura tonal: I (Tônica — repouso), IV (Subdominante — movimento, tensão moderada) e V (Dominante — tensão, pede resolução). A progressão V→I é a cadência mais forte da música ocidental.',
        degrees: [
          { degree: 'I — Tônica', description: 'Centro tonal, repouso, estabilidade', color: 'gold' },
          { degree: 'IV — Subdominante', description: 'Movimento, afastamento da tônica', color: 'silver' },
          { degree: 'V — Dominante', description: 'Tensão máxima, resolve na tônica', color: 'crimson' },
          { degree: 'VII — Sensível', description: 'Meio tom abaixo da tônica, forte atração', color: 'bronze' },
        ]
      },
      {
        title: 'Armadura de Clave',
        content: 'A armadura de clave (os sustenidos ou bemóis no início da pauta) indica a tonalidade. Sem acidentes = Dó Maior ou Lá Menor. Um sustenido (F#) = Sol Maior ou Mi Menor. Cada sustenido/bemol adicional sobe ou desce uma quinta.'
      }
    ]
  },
  rhythm: {
    title: 'Ritmo e Pulsação',
    subtitle: 'A linguagem do tempo na música',
    sections: [
      {
        title: 'O que é ritmo?',
        content: 'Ritmo é a organização do som no tempo. No violoncelo, o ritmo nasce do arco — a velocidade, peso e direção do arco criam o ritmo. Sem ritmo interno não há musicalidade.'
      },
      {
        title: 'Pulsação e Metrônomo',
        content: 'A pulsação é o "batimento cardíaco" da música. O metrônomo mantém a pulsação objetiva. SEMPRE comece com metrônomo lento — dominar o tempo é mais importante que a velocidade.',
        rule: 'Regra de ouro: se errou, o BPM está rápido demais. Reduza 10-15%.'
      },
      {
        title: 'Figuras Rítmicas Essenciais',
        content: 'As figuras rítmicas indicam a duração das notas: Semibreve (4 tempos), Mínima (2 tempos), Semínima (1 tempo), Colcheia (½ tempo), Semicolcheia (¼ tempo). No Dotzauer, você encontrará progressivamente todas elas.'
      },
      {
        title: 'Ritmo + Escala + Afinação',
        content: 'O auge da prática é unir os três: tocar a escala correta (teoria), afinada (ouvido + afinador) e no ritmo (metrônomo). Comece com metrônomo = 40 BPM e semínimas. Só aumente o BPM quando os três estiverem perfeitos juntos.'
      }
    ]
  },
  bowing: {
    title: 'Sonoridade e Arco',
    subtitle: 'Fatores e fundamentos da produção sonora',
    sections: [
      {
        title: 'Os 4 Fatores do Som no Arco',
        content: 'A qualidade do som no violoncelo depende de quatro fatores interligados. Dominar cada um separadamente antes de combiná-los é o caminho mais eficiente.',
        factors: [
          {
            name: 'Velocidade do Arco',
            description: 'Mais velocidade = mais volume e brilho. Menos velocidade = som mais íntimo e denso. Velocidade uniforme = som consistente.',
            icon: '→'
          },
          {
            name: 'Peso (Pressão)',
            description: 'O peso do braço, não a força muscular. O braço "cai" sobre a corda. Mais peso = mais ressonância (até o limite do crunch). Menos peso = sons mais sutis.',
            icon: '↓'
          },
          {
            name: 'Ponto de Contato',
            description: 'A distância entre o arco e o cavalete. Próximo ao cavalete (sul ponticello) = som metálico, brilhante. Próximo ao espelho (sul tasto) = som suave, velado. Centro = equilibrado.',
            icon: '⟷'
          },
          {
            name: 'Comprimento do Arco',
            description: 'Arco completo = máximo volume e projeção. Meia cana = controle e articulação. Pequenos arcos na ponta = pianissimo. Pequenos no talão = acentos, martellato.',
            icon: '↔'
          }
        ]
      },
      {
        title: 'Posição do Arco',
        content: 'O polegar da mão direita fica curvo, tocando o lado do arco. Os outros dedos caem naturalmente sobre o arco. O dedo mínimo equilibra na ponta. NUNCA segure com força — o arco deve ser uma extensão natural do braço.'
      },
      {
        title: 'Tipos de Golpe de Arco',
        content: 'Legato: arco contínuo, som ligado. Detaché: arco separado mas suave. Martellato: início com acento, arco parado depois. Spiccato: arco "saltando" na corda. Staccato: notas curtas, dentro de um único arco. Cada golpe é uma cor sonora diferente.'
      }
    ]
  },
  tuning: {
    title: 'Afinação com Afinador Cromático',
    subtitle: 'O caminho para o ouvido musical',
    sections: [
      {
        title: 'Por que usar o afinador?',
        content: 'O afinador cromático é seu professor de ouvido. Ele mostra objetivamente se você está acima (sharp ♯) ou abaixo (flat ♭) da nota. Com o tempo, você internalizará as frequências e precisará menos do afinador.'
      },
      {
        title: 'Como usar corretamente',
        content: 'Para cada nota da escala, toque, olhe o afinador E escute. Associe o que vê (agulha) com o que sente na corda e o que ouve. Esse triângulo visual-tátil-auditivo constrói o ouvido absoluto gradualmente.',
        steps: [
          'Toque a nota com arco médio-lento',
          'Observe se a agulha está acima ou abaixo do centro',
          'Ajuste a afinação sem parar de tocar',
          'Quando centralizar, MEMORIZE a sensação',
          'Repita até não precisar olhar'
        ]
      },
      {
        title: 'Afinação das Cordas Soltas',
        content: 'Antes de qualquer prática, afine as 4 cordas soltas do violoncelo: Lá (A3 = 220Hz), Ré (D3), Sol (G2), Dó (C2). Use o afinador com o microfone do dispositivo ou conecte o violoncelo diretamente. Afine sempre do mais agudo ao mais grave.'
      }
    ]
  }
}

// FASES DE DESENVOLVIMENTO
export const PRACTICE_PHASES = [
  {
    id: 'fase1',
    name: 'Fase I — Fundamentos',
    subtitle: 'Primeiras escalas e posição',
    duration: '4-8 semanas',
    goals: [
      'Dominar a posição básica do arco e mão esquerda',
      'Tocar escalas de C Maior, G Maior e A menor em 60 BPM',
      'Usar o afinador cromático com autonomia',
      'Completar exercícios Dotzauer 1-5'
    ],
    color: '#8B6914'
  },
  {
    id: 'fase2',
    name: 'Fase II — Expansão',
    subtitle: 'Novos tons e expressividade',
    duration: '8-12 semanas',
    goals: [
      'Dominar escalas maiores e menores em múltiplas tonalidades',
      'Introduzir a escala menor harmônica',
      'Trabalhar dinâmica (p, mf, f)',
      'Completar exercícios Dotzauer 6-15'
    ],
    color: '#2D5A8E'
  },
  {
    id: 'fase3',
    name: 'Fase III — Posições',
    subtitle: 'Mudança de posição e cordas duplas',
    duration: '12-20 semanas',
    goals: [
      'Aprender mudança de posição (1ª → 4ª)',
      'Introduzir cordas dobradas',
      'Escalas de 2 oitavas',
      'Completar exercícios Dotzauer 16-30'
    ],
    color: '#5C2D91'
  },
  {
    id: 'fase4',
    name: 'Fase IV — Musicalidade',
    subtitle: 'Expressão e repertório',
    duration: '20+ semanas',
    goals: [
      'Escalas menores melódicas completas',
      'Escalas de 3 oitavas',
      'Introdução ao vibrato',
      'Iniciar repertório: Peças barrocas e clássicas'
    ],
    color: '#1A5C1A'
  }
]

// Apps recomendados (funcionalidades a incorporar)
export const RECOMMENDED_APP_FEATURES = [
  { feature: 'Afinador cromático visual', source: 'GuitarTuna / insTuner' },
  { feature: 'Metrônomo com subdivisões', source: 'Metronome Beats' },
  { feature: 'Gravação e playback', source: 'Voice Memos / Tonal Energy' },
  { feature: 'Comparação gravação vs referência', source: 'Tonal Energy Tuner' },
  { feature: 'Análise de frequência em tempo real', source: 'Tonal Energy' },
  { feature: 'Biblioteca de escalas com áudio', source: 'iReal Pro' },
  { feature: 'Sistema de progresso gamificado', source: 'Simply Piano / Yousician' },
  { feature: 'Exercícios por fase e dificuldade', source: 'Fender Play' },
]
