"use client";
import { ChevronDown, MoveUpRight, Timer, Zap } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function TimeDropdown() {
  return (
    <Select defaultValue="10min">
      <SelectTrigger className="w-[200px]">
        <SelectValue placeholder="Select time control" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel className="flex gap-2">
            <MoveUpRight />
            Bullet
          </SelectLabel>
          <SelectItem value="1min">1 min</SelectItem>
          <SelectItem value="30sec">30 sec</SelectItem>
        </SelectGroup>
        <SelectGroup>
          <SelectLabel className="flex gap-2">
            <Zap />
            Blitz
          </SelectLabel>
          <SelectItem value="3min">3 min</SelectItem>
          <SelectItem value="5min">5 min</SelectItem>
        </SelectGroup>
        <SelectGroup>
          <SelectLabel className="flex gap-2">
            <Timer />
            Rapid
          </SelectLabel>
          <SelectItem value="10min">10 min</SelectItem>
          <SelectItem value="15min">15 min</SelectItem>
          <SelectItem value="30min">30 min</SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
