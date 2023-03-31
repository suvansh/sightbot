import '@/styles/globals.css'
import type { AppProps } from 'next/app'
import 'font-awesome/css/font-awesome.min.css';

export default function App({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />
}
