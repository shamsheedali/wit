export interface ChessMove {
  from: string;
  to: string;
  piece: string;
  san: string;
  color: "w" | "b";
}
