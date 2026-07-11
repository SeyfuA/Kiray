# Kiray · ኪራይ

A rental marketplace prototype for Ethiopia connecting **tenants**, **landlords**, and **brokers (ደላላ)** for residential and business rentals — with Addis Ababa, regional capitals, zonal capitals, and their neighbourhoods as the filtering mechanism.

## Run locally

```bash
npm install
npm run dev
```

Then open http://localhost:5173

## Build for production

```bash
npm run build
```

The output goes to `dist/` — a static folder you can host anywhere.

## Deploy free

**Vercel:** push this repo to GitHub, then import it at https://vercel.com/new (framework preset: Vite). Done.

**Netlify:** push to GitHub and import at https://app.netlify.com, or just run `npm run build` and drag the `dist/` folder onto https://app.netlify.com/drop

## Notes

- The map is a schematic SVG for prototyping. In production, swap in the Google Maps JavaScript SDK with a domain-restricted API key.
- All listings are sample data defined in `src/App.jsx`.
- Roles (tenant / landlord / broker) are chosen on the opening screen and can be switched from the top bar.
