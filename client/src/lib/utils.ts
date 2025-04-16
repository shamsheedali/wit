import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const timeToSeconds = (time: string): number => {
  switch (time) {
    case "30sec":
      return 30;
    case "1min":
      return 60;
    case "3min":
      return 180;
    case "5min":
      return 300;
    case "10min":
      return 600;
    case "15min":
      return 900;
    case "30min":
      return 1800;
    default:
      return 600;
  }
};

export const getGameType = (time: string): "blitz" | "bullet" | "rapid" => {
  switch (time) {
    case "30sec":
    case "1min":
      return "bullet";
    case "3min":
    case "5min":
      return "blitz";
    case "10min":
    case "15min":
    case "30min":
      return "rapid";
    default:
      return "rapid";
  }
};