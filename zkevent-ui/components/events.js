import { providers } from "ethers";
import { useEffect, useState } from "react";
import {
    useAccount, useContract, useSigner
} from "wagmi";
import eventAbi from "../contract/Event.json";
import networks from "../contract/networks.json";
export default function EventBox({ event }) {
    const signer = useSigner();

    const provider = providers.getDefaultProvider(networks["HarmonyTestNet"].rpcUrls[0])
        
    const account = useAccount();
    const eventContract = useContract({
        addressOrName: event,
        contractInterface: eventAbi.abi,
        signerOrProvider: signer.data || provider,
    });
    const [ticketPrice, updateticketPrice] = useState();
    useEffect(() => {
        const getTicket = async () => {
            const ticket = await eventContract.data?.ticketPrice;
            updateticketPrice(ticket);
        }
        getTicket();
    }, []);
    
    const renderPurchaseTicket = () => {
        const contractWrite = async (event) => {
            const total = event.target.ticket.value * ticketPrice;
            console.log(total);
            event.preventDefault();
            eventContract.purchaseTicket(
                event.target.ticket.value,
                {
                    "from": account.data?.address,
                    "value": "1000"
                },
            )
        };
        return (
            <form onSubmit={contractWrite}>
                <label htmlFor="ticket">Ticket number</label>
                <input id="ticket" name="ticket" type="number" autoComplete="0" required />
                <button
                    className="text-lg font-medium rounded-md px-5 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500"
                    type="submit"
                >
                    Purchase Ticket
                </button>
            </form> 
        );
    }


    return (
        <div>
            <h1 className={"text-2xl font-bold underline"}>
                Contract address: {eventContract.address}
            </h1>
            <div>{renderPurchaseTicket()}</div>
        </div>
    )
}