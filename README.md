# Welsh Mutation Trainer App

This repository contains a simple web‑based trainer for learning and practising Welsh initial consonant mutations.  The aim of the app is to help learners move seamlessly from reading examples to analysing what is going on and finally to producing their own sentences using the same grammatical structures.

The app is based on the mutation rules described in *Modern Welsh — A Comprehensive Grammar* by Gareth King.  All examples in the included dataset are taken or adapted from that text.  Key rules and triggers for mutations are summarised below with references to the grammar (page numbers refer to the third edition).  See the `data.js` file for concrete examples.

## Mutation system overview

Modern Welsh has three principal initial consonant mutations, plus a mixed mutation used in a few contexts.  The table below summarises which radical consonants change under each mutation.  A dash (—) means the consonant is unaffected.  Details can be found in the grammar at pages 3‑12【169933956085742†L1159-L1251】.

| Radical | Soft (SM) | Aspirate (AM) | Nasal (NM) |
|-------|-----------|---------------|-----------|
| **c** | g  | ch  | ngh  |
| **p** | b  | ph  | mh  |
| **t** | d  | th  | nh  |
| **g** | disappears | — | ng  |
| **b** | f  | — | — |
| **d** | dd  | — | — |
| **ll** | l  | — | — |
| **m** | f  | (mh) | — |
| **rh** | r  | — | — |
| **n** | — | (nh) | — |

The **soft mutation** is by far the most common in spoken Welsh.  Aspirate and nasal mutations occur after a more limited set of triggers and are often optional in informal speech【169933956085742†L1476-L1487】.  A consonant that has already been mutated cannot undergo a second mutation【169933956085742†L1280-L1284】.

## Contact mutation triggers

Many mutations are triggered by high‑frequency words immediately preceding the mutated word.  These are known as **contact mutations**.  Important triggers for the soft mutation include most simple prepositions and a small set of particles and numerals【169933956085742†L1374-L1424】:

*Prepositions*: **am**, **ar**, **at**, **dan**, **dros**, **gan**, **heb**, **hyd**, **i**, **o**, **tan**, **trwy/drwy**, **wrth**  
*Particles and others*: **a** (relative/linking), **mi/fe** (affirmative particles), **mor** “so”, **pur** “very”, **rhy** “too”, **dy** “your (sg.)”, **ei** “his”, **un/dau/dwy** “one/two”, **pa…** “which …”, **pan** “when”, **dyma/dyna/yma/yna** “here/there is …”, **neu** “or”, **rhy** “too”, **y** “the” before feminine nouns and adjectives (except l‑ and rh‑), **yn** with nouns/adjectives, and adjectives placed before a noun【169933956085742†L1374-L1424】.

The **aspirate mutation** is triggered by a much smaller group of words: **a** “and”, **gyd a** and **â** “with”, **tri** “three”, **chwe** “six”, **tua** “about/towards” and **ei** “her”【169933956085742†L1461-L1477】.  Even among these, application of the aspirate mutation in everyday speech is inconsistent and strongest with words beginning in **c‑**【169933956085742†L1476-L1487】.

The **nasal mutation** is rare.  It can occur after **fy ’(y)nn** “my” and **yn n** “in” but is often optional; it also affects **blynedd** “year” and **diwrnod** “day” after certain numerals【169933956085742†L1490-L1523】.

## Grammatical mutation

In addition to contact triggers, a small number of constructions require a mutation for grammatical reasons.  The soft mutation occurs:

1. **After the subject in verb–subject–object sentences** (e.g. *Naethon nhwº fynd* “They went”).  This is a major source of soft mutation and cannot be blocked【169933956085742†L1294-L1311】.
2. **With adverbs of time or manner**: *ºddwy ºflynedd yn ôl* “two years ago”【169933956085742†L1558-L1560】.
3. **In vocatives**, when calling someone by name: *Dewch fan hyn, ºblant!* “Come here, children!”【169933956085742†L1561-L1563】.
4. **With inflected verb forms**: *ºGolles i’r tocyn* “I lost the ticket”.  In spoken Welsh the soft mutation is applied broadly after inflected verbs【169933956085742†L1564-L1567】.
5. **After an intrusive element** inserted into the basic verb–subject–object order【169933956085742†L1568-L1574】.

Words that are already mutated or inherently resist mutation (e.g. *arth*, *egni*, *siop*) do not change【169933956085742†L1256-L1266】.  Personal names and most foreign place‑names do not mutate【169933956085742†L1587-L1594】.

## Numerals and mutation

Numbers can trigger mutations on following nouns.  The low numerals **un**, **dau** (masc.), **dwy** (fem.) and **un**/**dwy** trigger the soft mutation【169933956085742†L1374-L1424】.  For example, *dwy ºgath* “two (female) cats” softens **cath** to **gath**.  In contrast, the aspirate mutation occurs after **tri** (masc.), **chwe** “six” and occasionally **tua** when followed by words starting with **c‑**, **p‑** or **t‑**【169933956085742†L1461-L1487】.  Numerals relating to time can occasionally trigger the nasal mutation on *blwyddyn* and *diwrnod* (see §176 of the grammar)【169933956085742†L1490-L1523】.

## App structure

The trainer cycles through three modes for each example:

1. **Read** – Shows a short Welsh sentence with tappable highlights around clause boundaries, mutation triggers and the mutated words.  The radical (base form) of any mutated word is displayed faintly beside it so learners can see what changed.  Hover or tap on a highlight to see a brief explanation.
2. **Parse** – Presents the same sentence but hides the explanations.  Learners must label which grammatical or contact rule caused each mutation.  Multiple‑choice buttons are provided.  Immediate feedback is given.
3. **Produce** – Asks learners to write their own one‑ or two‑sentence response reusing the target structure.  For example, after a number‑triggered mutation example, learners are asked to produce a phrase with a different number that forces the same type of change.

### Running locally

1. Open `index.html` in your browser.  Everything is client‑side and no build step is required.
2. To add more examples, edit `data.js`.  Each entry should contain the Welsh sentence, its English translation, metadata about the mutated word(s) and the correct rules.

### Contributions

This project is intentionally kept simple so that it can be hosted as static pages (e.g. via GitHub Pages).  Pull requests to extend the dataset or improve the interface are welcome.  Please cite the relevant sections of the grammar when adding new examples.