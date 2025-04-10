import { FriendsTabs } from "@/components/core/friends-tabs";

export default function Friends() {
  return (
    <div
      // style={{
      //   background: `linear-gradient(20deg, rgb(201, 85, 43) -13%, rgb(0, 0, 0) 10%, rgb(0, 0, 0) 75%, rgb(201, 85, 43) 119%)`,
      // }}
      className="lg:px-56 w-full h-screen overflow-hidden pt-[80px] font-clashDisplay text-[#f0f0f0db]"
    >
        <div className="flex justify-center relative top-10">
            <FriendsTabs />
        </div>
    </div>
  );
}