import React from 'react';
import styles from '../styles/App.module.css';

type ApplicationProps = {
  children: React.ReactNode;
};

const HomeFeed: React.FC<ApplicationProps> = ({ children }) => {
  return (
    <div className={styles.homefeed}>
        {children}
    </div>
  );
};

export default HomeFeed;