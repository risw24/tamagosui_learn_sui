## Follow instruction in Backend.md

How to run Frontend?
## Step 1: Go to Project

```bash
# Go back to root directory (tamagosui)
cd ..
cd tamagosui-ui
```

## Step 2: Install Dependencies

```bash
# Core dependencies
npm install @mysten/dapp-kit @mysten/sui.js @tanstack/react-query
npm install @radix-ui/react-progress @radix-ui/react-separator @radix-ui/react-slot @radix-ui/react-tooltip
npm install class-variance-authority clsx lucide-react next-themes
npm install react-router-dom sonner tailwind-merge tailwindcss @tailwindcss/vite

# Dev dependencies
npm install -D @types/node autoprefixer postcss typescript
```

## Step 3: Configure Environment

Create the file **`.env`** and add:

```env
VITE_PACKAGE_ID=YOUR_PACKAGE_ID_HERE
```

**⚠️ Replace `YOUR_PACKAGE_ID_HERE` with the Package ID from your contract deployment!**

## Step 4: Run the Application

```bash
# Start development server
npm run dev
```

Open your browser to `http://localhost:5173` and you should see your TamagoSui app!