import { useEffect } from "react";
import { MessageCircle, MoreVertical, Users, Search } from "lucide-react";
import { userChatStore } from "../store/userChatStore.js";

const UsersSideBar = () => {
  const { getUsers, users, selectedUser, setSelectedUser } = userChatStore();

  useEffect(() => {
    getUsers();
  }, [getUsers]);

  return (
    <aside className="h-full w-full lg:w-80 bg-base-content flex flex-col">
      {/* Header */}
      <div className="bg-primary text-primary-content px-4 py-3 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3">
          <Users className="size-7" />
          <span className="font-medium text-lg">Chats</span>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn btn-ghost btn-sm btn-circle hover:bg-primary-focus">
            <MessageCircle className="w-5 h-5" />
          </button>
          <button className="btn btn-ghost btn-sm btn-circle hover:bg-primary-focus">
            <MoreVertical className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="p-0 bg-base-200 border-b border-base-300">
        <div className="relative my-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-base-content/60" />
          <input
            type="text"
            placeholder="Search chats"
            className="input input-bordered w-full pl-10 h-12 bg-base-300 border-base-300 focus:border-primary focus:outline-none"
          />
        </div>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto bg-base-100">
        {users.map((user, index) => (
          <button
            key={user._id}
            onClick={() => setSelectedUser(user)}
            className={`
              w-full px-4 py-4 flex items-center gap-4 text-left
              transition-all duration-200 ease-in-out
              border-b border-base-200
              ${
                selectedUser?._id === user._id
                  ? "bg-primary/10 border-l-4 border-l-primary shadow-sm"
                  : index % 2 === 0
                  ? "bg-base-100 hover:bg-base-200/70"
                  : "bg-base-50 hover:bg-base-200/70"
              }
              hover:shadow-sm
            `}
          >
            {/* Avatar */}
            <div className="flex-shrink-0">
              {user.profilePic ? (
                <div className="w-12 h-12 rounded-full overflow-hidden flex items-center justify-center ring-2 ring-base-300/50">
                  <img
                    src={user.profilePic}
                    alt={user.name}
                    className="object-cover w-full h-full"
                  />
                </div>
              ) : (
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center text-lg font-semibold text-primary border-2 border-primary/20">
                  {user.name ? user.name[0].toUpperCase() : "U"}
                </div>
              )}
            </div>

            {/* User Info */}
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-base-content truncate text-sm mb-1">
                {user.name ? user.name : "Unknown"}
              </h3>
              <p className="text-xs text-base-content/60 truncate">
                Click to start chatting
              </p>
            </div>

            {/* Status Indicator */}
            <div className="flex-shrink-0">
              <div className="w-3 h-3 rounded-full bg-success/60"></div>
            </div>
          </button>
        ))}

        {users.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center px-4">
            <div className="w-20 h-20 rounded-full bg-base-200 flex items-center justify-center mb-4">
              <MessageCircle className="w-10 h-10 text-base-content/30" />
            </div>
            <p className="text-base-content/60 font-medium">No users found</p>
            <p className="text-base-content/40 text-sm mt-1">
              Start a conversation to see your chats here
            </p>
          </div>
        )}
      </div>
    </aside>
  );
};

export default UsersSideBar;