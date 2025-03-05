import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import Link from "next/link"

export default function HomePage() {
    return (
      <div
        style={{
          background: `linear-gradient(20deg, rgb(201, 85, 43) -13%, rgb(0, 0, 0) 10%, rgb(0, 0, 0) 75%, rgb(201, 85, 43) 119%)`,
        }}
        className="px-16 w-full h-screen overflow-hidden pt-[80px] font-clashDisplay"
      >
        <div className="relative h-full flex justify-center">
          <div className="flex gap-[30px] h-fit relative top-5">

            <Dialog>
                <DialogTrigger>
                  <div className="h-[250px] w-[250px] bg-transparent border-2 rounded-xl relative top-20 cursor-pointer">
                     <div className="bg-gray-500 h-14 w-full absolute bottom-0 rounded-bl-xl rounded-br-xl font-semibold flex items-center justify-end px-10" style={{background: `linear-gradient(45deg, #4d2110, #000000)`}}>New Game</div>
                  </div> 
              </DialogTrigger>
              <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Choose the game</DialogTitle>
                    <DialogDescription>You can play bot or with players</DialogDescription>
                  </DialogHeader>

                  <div className="flex justify-around">
                    <Link href={'/play/computer'}>
                      <div className="h-[200px] w-[200px] bg-transparent border-2 rounded-xl relative cursor-pointer">
                         <div className="bg-gray-500 h-14 w-full absolute bottom-0 rounded-bl-xl rounded-br-xl font-medium text-md flex items-center justify-end px-10" style={{background: `linear-gradient(45deg, #4d2110, #000000)`}}>Play vs Bot</div>
                      </div>
                    </Link>

                    <div className="h-[200px] w-[200px] bg-transparent border-2 rounded-xl relative cursor-pointer">
                       <div className="bg-gray-500 h-14 w-full absolute bottom-0 rounded-bl-xl rounded-br-xl font-medium text-md flex items-center justify-end px-10" style={{background: `linear-gradient(45deg, #4d2110, #000000)`}}>Play vs Players</div>
                    </div>
                  </div>
              </DialogContent>
            </Dialog>
          
            <div className="h-[250px] w-[250px] bg-transparent border-2 rounded-xl relative top-5 cursor-pointer">
               <div className="bg-gray-500 h-14 w-full absolute bottom-0 rounded-bl-xl rounded-br-xl font-semibold flex items-center justify-end px-10" style={{background: `linear-gradient(45deg, #4d2110, #000000)`}}>Tournaments</div>
            </div> 

            <div className="h-[250px] w-[250px] bg-transparent border-2 rounded-xl relative top-20 cursor-pointer">
               <div className="bg-gray-500 h-14 w-full absolute bottom-0 rounded-bl-xl rounded-br-xl font-semibold flex items-center justify-end px-10" style={{background: `linear-gradient(45deg, #4d2110, #000000)`}}>Leaderboard</div>
            </div> 

            <div className="h-[250px] w-[250px] bg-transparent border-2 rounded-xl relative top-5 cursor-pointer">
               <div className="bg-gray-500 h-14 w-full absolute bottom-0 rounded-bl-xl rounded-br-xl font-semibold flex items-center justify-end px-10" style={{background: `linear-gradient(45deg, #4d2110, #000000)`}}>History</div>
            </div> 
          </div>

          <h1 className="select-none absolute bottom-0 left-1/2 transform -translate-x-1/2 font-stardom text-[210px] tracking-wider leading-none text-white">
            Clever
          </h1>
        </div>
      </div>
    );
}
