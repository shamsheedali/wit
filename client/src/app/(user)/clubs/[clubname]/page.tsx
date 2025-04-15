import GroupChatInterface from "@/components/core/group-chat-interface";

export default function Club() {

  return (
    <div
      className="w-full h-screen pt-[57px] font-clashDisplay text-[#f0f0f0db]"
    >
        <div className="flex justify-center relative top-4">
            <GroupChatInterface />
        </div>
    </div>
  );
}