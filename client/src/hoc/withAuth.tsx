"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, ComponentType } from "react";

const withAuth = <P extends object>(WrappedComponent: ComponentType<P>) => {
  return function ProtectedComponent(props: P) {
    const router = useRouter();
    const [loading, setLoading] = useState(true);

    useEffect(() => {
      const token = localStorage.getItem("adminToken");

      if (!token) {
        router.replace("/admin-login");
      } else {
        setLoading(false);
      }
    }, [router]);

    if (loading) return null;

    return <WrappedComponent {...props} />;
  };
};

export default withAuth;