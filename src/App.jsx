import { useMemo, useState } from 'react'
import Papa from 'papaparse'

const SAMPLE_CSV = `Topic,Welsh,English,Rule,Notes
Soft mutation – numerals (feminine),un gath,one cat,Soft,Triggered by the feminine numeral "un"
Soft mutation – possessives,ei lysiau,her vegetables,Soft,Possessive "ei" (her) softens following consonants
Aspirate mutation – conjunction,a chath,and a cat,Aspirate,Conjunction "a" causes the aspirate mutation before c-
Nasal mutation – preposition,yn Nghaerdydd,in Cardiff,Nasal,Preposition "yn" can trigger the nasal mutation before place names
Contact mutation – particle,fe ddynion,men,Soft,Particle "fe" can cause a soft mutation on following verbs
`

const parseCsv = (text) =>
  Papa.parse(text, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header) => header.trim(),
  })

function App() {
  const [csvText, setCsvText] = useState(SAMPLE_CSV)
  const [{ rows, errors }, setData] = useState(() => {
    const result = parseCsv(SAMPLE_CSV)
    return { rows: result.data, errors: result.errors }
  })
  const [status, setStatus] = useState('Sample data loaded successfully.')

  const groupedByRule = useMemo(() => {
    return rows.reduce((acc, row) => {
      const rule = row.Rule || row.rule || row.type
      if (!rule) return acc
      const key = String(rule).trim()
      acc[key] = (acc[key] || 0) + 1
      return acc
    }, {})
  }, [rows])

  const handleCsvChange = (text) => {
    setCsvText(text)
    const result = parseCsv(text)
    setData({ rows: result.data, errors: result.errors })
    setStatus(result.errors.length ? 'Parsing finished with warnings.' : 'CSV parsed successfully.')
  }

  const handleFileChange = (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (ev) => {
      const nextValue = typeof ev.target?.result === 'string' ? ev.target.result : ''
      handleCsvChange(nextValue)
    }
    reader.onerror = () => {
      setStatus('Unable to read that file. Please try again with a UTF-8 CSV.')
    }
    reader.readAsText(file)
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="bg-gradient-to-r from-indigo-500 to-blue-500 text-white py-10 shadow-lg">
        <div className="max-w-5xl mx-auto px-4">
          <p className="text-sm font-semibold uppercase tracking-wide text-indigo-100">Vite + React</p>
          <h1 className="mt-1 text-3xl font-bold">Welsh Mutation Dataset Explorer</h1>
          <p className="mt-2 max-w-3xl text-indigo-50">
            Load your mutation exercises from a CSV file, inspect them quickly, and track which mutation rules appear most often.
            The parser uses PapaParse under the hood and works entirely in the browser.
          </p>
          <div className="mt-4 flex flex-wrap gap-3 items-center">
            <label className="btn btn-light cursor-pointer" htmlFor="upload-input">
              <span className="font-semibold">Upload CSV</span>
              <input id="upload-input" type="file" accept=".csv" onChange={handleFileChange} className="sr-only" />
            </label>
            <button className="btn btn-ghost" type="button" onClick={() => handleCsvChange(SAMPLE_CSV)}>
              Reset to sample data
            </button>
            <span className="text-sm opacity-90">{status}</span>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-10 space-y-8">
        <section className="grid gap-4 md:grid-cols-3">
          <div className="panel">
            <p className="text-sm text-slate-500">Rows parsed</p>
            <p className="text-3xl font-bold">{rows.length}</p>
            <p className="text-xs text-slate-400">Including header-aware columns</p>
          </div>
          <div className="panel">
            <p className="text-sm text-slate-500">Detected rules</p>
            <p className="text-3xl font-bold">{Object.keys(groupedByRule).length}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {Object.entries(groupedByRule).map(([rule, count]) => (
                <span key={rule} className="badge">
                  {rule} · {count}
                </span>
              ))}
              {!Object.keys(groupedByRule).length && <span className="text-xs text-slate-400">No rule column found.</span>}
            </div>
          </div>
          <div className="panel">
            <p className="text-sm text-slate-500">Parser feedback</p>
            <p className="text-3xl font-bold">{errors.length ? 'Warnings' : 'Clean'}</p>
            <p className="text-xs text-slate-400">PapaParse handles empty lines and trims headers.</p>
          </div>
        </section>

        <section className="panel">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <h2 className="text-xl font-semibold">CSV contents</h2>
              <p className="text-sm text-slate-500">Paste or type directly to re-parse live.</p>
            </div>
            <span className="text-xs text-slate-400">Headers: Topic, Welsh, English, Rule, Notes</span>
          </div>
          <textarea
            className="textarea mt-3"
            value={csvText}
            onChange={(event) => handleCsvChange(event.target.value)}
            rows={8}
          />
          {errors.length > 0 && (
            <ul className="mt-3 space-y-2">
              {errors.map((err, index) => (
                <li key={index} className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-2">
                  Line {err.row ?? 'n/a'}: {err.message}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="panel">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <h2 className="text-xl font-semibold">Preview</h2>
            <p className="text-sm text-slate-500">Showing {rows.length} entries</p>
          </div>
          <div className="table-wrapper mt-4">
            <table className="table">
              <thead>
                <tr>
                  <th className="w-32">Topic</th>
                  <th>Welsh</th>
                  <th>English</th>
                  <th className="w-28">Rule</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, index) => (
                  <tr key={`${row.Welsh}-${index}`}>
                    <td>{row.Topic || '—'}</td>
                    <td className="font-semibold text-slate-800">{row.Welsh || '—'}</td>
                    <td className="text-slate-600">{row.English || '—'}</td>
                    <td>
                      <span className="badge badge-outline">{row.Rule || row.rule || '—'}</span>
                    </td>
                    <td className="text-slate-600">{row.Notes || '—'}</td>
                  </tr>
                ))}
                {!rows.length && (
                  <tr>
                    <td colSpan={5} className="text-center text-slate-500 py-6">
                      No rows to display yet. Paste CSV data or upload a file to get started.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  )
}

export default App
