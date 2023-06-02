import React from 'react';
import Link from 'next/link';
import styles from '../styles/App.module.css';

const Sidebar = () => {
  return (
    <div className={styles.sidebar}>
      <ul className={styles.sidebarList}>
        <li className={styles.sidebarLink}><Link href="/home">Home</Link></li>
        <li className={styles.sidebarLink}><Link href="/posts">Post</Link></li>
        <li className={styles.sidebarLink}><Link href="/messages">Messages</Link></li>
        <li className={styles.sidebarLink}><Link href="/settings">Settings</Link></li>
      </ul>
    </div>
  );
}

export default Sidebar;