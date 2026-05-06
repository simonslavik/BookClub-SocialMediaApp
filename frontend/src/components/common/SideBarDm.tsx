import { useNavigate } from 'react-router-dom';
import { FiPlus } from 'react-icons/fi';
import logger from '@utils/logger';

const SideBarDmComponent = ({
    directMessages,
    currentDm,
    switchDm,
}) => {
    const navigate = useNavigate();

    return (   
        <div className="w-64 bg-gray-800 text-white flex flex-col">
            <div className="p-4 border-b border-gray-700 flex items-center justify-between">
                <h2 className="text-lg font-bold">Direct Messages</h2>
                <button 
                    onClick={() => navigate('/messages')}
                    className="text-gray-400 hover:text-white"
                    title="New Message"
                >
                    <FiPlus size={20} />
                </button>
            </div>
            <div className="flex-1 overflow-y-auto">
                {directMessages.length === 0 ? (
                    <p className="p-4 text-gray-400">No direct messages yet.</p>
                ) : (
                    directMessages.map((dm) => (
                        <div
                            key={dm.userId}
                            className={`p-3 cursor-pointer hover:bg-gray-700 flex items-center gap-3 ${
                                currentDm && currentDm.userId === dm.userId ? 'bg-gray-700' : ''
                            }`}
                            onClick={() => switchDm(dm.userId)}
                        >
                            <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center text-white">
                                {dm.userName.charAt(0).toUpperCase()}
                            </div>
                            <span className="truncate">{dm.userName}</span>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default SideBarDmComponent;