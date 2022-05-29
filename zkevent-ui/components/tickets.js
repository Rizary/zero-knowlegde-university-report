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
import { createCommitment, PoseidonHasher } from '../utils/hasher';
const ZERO_ELEMENT = "0x9aa38f7ea48808686649fa7880b9399d9e535a0a95a359acf706c433259205a5"

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
    
    // const [ticketArray, updateTicketArray] = useState([]);
    // useEffect(() => {
    //     const getTicketArray = async () => {
    //         try {
    //             const result = await eventContract.balanceOf(accountData.address);
    //             updateTicketArray([...Array(result.toNumber())]);
    //         } catch (err) {
    //             console.log(err);
    //         }
    //     }
    //     getTicketArray() ;
    // }, []);
    
    let [merkleTreeLeaves, setMerkleTreeLeaves] = useState([]);
    useEffect(() => {
        const getMerkleTreeLeaves = async () => {
            try {
                const result = await eventContract.getMerkleTreeLeaves();
                setMerkleTreeLeaves(result);
            } catch (err) {
                console.log(err);
            }
        }
        getMerkleTreeLeaves();
    }, []);
    
    let [addressIndex, setAddressIndex] = useState([]);
    useEffect(() => {
        const getAddressIndex = async () => {
            try {
                const result = await eventContract.getAddressIndex(accountData.address);
                setAddressIndex(result);
            } catch (err) {
                console.log(err);
            }
        }
        getAddressIndex();
    }, []);
    
    let [proof, setProof] = useState("");

    let [publicSignals, setPublicSignals] = useState("");

    let [proofResult, setProofResult] = useState(false);
    
    let [isProved, setIsProved] = useState(false);
    // const fetcher = (url) => fetch(url).then((res) => res.json());
    // const { data, error } = useSWR('/api/readfile', fetcher);
    const renderVerifyTicket = () => {
        const contractVerify = async (event) => {
            event.preventDefault();
            let leaves = [];
            
            const comm = await createCommitment(event.target.key.value, event.target.secret.value);
            const keyBits = comm.commitment.pedersenBits.slice(0, 248);
            console.log("Key bits: ", keyBits);
            const secretBits = comm.commitment.pedersenBits.slice(248, 496);
            console.log("Secret bits: ", secretBits);
            
            for (let i = 0; i < merkleTreeLeaves.length; i++) {
                leaves.push(BigNumber.from(merkleTreeLeaves[i]).toHexString());
            }
            console.log(merkleTreeLeaves)

            const tree = new MerkleTree(16, leaves, {
                hashFunction: (left, right) => poseidon.hash(BigNumber.from(left), BigNumber.from(right)).toHexString(),
                zeroElement: ZERO_ELEMENT
            })
            const path = tree.proof(comm.commitment.pedersenResult);
            const circuitJSON = {
                "root": path.pathRoot,
                "pathElements": path.pathElements,
                "nullifierHash": comm.nullifierHash.pedersenResult,
                "nullifier": keyBits,
                "secret": secretBits,
                "recipient": accountData.address,
                "pathIndices": path.pathIndices
            };
            console.log("circuit", circuitJSON);
            const { proof: _proof, publicSignals: _publicSignals } =
                await plonk.fullProve(
                    circuitJSON,
                    "/zkproof/merkleproof.wasm",
                    "/zkproof/merkleproof_final.zkey",
                );
            const calldata = await plonk.exportSolidityCallData(
                unstringifyBigInts(_proof),
                unstringifyBigInts(_publicSignals)
            );
            console.log("calldata", calldata);
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
              } catch (err) {
                setProofResult(false);
                setIsProved(false)
                console.log(err);
            }
        };
        return (
            <div>
                <form className="mb-4" onSubmit={contractVerify}>
                    <div className="mb-4 md:w-full">
                        <label className="block text-xs mb-1" htmlFor="name">Key</label>
                        <input className="w-full border rounded p-2 outline-none focus:shadow-outline" id="key" name="key" type="text" autoComplete="key" placeholder="Key" required />
                    </div>
                    <div className="mb-4 md:w-full">
                        <label className="block text-xs mb-1" htmlFor="start">Secret</label>
                        <input className="w-full border rounded p-2 outline-none focus:shadow-outline" id="secret" name="secret" type="text" autoComplete="secret" placeholder="Secret" required />
                    </div>
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
                    <div className="p-4 border-t border-b text-xs text-gray-700">
                      <span className="flex items-left mb-12">
                        Result: {(proofResult ? "Verified" : "UnVerified") }
                      </span>
                    </div>
                </div>
                ): <div></div>}
              </div>
            </div>
        );
    }

    const createTicketList = () => {
        return (
            <div className="c-card block mt-4 bg-white shadow-md hover:shadow-xl rounded-lg overflow-hidden">
            <div className="p-4">
                <span className="inline-block px-2 py-1 leading-none bg-green-200 text-green-800 rounded-full font-semibold uppercase tracking-wide text-xs"> Ticket </span>
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
            <span className="flex items-center mb-1">Ticket Number: {addressIndex}</span>
            </div>
            <div className="p-4 flex items-center text-sm text-gray-600">
                {renderVerifyTicket()}
            </div>
        </div>
        );
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