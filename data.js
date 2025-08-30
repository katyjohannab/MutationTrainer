// Use var instead of const so it attaches to the window object when loaded in the browser.
var exercises = 
[
  {
    "id": 1,
    "topic": "soft mutation – numerals (feminine)",
    "welsh": "un gath",
    "english": "one cat",
    "tokens": [
      {
        "text": "un",
        "type": "trigger",
        "rule": "soft-numeral",
        "explanation": "The numeral <em>un</em> triggers the soft mutation on feminine nouns (but not masculine ones)【588941943427863†L256-L263】."
      },
      {
        "text": "gath",
        "radical": "cath",
        "type": "mutated",
        "rule": "soft-numeral",
        "explanation": "<em>Cath</em> (cat, feminine) becomes <em>gath</em> after <em>un</em> via the soft mutation【588941943427863†L256-L263】.",
        "parseOptions": [
          "Soft mutation after the numeral <em>un</em> (feminine)",
          "Aspirate mutation after a conjunction",
          "Nasal mutation after <em>fy</em>"
        ],
        "correctIndex": 0
      }
    ],
    "producePrompt": "Use another feminine numeral (e.g. dwy, tair, pedair) and a feminine noun to illustrate the soft mutation."
  },
  {
    "id": 2,
    "topic": "soft mutation – numerals (masculine)",
    "welsh": "dau gi",
    "english": "two dogs",
    "tokens": [
      {
        "text": "dau",
        "type": "trigger",
        "rule": "soft-numeral",
        "explanation": "The numeral <em>dau</em> (two, masculine) triggers the soft mutation on a following masculine noun【588941943427863†L256-L263】."
      },
      {
        "text": "gi",
        "radical": "ci",
        "type": "mutated",
        "rule": "soft-numeral",
        "explanation": "<em>Ci</em> (dog) becomes <em>gi</em> after <em>dau</em> due to the soft mutation【588941943427863†L256-L263】.",
        "parseOptions": [
          "Soft mutation after <em>dau</em>",
          "Aspirate mutation after a preposition",
          "No mutation after a numeral"
        ],
        "correctIndex": 0
      }
    ],
    "producePrompt": "Write a phrase with <em>dau</em> and another masculine noun beginning with <em>c</em>, <em>p</em> or <em>t</em> that shows the soft mutation."
  },
  {
    "id": 3,
    "topic": "soft mutation – numerals (feminine)",
    "welsh": "dwy gath",
    "english": "two cats",
    "tokens": [
      {
        "text": "dwy",
        "type": "trigger",
        "rule": "soft-numeral",
        "explanation": "<em>Dwy</em> (two, feminine) triggers the soft mutation on a following feminine noun【588941943427863†L256-L263】."
      },
      {
        "text": "gath",
        "radical": "cath",
        "type": "mutated",
        "rule": "soft-numeral",
        "explanation": "As in example 1, <em>cath</em> becomes <em>gath</em> after <em>dwy</em>.",
        "parseOptions": [
          "Soft mutation after a feminine numeral",
          "Aspirate mutation after a numeral",
          "Nasal mutation after a preposition"
        ],
        "correctIndex": 0
      }
    ],
    "producePrompt": "Use <em>dwy</em> or another feminine numeral with a different feminine noun to create a similar phrase."
  },
  {
    "id": 4,
    "topic": "aspirate mutation – numerals",
    "welsh": "tri char",
    "english": "three cars",
    "tokens": [
      {
        "text": "tri",
        "type": "trigger",
        "rule": "aspirate-numeral",
        "explanation": "The numeral <em>tri</em> (three, masculine) triggers the aspirate mutation on nouns beginning with <em>c</em>, <em>p</em> or <em>t</em>【588941943427863†L256-L263】."
      },
      {
        "text": "char",
        "radical": "car",
        "type": "mutated",
        "rule": "aspirate-numeral",
        "explanation": "<em>Car</em> becomes <em>char</em> after <em>tri</em> because <em>tri</em> triggers the aspirate mutation on <em>c/p/t</em>-initial nouns【588941943427863†L256-L263】.",
        "parseOptions": [
          "Aspirate mutation after <em>tri</em>",
          "Soft mutation after a conjunction",
          "Nasal mutation after <em>fy</em>"
        ],
        "correctIndex": 0
      }
    ],
    "producePrompt": "Form a phrase with <em>tri</em> or <em>chwe</em> and a noun starting with <strong>c</strong>, <strong>p</strong> or <strong>t</strong> to illustrate the aspirate mutation."
  },
  {
    "id": 5,
    "topic": "aspirate mutation – numerals",
    "welsh": "chwe phlentyn",
    "english": "six children",
    "tokens": [
      {
        "text": "chwe",
        "type": "trigger",
        "rule": "aspirate-numeral",
        "explanation": "<em>Chwe</em> (six) is one of the numerals that trigger the aspirate mutation on nouns beginning with <em>c</em>, <em>p</em> or <em>t</em>【588941943427863†L256-L263】."
      },
      {
        "text": "phlentyn",
        "radical": "plentyn",
        "type": "mutated",
        "rule": "aspirate-numeral",
        "explanation": "<em>Plentyn</em> becomes <em>phlentyn</em> after <em>chwe</em> because of the aspirate mutation【588941943427863†L256-L263】.",
        "parseOptions": [
          "Aspirate mutation after <em>chwe</em>",
          "Soft mutation after a preposition",
          "No mutation after a numeral"
        ],
        "correctIndex": 0
      }
    ],
    "producePrompt": "Use <em>chwe</em> with another noun starting with <em>c</em>, <em>p</em> or <em>t</em> to show the aspirate mutation."
  },
  {
    "id": 6,
    "topic": "no mutation – numerals (feminine)",
    "welsh": "tair cath",
    "english": "three cats (feminine)",
    "tokens": [
      {
        "text": "tair",
        "type": "trigger",
        "rule": "none",
        "explanation": "<em>Tair</em> is the feminine form of 'three' and does not trigger any mutation【588941943427863†L256-L263】."
      },
      {
        "text": "cath",
        "radical": "cath",
        "type": "radical",
        "rule": "none",
        "explanation": "Because <em>tair</em> does not mutate following nouns, <em>cath</em> remains unchanged.",
        "parseOptions": [
          "No mutation after <em>tair</em>",
          "Soft mutation after <em>tair</em>",
          "Aspirate mutation after <em>tair</em>"
        ],
        "correctIndex": 0
      }
    ],
    "producePrompt": "Write a phrase using <em>tair</em> or <em>pedair</em> to show that no mutation occurs."
  },
  {
    "id": 7,
    "topic": "soft mutation – possessive pronouns (his)",
    "welsh": "ei gath",
    "english": "his cat",
    "tokens": [
      {
        "text": "ei",
        "type": "trigger",
        "rule": "soft-possessive",
        "explanation": "The possessive pronoun <em>ei</em> (meaning his) triggers the soft mutation on the following noun.",
      },
      {
        "text": "gath",
        "radical": "cath",
        "type": "mutated",
        "rule": "soft-possessive",
        "explanation": "<em>Cath</em> becomes <em>gath</em> after the pronoun <em>ei</em> meaning 'his'.",
        "parseOptions": [
          "Soft mutation after a possessive pronoun (his)",
          "Aspirate mutation after a conjunction",
          "Nasal mutation after a numeral"
        ],
        "correctIndex": 0
      }
    ],
    "producePrompt": "Use <em>ei</em> (his) with another noun to demonstrate the soft mutation (e.g. <em>ei ddwrn</em> — his fist)."
  },
  {
    "id": 8,
    "topic": "aspirate mutation – possessive pronouns (her)",
    "welsh": "ei phen",
    "english": "her head",
    "tokens": [
      {
        "text": "ei",
        "type": "trigger",
        "rule": "aspirate-possessive",
        "explanation": "The possessive pronoun <em>ei</em> (meaning her) triggers the aspirate mutation on nouns beginning with <em>c</em>, <em>p</em> or <em>t</em>.",
      },
      {
        "text": "phen",
        "radical": "pen",
        "type": "mutated",
        "rule": "aspirate-possessive",
        "explanation": "<em>Pen</em> becomes <em>phen</em> after <em>ei</em> meaning 'her'.",
        "parseOptions": [
          "Aspirate mutation after a possessive pronoun (her)",
          "Soft mutation after a preposition",
          "Nasal mutation after <em>fy</em>"
        ],
        "correctIndex": 0
      }
    ],
    "producePrompt": "Combine <em>ei</em> (her) with another noun beginning with <em>c</em>, <em>p</em> or <em>t</em> to illustrate the aspirate mutation."
  },
  {
    "id": 9,
    "topic": "nasal mutation – possessive pronouns (my)",
    "welsh": "fy nghi",
    "english": "my dog",
    "tokens": [
      {
        "text": "fy",
        "type": "trigger",
        "rule": "nasal-possessive",
        "explanation": "The possessive pronoun <em>fy</em> ('my') triggers the nasal mutation on the following noun.",
      },
      {
        "text": "nghi",
        "radical": "ci",
        "type": "mutated",
        "rule": "nasal-possessive",
        "explanation": "<em>Ci</em> becomes <em>nghi</em> after <em>fy</em> via the nasal mutation.",
        "parseOptions": [
          "Nasal mutation after <em>fy</em>",
          "Soft mutation after <em>ei</em> (his)",
          "Aspirate mutation after <em>tri</em>"
        ],
        "correctIndex": 0
      }
    ],
    "producePrompt": "Use <em>fy</em> with another noun (e.g. <em>fy mhen</em> — my head) to show the nasal mutation."
  },
  {
    "id": 10,
    "topic": "nasal mutation – numerals (years)",
    "welsh": "pum mlynedd",
    "english": "five years",
    "tokens": [
      {
        "text": "pum",
        "type": "trigger",
        "rule": "nasal-numeral",
        "explanation": "Certain numerals such as <em>pum</em>, <em>saith</em>, <em>wyth</em>, <em>deng</em>, <em>deuddeng</em> and <em>pymtheng</em> trigger the nasal mutation on <em>blwyddyn</em> ('year')【588941943427863†L256-L263】."
      },
      {
        "text": "mlynedd",
        "radical": "blwyddyn",
        "type": "mutated",
        "rule": "nasal-numeral",
        "explanation": "<em>Blwyddyn</em> becomes <em>mlynedd</em> after <em>pum</em> (five) due to the nasal mutation【588941943427863†L256-L263】.",
        "parseOptions": [
          "Nasal mutation after numerals (years)",
          "Soft mutation after a preposition",
          "Aspirate mutation after <em>chwe</em>"
        ],
        "correctIndex": 0
      }
    ],
    "producePrompt": "Use another numeral (saith, wyth, deng, deuddeng, pymtheg) with <em>blwyddyn</em> to show the nasal mutation on 'year'."
  },
  {
    "id": 11,
    "topic": "soft mutation – prepositions",
    "welsh": "trwy bentref",
    "english": "through a village",
    "tokens": [
      {
        "text": "trwy",
        "type": "trigger",
        "rule": "soft-preposition",
        "explanation": "Many prepositions (am, ar, at, dan, dros, gan, heb, hyd, i, o, tan, trwy, wrth) trigger the soft mutation on the following noun.",
      },
      {
        "text": "bentref",
        "radical": "pentref",
        "type": "mutated",
        "rule": "soft-preposition",
        "explanation": "<em>Pentref</em> becomes <em>bentref</em> after <em>trwy</em> via the soft mutation.",
        "parseOptions": [
          "Soft mutation after a preposition",
          "Aspirate mutation after a conjunction",
          "Nasal mutation after <em>fy</em>"
        ],
        "correctIndex": 0
      }
    ],
    "producePrompt": "Write a phrase using one of the soft‑mutating prepositions (e.g. <em>gan</em>, <em>o</em>, <em>am</em>) and a noun that demonstrates the soft mutation."
  },
  {
    "id": 12,
    "topic": "soft mutation – complement marker <em>yn</em>",
    "welsh": "mae hi'n dda",
    "english": "she is good",
    "tokens": [
      {
        "text": "yn",
        "type": "trigger",
        "rule": "soft-yn",
        "explanation": "The complement marker <em>yn</em> triggers soft mutation on adjectives and nouns following the verb <em>bod</em>.",
      },
      {
        "text": "dda",
        "radical": "da",
        "type": "mutated",
        "rule": "soft-yn",
        "explanation": "<em>Da</em> (good) becomes <em>dda</em> after <em>yn</em> in a predicative construction.",
        "parseOptions": [
          "Soft mutation after <em>yn</em>",
          "Aspirate mutation after <em>tri</em>",
          "Nasal mutation after a pronoun"
        ],
        "correctIndex": 0
      }
    ],
    "producePrompt": "Write a sentence with <em>mae</em> or <em>roedd</em> and <em>yn</em> followed by an adjective that soft‑mutates (e.g. <em>mae e'n brysur</em> — he is busy)."
  },
  {
    "id": 13,
    "topic": "aspirate mutation – conjunction ‘and’ (a)",
    "welsh": "bara a chaws",
    "english": "bread and cheese",
    "tokens": [
      {
        "text": "a",
        "type": "trigger",
        "rule": "aspirate-conjunction",
        "explanation": "The conjunction <em>a</em> (and) triggers the aspirate mutation on words beginning with <em>c</em>, <em>p</em> or <em>t</em>.",
      },
      {
        "text": "chaws",
        "radical": "caws",
        "type": "mutated",
        "rule": "aspirate-conjunction",
        "explanation": "<em>Caws</em> (cheese) becomes <em>chaws</em> after <em>a</em> via the aspirate mutation.",
        "parseOptions": [
          "Aspirate mutation after the conjunction <em>a</em>",
          "Soft mutation after a preposition",
          "Nasal mutation after a numeral"
        ],
        "correctIndex": 0
      }
    ],
    "producePrompt": "Create a noun phrase joined by <em>a</em> (‘and’) where the second noun begins with <em>c</em>, <em>p</em> or <em>t</em> and undergoes the aspirate mutation."
  },
  {
    "id": 14,
    "topic": "soft mutation – particles ‘dyma’/‘dyna’",
    "welsh": "dyma'r gath",
    "english": "here's the cat",
    "tokens": [
      {
        "text": "dyma",
        "type": "trigger",
        "rule": "soft-demonstrative",
        "explanation": "The particles <em>dyma</em> (‘here is’) and <em>dyna</em> (‘there is’) trigger the soft mutation on the following noun.",
      },
      {
        "text": "gath",
        "radical": "cath",
        "type": "mutated",
        "rule": "soft-demonstrative",
        "explanation": "<em>Cath</em> becomes <em>gath</em> after <em>dyma</em> because of the soft mutation.",
        "parseOptions": [
          "Soft mutation after <em>dyma</em>/<em>dyna</em>",
          "Aspirate mutation after <em>a</em>",
          "Nasal mutation after <em>fy</em>"
        ],
        "correctIndex": 0
      }
    ],
    "producePrompt": "Use <em>dyma</em> or <em>dyna</em> with another noun to illustrate the soft mutation."
  },
  {
    "id": 15,
    "topic": "soft mutation – relative particle ‘a’",
    "welsh": "y dyn a welais i",
    "english": "the man I saw",
    "tokens": [
      {
        "text": "a",
        "type": "trigger",
        "rule": "soft-relative",
        "explanation": "The relative particle <em>a</em> triggers the soft mutation on the following verb.",
      },
      {
        "text": "welais",
        "radical": "gwelais",
        "type": "mutated",
        "rule": "soft-relative",
        "explanation": "<em>Gwelais</em> (I saw) becomes <em>welais</em> after the relative particle <em>a</em>.",
        "parseOptions": [
          "Soft mutation after the relative particle <em>a</em>",
          "Aspirate mutation after a conjunction",
          "No mutation after a relative"
        ],
        "correctIndex": 0
      }
    ],
    "producePrompt": "Compose a relative clause using <em>a</em> followed by a verb that shows the soft mutation (e.g. <em>y ferch a ddaeth</em> — the girl who came)."
  },
  {
    "id": 16,
    "topic": "soft mutation – particle ‘mi’/‘fe’",
    "welsh": "mi welais i ef",
    "english": "I saw him",
    "tokens": [
      {
        "text": "mi",
        "type": "trigger",
        "rule": "soft-particle",
        "explanation": "The affirmative particles <em>mi</em> and <em>fe</em> trigger the soft mutation on the following verb in colloquial Welsh.",
      },
      {
        "text": "welais",
        "radical": "gwelais",
        "type": "mutated",
        "rule": "soft-particle",
        "explanation": "<em>Gwelais</em> becomes <em>welais</em> after <em>mi</em> via the soft mutation.",
        "parseOptions": [
          "Soft mutation after <em>mi</em>/<em>fe</em>",
          "Aspirate mutation after a conjunction",
          "Nasal mutation after a pronoun"
        ],
        "correctIndex": 0
      }
    ],
    "producePrompt": "Use <em>mi</em> or <em>fe</em> with another verb to demonstrate the soft mutation (e.g. <em>fe ddes i</em> — I came)."
  },
  {
    "id": 17,
    "topic": "soft mutation – modal/impersonal constructions",
    "welsh": "Rhaid i Rhys fynd",
    "english": "Rhys must go",
    "tokens": [
      {
        "text": "fynd",
        "radical": "mynd",
        "type": "mutated",
        "rule": "soft-modal",
        "explanation": "In <em>rhaid i</em> constructions, the verb following the subject undergoes soft mutation; here <em>mynd</em> becomes <em>fynd</em>.",
        "parseOptions": [
          "Soft mutation after the subject in a modal construction",
          "Aspirate mutation after a numeral",
          "No mutation in this context"
        ],
        "correctIndex": 0
      }
    ],
    "producePrompt": "Write a sentence using <em>rhaid i</em> or another modal expression (e.g. <em>angen ar</em>, <em>gallu</em>) where the verb following the subject is soft‑mutated."
  },
  {
    "id": 18,
    "topic": "soft mutation – vocative",
    "welsh": "Dewch fan hyn, blant!",
    "english": "Come here, children!",
    "tokens": [
      {
        "text": "blant",
        "radical": "plant",
        "type": "mutated",
        "rule": "soft-vocative",
        "explanation": "In the vocative (addressing someone), nouns often undergo the soft mutation: <em>plant</em> becomes <em>blant</em> when calling out to the children.",
        "parseOptions": [
          "Soft mutation in a vocative",
          "Aspirate mutation after a conjunction",
          "Nasal mutation after a numeral"
        ],
        "correctIndex": 0
      }
    ],
    "producePrompt": "Call out to a group of people or things (e.g. ‘Come on, friends!’) and apply the correct mutation."
  },
  {
    "id": 19,
    "topic": "soft mutation – negative particle",
    "welsh": "Doedd dim ots ganddo",
    "english": "He didn’t mind",
    "tokens": [
      {
        "text": "dim",
        "type": "trigger",
        "rule": "soft-negative",
        "explanation": "The negative particle <em>dim</em> triggers the soft mutation on the following noun or pronoun.",
      },
      {
        "text": "ots",
        "radical": "pots",
        "type": "mutated",
        "rule": "soft-negative",
        "explanation": "In colloquial Welsh, <em>p</em> may disappear after <em>dim</em>; here <em>pots</em> becomes <em>ots</em>.",
        "parseOptions": [
          "Soft mutation after the negative particle <em>dim</em>",
          "Aspirate mutation after a conjunction",
          "No mutation after <em>dim</em>"
        ],
        "correctIndex": 0
      }
    ],
    "producePrompt": "Form a negative sentence using <em>dim</em> followed by a noun that undergoes the soft mutation."
  },
  {
    "id": 20,
    "topic": "nasal mutation – prepositions",
    "welsh": "yn ngogledd Cymru",
    "english": "in North Wales",
    "tokens": [
      {
        "text": "yn",
        "type": "trigger",
        "rule": "nasal-preposition",
        "explanation": "The preposition <em>yn</em> meaning ‘in’ triggers the nasal mutation when used with place names beginning with certain consonants.",
      },
      {
        "text": "ngogledd",
        "radical": "gogledd",
        "type": "mutated",
        "rule": "nasal-preposition",
        "explanation": "<em>Gogledd</em> (north) becomes <em>ngogledd</em> after <em>yn</em> via the nasal mutation.",
        "parseOptions": [
          "Nasal mutation after the preposition <em>yn</em>",
          "Soft mutation after a preposition",
          "Aspirate mutation after <em>a</em>"
        ],
        "correctIndex": 0
      }
    ],
    "producePrompt": "Use <em>yn</em> with a place name beginning with <em>c</em>, <em>p</em>, <em>t</em>, <em>b</em>, <em>d</em>, or <em>g</em> to illustrate the nasal mutation (e.g. <em>yn Nghaerdydd</em> — in Cardiff)."
  }
  ,
  {
    "id": 21,
    "topic": "soft mutation – preposition 'am' with 'o'",
    "welsh": "am banad o de",
    "english": "about a cup of tea",
    "tokens": [
      {
        "text": "am",
        "type": "trigger",
        "rule": "soft-preposition",
        "explanation": "The preposition <em>am</em> (about) triggers the soft mutation on the following noun【169933956085742†L1376-L1424】."
      },
      {
        "text": "banad",
        "radical": "panad",
        "type": "mutated",
        "rule": "soft-preposition",
        "explanation": "<em>Panad</em> (cup) becomes <em>banad</em> after <em>am</em> via the soft mutation【169933956085742†L1376-L1424】.",
        "parseOptions": [
          "Soft mutation after a preposition",
          "Aspirate mutation after a preposition",
          "Nasal mutation after a numeral"
        ],
        "correctIndex": 0
      },
      {
        "text": "o",
        "type": "trigger",
        "rule": "soft-preposition",
        "explanation": "The preposition <em>o</em> (of/from) also triggers the soft mutation on the following noun【169933956085742†L1376-L1424】."
      },
      {
        "text": "de",
        "radical": "te",
        "type": "mutated",
        "rule": "soft-preposition",
        "explanation": "<em>Te</em> (tea) becomes <em>de</em> after the preposition <em>o</em> via the soft mutation【169933956085742†L1376-L1424】.",
        "parseOptions": [
          "Soft mutation after a preposition",
          "Aspirate mutation after a conjunction",
          "Nasal mutation after <em>fy</em>"
        ],
        "correctIndex": 0
      }
    ],
    "producePrompt": "Write a phrase using <em>am</em> or <em>o</em> with other nouns to show the soft mutation."
  },
  {
    "id": 22,
    "topic": "soft mutation – preposition 'ar'",
    "welsh": "ar ben",
    "english": "on top",
    "tokens": [
      {
        "text": "ar",
        "type": "trigger",
        "rule": "soft-preposition",
        "explanation": "The preposition <em>ar</em> (on) triggers the soft mutation on the following noun【169933956085742†L1376-L1424】."
      },
      {
        "text": "ben",
        "radical": "pen",
        "type": "mutated",
        "rule": "soft-preposition",
        "explanation": "<em>Pen</em> (top) becomes <em>ben</em> after <em>ar</em> due to the soft mutation【169933956085742†L1376-L1424】.",
        "parseOptions": [
          "Soft mutation after a preposition",
          "Aspirate mutation after a numeral",
          "No mutation after a pronoun"
        ],
        "correctIndex": 0
      }
    ],
    "producePrompt": "Use <em>ar</em> with another noun to illustrate the soft mutation (e.g. <em>ar fwrdd</em> — on a table)."
  },
  {
    "id": 23,
    "topic": "soft mutation – preposition 'at'",
    "welsh": "at ddyn",
    "english": "to a man",
    "tokens": [
      {
        "text": "at",
        "type": "trigger",
        "rule": "soft-preposition",
        "explanation": "The preposition <em>at</em> (to) triggers the soft mutation on the following noun【169933956085742†L1376-L1424】."
      },
      {
        "text": "ddyn",
        "radical": "dyn",
        "type": "mutated",
        "rule": "soft-preposition",
        "explanation": "<em>Dyn</em> (man) becomes <em>ddyn</em> after <em>at</em> via the soft mutation【169933956085742†L1376-L1424】.",
        "parseOptions": [
          "Soft mutation after a preposition",
          "Aspirate mutation after a conjunction",
          "Nasal mutation after a numeral"
        ],
        "correctIndex": 0
      }
    ],
    "producePrompt": "Write a phrase using <em>at</em> with another noun showing the soft mutation (e.g. <em>at fenyw</em> — to a woman)."
  },
  {
    "id": 24,
    "topic": "soft mutation – preposition 'dan'",
    "welsh": "dan do",
    "english": "under a roof",
    "tokens": [
      {
        "text": "dan",
        "type": "trigger",
        "rule": "soft-preposition",
        "explanation": "The preposition <em>dan</em> (under) triggers the soft mutation on the following noun【169933956085742†L1376-L1424】."
      },
      {
        "text": "do",
        "radical": "to",
        "type": "mutated",
        "rule": "soft-preposition",
        "explanation": "<em>To</em> (roof) becomes <em>do</em> after <em>dan</em> due to the soft mutation【169933956085742†L1376-L1424】.",
        "parseOptions": [
          "Soft mutation after a preposition",
          "Aspirate mutation after a numeral",
          "Nasal mutation after <em>fy</em>"
        ],
        "correctIndex": 0
      }
    ],
    "producePrompt": "Use <em>dan</em> with another noun to show the soft mutation (e.g. <em>dan bont</em> — under a bridge)."
  },
  {
    "id": 25,
    "topic": "soft mutation – preposition 'dros'",
    "welsh": "dros bont",
    "english": "over a bridge",
    "tokens": [
      {
        "text": "dros",
        "type": "trigger",
        "rule": "soft-preposition",
        "explanation": "The preposition <em>dros</em> (over) triggers the soft mutation on the following noun【169933956085742†L1376-L1424】."
      },
      {
        "text": "bont",
        "radical": "pont",
        "type": "mutated",
        "rule": "soft-preposition",
        "explanation": "<em>Pont</em> (bridge) becomes <em>bont</em> after <em>dros</em> via the soft mutation【169933956085742†L1376-L1424】.",
        "parseOptions": [
          "Soft mutation after a preposition",
          "Aspirate mutation after a conjunction",
          "Nasal mutation after a numeral"
        ],
        "correctIndex": 0
      }
    ],
    "producePrompt": "Create a phrase with <em>dros</em> and another noun to demonstrate the soft mutation (e.g. <em>dros ffenest</em> — over a window)."
  },
  {
    "id": 26,
    "topic": "soft mutation – preposition 'gan'",
    "welsh": "gan frawd",
    "english": "with a brother",
    "tokens": [
      {
        "text": "gan",
        "type": "trigger",
        "rule": "soft-preposition",
        "explanation": "The preposition <em>gan</em> (with/by) triggers the soft mutation on the following noun【169933956085742†L1376-L1424】."
      },
      {
        "text": "frawd",
        "radical": "brawd",
        "type": "mutated",
        "rule": "soft-preposition",
        "explanation": "<em>Brawd</em> (brother) becomes <em>frawd</em> after <em>gan</em> due to the soft mutation【169933956085742†L1376-L1424】.",
        "parseOptions": [
          "Soft mutation after a preposition",
          "Aspirate mutation after a pronoun",
          "Nasal mutation after <em>fy</em>"
        ],
        "correctIndex": 0
      }
    ],
    "producePrompt": "Use <em>gan</em> with another noun to illustrate the soft mutation (e.g. <em>gan law</em> — by hand)."
  },
  {
    "id": 27,
    "topic": "soft mutation – preposition 'heb'",
    "welsh": "heb fwyd",
    "english": "without food",
    "tokens": [
      {
        "text": "heb",
        "type": "trigger",
        "rule": "soft-preposition",
        "explanation": "The preposition <em>heb</em> (without) triggers the soft mutation on the following noun【169933956085742†L1376-L1424】."
      },
      {
        "text": "fwyd",
        "radical": "bwyd",
        "type": "mutated",
        "rule": "soft-preposition",
        "explanation": "<em>Bwyd</em> (food) becomes <em>fwyd</em> after <em>heb</em> via the soft mutation【169933956085742†L1376-L1424】.",
        "parseOptions": [
          "Soft mutation after a preposition",
          "Aspirate mutation after a preposition",
          "No mutation after <em>heb</em>"
        ],
        "correctIndex": 0
      }
    ],
    "producePrompt": "Write a phrase using <em>heb</em> with another noun that shows the soft mutation (e.g. <em>heb ddŵr</em> — without water)."
  },
  {
    "id": 28,
    "topic": "soft mutation – preposition 'hyd'",
    "welsh": "hyd gefn",
    "english": "along a back",
    "tokens": [
      {
        "text": "hyd",
        "type": "trigger",
        "rule": "soft-preposition",
        "explanation": "The preposition <em>hyd</em> (as far as) triggers the soft mutation on the following noun【169933956085742†L1376-L1424】."
      },
      {
        "text": "gefn",
        "radical": "cefn",
        "type": "mutated",
        "rule": "soft-preposition",
        "explanation": "<em>Cefn</em> (back, ridge) becomes <em>gefn</em> after <em>hyd</em> due to the soft mutation【169933956085742†L1376-L1424】.",
        "parseOptions": [
          "Soft mutation after a preposition",
          "Aspirate mutation after a conjunction",
          "Nasal mutation after a pronoun"
        ],
        "correctIndex": 0
      }
    ],
    "producePrompt": "Use <em>hyd</em> with another noun to show the soft mutation (e.g. <em>hyd lôn</em> — along a lane)."
  },
  {
    "id": 29,
    "topic": "soft mutation – preposition 'i'",
    "welsh": "i ferch",
    "english": "to a girl",
    "tokens": [
      {
        "text": "i",
        "type": "trigger",
        "rule": "soft-preposition",
        "explanation": "The preposition <em>i</em> (to/for) triggers the soft mutation on the following noun【169933956085742†L1376-L1424】."
      },
      {
        "text": "ferch",
        "radical": "merch",
        "type": "mutated",
        "rule": "soft-preposition",
        "explanation": "<em>Merch</em> (girl) becomes <em>ferch</em> after <em>i</em> via the soft mutation【169933956085742†L1376-L1424】.",
        "parseOptions": [
          "Soft mutation after a preposition",
          "Aspirate mutation after a pronoun",
          "Nasal mutation after a numeral"
        ],
        "correctIndex": 0
      }
    ],
    "producePrompt": "Write a phrase using <em>i</em> with another noun to illustrate the soft mutation (e.g. <em>i gariad</em> — to a love)."
  },
  {
    "id": 30,
    "topic": "soft mutation – preposition 'o'",
    "welsh": "o gegin",
    "english": "from a kitchen",
    "tokens": [
      {
        "text": "o",
        "type": "trigger",
        "rule": "soft-preposition",
        "explanation": "The preposition <em>o</em> (from/of) triggers the soft mutation on the following noun【169933956085742†L1376-L1424】."
      },
      {
        "text": "gegin",
        "radical": "cegin",
        "type": "mutated",
        "rule": "soft-preposition",
        "explanation": "<em>Cegin</em> (kitchen) becomes <em>gegin</em> after <em>o</em> due to the soft mutation【169933956085742†L1376-L1424】.",
        "parseOptions": [
          "Soft mutation after a preposition",
          "Aspirate mutation after a conjunction",
          "Nasal mutation after a pronoun"
        ],
        "correctIndex": 0
      }
    ],
    "producePrompt": "Use <em>o</em> with another noun to illustrate the soft mutation (e.g. <em>o bapur</em> — from paper)."
  },
  {
    "id": 31,
    "topic": "soft mutation – preposition 'wrth'",
    "welsh": "wrth fenyw",
    "english": "towards a woman",
    "tokens": [
      {
        "text": "wrth",
        "type": "trigger",
        "rule": "soft-preposition",
        "explanation": "The preposition <em>wrth</em> (towards/by) triggers the soft mutation on the following noun【169933956085742†L1376-L1424】."
      },
      {
        "text": "fenyw",
        "radical": "menyw",
        "type": "mutated",
        "rule": "soft-preposition",
        "explanation": "<em>Menyw</em> (woman) becomes <em>fenyw</em> after <em>wrth</em> via the soft mutation【169933956085742†L1376-L1424】.",
        "parseOptions": [
          "Soft mutation after a preposition",
          "Aspirate mutation after a numeral",
          "Nasal mutation after a pronoun"
        ],
        "correctIndex": 0
      }
    ],
    "producePrompt": "Create a phrase using <em>wrth</em> with another noun to show the soft mutation (e.g. <em>wrth ffrind</em> — to/with a friend)."
  },
  {
    "id": 32,
    "topic": "aspirate mutation – preposition 'gyda'",
    "welsh": "gyda char",
    "english": "with a car",
    "tokens": [
      {
        "text": "gyda",
        "type": "trigger",
        "rule": "aspirate-preposition",
        "explanation": "The preposition <em>gyda</em> (with) triggers the aspirate mutation on nouns beginning with <em>c</em>, <em>p</em> or <em>t</em>【169933956085742†L1461-L1481】."
      },
      {
        "text": "char",
        "radical": "car",
        "type": "mutated",
        "rule": "aspirate-preposition",
        "explanation": "<em>Car</em> becomes <em>char</em> after <em>gyda</em> because it triggers the aspirate mutation【169933956085742†L1461-L1481】.",
        "parseOptions": [
          "Aspirate mutation after a preposition",
          "Soft mutation after a preposition",
          "Nasal mutation after a pronoun"
        ],
        "correctIndex": 0
      }
    ],
    "producePrompt": "Use <em>gyda</em> with another noun starting with <em>c</em>, <em>p</em> or <em>t</em> to illustrate the aspirate mutation."
  },
  {
    "id": 33,
    "topic": "aspirate mutation – preposition 'â'",
    "welsh": "â phlant",
    "english": "with children",
    "tokens": [
      {
        "text": "â",
        "type": "trigger",
        "rule": "aspirate-preposition",
        "explanation": "The preposition <em>â</em> (with) triggers the aspirate mutation on words beginning with <em>c</em>, <em>p</em> or <em>t</em>【169933956085742†L1461-L1481】."
      },
      {
        "text": "phlant",
        "radical": "plant",
        "type": "mutated",
        "rule": "aspirate-preposition",
        "explanation": "<em>Plant</em> (children) becomes <em>phlant</em> after <em>â</em> through the aspirate mutation【169933956085742†L1461-L1481】.",
        "parseOptions": [
          "Aspirate mutation after a preposition",
          "Soft mutation after a preposition",
          "Nasal mutation after <em>fy</em>"
        ],
        "correctIndex": 0
      }
    ],
    "producePrompt": "Write a phrase using <em>â</em> with another <em>c/p/t</em>-initial noun to show the aspirate mutation."
  },
  {
    "id": 34,
    "topic": "aspirate mutation – preposition 'tua'",
    "welsh": "tua thref",
    "english": "towards a town",
    "tokens": [
      {
        "text": "tua",
        "type": "trigger",
        "rule": "aspirate-preposition",
        "explanation": "The preposition <em>tua</em> (towards) triggers the aspirate mutation on nouns beginning with <em>c</em>, <em>p</em> or <em>t</em>【169933956085742†L1461-L1481】."
      },
      {
        "text": "thref",
        "radical": "tref",
        "type": "mutated",
        "rule": "aspirate-preposition",
        "explanation": "<em>Tref</em> (town) becomes <em>thref</em> after <em>tua</em> due to the aspirate mutation【169933956085742†L1461-L1481】.",
        "parseOptions": [
          "Aspirate mutation after a preposition",
          "Soft mutation after a preposition",
          "Nasal mutation after <em>fy</em>"
        ],
        "correctIndex": 0
      }
    ],
    "producePrompt": "Use <em>tua</em> with another noun starting with <em>c</em>, <em>p</em> or <em>t</em> to illustrate the aspirate mutation."
  },
  {
    "id": 35,
    "topic": "aspirate mutation – numeral 'tri' (three)",
    "welsh": "tri phlentyn",
    "english": "three children",
    "tokens": [
      {
        "text": "tri",
        "type": "trigger",
        "rule": "aspirate-numeral",
        "explanation": "The numeral <em>tri</em> triggers the aspirate mutation on nouns beginning with <em>c</em>, <em>p</em> or <em>t</em>【169933956085742†L1461-L1481】."
      },
      {
        "text": "phlentyn",
        "radical": "plentyn",
        "type": "mutated",
        "rule": "aspirate-numeral",
        "explanation": "<em>Plentyn</em> (child) becomes <em>phlentyn</em> after <em>tri</em> due to the aspirate mutation【169933956085742†L1461-L1481】.",
        "parseOptions": [
          "Aspirate mutation after a numeral",
          "Soft mutation after a preposition",
          "Nasal mutation after <em>fy</em>"
        ],
        "correctIndex": 0
      }
    ],
    "producePrompt": "Create another phrase using <em>tri</em> with a <em>c/p/t</em>-initial noun to demonstrate the aspirate mutation."
  },
  {
    "id": 36,
    "topic": "aspirate mutation – numeral 'chwe' (six)",
    "welsh": "chwe photel",
    "english": "six bottles",
    "tokens": [
      {
        "text": "chwe",
        "type": "trigger",
        "rule": "aspirate-numeral",
        "explanation": "<em>Chwe</em> triggers the aspirate mutation on nouns beginning with <em>c</em>, <em>p</em> or <em>t</em>【169933956085742†L1461-L1481】."
      },
      {
        "text": "photel",
        "radical": "potel",
        "type": "mutated",
        "rule": "aspirate-numeral",
        "explanation": "<em>Potel</em> (bottle) becomes <em>photel</em> after <em>chwe</em> due to the aspirate mutation【169933956085742†L1461-L1481】.",
        "parseOptions": [
          "Aspirate mutation after a numeral",
          "Soft mutation after a conjunction",
          "No mutation after a numeral"
        ],
        "correctIndex": 0
      }
    ],
    "producePrompt": "Use <em>chwe</em> with another noun beginning with <em>c</em>, <em>p</em> or <em>t</em> to illustrate the aspirate mutation."
  },
  {
    "id": 37,
    "topic": "soft mutation – possessive pronouns (your)",
    "welsh": "dy gariad",
    "english": "your love",
    "tokens": [
      {
        "text": "dy",
        "type": "trigger",
        "rule": "soft-possessive",
        "explanation": "The possessive pronoun <em>dy</em> (your) triggers the soft mutation on the following noun【169933956085742†L1376-L1424】."
      },
      {
        "text": "gariad",
        "radical": "cariad",
        "type": "mutated",
        "rule": "soft-possessive",
        "explanation": "<em>Cariad</em> (love) becomes <em>gariad</em> after <em>dy</em> due to the soft mutation【169933956085742†L1376-L1424】.",
        "parseOptions": [
          "Soft mutation after a possessive pronoun",
          "Aspirate mutation after <em>dy</em>",
          "Nasal mutation after <em>fy</em>"
        ],
        "correctIndex": 0
      }
    ],
    "producePrompt": "Use <em>dy</em> with another noun to show the soft mutation (e.g. <em>dy dŷ</em> — your house)."
  },
  {
    "id": 38,
    "topic": "soft mutation – possessive pronouns (our)",
    "welsh": "ein gar",
    "english": "our car",
    "tokens": [
      {
        "text": "ein",
        "type": "trigger",
        "rule": "soft-possessive",
        "explanation": "The possessive pronoun <em>ein</em> (our) triggers the soft mutation on the following noun【169933956085742†L1376-L1424】."
      },
      {
        "text": "gar",
        "radical": "car",
        "type": "mutated",
        "rule": "soft-possessive",
        "explanation": "<em>Car</em> becomes <em>gar</em> after <em>ein</em> due to the soft mutation【169933956085742†L1376-L1424】.",
        "parseOptions": [
          "Soft mutation after a possessive pronoun",
          "Aspirate mutation after a preposition",
          "Nasal mutation after <em>fy</em>"
        ],
        "correctIndex": 0
      }
    ],
    "producePrompt": "Write a phrase using <em>ein</em> with another noun to illustrate the soft mutation (e.g. <em>ein dref</em> — our town)."
  },
  {
    "id": 39,
    "topic": "soft mutation – possessive pronouns (their)",
    "welsh": "eu dŷ",
    "english": "their house",
    "tokens": [
      {
        "text": "eu",
        "type": "trigger",
        "rule": "soft-possessive",
        "explanation": "The possessive pronoun <em>eu</em> (their) triggers the soft mutation on the following noun【169933956085742†L1376-L1424】."
      },
      {
        "text": "dŷ",
        "radical": "tŷ",
        "type": "mutated",
        "rule": "soft-possessive",
        "explanation": "<em>Tŷ</em> (house) becomes <em>dŷ</em> after <em>eu</em> via the soft mutation【169933956085742†L1376-L1424】.",
        "parseOptions": [
          "Soft mutation after a possessive pronoun",
          "Aspirate mutation after a conjunction",
          "Nasal mutation after a numeral"
        ],
        "correctIndex": 0
      }
    ],
    "producePrompt": "Use <em>eu</em> with another noun to illustrate the soft mutation (e.g. <em>eu gwraig</em> — their wife)."
  },
  {
    "id": 40,
    "topic": "mixed mutation – negative particle 'ni'",
    "welsh": "ni chaf i frecwast",
    "english": "I will not have breakfast",
    "tokens": [
      {
        "text": "ni",
        "type": "trigger",
        "rule": "mixed-negative",
        "explanation": "The negative particle <em>ni</em> triggers a mixed mutation: aspirate mutation on verbs beginning with <em>c</em>, <em>p</em> or <em>t</em>, and soft mutation on other consonants【169933956085742†L1534-L1542】."
      },
      {
        "text": "chaf",
        "radical": "caf",
        "type": "mutated",
        "rule": "mixed-negative",
        "explanation": "<em>Caf</em> (I will have) becomes <em>chaf</em> after <em>ni</em> due to the aspirate part of the mixed mutation【169933956085742†L1534-L1542】.",
        "parseOptions": [
          "Mixed mutation after the negative particle <em>ni</em>",
          "Soft mutation after a preposition",
          "Aspirate mutation after a numeral"
        ],
        "correctIndex": 0
      },
      {
        "text": "frecwast",
        "radical": "brecwast",
        "type": "mutated",
        "rule": "mixed-negative",
        "explanation": "<em>Brecwast</em> (breakfast) softens to <em>frecwast</em> after <em>ni</em> as part of the mixed mutation【169933956085742†L1534-L1542】.",
        "parseOptions": [
          "Mixed mutation after <em>ni</em>",
          "No mutation after <em>ni</em>",
          "Aspirate mutation after a conjunction"
        ],
        "correctIndex": 0
      }
    ],
    "producePrompt": "Use the negative particle <em>ni</em> with another verb beginning with <em>c</em>, <em>p</em> or <em>t</em> and a noun to illustrate the mixed mutation (e.g. <em>ni phrynodd hi gar</em> — she didn't buy a car)."
  },
  {
    "id": 41,
    "topic": "mixed mutation – negative particle 'na'",
    "welsh": "na phrynodd hi gar",
    "english": "she didn't buy a car",
    "tokens": [
      {
        "text": "na",
        "type": "trigger",
        "rule": "mixed-negative",
        "explanation": "The negative particle <em>na</em> triggers the same mixed mutation as <em>ni</em>: aspirate mutation on <em>c/p/t</em> and soft mutation on other consonants【169933956085742†L1534-L1542】."
      },
      {
        "text": "phrynodd",
        "radical": "prynodd",
        "type": "mutated",
        "rule": "mixed-negative",
        "explanation": "<em>Prynodd</em> (she bought) becomes <em>phrynodd</em> after <em>na</em> due to the aspirate part of the mixed mutation【169933956085742†L1534-L1542】.",
        "parseOptions": [
          "Mixed mutation after the negative particle <em>na</em>",
          "Soft mutation after a preposition",
          "Nasal mutation after a numeral"
        ],
        "correctIndex": 0
      },
      {
        "text": "gar",
        "radical": "car",
        "type": "mutated",
        "rule": "mixed-negative",
        "explanation": "<em>Car</em> becomes <em>gar</em> in this context because <em>na</em> softens other consonants as part of the mixed mutation【169933956085742†L1534-L1542】.",
        "parseOptions": [
          "Mixed mutation after <em>na</em>",
          "Soft mutation after a conjunction",
          "Aspirate mutation after a preposition"
        ],
        "correctIndex": 0
      }
    ],
    "producePrompt": "Form a negative sentence with <em>na</em> involving a verb beginning with <em>c</em>, <em>p</em> or <em>t</em> and see how both the verb and object mutate."
  },
  {
    "id": 42,
    "topic": "soft mutation – intensifier 'mor'",
    "welsh": "mor braf",
    "english": "so fine",
    "tokens": [
      {
        "text": "mor",
        "type": "trigger",
        "rule": "soft-intensifier",
        "explanation": "The intensifier <em>mor</em> (so) triggers the soft mutation on the following adjective or adverb【169933956085742†L1376-L1424】."
      },
      {
        "text": "fraf",
        "radical": "braf",
        "type": "mutated",
        "rule": "soft-intensifier",
        "explanation": "<em>Braf</em> (fine, pleasant) becomes <em>fraf</em> after <em>mor</em> due to the soft mutation【169933956085742†L1376-L1424】.",
        "parseOptions": [
          "Soft mutation after <em>mor</em>",
          "Aspirate mutation after a conjunction",
          "No mutation after an intensifier"
        ],
        "correctIndex": 0
      }
    ],
    "producePrompt": "Use <em>mor</em> with another adjective to illustrate the soft mutation (e.g. <em>mor ddrwg</em> — so bad)."
  },
  {
    "id": 43,
    "topic": "soft mutation – intensifier 'rhy'",
    "welsh": "rhy wan",
    "english": "too weak",
    "tokens": [
      {
        "text": "rhy",
        "type": "trigger",
        "rule": "soft-intensifier",
        "explanation": "The intensifier <em>rhy</em> (too) also triggers the soft mutation on the following adjective【169933956085742†L1376-L1424】."
      },
      {
        "text": "wan",
        "radical": "gwan",
        "type": "mutated",
        "rule": "soft-intensifier",
        "explanation": "<em>Gwan</em> (weak) becomes <em>wan</em> after <em>rhy</em> due to the soft mutation【169933956085742†L1376-L1424】.",
        "parseOptions": [
          "Soft mutation after <em>rhy</em>",
          "Aspirate mutation after <em>rhy</em>",
          "Nasal mutation after a preposition"
        ],
        "correctIndex": 0
      }
    ],
    "producePrompt": "Use <em>rhy</em> with another adjective that softens to illustrate the rule (e.g. <em>rhy fach</em> — too small)."
  },
  {
    "id": 44,
    "topic": "soft mutation – adjective 'hen' before a noun",
    "welsh": "hen ddyn",
    "english": "an old man",
    "tokens": [
      {
        "text": "hen",
        "type": "trigger",
        "rule": "soft-adjective",
        "explanation": "Certain adjectives placed before the noun, such as <em>hen</em> (old), trigger the soft mutation【169933956085742†L1424-L1426】."
      },
      {
        "text": "ddyn",
        "radical": "dyn",
        "type": "mutated",
        "rule": "soft-adjective",
        "explanation": "<em>Dyn</em> (man) becomes <em>ddyn</em> after <em>hen</em> due to the soft mutation【169933956085742†L1424-L1426】.",
        "parseOptions": [
          "Soft mutation after an adjective placed before the noun",
          "Aspirate mutation after a numeral",
          "Nasal mutation after a preposition"
        ],
        "correctIndex": 0
      }
    ],
    "producePrompt": "Place <em>hen</em> before another noun to illustrate the soft mutation (e.g. <em>hen gath</em> — an old cat)."
  },
  {
    "id": 45,
    "topic": "soft mutation – adjective 'prif' before a noun",
    "welsh": "prif weinidog",
    "english": "prime minister",
    "tokens": [
      {
        "text": "prif",
        "type": "trigger",
        "rule": "soft-adjective",
        "explanation": "The adjective <em>prif</em> (chief/main), when placed before a noun, triggers the soft mutation【169933956085742†L1424-L1426】."
      },
      {
        "text": "weinidog",
        "radical": "gweinidog",
        "type": "mutated",
        "rule": "soft-adjective",
        "explanation": "<em>Gweinidog</em> (minister) becomes <em>weinidog</em> after <em>prif</em> via the soft mutation【169933956085742†L1424-L1426】.",
        "parseOptions": [
          "Soft mutation after a preceding adjective",
          "Aspirate mutation after a conjunction",
          "Nasal mutation after a pronoun"
        ],
        "correctIndex": 0
      }
    ],
    "producePrompt": "Use another adjective that precedes a noun (e.g. <em>gwir</em>, <em>pur</em>) to show the soft mutation."
  },
  {
    "id": 46,
    "topic": "soft mutation – adjective 'gwir' before a noun",
    "welsh": "gwir gariad",
    "english": "true love",
    "tokens": [
      {
        "text": "gwir",
        "type": "trigger",
        "rule": "soft-adjective",
        "explanation": "Adjectives like <em>gwir</em> (true) placed before the noun trigger the soft mutation【169933956085742†L1424-L1426】."
      },
      {
        "text": "gariad",
        "radical": "cariad",
        "type": "mutated",
        "rule": "soft-adjective",
        "explanation": "<em>Cariad</em> (love) becomes <em>gariad</em> after <em>gwir</em> via the soft mutation【169933956085742†L1424-L1426】.",
        "parseOptions": [
          "Soft mutation after a preceding adjective",
          "Aspirate mutation after a preposition",
          "No mutation after an adjective"
        ],
        "correctIndex": 0
      }
    ],
    "producePrompt": "Place <em>gwir</em> before another noun to illustrate the soft mutation (e.g. <em>gwir ffrind</em> — a true friend)."
  },
  {
    "id": 47,
    "topic": "soft mutation – adjective 'pur' before a noun",
    "welsh": "pur gymhleth",
    "english": "quite complex",
    "tokens": [
      {
        "text": "pur",
        "type": "trigger",
        "rule": "soft-adjective",
        "explanation": "The intensifying adjective <em>pur</em> (quite/very) triggers the soft mutation when placed before an adjective or noun【169933956085742†L1424-L1426】."
      },
      {
        "text": "gymhleth",
        "radical": "cymhleth",
        "type": "mutated",
        "rule": "soft-adjective",
        "explanation": "<em>Cymhleth</em> (complex) becomes <em>gymhleth</em> after <em>pur</em> due to the soft mutation【169933956085742†L1424-L1426】.",
        "parseOptions": [
          "Soft mutation after a preceding adjective",
          "Aspirate mutation after a conjunction",
          "Nasal mutation after a numeral"
        ],
        "correctIndex": 0
      }
    ],
    "producePrompt": "Use <em>pur</em> before another adjective to illustrate the soft mutation (e.g. <em>pur ddel</em> — quite pretty)."
  },
  {
    "id": 48,
    "topic": "soft mutation – 'Nos' with day names",
    "welsh": "Nos Fawrth",
    "english": "Tuesday night",
    "tokens": [
      {
        "text": "Nos",
        "type": "trigger",
        "rule": "soft-nos",
        "explanation": "The word <em>Nos</em> (night) triggers soft mutation on following day-of-week names【169933956085742†L1424-L1426】."
      },
      {
        "text": "Fawrth",
        "radical": "Mawrth",
        "type": "mutated",
        "rule": "soft-nos",
        "explanation": "<em>Mawrth</em> (Tuesday) becomes <em>Fawrth</em> after <em>Nos</em> due to the soft mutation【169933956085742†L1424-L1426】.",
        "parseOptions": [
          "Soft mutation after <em>Nos</em>",
          "Aspirate mutation after <em>Nos</em>",
          "Nasal mutation after a preposition"
        ],
        "correctIndex": 0
      }
    ],
    "producePrompt": "Use <em>Nos</em> with another day name to illustrate the soft mutation (e.g. <em>Nos Fawrth</em>, <em>Nos Sadwrn</em>)."
  },
  {
    "id": 49,
    "topic": "no mutation – 'mor' before ll- and rh- words",
    "welsh": "mor llawn",
    "english": "so full",
    "tokens": [
      {
        "text": "mor",
        "type": "trigger",
        "rule": "limited-soft-intensifier",
        "explanation": "The intensifier <em>mor</em> usually causes soft mutation, but words beginning with the digraphs <em>ll</em> or <em>rh</em> do not mutate【169933956085742†L1386-L1388】."
      },
      {
        "text": "llawn",
        "radical": "llawn",
        "type": "radical",
        "rule": "limited-soft-intensifier",
        "explanation": "<em>Llawn</em> (full) begins with <em>ll</em>, which resists soft mutation, so the word remains unchanged after <em>mor</em>【169933956085742†L1386-L1388】.",
        "parseOptions": [
          "No mutation because ll- does not soften",
          "Soft mutation after <em>mor</em>",
          "Aspirate mutation after <em>mor</em>"
        ],
        "correctIndex": 0
      }
    ],
    "producePrompt": "Use <em>mor</em> with a word beginning with <em>ll</em> or <em>rh</em> to show that no mutation occurs (e.g. <em>mor rhad</em> — so cheap)."
  },
  {
    "id": 50,
    "topic": "nasal mutation – numerals (days)",
    "welsh": "saith niwrnod",
    "english": "seven days",
    "tokens": [
      {
        "text": "saith",
        "type": "trigger",
        "rule": "nasal-numeral",
        "explanation": "Certain numerals such as <em>saith</em>, <em>wyth</em>, <em>deng</em>, <em>deuddeng</em> and others trigger nasal mutation on time words like <em>diwrnod</em> ('day')【169933956085742†L1494-L1499】."
      },
      {
        "text": "niwrnod",
        "radical": "diwrnod",
        "type": "mutated",
        "rule": "nasal-numeral",
        "explanation": "<em>Diwrnod</em> becomes <em>niwrnod</em> after <em>saith</em> due to the nasal mutation【169933956085742†L1494-L1499】.",
        "parseOptions": [
          "Nasal mutation after certain numerals (days)",
          "Soft mutation after a conjunction",
          "Aspirate mutation after <em>tri</em>"
        ],
        "correctIndex": 0
      }
    ],
    "producePrompt": "Combine another numeral (wyth, deng, deuddeng, pymtheg) with <em>diwrnod</em> to illustrate the nasal mutation on 'day'."
  }
];
