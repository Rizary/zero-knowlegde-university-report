import { BigNumber, providers } from "ethers";
import { useEffect, useState } from "react";
import {
    useAccount, useContract, useSigner
} from "wagmi";
import eventAbi from "../contract/Event.json";
import networks from "../contract/networks.json";
export default function EventBox({ event }) {
    const { data: accountData } = useAccount();
    const provider = providers.getDefaultProvider(networks["HarmonyMainNet"].rpcUrls[0])
    const { data: signer, isSuccess } = useSigner();

    const account = useAccount();
    const eventContract = useContract({
        addressOrName: event,
        contractInterface: eventAbi.abi,
        signerOrProvider: signer || provider,
    });
    const [isBusy, setBusy] = useState(true)
    const [eventIdentity, updateEventIdentity] = useState();
    useEffect(() => {
        const getEventIdentity = async () => {
            try {
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
            } catch (err) {
                console.log(err);
            }
        }
        getEventIdentity();
    }, []);
    
    const [ticketMinted, updateTicketMinted] = useState(0);
    useEffect(() => {
        const getTicketMinted = async () => {
            try {
                const result = await eventContract.getTotalTicketMinted();
                updateTicketMinted(result.toNumber());
            } catch (err) {
                console.log(err);
            }
        }
        getTicketMinted() ;
    }, []);
    
    const [ticketAvailable, updateTicketAvailable] = useState(0);
    useEffect(() => {
        const getTicketAvailable = async () => {
            try {
                const result = await eventContract.getTotalTicketAvailables();
                updateTicketAvailable(result.toNumber());
            } catch (err) {
                console.log(err);
            }
        }
        getTicketAvailable();
    }, []);

    const renderPurchaseTicket = () => {
        const contractWrite = async (event) => {
            event.preventDefault();
            eventContract.purchaseTicket(
                accountData.address,
                BigNumber.from(1),
                {
                    "from": accountData.address,
                    "value": eventIdentity["price"],
                },
            )
        };
        return (
            <form onSubmit={contractWrite}>
                <button
                    className="bg-blue-500 hover:bg-blue-700 text-white uppercase text-sm font-semibold px-4 py-2 rounded"
                    type="submit"
                >
                    Purchase Ticket
                </button>
            </form> 
        );
    }

    return (
        <div className="w-full sm:w-1/2 md:w-1/2 xl:w-1/4 p-4">
            {isBusy ? (
                <h2 className="t-2 mb-2  font-bold">
                    loading...
                </h2>
              ):(<div className="c-card block bg-white shadow-md hover:shadow-xl rounded-lg overflow-hidden">
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
                <span className="flex items-center mb-1">Minted: {ticketMinted}</span>
                <span className="flex items-center">Available: {ticketAvailable}</span>
                </div>
                <div className="p-4 flex items-center text-sm text-gray-600">
                    {renderPurchaseTicket()}
                </div>
            </div>)}
        </div>
    )
}