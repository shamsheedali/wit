// components/create-club-dialog.tsx
"use client";

import * as React from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroupItem, RadioGroup } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createClub } from "@/lib/api/club";
import { useAuthStore } from "@/stores";
import { useQuery } from "@tanstack/react-query";
import { debounce } from "lodash";
import { searchFriend } from "@/lib/api/user";

interface CreateClubDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface User {
  _id: string;
  username: string;
}

export function CreateClubDialog({ open, onOpenChange }: CreateClubDialogProps) {
  const { user: mainUser } = useAuthStore();
  const queryClient = useQueryClient();

  const [formData, setFormData] = React.useState({
    name: "",
    description: "",
    clubType: "public" as "public" | "private",
  });
  const [selectedUsers, setSelectedUsers] = React.useState<User[]>([]);
  const [searchQuery, setSearchQuery] = React.useState("");

  // Debounced search for users
  const debouncedSetQuery = React.useCallback(
    debounce((val: string) => setSearchQuery(val), 500),
    []
  );

  const { data: searchResults = [], isLoading: searchLoading } = useQuery({
    queryKey: ["searchFriend", searchQuery],
    queryFn: () => searchFriend(searchQuery),
    enabled: !!searchQuery,
  });

  const filteredSearchResults = searchResults.filter(
    (user: User) => !selectedUsers.some((u) => u._id === user._id) && user._id !== mainUser?._id
  );

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    debouncedSetQuery(e.target.value);
  };

  const addUser = (user: User) => {
    setSelectedUsers([...selectedUsers, user]);
    setSearchQuery("");
  };

  const removeUser = (userId: string) => {
    setSelectedUsers(selectedUsers.filter((user) => user._id !== userId));
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleClubTypeChange = (value: "public" | "private") => {
    setFormData((prev) => ({ ...prev, clubType: value }));
  };

  const createClubMutation = useMutation({
    mutationFn: () =>
      createClub({
        name: formData.name,
        description: formData.description || undefined,
        clubType: formData.clubType,
        adminIds: [mainUser!._id], // Current user as admin
        memberIds: selectedUsers.map((user) => user._id),
        userId: mainUser?._id as string,
      }),
    onSuccess: (response) => {
      if (response?.success) {
        queryClient.invalidateQueries({ queryKey: ["publicClubs"] });
        onOpenChange(false); // Close dialog
        setFormData({ name: "", description: "", clubType: "public" });
        setSelectedUsers([]);
      }
    },
  });

  const handleSubmit = () => {
    if (!formData.name || !mainUser?._id) {
      toast.error("Club name and authentication are required");
      return;
    }
    createClubMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create New Club</DialogTitle>
          <DialogDescription>
            Fill in the details to create your new club. Add members and set privacy options.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="clubName" className="text-right">
              Club Name
            </Label>
            <Input
              id="clubName"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter club name"
              className="col-span-3"
            />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="description" className="text-right">
              Description
            </Label>
            <Textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Describe your club"
              className="col-span-3 min-h-[100px]"
            />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right" htmlFor="club-type">
              Club Type
            </Label>
            <RadioGroup
              id="club-type"
              value={formData.clubType}
              onValueChange={handleClubTypeChange}
              className="col-span-3 flex gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="public" id="public" />
                <Label htmlFor="public">Public</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="private" id="private" />
                <Label htmlFor="private">Private</Label>
              </div>
            </RadioGroup>
          </div>

          <div className="grid grid-cols-4 items-start gap-4">
            <Label htmlFor="members" className="text-right pt-2">
              Members
            </Label>
            <div className="col-span-3 space-y-2">
              <div className="relative">
                <Input
                  id="members"
                  placeholder="Search users..."
                  value={searchQuery}
                  onChange={handleSearchChange}
                />
                {filteredSearchResults.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-background border rounded-md shadow-lg max-h-60 overflow-auto">
                    {filteredSearchResults.map((user) => (
                      <div
                        key={user._id}
                        className="p-2 hover:bg-muted cursor-pointer"
                        onClick={() => addUser(user)}
                      >
                        {user.username}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {selectedUsers.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {selectedUsers.map((user) => (
                    <div
                      key={user._id}
                      className="flex items-center gap-1 bg-muted px-2 py-1 rounded-full text-sm"
                    >
                      {user.username}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-4 w-4 rounded-full"
                        onClick={() => removeUser(user._id)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button
            onClick={handleSubmit}
            disabled={createClubMutation.isPending}
          >
            {createClubMutation.isPending ? "Creating..." : "Create Club"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}