# Sarcasm Wiki

Next.js application that fetches Wikipedia pages, rewrites them, and saves as Markdown files.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file with your Gemini API key:
```
GEMINI_API_KEY=your_key_here
```

3. Run development server:
```bash
npm run dev
```

## Usage

Navigate to any Wikipedia article by URL:
- `/Artificial_intelligence`
- `/Machine_learning`
- `/Quantum_computing`

The app will:
1. Check if an MD file exists for the article
2. If not, fetch from Wikipedia
3. Rewrite the content using Google Gemini
4. Save as MD file in `/content` directory
5. Display the rewritten content

# sarcasm-wiki
# sarcasm-wiki
