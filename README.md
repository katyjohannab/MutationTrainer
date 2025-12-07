# Welsh Mutation Trainer (React)

This project now uses a Vite + React build so you can explore Welsh mutation datasets from CSV files. PapaParse handles client-side parsing and the UI offers quick summaries of the mutation rules present in your data.

## Getting started

```bash
npm install
npm run dev
```

The dev server defaults to [http://localhost:5173](http://localhost:5173). Use `npm run build` for a production bundle or `npm run preview` to test the built output locally.

## Using the dataset explorer

1. Upload a CSV file via the **Upload CSV** button or paste CSV text into the editor.
2. The app immediately parses the data with PapaParse, showing row counts, detected rule labels, and any parser warnings.
3. Review the table preview to verify headings such as `Topic`, `Welsh`, `English`, `Rule`, and `Notes` are mapped correctly.

## Notes

* Styling uses lightweight, Tailwind-like utility classes implemented in `src/index.css`.
* Sample data is embedded in `src/App.jsx` so the explorer works without any external files.
