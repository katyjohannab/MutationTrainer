/*
 * A small dataset of Welsh sentences illustrating different types of initial
 * consonant mutation.  Each exercise consists of a Welsh sentence with one
 * or more mutated words.  For each mutated word we provide its radical
 * (unmutated base form), the explanation of why it mutates and the rule name.
 * During the parse phase learners must identify the correct rule; the
 * `parseOptions` array holds distractors and the correct option.
 */

const exercises = [
  {
    id: 1,
    welsh: "dwy gath",
    english: "two cats",
    tokens: [
      {
        text: "dwy",
        type: "trigger",
        rule: "soft",
        explanation: "The numeral <em>dwy</em> (two, feminine) triggers the soft mutation on the following noun",
      },
      {
        text: "gath",
        radical: "cath",
        type: "mutated",
        rule: "soft",
        explanation: "<em>cath</em> becomes <em>gath</em> after the numeral <em>dwy</em> by the soft mutation",
        parseOptions: [
          "Soft mutation after a feminine numeral",
          "Aspirate mutation after a numeral",
          "Nasal mutation after a preposition",
        ],
        correctIndex: 0,
      },
    ],
    producePrompt:
      "Write your own phrase with a different feminine numeral (e.g. un, dwy, tair) that triggers the same mutation on a noun.",
  },
  {
    id: 2,
    welsh: "tri char",
    english: "three cars",
    tokens: [
      {
        text: "tri",
        type: "trigger",
        rule: "aspirate",
        explanation: "The numeral <em>tri</em> (three, masculine) is one of a small set of triggers (tri, chwe, tua) that cause the aspirate mutation on nouns beginning with <em>c</em>, <em>p</em> or <em>t</em>【169933956085742†L1461-L1487】",
      },
      {
        text: "char",
        radical: "car",
        type: "mutated",
        rule: "aspirate",
        explanation: "<em>car</em> becomes <em>char</em> after <em>tri</em> because <em>tri</em> triggers the aspirate mutation for nouns starting with <em>c</em>, <em>p</em> or <em>t</em>【169933956085742†L1461-L1487】",
        parseOptions: [
          "Soft mutation after a particle",
          "Aspirate mutation after specific triggers (tri/chwe/tua)",
          "Nasal mutation after fy ('my')",
        ],
        correctIndex: 1,
      },
    ],
    producePrompt:
      "Write another phrase with <em>tri</em> (three) or <em>chwe</em> (six) and a noun starting with <strong>c</strong>, <strong>p</strong> or <strong>t</strong> that shows the same aspirate mutation.",
  },
  {
    id: 3,
    welsh: "Rhaid i Emrys fynd yn gynnar",
    english: "Emrys must go early",
    tokens: [
      {
        text: "fynd",
        radical: "mynd",
        type: "mutated",
        rule: "soft-subject",
        explanation:
          "The soft mutation on <em>mynd</em> (&rarr; <em>fynd</em>) occurs because the verb appears after the subject <em>Emrys</em> in a <em>rhaid i</em> construction【169933956085742†L1294-L1311】.",
        parseOptions: [
          "Soft mutation after the subject of the sentence",
          "Soft mutation after the preposition <em>i</em>",
          "Aspirate mutation after <em>rhaid</em>",
        ],
        correctIndex: 0,
      },
      {
        text: "gynnar",
        radical: "cynnar",
        type: "mutated",
        rule: "soft-yn",
        explanation:
          "The complement marker <em>yn</em> triggers soft mutation of adjectives and nouns; here <em>cynnar</em> becomes <em>gynnar</em>【169933956085742†L1374-L1424】.",
        parseOptions: [
          "Soft mutation after a feminine numeral",
          "Soft mutation after <em>yn</em> introducing a complement",
          "Nasal mutation after <em>fy</em>",
        ],
        correctIndex: 1,
      },
    ],
    producePrompt:
      "Write a sentence using <em>rhaid i</em> or another modal construction where the verb follows the subject and is mutated.",
  },
  {
    id: 4,
    welsh: "Bws a char",
    english: "A bus and a car",
    tokens: [
      {
        text: "a",
        type: "trigger",
        rule: "aspirate",
        explanation: "The conjunction <em>a</em> (and) triggers the aspirate mutation on words beginning with <em>c</em>, <em>p</em> or <em>t</em>【169933956085742†L1461-L1487】.",
      },
      {
        text: "char",
        radical: "car",
        type: "mutated",
        rule: "aspirate",
        explanation: "<em>car</em> becomes <em>char</em> after <em>a</em> by the aspirate mutation",
        parseOptions: [
          "Soft mutation after a preposition",
          "Aspirate mutation after the conjunction <em>a</em>",
          "Nasal mutation after a numeral",
        ],
        correctIndex: 1,
      },
    ],
    producePrompt:
      "Form a noun phrase linked by <em>a</em> (‘and’) where the second noun undergoes the aspirate mutation (e.g. <em>bara a chaws</em> — bread and cheese).",
  },
  {
    id: 5,
    welsh: "Dewch fan hyn, blant!",
    english: "Come here, children!",
    tokens: [
      {
        text: "blant",
        radical: "plant",
        type: "mutated",
        rule: "soft-vocative",
        explanation:
          "Calling or addressing someone by a noun triggers a soft mutation; here <em>plant</em> (children) becomes <em>blant</em>【169933956085742†L1561-L1563】.",
        parseOptions: [
          "Soft mutation in a vocative (addressing someone)",
          "Aspirate mutation after a conjunction",
          "Nasal mutation after a numeral",
        ],
        correctIndex: 0,
      },
    ],
    producePrompt:
      "Write a short exclamation calling a group of people or things by name (e.g. ‘Come on, friends!’) using the correct mutation.",
  },
  {
    id: 6,
    welsh: "am baned o de",
    english: "for a cup of tea",
    tokens: [
      {
        text: "am",
        type: "trigger",
        rule: "soft-preposition",
        explanation: "The preposition <em>am</em> triggers the soft mutation on the following noun.",
      },
      {
        text: "baned",
        radical: "paned",
        type: "mutated",
        rule: "soft-preposition",
        explanation: "<em>paned</em> becomes <em>baned</em> after the soft-mutating preposition <em>am</em>.",
        parseOptions: [
          "Soft mutation after a preposition",
          "Aspirate mutation after a conjunction",
          "Nasal mutation after a numeral",
        ],
        correctIndex: 0,
      },
    ],
    producePrompt:
      "Create a phrase using another preposition (am, ar, at, dan, dros, gan, heb, i, o, tan, trwy, wrth) that triggers the soft mutation on the following noun.",
  },
  {
    id: 7,
    welsh: "fy nghi",
    english: "my dog",
    tokens: [
      {
        text: "fy",
        type: "trigger",
        rule: "nasal-pronoun",
        explanation: "The possessive pronoun <em>fy</em> (‘my’) triggers the nasal mutation on the following noun.",
      },
      {
        text: "nghi",
        radical: "ci",
        type: "mutated",
        rule: "nasal-pronoun",
        explanation: "<em>ci</em> (dog) undergoes the nasal mutation after <em>fy</em> and appears as <em>nghi</em>.",
        parseOptions: [
          "Nasal mutation after <em>fy</em> (‘my’)",
          "Soft mutation after <em>ei</em> (‘his’)",
          "Aspirate mutation after a numeral",
        ],
        correctIndex: 0,
      },
    ],
    producePrompt:
      "Write another noun phrase beginning with <em>fy</em> that causes the nasal mutation (e.g. <em>fy mhen</em> — my head).",
  },
];
