# Eye of Law - Frontend Dashboard Client

This is the Next.js React client application for the **Eye of Law - Adaptive Urban Traffic Intelligence Platform**. It provides an interactive command and control interface for traffic enforcement authorities to monitor real-time violations, view analytics, interact with geospatial risk maps, manage incident dossiers, and deploy patrols.

---

## Technical Stack

- **Framework**: Next.js (App Router, TypeScript)
- **Styling**: Tailwind CSS
- **Visuals**: Lucide React Icons
- **Data Visualization**: Recharts (for charts and graphs)
- **Mapping**: React Leaflet (for geographic incident hotspots)

---

## Getting Started

### 1. Installation
Navigate to the frontend directory and install the necessary package dependencies:

```bash
npm install
```

### 2. Development Execution
Launch the local Next.js development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to access the control panel.

### 3. Production Compilation
To compile a minimized production-ready bundle, execute:

```bash
npm run build
```

---

## Application Structure

- **`src/app/page.tsx`**: Main dashboard controller containing dashboard layout tabs (Analytics, Control Room, Searchable Records, Junction Risk, Recommendations, and Evaluation).
- **`src/app/layout.tsx`**: Root layout config setting metadata titles, font antialiasing, global styling imports, and sidebar configurations.
- **`src/components/RiskMap.tsx`**: Renders the Leaflet.js interactive maps featuring junction markers, severity-coded radii, and tooltips containing recommended dispatch overrides.
- **`public/`**: Stores static media assets, including the custom branding element `vision.png` utilized in the sidebar header.

---

## Integration Configuration

The application communicates with the backend FastAPI engine using API endpoints defined at:
- **Base Endpoint**: `http://localhost:8000`

If the backend server is offline, the client will display a warning notification banner and fall back to localized Bangalore municipal mock datasets so that UI visual testing can still be executed.
