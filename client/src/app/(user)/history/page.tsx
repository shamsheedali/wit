import GameHistoryTable from "@/components/core/game-history-table";

export default function History() {
  return (
    <div className="lg:px-56 w-full py-[120px] font-clashDisplay">
        <h1 className="text-xl mb-3">Game History</h1>
        <GameHistoryTable />
    </div>
  );
}
