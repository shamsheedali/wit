"use client";

import { useEffect } from "react";
import Cookies from "js-cookie";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores";

export default function Home() {
  const { setUser } = useAuthStore();
  useEffect(() => {
    //Saving google user token from server cookie
    // Check if there's a Google auth token cookie
    const googleToken = Cookies.get("google_auth_token");
    if (googleToken) {
      // Transfer from cookie to localStorage
      localStorage.setItem("userToken", googleToken);

      // Remove the cookie after transferring
      Cookies.remove("google_auth_token");
    }
    const googleUserData = Cookies.get("google_user_data");
    if (googleUserData) {
      try {
        const parsedUserData = JSON.parse(googleUserData);
        setUser(parsedUserData);
        Cookies.remove("google_user_data");
      } catch (error) {
        console.error("Failed to parse google_user_data:", error);
      }
    }
  }, [setUser]);

  return (
    <div className="px-16 w-full h-screen lg:overflow-hidden pt-[80px] font-clashDisplay text-[#f0f0f0db]">
      <div className="relative h-full flex justify-center">
        <div className="flex flex-col gap-[30px] h-fit relative top-5 md:flex-row md:flex-wrap lg:flex-nowrap">
          <Link
            href={"/play"}
            className="h-[305px] w-[250px] bg-transparent border-2 rounded-xl relative top-32 cursor-pointer overflow-hidden"
          >
            <Image
              src="/images/newGameImg.webp"
              alt="New Game"
              width={250}
              height={194}
              className="object-cover w-full h-[247px]"
              quality={100}
            />
            <div className="bg-white/5 h-14 w-full absolute bottom-0 rounded-bl-xl rounded-br-xl font-semibold flex items-center justify-end px-10">
              New Game
            </div>
          </Link>

          <div className="h-[305px] w-[250px] bg-transparent border-2 rounded-xl relative top-8 cursor-pointer overflow-hidden">
            <Image
              src="/images/tournamentImg.webp"
              alt="Tournaments"
              width={250}
              height={194}
              className="object-cover w-full h-[247px]"
              quality={100}
            />
            <div className="bg-white/5 h-14 w-full absolute bottom-0 rounded-bl-xl rounded-br-xl font-semibold flex items-center justify-end px-10">
              Tournaments
            </div>
          </div>

          <div className="h-[305px] w-[250px] bg-transparent border-2 rounded-xl relative top-32 cursor-pointer overflow-hidden">
            <Image
              src="/images/leaderBoardImg.webp"
              alt="Leaderboard"
              width={250}
              height={194}
              className="object-cover w-full h-[247px]"
              quality={100}
            />
            <div className="bg-white/5 h-14 w-full absolute bottom-0 rounded-bl-xl rounded-br-xl font-semibold flex items-center justify-end px-10">
              Leaderboard
            </div>
          </div>

          <div className="h-[305px] w-[250px] bg-transparent border-2 rounded-xl relative top-8 cursor-pointer overflow-hidden">
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
          </div>
        </div>

        <h1 className="select-none absolute bottom-0 right-0 font-stardom text-[150px] tracking-wider leading-none hidden lg:block">
          Wit
        </h1>
      </div>
    </div>
  );
}
