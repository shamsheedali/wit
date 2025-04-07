export default function Leaderboard() {
  return (
    <div className="lg:px-56 w-full h-screen overflow-hidden pt-[120px] font-clashDisplay">
      <h1 className="text-xl mb-3 font-bold">Leaderboard</h1>

      <div>
        <div
          className="flex items-center space-x-4 p-3 rounded-lg transition-all duration-200 hover:bg-accent hover:scale-[1.02] group"
        //   onClick={() => handleUserPage(user.username)}
        >
          <div className="relative">
            <img
              src={
                "/placeholder.svg?height=40&width=40"
              }
              alt="User avatar"
              className="rounded-full w-10 h-10 object-cover"
              width={40}
              height={40}
            />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium">username</p>
          </div>
        </div>
      </div>
    </div>
  );
}
