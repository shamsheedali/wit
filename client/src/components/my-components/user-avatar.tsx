import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import useUser from "@/hooks/queryHooks/useUser";
import { queryClient } from "@/lib/providers/QueryProvider";
import { User, Settings, LogOut } from "lucide-react";
import Link from "next/link";

export function UserAvatar() {
  const { data: user } = useUser();

  const handleLogout = () => {
    localStorage.removeItem("userToken");

    queryClient.resetQueries(["user"], { exact: true });

    const persistedData = localStorage.getItem("REACT_QUERY_OFFLINE_CACHE");

    if (persistedData) {
      const parsedData = JSON.parse(persistedData);

      // Delete only the "user" query data while keeping others
      parsedData.clientState.queries = parsedData.clientState.queries.filter(
        (query: any) => query.queryKey[0] !== "user"
      );

      localStorage.setItem(
        "REACT_QUERY_OFFLINE_CACHE",
        JSON.stringify(parsedData)
      );
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Avatar className="cursor-pointer w-8 h-8">
          <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
          <AvatarFallback>CN</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">Signed in as</p>
            <p className="text-xs leading-none text-muted-foreground">
              {user?.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <Link href={"/profile"}>
            <DropdownMenuItem className="cursor-pointer">
              <User className="mr-2 h-4 w-4" />
              <span>Profile</span>
            </DropdownMenuItem>
          </Link>
          <DropdownMenuItem className="cursor-pointer">
            <Settings className="mr-2 h-4 w-4" />
            <span>Settings</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="cursor-pointer" onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
