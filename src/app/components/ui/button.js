export default function Button({children, onClick}) {
    return (
        <button onClick={onClick} className="bg-red-600 text-white px-6 py-2 rounded-md hover:bg-red-700">
            {children}
        </button>
    );
}
