import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Calendar1, Pencil, Swords, TrendingUp, UsersRound } from "lucide-react";

export default function PlayComputer() {
  return (
    <div className="px-56 w-full h-screen overflow-hidden pt-[120px] font-clashDisplay">
      <div className="border-2 rounded-lg flex justify-center items-center p-8 gap-20">
        <Avatar className="cursor-pointer w-40 h-40">
          <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
          <AvatarFallback>CN</AvatarFallback>
        </Avatar>

        <div className="flex flex-col gap-5 relative">
          <div>
            <h1 className="text-2xl">shamsheed_ali</h1>
            <p className="text-sm w-[250px] text-gray-500">
              Lorem ipsum dolor sit amet consectetur adipisicing elit. Doloribus
              excepturi aliquam repellat.
            </p>
            
            <Button className="absolute right-0 top-0 bg-gray-300">
                <Pencil />
                Edit
            </Button>
          </div>


            {/* icons */}
          <div className="flex gap-20 text-center">
            <div className="flex flex-col items-center gap-3">
              <TrendingUp />
              Online Now
            </div>
            <div className="flex flex-col items-center gap-3">
              <Calendar1 />
              Aug 27, 2023
            </div>
            <div className="flex flex-col items-center gap-3">
              <UsersRound />5
            </div>
            <div className="flex flex-col items-center gap-3">
                <Swords />
                123
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
