import { ClubsTabs } from "@/components/my-components/clubs-tabs";

export default function Clubs() {

  return (
    <div
      className="px-56 w-full h-screen overflow-hidden pt-[80px] font-clashDisplay text-[#f0f0f0db]"
    >
        <div className="flex justify-center relative top-4">
            <ClubsTabs />
        </div>
    </div>
  );
}