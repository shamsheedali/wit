"use client";

import { useEffect, useState} from 'react';
import Link from "next/link";

export default function UserNavbar() {
  const [user, setUser] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('userToken');
    if(token) setUser(true)
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('userToken');
  }

  return (
   <div className="flex justify-between px-16 py-5 font-bold font-clashDisplay text-lg bg-transparent w-full fixed z-10">
      <nav className="flex gap-16">
        <Link href={'/homepage'} className="font-stardom text-2xl">Wit</Link>
        <h1>About Us</h1>
        <h1>Contact Us</h1>
      </nav>

      <nav className="flex gap-16">
        <h1>Groups</h1>
        <h1>Friends</h1>
        <h1>Notification</h1>
          {user ? (
            <h1 className='underline' onClick={handleLogout}>Logout</h1>
          ) : (
            <Link href={'/login'} className='underline'>Login</Link>
          )}
        </nav>
      </div>    
  )
}
