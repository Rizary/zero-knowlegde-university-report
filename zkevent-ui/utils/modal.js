const Modal = ({ setModalOn, commitment }) => {

    const handleOKClick = () => {
        setModalOn(false)
    }
    console.log(commitment);
    return (
        <div className="w-full bg-white rounded shadow-lg p-8 m-4 md:max-w-sm md:mx-auto inset-0 z-100">
            <div className="mb-4">
                <span className="block w-full text-xl uppercase font-bold mb-4">Your Key:</span>
                <div className="mb-4 md:w-full" >
                    {commitment.commitment.nullifier}
                </div>
                <span className="block w-full text-xl uppercase font-bold mb-4">Your Secret:</span>
                <div className="mb-4 md:w-full" >
                    {commitment.commitment.secret}
                </div>
                <div className="mb-4 md:w-full">
                    <div className="" >Are you sure ?</div>
                    <div className="">
                    <button onClick={handleOKClick} className="bg-green-500 hover:bg-green-700 text-white uppercase text-sm font-semibold px-4 py-2 rounded">Ok</button>
                    </div>

                </div>
            </div>
        </div>

    );
}

export default Modal