import { buildPoseidon } from 'circomlibjs';
import { BigNumber, providers } from "ethers";
import { utils } from "ffjavascript";
import { MerkleTree } from 'fixed-merkle-tree';
import { useEffect, useState } from "react";
import { plonk } from 'snarkjs';
// import useSWR from 'swr';
import {
    useAccount, useContract, useSigner
} from "wagmi";
import eventAbi from "../contract/Event.json";
import networks from "../contract/networks.json";
import { PoseidonHasher } from '../utils/hasher';
const ZERO_ELEMENT = "1937035142596246788172577232054709726386880441279550832067530347910661804397"

export default function TicketBox({ event }) {
    const WITNESS_FILE = '../public/zkproof/witness1';
    const {data: signer} = useSigner();
    const unstringifyBigInts = utils.unstringifyBigInts;

    const provider = providers.getDefaultProvider(networks["HarmonyTestNet"].rpcUrls[0])
        
    const { data: accountData } = useAccount();
    const eventContract = useContract({
        addressOrName: event,
        contractInterface: eventAbi.abi,
        signerOrProvider: signer || provider,
    });
    const [isBusy, setBusy] = useState(true)
    const [eventIdentity, updateEventIdentity] = useState();
    useEffect(() => {
        const getEventIdentity = async () => {
            const result = await eventContract.getIdentity();
            const {
                0: owner,
                1: name,
                2: start,
                3: end,
                4: desc,
                5: loc,
                6: tp,
                7: avail,
            } = result;
            updateEventIdentity({
                "owner": owner,
                "name": name,
                "start": start.toNumber(),
                "end": end.toNumber(),
                "description": desc,
                "location": loc,
                "price": tp.toNumber(),
                "available": avail.toNumber()
            });
            result["0"] === undefined ? setBusy(true) : setBusy(false);
        }
        getEventIdentity();
    }, []);

    const [poseidon, updatePoseidon] = useState();
    useEffect(() => {
        const getPoseidon = async () => {
            const result = new PoseidonHasher(await buildPoseidon());
            updatePoseidon(result)
        }
        getPoseidon();
    }, []);
    
    // const [eventPurchased, updateEventPurchased] = useState();
    // useEffect(() => {
    //     const getEvents = async () => {
    //         const events =  await eventContract.getPastEvents('TicketPurchased', { fromBlock: 0, toBlock: 'latest' });
    //         updateEventPurchased(events)
    //     }
    //     getEvents();
    // }, []);
    
    const [ticketArray, updateTicketArray] = useState([]);
    useEffect(() => {
        const getTicketArray = async () => {
            const result = (await eventContract.balanceOf(accountData.address))?.toNumber();
            updateTicketArray(ticketArray => ticketArray.length < result ? [...Array(result)] : ticketArray)
        }
        getTicketArray();
    }, [ticketArray]);
    
    let [merkleTreeLeaves, setMerkleTreeLeaves] = useState([]);
    useEffect(() => {
        const getMerkleTreeLeaves = async () => {
            const result = await eventContract.getMerkleTreeLeaves();
            setMerkleTreeLeaves(result)
        }
        getMerkleTreeLeaves();
    }, []);
    
    let [proof, setProof] = useState("");

    let [publicSignals, setPublicSignals] = useState("");

    let [proofResult, setProofResult] = useState(false);
    
    let [isProved, setIsProved] = useState(false);
    // const fetcher = (url) => fetch(url).then((res) => res.json());
    // const { data, error } = useSWR('/api/readfile', fetcher);
    const renderVerifyTicket = (index) => {
        const contractVerify = async (event) => {
            event.preventDefault();
            let leaves = [];

            for (let i = 0; i < merkleTreeLeaves.length; i++) {
                leaves.push(BigNumber.from(merkleTreeLeaves[i]).toString());
            }

            const tree = new MerkleTree(16, [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16], {
                hashFunction: (left, right) => poseidon.hash(BigNumber.from(left), BigNumber.from(right)).toString(),
                zeroElement: ZERO_ELEMENT
            })

            const path = tree.proof(3);
            console.log(path);

            // const wc = require("../public/zkproof/witness_calculator.js");
            // console.log(data["result"]);
            // const witnessCalculator = await wc(data["result"]);
            // const buffer = await witnessCalculator.calculateWTNSBin({
            //     "leaf": 4,
            //     "root": tree.root,
            //     "pathElements": path.pathElements,
            //     "pathIndices": path.pathIndices
            // });
            // fs.writeFileSync(WITNESS_FILE, buffer);
            const { proof: _proof, publicSignals: _publicSignals } =
                await plonk.prove(
                    "/zkproof/merkleproof_final.zkey",
                    "/zkproof/witness.wtns"
                );
            // const { proof: _proof, publicSignals: _publicSignals } =
            //     await plonk.fullProve(
            //         {
            //             "leaf": 4,
            //             "root": tree.root,
            //             "pathElements": path.pathElements,
            //             "pathIndices": path.pathIndices
            //         },
            //         "/zkproof/merkleproof.wasm",
            //         "/zkproof/merkleproof_final.zkey",
            //     );
            const calldata = await plonk.exportSolidityCallData(
                unstringifyBigInts(_proof),
                unstringifyBigInts(_publicSignals)
            );

            const argv = calldata
                .replace(/["[\]\s]/g, "")
                .split(",");
            const [proof, ...rest] = argv;
            const publicSignals = rest.map((x) => BigInt(x).toString());;

            try {
                const _veifierResult = await eventContract.verifyTicketEvent(
                    proof,
                    publicSignals,
                );
                setIsProved(true);
                setProofResult(_veifierResult);
                console.log(_veifierResult);
              } catch (err) {
                setProofResult(false);
                setIsProved(false)
                console.log(err);
            }
        };
        return (
            <div>
                <form onSubmit={contractVerify}>
                    <button
                        className="bg-blue-500 hover:bg-blue-700 text-white uppercase text-sm font-semibold px-4 py-2 rounded"
                        type="submit"
                    >
                        Verify Ticket
                    </button>
                </form> 
                <div className="p-4">
                {isProved ?  (
                <div>
                    <div className="p-4">
                      <span className="p-4 border-t border-b text-xs text-gray-700">
                        Proof: {proof}
                      </span>
                      <span className="flex items-left mb-1" width={1 / 2}>{proof}</span>
                    </div>
                    <div className="p-4 border-t border-b text-xs text-gray-700">
                      <span className="flex items-left mb-1">
                        Signals: {publicSignals}
                      </span>
                    </div>
                    <div className="p-4 border-t border-b text-xs text-gray-700">
                      <span className="flex items-left mb-12">
                        Result: {proofResult.toString()}
                      </span>
                    </div>
                </div>
                ): <div></div>}
              </div>
            </div>
        );
    }

    const createTicketList = () => {
        return (ticketArray.map((_, i) => {
            return (
                <div className="c-card block mt-4 bg-white shadow-md hover:shadow-xl rounded-lg overflow-hidden" key={i}>
                <div className="p-4">
                    <span className="inline-block px-2 py-1 leading-none bg-orange-200 text-orange-800 rounded-full font-semibold uppercase tracking-wide text-xs"> Event </span>
                </div>
                <div className="p-4">  
                    <h2 className="t-2 mb-2  font-bold">
                        {eventIdentity["name"]}
                    </h2>
                    <p className="text-sm">
                        {eventIdentity["description"]}
                    </p>
                    <div className="mt-3 flex items-center">
                        <span className="text-sm font-semibold">Price</span>&nbsp;<span className="font-bold text-xl">{eventIdentity["price"]}</span>
                    </div>
                    <div className="mt-3 flex items-center">
                        <span className="text-sm font-semibold">Address:</span>
                    </div> 
                    <div className="mt-3 flex items-center">
                        <span className="text-sm">{eventContract.address}</span>
                    </div>
                </div>
                <div className="p-4 border-t border-b text-xs text-gray-700">
                <span className="flex items-center mb-1">Ticket Number: {i+1}</span>
                </div>
                <div className="p-4 flex items-center text-sm text-gray-600">
                    {renderVerifyTicket(i)}
                </div>
            </div>
            );
        }))
    };

    return (
        <div className="w-full sm:w-1/2 md:w-1/2 xl:w-1/4 p-4">
            {isBusy? (
                <h2 className="t-2 mb-2  font-bold">
                    loading...
                </h2>
              ):(createTicketList())}
        </div>
    )
}