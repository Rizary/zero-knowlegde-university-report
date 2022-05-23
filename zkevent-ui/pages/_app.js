import { providers } from "ethers";
import Head from 'next/head';
import { Provider } from "wagmi";
import networks from "../contract/networks.json";
import '../styles/globals.css';

const env = process.env.NODE_ENV;
let provider;

const chains = [
    {
      id: 1666700000,
      name: 'Harmony Testnet Shard 0',
      rpcUrls: ['https://api.s0.b.hmny.io'],
      nativeCurrency: { name: 'ONE', symbol: 'ONE', decimals: 18 },
      blockExplorers: [
        {
          name: 'Harmony Block Explorer',
          url: 'https://explorer.harmony.one',
          standard: 'EIP3091',
        },
      ],
      testnet: true,
    },
];
  
const connectors = () => {
    return [
      new InjectedConnector({
        chains,
        options: { shimDisconnect: true },
      }),
    ];
};
  

function MyApp({ Component, pageProps }) {
    const testNet = networks["HarmonyTestNet"];
    const mainNet = networks["HarmonyMainNet"];
    if (env == "development") {
      provider = new providers.JsonRpcProvider(
        testNet.rpcUrls[0],
        {
            chainId: testNet.chainId,
            name: testNet.name
      });
    } else {
      provider = new providers.JsonRpcProvider(
        mainNet.rpcUrls[0],
        {
            chainId: mainNet.chainId,
            name: mainNet.name
        });
    }
    return (
      <>
        <Head>
          <title>ZKEvent</title>
        </Head>
        <Provider provider={provider}>
          <Component {...pageProps} />
        </Provider>
      </>
    );
}

export default MyApp
