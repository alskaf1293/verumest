import React from 'react';
import styles from '../styles/App.module.css';

type ApplicationProps = {
  children: React.ReactNode;
};

const Application: React.FC<ApplicationProps> = ({ children }) => {
  return (
    <div className={styles.application}>
      {children}
    </div>
  );
};

export default Application;