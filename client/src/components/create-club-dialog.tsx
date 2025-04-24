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

interface CreateClubDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface User {
  _id: string;
  username: string;
}

interface IClub {
  _id: string;
  name: string;
  description?: string;
  clubType: "public" | "private";
  admins: string[];
  members?: string[];
  maxMembers?: number;
}

export function CreateClubDialog({
  open,
  onOpenChange,
}: CreateClubDialogProps) {
  const { user: mainUser } = useAuthStore();
  const queryClient = useQueryClient();

  const [formData, setFormData] = React.useState({
    name: "",
    description: "",
    clubType: "public" as "public" | "private",
    maxMembers: "",
  });
  const [selectedUsers, setSelectedUsers] = React.useState<User[]>([]);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [maxMembersError, setMaxMembersError] = React.useState<string | null>(
    null
  );
  const [nameError, setNameError] = React.useState<string | null>(null);

  // Debounced search for users
  const debouncedSetQuery = React.useCallback(
    debounce((val: string) => setSearchQuery(val), 500),
    []
  );

  const { data: searchResults = [] } = useQuery({
    queryKey: ["searchFriend", searchQuery],
    queryFn: () => searchFriend(searchQuery),
    enabled: !!searchQuery,
  });

  const filteredSearchResults = searchResults.filter(
    (user: User) =>
      !selectedUsers.some((u) => u._id === user._id) &&
      user._id !== mainUser?._id
  );

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    debouncedSetQuery(e.target.value);
  };

  const addUser = (user: User) => {
    setSelectedUsers([...selectedUsers, user]);
    setSearchQuery("");
    validateMaxMembers([...selectedUsers, user]);
  };

  const removeUser = (userId: string) => {
    const updatedUsers = selectedUsers.filter((user) => user._id !== userId);
    setSelectedUsers(updatedUsers);
    validateMaxMembers(updatedUsers);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    if (name === "name") {
      // Validate no spaces in club name
      if (/\s/.test(value)) {
        setNameError("Club name cannot contain spaces");
      } else {
        setNameError(null);
      }
    }
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (name === "maxMembers") {
      validateMaxMembers(selectedUsers, value);
    }
  };

  const handleClubTypeChange = (value: "public" | "private") => {
    setFormData((prev) => ({ ...prev, clubType: value }));
    validateMaxMembers(selectedUsers); // Re-validate with new club type
  };

  // Validate max members based on club type
  const validateMaxMembers = (
    users: User[],
    maxMembersValue = formData.maxMembers
  ) => {
    const maxLimit = formData.clubType === "public" ? 100 : 50;
    const max = maxMembersValue ? parseInt(maxMembersValue, 10) : maxLimit;
    const totalMembers = users.length + 1; // Include the creator (mainUser)

    if (max > maxLimit) {
      setMaxMembersError(
        `Maximum members cannot exceed ${maxLimit} for ${formData.clubType} clubs.`
      );
    } else if (maxMembersValue && !isNaN(max) && totalMembers > max) {
      setMaxMembersError(
        `Selected members (${totalMembers}) exceed the maximum limit (${max}).`
      );
    } else {
      setMaxMembersError(null);
    }
  };

  const createClubMutation = useMutation({
    mutationFn: () =>
      createClub({
        name: formData.name,
        description: formData.description || undefined,
        clubType: formData.clubType,
        maxMembers: formData.maxMembers
          ? parseInt(formData.maxMembers)
          : undefined,
        adminIds: [mainUser!._id],
        memberIds: selectedUsers.map((user) => user._id),
        userId: mainUser?._id as string,
      }),
    onSuccess: (response) => {
      if (response?.success) {
        // Update the userClubs cache manually
        queryClient.setQueryData(
          ["userClubs", mainUser?._id],
          (oldData: IClub[] | undefined) => {
            const newClub: IClub = {
              _id: response.data._id,
              name: formData.name,
              description: formData.description || undefined,
              clubType: formData.clubType,
              admins: [mainUser!._id],
              members: [
                mainUser!._id,
                ...selectedUsers.map((user) => user._id),
              ],
              maxMembers: formData.maxMembers
                ? parseInt(formData.maxMembers)
                : formData.clubType === "public"
                ? 100
                : 50, // Set default maxMembers
            };
            return oldData ? [...oldData, newClub] : [newClub];
          }
        );

        // Invalidate queries to refetch in the background
        queryClient.invalidateQueries({ queryKey: ["publicClubs"] });
        queryClient.invalidateQueries({ queryKey: ["userClubs"] });

        // Close dialog and reset form
        onOpenChange(false);
        setFormData({
          name: "",
          description: "",
          clubType: "public",
          maxMembers: "",
        });
        setSelectedUsers([]);
        setMaxMembersError(null);
        setNameError(null);
        toast.success("Club created successfully!");
      }
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to create club");
      console.error(error);
    },
  });

  const handleSubmit = () => {
    if (!formData.name || !mainUser?._id) {
      toast.error("Club name and authentication are required");
      return;
    }
    if (nameError) {
      toast.error(nameError);
      return;
    }
    if (maxMembersError) {
      toast.error(maxMembersError);
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
            Fill in the details to create your new club. Add members and set
            privacy options.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="clubName" className="text-right">
              Club Name
            </Label>
            <div className="col-span-3 space-y-1">
              <Input
                id="clubName"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter club name"
                className="w-full"
              />
              {nameError && <p className="text-sm text-red-500">{nameError}</p>}
            </div>
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
            <Label htmlFor="maxMembers" className="text-right">
              Max Members
            </Label>
            <div className="col-span-3 space-y-1">
              <Input
                id="maxMembers"
                name="maxMembers"
                type="number"
                min="1"
                max={formData.clubType === "public" ? 100 : 50}
                value={formData.maxMembers}
                onChange={handleChange}
                placeholder={`Max ${
                  formData.clubType === "public" ? 100 : 50
                } members`}
                className="w-full"
              />
              {maxMembersError && (
                <p className="text-sm text-red-500">{maxMembersError}</p>
              )}
            </div>
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
            disabled={
              createClubMutation.isPending || !!maxMembersError || !!nameError
            }
          >
            {createClubMutation.isPending ? "Creating..." : "Create Club"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
