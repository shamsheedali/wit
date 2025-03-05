import UserNavbar from "@/components/my-user-navbar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <UserNavbar />
        {children}
    </>
  );
}
