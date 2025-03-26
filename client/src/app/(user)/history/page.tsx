import GameHistoryTable from "@/components/my-components/game-history-table";

export default function History() {
  return (
    <div className="lg:px-56 w-full h-screen overflow-hidden pt-[120px] font-clashDisplay">
        <h1 className="text-xl mb-3">Game History</h1>
        <GameHistoryTable />
    </div>
  );
}
