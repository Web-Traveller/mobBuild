import { toKebabCase } from './utils';

export class StructureGenerator {
  generateProjectStructure(appName: string): Record<string, string> {
    const packageName = toKebabCase(appName || 'generated-app');

    return {
      'package.json': JSON.stringify(
        {
          name: packageName,
          private: true,
          version: '0.1.0',
          type: 'module',
          scripts: {
            dev: 'vite',
            build: 'tsc -b && vite build',
            preview: 'vite preview',
            lint: 'eslint .',
          },
          dependencies: {
            react: '^18.2.0',
            'react-dom': '^18.2.0',
            'react-router-dom': '^6.26.2',
          },
          devDependencies: {
            '@types/react': '^18.2.61',
            '@types/react-dom': '^18.2.19',
            '@vitejs/plugin-react': '^4.3.1',
            eslint: '^9.0.0',
            typescript: '^5.5.4',
            vite: '^5.4.0',
          },
        },
        null,
        2
      ),
      'tsconfig.json': JSON.stringify(
        {
          compilerOptions: {
            target: 'ES2020',
            lib: ['ES2020', 'DOM', 'DOM.Iterable'],
            module: 'ESNext',
            moduleResolution: 'Bundler',
            jsx: 'react-jsx',
            strict: true,
            noEmit: true,
            skipLibCheck: true,
            types: ['vite/client'],
          },
          include: ['src'],
        },
        null,
        2
      ),
      'vite.config.ts': `import { defineConfig } from 'vite';\nimport react from '@vitejs/plugin-react';\n\nexport default defineConfig({\n  plugins: [react()],\n});\n`,
      'index.html': `<!doctype html>\n<html lang=\"en\">\n  <head>\n    <meta charset=\"UTF-8\" />\n    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\" />\n    <title>${appName}</title>\n  </head>\n  <body>\n    <div id=\"root\"></div>\n    <script type=\"module\" src=\"/src/index.tsx\"></script>\n  </body>\n</html>\n`,
      '.env.example': 'VITE_API_BASE_URL=http://localhost:3000\n',
      'README.md': `# ${appName}\n\nGenerated React + TypeScript frontend.\n\n## Getting Started\n\n1. Copy environment variables:\n\n   \`cp .env.example .env\`\n\n2. Install dependencies:\n\n   \`npm install\`\n\n3. Run the app:\n\n   \`npm run dev\`\n`,
      'src/config.ts': `export const API_BASE_URL: string =\n  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000';\n`,
      'src/index.tsx': `import React from 'react';\nimport ReactDOM from 'react-dom/client';\n\nimport { App } from './App';\nimport './styles/global.css';\n\nReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(\n  <React.StrictMode>\n    <App />\n  </React.StrictMode>\n);\n`,
      'src/App.tsx': `import React from 'react';\nimport { BrowserRouter } from 'react-router-dom';\n\nimport { AppLayout } from './components/layout/AppLayout';\nimport { AppRoutes } from './routes';\n\nexport const App: React.FC = () => {\n  return (\n    <BrowserRouter>\n      <AppLayout>\n        <AppRoutes />\n      </AppLayout>\n    </BrowserRouter>\n  );\n};\n`,
      'src/routes.tsx': `import React from 'react';\nimport { Navigate, Route, Routes } from 'react-router-dom';\n\nexport const AppRoutes: React.FC = () => {\n  return (\n    <Routes>\n      <Route path=\"/\" element={<Navigate to=\"/dashboard\" replace />} />\n      <Route path=\"*\" element={<div>Not Found</div>} />\n    </Routes>\n  );\n};\n`,
      'src/components/layout/AppLayout.tsx': `import React from 'react';\n\nimport { Navigation } from './Navigation';\n\nexport interface AppLayoutProps {\n  children: React.ReactNode;\n}\n\nexport const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {\n  return (\n    <div style={{ minHeight: '100vh', background: '#f9fafb' }}>\n      <Navigation />\n      <main style={{ maxWidth: 1200, margin: '0 auto', padding: 24 }}>{children}</main>\n    </div>\n  );\n};\n`,
      'src/components/layout/Navigation.tsx': `import React from 'react';\n\nexport const Navigation: React.FC = () => {\n  return (\n    <header\n      style={{\n        background: '#ffffff',\n        borderBottom: '1px solid #e4e7ec',\n        padding: '14px 24px',\n      }}\n    >\n      <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', gap: 16 }}>\n        <strong>${appName}</strong>\n      </div>\n    </header>\n  );\n};\n`,
      'src/styles/global.css': `:root {\n  font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;\n  color: #101828;\n  background: #f9fafb;\n}\n\n* {\n  box-sizing: border-box;\n}\n\nbody {\n  margin: 0;\n}\n\na {\n  color: inherit;\n}\n\nbutton {\n  font: inherit;\n}\n`,
      'src/services/.keep': '',
      'src/hooks/.keep': '',
      'src/pages/.keep': '',
      'src/components/.keep': '',
      'src/utils/.keep': '',
      'src/styles/.keep': '',
    };
  }
}
