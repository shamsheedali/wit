import { ChessBoard } from "@/components/chess/chessBoard";

export default function PlayFriend() {
  return (
    <div className="flex flex-col md:flex-row h-screen">
      <div className="bg-red-500 w-full md:w-1/2 flex flex-col h-full">
        <div className="bg-green-500 h-14 flex-shrink-0" />
        <div className="bg-orange-600 flex-grow flex items-center justify-center p-4 overflow-hidden">
          <ChessBoard maxWidth={750} />
        </div>
        <div className="bg-green-500 h-14 flex-shrink-0" />
      </div>
      <div className="bg-blue-500 w-full md:w-1/4" />
    </div>
  );
}