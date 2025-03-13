import UserNavbar from "@/components/my-components/my-user-navbar";

export default function UserLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <UserNavbar />
        {children}
    </>
  );
}
