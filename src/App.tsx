
import { CategoryProvider } from './contexts/CategoryContext';
import Sidebar from './components/Sidebar';
import { AppProps } from 'next/app';

function App({ Component, pageProps }: AppProps) {
  return (
    <CategoryProvider>
      <div className="min-h-screen max-w-full font-sans">
        <Sidebar />
        <Component {...pageProps} />
      </div>
    </CategoryProvider>
  );
}

export default App;