import React from 'react';
import Link from 'next/link';

const Sidebar = () => {
  return (
    <div className="sidebar">
      <ul>
        <li><Link href="/home">Home</Link></li>
        <li><Link href="/posts">Post</Link></li>
        <li><Link href="/chatbot">Messages</Link></li>
        <li><Link href="/">Notifications</Link></li>
        <li><Link href="/">Settings</Link></li>
      </ul>
    </div>
  );
}

export default Sidebar;