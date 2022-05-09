import { providers } from "ethers";
import Head from 'next/head';
import { WagmiProvider } from "wagmi";
import networks from "../contract/networks.json";
import '../styles/globals.css';

const env = process.env.NODE_ENV

function MyApp({ Component, pageProps }) {
    if(env == "development"){
       var provider = providers.getDefaultProvider(networks["HarmonyTestNet"].rpcUrls[0])
    } else {
       var provider = providers.getDefaultProvider(networks["HarmonyTestNet"].rpcUrls[0])
    }
    return (
      <>
        <Head>
          <title>ZKEvent</title>
        </Head>
        <WagmiProvider autoConnect provider={provider}>
          <Component {...pageProps} />
        </WagmiProvider>
      </>
    );
}

export default MyApp
