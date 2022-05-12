import { providers } from "ethers";
import { utils } from "ffjavascript";
import { useEffect, useState } from "react";
import { plonk } from 'snarkjs';
import {
    useAccount, useContract, useSigner
} from "wagmi";
import eventAbi from "../contract/Event.json";
import networks from "../contract/networks.json";

export default function TicketBox({ event }) {
    const signer = useSigner();
    const unstringifyBigInts = utils.unstringifyBigInts;

    const provider = providers.getDefaultProvider(networks["HarmonyTestNet"].rpcUrls[0])
        
    const account = useAccount();
    const eventContract = useContract({
        addressOrName: event,
        contractInterface: eventAbi.abi,
        signerOrProvider: signer.data || provider,
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

    const [ticketOwned, updateTicketOwned] = useState();
    useEffect(() => {
        const getTicketOwned = async () => {
            const result = await eventContract.balanceOf(account.data?.address);
            updateTicketOwned(result?.toNumber())
        }
        getTicketOwned();
    }, []);
    
    let [merkleTreeLeaves, setMerkleTreeLeaves] = useState([]);
    
    let [proof, setProof] = useState("");

    let [publicSignals, setPublicSignals] = useState("");

    let [proofResult, setProofResult] = useState(false);
    const renderVerifyTicket = () => {
        const contractVerify = async (event) => {
            event.preventDefault();
            const _merkleTreeLeaves = await eventContract.getMerkleTreeLeaves();
            setMerkleTreeLeaves(_merkleTreeLeaves);

            let leaves = [];

            for (let i = 0; i < _merkleTreeLeaves.length; i++) {
                leaves.push(_merkleTreeLeaves[i]);
            }
            
            const { proof: _proof, publicSignals: _publicSignals } =
                await plonk.fullProve(
                    { leaves },
                    "/zkproof/merkletree.wasm",
                    "/zkproof/merkletree_final.zkey"
                );

            const calldata = await plonk.exportSolidityCallData(
                unstringifyBigInts(_proof),
                unstringifyBigInts(_publicSignals)
            );
            const argv = calldata
                .replace(/["[\]\s]/g, "")
                .split(",");
            const [proof, ...rest] = argv;
            const publicSignals = rest.map((x) => BigInt(x).toString());
                // .replace(/["[\]\s]/g, "")
                // .split(",")
                // .map((x) => BigInt(x).toString());
            console.log(proof);
            console.log(publicSignals);

            try {
                const _veifierResult = await eventContract.verifyTicketEvent(
                    proof,
                    publicSignals,
                );
                setProofResult(_veifierResult);
                console.log(_veifierResult);
              } catch (err) {
                setProofResult(false);
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
                {proof && (
                <div>
                    <div className="p-4">
                      <span className="p-4 border-t border-b text-xs text-gray-700">
                        Proof:
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
                )}
              </div>
            </div>
        );
    }


    return (
        <div className="w-full sm:w-1/2 md:w-1/2 xl:w-1/4 p-4">
            {isBusy? (
                <h2 className="t-2 mb-2  font-bold">
                    loading...
                </h2>
              ):((ticketOwned > 0) ? <div className="c-card block bg-white shadow-md hover:shadow-xl rounded-lg overflow-hidden">
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
                <span className="flex items-center mb-1">Ticket Owned: {ticketOwned}</span>
                </div>
                <div className="p-4 flex items-center text-sm text-gray-600">
                    {renderVerifyTicket()}
                </div>
            </div>:<div></div>)}
        </div>
    )
}