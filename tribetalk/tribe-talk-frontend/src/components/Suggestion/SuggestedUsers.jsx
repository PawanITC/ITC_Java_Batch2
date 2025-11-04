import { FiMoreHorizontal } from "react-icons/fi";

function SuggestedUsers() {
  const users = [
    { name: "Microsoft Developer", handle: "@msdev" },
    { name: "Joe Biden", handle: "@JoeBiden" },
    { name: "CNN Breaking News", handle: "@cnnbrk" },
  ];

  return (
    <div className="bg-neutral-800 border border-yellow-700/40 rounded-xl p-4">
      <h2 className="text-lg font-semibold mb-4">You Might Like</h2>
      <ul className="space-y-4">
        {users.map((user, i) => (
          <li key={i} className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-yellow-100">{user.name}</p>
              <p className="text-sm text-yellow-400">{user.handle}</p>
            </div>
            <div className="flex items-center gap-2">
              <button className="bg-yellow-500 text-neutral-900 px-3 py-1 rounded-full text-sm font-medium hover:bg-yellow-400 transition">
                Follow
              </button>
            </div>
          </li>
        ))}
      </ul>
      <button className="mt-4 text-sm text-sky-400 hover:underline">
        Show more
      </button>
    </div>
  );
}

export default SuggestedUsers;
