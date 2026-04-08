export default function ClubStats({ completedBooks, upcomingBooks, members, connectedUsers }) {
    const stats = [
        { label: 'Books Read', value: completedBooks.length },
        { label: 'Upcoming', value: upcomingBooks.length },
        { label: 'Members', value: members.length },
        { label: 'Online', value: connectedUsers.length },
    ];

    return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl ring-1 ring-black/5 dark:ring-white/5 p-6">
            <p className="text-[11px] uppercase tracking-widest text-stone-400 dark:text-gray-500 font-bold font-outfit mb-4">Stats</p>
            <div className="grid grid-cols-2 gap-4">
                {stats.map(({ label, value }) => (
                    <div key={label} className="text-center py-3 bg-stone-50 dark:bg-gray-700/50 rounded-xl">
                        <p className="text-xl font-bold text-stone-800 dark:text-gray-100">{value}</p>
                        <p className="text-[11px] text-stone-400 dark:text-gray-500 font-outfit">{label}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}
