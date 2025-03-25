"use client";

import type React from "react";
import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { User, Upload, CircleCheck, CircleX, Loader2 } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { debounce } from "lodash";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { toast } from "sonner";
import { updateUserProfile, checkUsername } from "@/lib/api/user";
import { useAuthStore } from "@/stores";

const profileFormSchema = z.object({
  username: z
    .string()
    .min(4, { message: "Username must be at least 4 characters." })
    .max(30, { message: "Username cannot be longer than 30 characters." })
    .regex(/^\S+$/, { message: "Username cannot contain spaces." })
    .regex(/^[a-zA-Z0-9_]+$/, { message: "Username can only contain letters, numbers, and underscores." }) // New rule
    .refine((val) => val.trim() !== "", { message: "Username cannot be empty." }),
  firstName: z.string().max(10, { message: "First name cannot exceed 10 characters." }).optional(),
  lastName: z.string().max(10, { message: "Last name cannot exceed 10 characters." }).optional(),
  bio: z.string().max(500, { message: "Bio cannot be longer than 500 characters." }).optional(),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

export default function ProfileSettingsForm() {
  const { user, updateUser } = useAuthStore();

  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [debouncedUsername, setDebouncedUsername] = useState("");
  const [hasTyped, setHasTyped] = useState(false);

  const defaultValues: Partial<ProfileFormValues> = {
    username: "",
    firstName: "",
    lastName: "",
    bio: "",
  };

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues,
    mode: "onChange",
  });

  useEffect(() => {
    if (user) {
      form.reset({
        username: user.username || "",
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        bio: user.bio || "",
      });
      setDebouncedUsername(user.username || "");
    }
  }, [user, form]);

  const debouncedSetUsername = debounce((val: string) => {
    if (val !== user?.username) {
      setDebouncedUsername(val);
    }
  }, 500);

  const { data: isUsernameAvailable, isLoading: checkingUsername } = useQuery({
    queryKey: ["checkUsername", debouncedUsername],
    queryFn: () => checkUsername(debouncedUsername),
    enabled: !!debouncedUsername && debouncedUsername !== user?.username,
  });

  const { mutate } = useMutation({
    mutationFn: ({ userData, userId }: { userData: FormData; userId: string }) =>
      updateUserProfile({ userData, userId }),
    onSuccess: (result) => {
      if (result?.success) {
        toast.success(result.data.message);
        updateUser(result.data.user);
        setIsSubmitting(false);
      }
    },
    onError: (err) => {
      console.error("Error updating profile", err);
      setIsSubmitting(false);
    },
  });

  function onSubmit(data: ProfileFormValues) {
    if (!isUsernameAvailable && data.username !== user?.username) {
      form.setError("username", { message: "Username is already taken." });
      return;
    }

    setIsSubmitting(true);
    const formData = new FormData();
    formData.append("username", data.username);
    if (data.firstName) formData.append("firstName", data.firstName);
    if (data.lastName) formData.append("lastName", data.lastName);
    if (data.bio) formData.append("bio", data.bio);
    if (imageFile) formData.append("profileImage", imageFile);

    if (user?._id) {
      mutate({ userData: formData, userId: user._id });
    } else {
      console.error("User ID is missing");
      setIsSubmitting(false);
    }
  }

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = (e) => setProfileImage(e.target?.result as string);
      reader.readAsDataURL(file);
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Profile Settings</CardTitle>
        <CardDescription>
          Update your profile information and how others see you on the platform.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <div className="flex flex-col items-center space-y-4">
              <Avatar className="w-24 h-24">
                <AvatarImage
                  src={profileImage || user?.profileImageUrl || "/placeholder.svg?height=96&width=96"}
                  alt="Profile picture"
                />
                <AvatarFallback>
                  <User className="w-12 h-12" />
                </AvatarFallback>
              </Avatar>
              <div className="flex items-center justify-center">
                <label htmlFor="profile-image" className="cursor-pointer">
                  <div className="flex items-center gap-2 text-sm text-primary">
                    <Upload className="w-4 h-4" />
                    <span>Upload new image</span>
                  </div>
                  <input
                    id="profile-image"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageChange}
                  />
                </label>
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Name</FormLabel>
                    <FormControl>
                      <Input placeholder="John" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Username</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="johndoe"
                      {...field}
                      onChange={(e) => {
                        field.onChange(e);
                        setHasTyped(true);
                        debouncedSetUsername(e.target.value);
                      }}
                    />
                  </FormControl>
                  <FormDescription>
                    This is your public display name. It can be your real name or a pseudonym.
                  </FormDescription>
                  {hasTyped && field.value.length >= 4 && (
                    checkingUsername ? (
                      <div className="flex items-center gap-1 text-sm">
                        <Loader2 className="animate-spin w-4 h-4" />
                        Checking availability...
                      </div>
                    ) : isUsernameAvailable || field.value === user?.username ? (
                      <div className="flex items-center gap-1 text-sm text-green-500">
                        <CircleCheck className="w-4 h-4" />
                        Username is available
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-sm text-red-500">
                        <CircleX className="w-4 h-4" />
                        Username is already taken
                      </div>
                    )
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="bio"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bio</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Tell us a little bit about yourself"
                      className="resize-none min-h-[120px]"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    You can write a short bio about yourself. This will be displayed on your profile.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : "Save changes"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}