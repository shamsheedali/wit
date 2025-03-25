"use client";

import Link from "next/link";
import Image from "next/image";

export default function Play() {

  return (
    <div className="px-16 w-full h-screen lg:overflow-hidden pt-[80px] font-clashDisplay text-[#f0f0f0db]">
      <div className="relative h-full flex justify-center">
        <div className="flex flex-col gap-[50px] h-fit relative top-5 md:flex-row md:flex-wrap lg:flex-nowrap">
          <div className="h-[305px] w-[250px] bg-transparent border-2 rounded-xl relative top-32 cursor-pointer overflow-hidden">
            <Image
              src="/images/playOnlineImg.webp"
              alt="Play Online"
              width={250}
              height={194}
              className="object-cover w-full h-[247px]"
              quality={100}
            />
            <div className="bg-white/5 h-14 w-full absolute bottom-0 rounded-bl-xl rounded-br-xl font-semibold flex items-center justify-end px-10">
              Play Online
            </div>
          </div>

          <Link href={'/play/friend'} className="h-[305px] w-[250px] bg-transparent border-2 rounded-xl relative top-8 cursor-pointer overflow-hidden">
            <Image
              src="/images/playFriendImg.webp"
              alt="Play a Friend"
              width={250}
              height={194}
              className="object-cover w-full h-[247px]"
              quality={100}
            />
            <div className="bg-white/5 h-14 w-full absolute bottom-0 rounded-bl-xl rounded-br-xl font-semibold flex items-center justify-end px-10">
              Play a Friend
            </div>
          </Link>

          <Link href={'/play/computer'} className="h-[305px] w-[250px] bg-transparent border-2 rounded-xl relative top-32 cursor-pointer overflow-hidden">
            <Image
              src="/images/playBotsImg.webp"
              alt="Play Bots"
              width={250}
              height={194}
              className="object-cover w-full h-[247px] relative top-[-13px] scale-[1.1]"
              quality={100}
            />
            <div className="bg-white/5 h-14 w-full absolute bottom-0 rounded-bl-xl rounded-br-xl font-semibold flex items-center justify-end px-10">
              Play Bots
            </div>
          </Link>

          {/* <div className="h-[305px] w-[250px] bg-transparent border-2 rounded-xl relative top-8 cursor-pointer overflow-hidden">
            <Image
              src="/images/historyImg.webp"
              alt="History"
              width={250}
              height={194}
              className="object-cover w-full h-[331px] relative top-[-85px]"
              quality={100}
            />
            <div className="bg-white/5 h-14 w-full absolute bottom-0 rounded-bl-xl rounded-br-xl font-semibold flex items-center justify-end px-10">
              History
            </div>
          </div> */}
        </div>

        {/* <h1 className="select-none absolute bottom-0 right-0 font-stardom text-[150px] tracking-wider leading-none hidden lg:block">
          Wit
        </h1> */}
      </div>
    </div>
  );
}
