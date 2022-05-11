import { providers } from "ethers";
import { useEffect, useState } from "react";
import {
    useAccount, useConnect, useContract, useDisconnect, useSigner
} from "wagmi";
import EventBox from "../components/events";
import TicketBox from "../components/tickets";
import contractAddress from "../contract/address.json";
import eventFactoryAbi from "../contract/EventFactory.json";
import networks from "../contract/networks.json";
// import plonkVerifierAbi from "../contract/PlonkVerifier.json";

export default function Home() {
    const signer = useSigner();

    const provider = providers.getDefaultProvider(networks["HarmonyTestNet"].rpcUrls[0])
        
    const account = useAccount();

    const mainContract = useContract({
        addressOrName: contractAddress.EventFactory,
        contractInterface: eventFactoryAbi.abi,
        signerOrProvider: signer.data || provider,
    });
    
    // const plonkContract = useContract({
    //     addressOrName: contractAddress.PlonkVerifier,
    //     contractInterface: plonkVerifierAbi.abi,
    //     signerOrProvider: signer.data || provider,
    // });


    const {
        activeConnector,
        connect,
        connectors,
        isConnected,
    } = useConnect()

    const { disconnect } = useDisconnect()
    
    const renderConnectWallet = () => {
        if (!account.data?.address) {
            return (
                <button
                    className="text-lg font-medium rounded-md px-5 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500"
                    onClick={() => {
                        connect(connectors[0]);
                    }}
                >
                    Connect Wallet
                </button>
            );  
        }
    };    

    const [events, updateEvent] = useState();
    useEffect(() => {
        const getEventD = async () => {
            const allEvent = await mainContract.getDeployedEvents();
            updateEvent(allEvent);
        }
        getEventD();
    }, []);
    
    // TODO: ethers didn't support harmony hmy_getlogs
    // const EventCreated = mainContract.interface.getEvent("eventCreated(address, string, uint, string, uint, uint, string, string)");
    
    // const [eventsCreated, updateEventsCreated] = useState([]);
    // useEffect(() => {
    //     const getEventC = async () => {
    //         const logs = await provider.getLogs({
    //             method: "hmy_getlogs",
    //             fromBlock: 0,
    //             toBlock: "latest",
    //             address: mainContract.address,
    //             topics: EventCreated.topics
    //         });
    //         for (const log of logs)
    //         {
    //             const logData = EventCreated.parse(log.topics, log.data);
        
    //             console.log(logData);
        
    //         //do something with logData which includes the event arguments are properties. eg logData.fromAddress, logData.toAddress and logData.amount
    //         }
    //         // updateEvent(allEvent);
    //     }
    //     getEventC();
    // }, []);
    // // filter: { _filterName: "", _filterLocation: "" },
    // //   fromBlock: 0,
    // //   toBlock: "latest"
    // const handleEventsCreated =
    //     (
    //         data,
    //     ) => {
    //         console.log(name);
    //         updateEventsCreated(old => [...old, {
    //             "address": addr,
    //             "name": name,
    //             "price": tp,
    //             "location": location,
    //             "startDate": start,
    //             "endDate": end,
    //         }]);
    //     };
    // useContractEvent(
    //     {
    //         addressOrName: contractAddress.EventFactory,
    //         contractInterface: eventFactoryAbi.abi,
    //         signerOrProvider: signer.data || provider,
    //     },
    //     'eventCreated',
    //     handleEventsCreated,
    // );

    const renderAccount = () => {
        if (isConnected) {
            return (
                <div>
                    <div className="text-lg">
                        Welcome {account.data?.address}
                    </div>
                    <div>Connected to {activeConnector.name}</div>
                    <button className="bg-red-500 hover:bg-red-700 text-white uppercase text-sm font-semibold px-4 py-2 rounded" onClick={disconnect}>Disconnect</button>
                    <div>{renderEvents()}</div>
                </div>
            )
        } else {
            return (
                <div>
                    <h1 className={"text-1xl font-bold"}>
                        You are not connected to the app yet.
                    </h1>
                </div>
            )
        }
    };
    
    const getEventList = () => {
        return (
            <div>
                Length of event: {events?.length}
            </div>
        )
    };
        
    const createEventList = () => {
        return (events?.map((event, index) => {
            return (
                <div className="container mx-auto" key={index}>
                    <div className="flex flex-wrap -mx-4">
                        <EventBox
                            event={event}
                        />
                    </div>
                </div>
            );
        }))
    };
    
    const createTicketList = () => {
        return (events?.map((event, index) => {
            return (
                <div className="container mx-auto" key={index}>
                    <div className="flex flex-wrap -mx-4">
                        <TicketBox
                            event={event}
                        />
                    </div>
                </div>
            );
        }))
    };
    
    const renderCreateEvent = () => {
        const contractWrite = async (event) => {
            event.preventDefault();
            mainContract.createEvent(
                event.target.name.value,
                event.target.start.value,
                event.target.end.value,
                event.target.supply.value,
                event.target.price.value,
                event.target.desc.value,
                event.target.loc.value,
                contractAddress.PlonkVerifier,
            )
        };
        return (
            <div className="w-full bg-white rounded shadow-lg p-8 m-4 md:max-w-sm md:mx-auto">
                <span className="block w-full text-xl uppercase font-bold mb-4">Create Event</span> 
                <form className="mb-4" onSubmit={contractWrite}>
                    <div className="mb-4 md:w-full">
                        <label className="block text-xs mb-1" htmlFor="name">Name</label>
                        <input className="w-full border rounded p-2 outline-none focus:shadow-outline" id="name" name="name" type="text" autoComplete="name" placeholder="Event Name" required />
                    </div>
                    <div className="mb-4 md:w-full">
                        <label className="block text-xs mb-1" htmlFor="start">Start</label>
                        <input className="w-full border rounded p-2 outline-none focus:shadow-outline" id="start" name="start" type="number" autoComplete="start" placeholder="Event Start" required />
                    </div>
                    <div className="mb-4 md:w-full">
                        <label className="block text-xs mb-1" htmlFor="end">End</label>
                        <input className="w-full border rounded p-2 outline-none focus:shadow-outline" id="end" name="end" type="number" autoComplete="end" placeholder="Event End" required />
                    </div>
                    <div className="mb-4 md:w-full">
                        <label className="block text-xs mb-1" htmlFor="supply">Supply</label>
                        <input className="w-full border rounded p-2 outline-none focus:shadow-outline" id="supply" name="supply" type="number" placeholder="Ticket Supply" required />
                    </div>
                    <div className="mb-4 md:w-full">
                        <label className="block text-xs mb-1" htmlFor="price">Ticket Price</label>
                        <input className="w-full border rounded p-2 outline-none focus:shadow-outline" id="price" name="price" type="number" required min="0" step="any" placeholder="0"/>
                    </div>
                    <div className="mb-4 md:w-full">
                        <label className="block text-xs mb-1" htmlFor="desc">Description</label>
                        <input className="w-full border rounded p-2 outline-none focus:shadow-outline" id="desc" name="desc" type="text" autoComplete="desc" placeholder="Description" required />
                    </div>
                    <div className="mb-4 md:w-full">
                        <label className="block text-xs mb-1" htmlFor="loc">Location</label>
                        <input className="w-full border rounded p-2 outline-none focus:shadow-outline" id="loc" name="loc" type="text" autoComplete="loc" placeholder="Location" required />
                    </div>
                    <button
                        className="bg-green-500 hover:bg-green-700 text-white uppercase text-sm font-semibold px-4 py-2 rounded"
                        type="submit"
                    >
                        Create Event
                    </button>
                </form>
            </div>
        );
    }
    
    const renderEvents = () => {
      return (
        <div>
            <h1 className={"text-1xl font-bold"}>
                Your Event:
            </h1>
            <div>{getEventList()}</div>
            <div className="py-4">
                <h1 className={"text-2xl font-bold underline"}>
                    List Events:
                </h1>
                {createEventList()}
            </div>
            <div>
                <div className="flex items-center h-screen w-full">
                    {renderCreateEvent()}
                </div>
            </div> 
            <div className="py-4">
                <h1 className={"text-2xl font-bold underline"}>
                    My Tickets:
                </h1>
                {createTicketList()}
            </div>
        </div>
      )
    } 

    return (
        <div className="antialiased bg-gray-200 text-gray-900 font-sans p-6">
        <main>
            <h1 className={"text-3xl font-bold underline"}>
            Welcome to ZKEvent
            </h1>
                <div>{renderConnectWallet()}</div>
                <div>{renderAccount()}</div>
        </main>
        </div>
    )
}
